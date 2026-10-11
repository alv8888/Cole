import { registerSharePart } from '../navigation/ui.js';
import { numberIn, choice } from '../navigation/share.js';
import { createGlobePanel } from '../three/bridge.js';
import { rocketPath, rocketPoint } from '../three/geometry.js';
import { BODIES } from './model.js';
import { DEFAULT, clone, budget, simulate } from './model.js';
import { saveLaunch, loadLaunch } from './storage.js';
import { chart, stageDiagram } from './visualization.js';
import { downloadFile } from '../files.js';
const $ = id => document.getElementById(id);
const globe=createGlobePanel($('rocket-globe'));
let result = null, playing = false, clock = 0, previousFrame = null;
const fields = [['dry','Masa seca','kg',1,100000],['propellant','Propelente','kg',1,1000000],['thrust','Empuje','N',1,10000000],['duration','Duración','s',1,600]];
function pause() { playing = false; previousFrame = null; $('launch-play').textContent = 'Reproducir'; }
function invalidate() {
  pause(); result = null; clock = 0; globe.setPath(null);
  for (const id of ['launch-play','launch-timeline','launch-csv']) $(id).disabled = true;
  $('launch-state').textContent = 'Diseño modificado: calcula un nuevo lanzamiento.';
  $('launch-outcome').textContent = 'Sin trayectoria vigente.';
  $('launch-events').replaceChildren(); $('launch-altitude').replaceChildren(); $('launch-velocity').replaceChildren();
  updateBudget();
}
function config() {
  return { body: $('launch-body').value, payload: $('launch-payload').valueAsNumber, horizon: $('launch-horizon').valueAsNumber,
    stages: [...$('launch-stages').children].map((el, index) => Object.fromEntries(fields.map(([key]) => [key, $(`stage-${index}-${key}`).valueAsNumber]))) };
}
function renderStages(stages) {
  $('launch-stages').innerHTML = stages.map((s, i) => `<fieldset><legend>Etapa ${i + 1} · ${i === 0 ? 'encendido inicial' : 'después de la anterior'}</legend><div class="engineering-field-grid">${fields.map(([key,label,unit,min,max]) => `<div class="field"><label for="stage-${i}-${key}">${label}<span>${unit}</span></label><input id="stage-${i}-${key}" type="number" min="${min}" max="${max}" step="any" required value="${s[key]}" aria-describedby="stage-${i}-${key}-limit"><p class="limits" id="stage-${i}-${key}-limit">${min}–${max} ${unit}</p></div>`).join('')}</div></fieldset>`).join('');
}
function fill(c) {
  $('launch-body').value = c.body; $('launch-payload').value = c.payload; $('launch-horizon').value = c.horizon; $('launch-count').value = c.stages.length; renderStages(c.stages); invalidate();
}
function updateBudget() {
  for (const input of $('launch-form').querySelectorAll('input')) {
    input.setAttribute('aria-invalid', String(!Number.isFinite(input.valueAsNumber) || !input.checkValidity()));
  }
  try {
    const c = config(), b = budget(c);
    $('launch-budget').textContent = `Masa inicial: ${b.initialMass.toFixed(1)} kg · Masa final retenida: ${b.finalMass.toFixed(1)} kg · Δv ideal total: ${b.deltaV.toFixed(2)} m/s. No es velocidad final de lanzamiento.`;
    $('launch-stage-budget').replaceChildren(...b.stages.map((s, i) => {
      const li = document.createElement('li'); li.textContent = `Etapa ${i + 1}: m₀=${s.before.toFixed(1)} kg → mf=${s.after.toFixed(1)} kg; desprende ${s.dropped} kg; ṁ=${s.flow.toFixed(2)} kg/s; ve=${s.exhaust.toFixed(2)} m/s; Δv=${s.deltaV.toFixed(2)} m/s.`; return li;
    }));
    stageDiagram($('launch-diagram'), c, null); $('launch-run').disabled = false; $('launch-save').disabled = false;
    $('launch-message').textContent = 'Diseño válido para el modelo educativo.';
  } catch (e) {
    $('launch-budget').textContent = 'Corrige las entradas para calcular.'; $('launch-stage-budget').replaceChildren(); $('launch-diagram').replaceChildren();
    $('launch-run').disabled = true; $('launch-save').disabled = true; $('launch-message').textContent = e.message;
  }
}
const labels = { liftoff: 'Despegue', burnout: 'Fin de funcionamiento', separation: 'Separación', impact: 'Impacto en superficie', apogee: 'Paso por altura máxima' };
const outcomes = {
  impact: 'Cae de nuevo: impacto calculado en la superficie.',
  pad: 'No despega: permanece en la plataforma tras agotar las etapas.',
  escape: 'Escape energético en este modelo: sin propulsión, velocidad radial positiva y energía específica positiva. La gravedad sigue actuando.',
  bound: 'Trayectoria ligada: sin propulsión y energía negativa; regresará en el modelo radial, pero el impacto queda fuera del tiempo calculado.',
  horizon: 'Horizonte alcanzado: desenlace no resuelto. Puede quedar propulsión pendiente o energía próxima al umbral de escape.',
};
function display() {
  if (!result) return;
  // Binary search locates a computed physical state; no fictitious interpolation.
  let low = 0, high = result.samples.length - 1;
  while (low < high) { const mid = Math.ceil((low + high) / 2); if (result.samples[mid].t <= clock) low = mid; else high = mid - 1; }
  const s = result.samples[low];
  globe.setPosition(rocketPoint(s,BODIES[result.config.body].radius),s.t);
  const prefix = result.samples.slice(0, low + 1);
  $('launch-state').textContent = `t=${s.t.toFixed(1)} s · Altitud=${(s.h/1000).toFixed(3)} km · Velocidad radial=${s.v.toFixed(2)} m/s · Masa=${s.mass.toFixed(1)} kg · ${s.stage < result.config.stages.length ? `Etapa ${s.stage+1}` : 'Vuelo sin propulsión'} · Escape local=${s.escapeSpeed.toFixed(1)} m/s`;
  $('launch-timeline').value = result.final.t ? clock / result.final.t * 100 : 0;
  $('launch-outcome').textContent = clock >= result.final.t ? outcomes[result.outcome] : 'Lanzamiento en reproducción; el desenlace se muestra al final.';
  chart($('launch-altitude'), prefix, result.final.t, 'h', .001, 'Altitud (km)');
  chart($('launch-velocity'), prefix, result.final.t, 'v', 1, 'Velocidad radial (m/s)');
  stageDiagram($('launch-diagram'), result.config, s);
  $('launch-events').replaceChildren(...result.events.filter(e => e.t <= s.t + 1e-8).map(e => { const li = document.createElement('li'); li.textContent = `${e.t.toFixed(2)} s · ${labels[e.type]} · etapa ${Math.min(e.stage+1,result.config.stages.length)}`; return li; }));
}
$('launch-form').addEventListener('submit', e => e.preventDefault());
$('launch-form').addEventListener('input', e => { if (e.target.id !== 'launch-count') invalidate(); });
$('launch-count').addEventListener('change', () => {
  const count = Number($('launch-count').value), old = config().stages;
  renderStages(Array.from({ length: count }, (_, i) => old[i] ?? { dry:100, propellant:600, thrust:15000, duration:100 })); invalidate();
});
function calculateLaunch(autoPlay = false, restoredClock = 0) {
  pause();
  try {
    result = simulate(config());
    globe.setPath({body:result.config.body,description:`${BODIES[result.config.body].name} · radio ${BODIES[result.config.body].radius/1000} km · 1 unidad 3D = radio del cuerpo.`,...rocketPath(result.samples,BODIES[result.config.body].radius),closed:false});
    clock = restoredClock; $('launch-timeline').max = 100;
    for (const id of ['launch-play','launch-timeline','launch-csv']) $(id).disabled = false;
    $('launch-message').textContent = 'Trayectoria calculada con RK4, paso máximo 0,1 s. Se reproduce el tiempo calculado, acelerado según el control.';
    display(); if (autoPlay && !matchMedia('(prefers-reduced-motion: reduce)').matches) { playing = true; $('launch-play').textContent = 'Pausar'; }
  } catch (e) { invalidate(); $('launch-message').textContent = e.message; }
}
$('launch-run').addEventListener('click', () => calculateLaunch(true));
$('launch-play').addEventListener('click', () => {
  if (playing) pause(); else { if (clock >= result.final.t) clock = 0; playing = true; previousFrame = null; $('launch-play').textContent = 'Pausar'; }
});
$('launch-timeline').addEventListener('input', () => { pause(); const fraction = $('launch-timeline').valueAsNumber; clock = fraction >= 100 ? result.final.t : result.final.t * (fraction / 100); display(); });
$('launch-reset').addEventListener('click', () => fill(clone(DEFAULT)));
$('launch-save').addEventListener('click', () => { try { saveLaunch(config()); $('launch-message').textContent = 'Diseño multietapa guardado; no modifica la calculadora de una etapa.'; } catch(e) { $('launch-message').textContent = e.message; } });
$('launch-load').addEventListener('click', () => { try { fill(loadLaunch()); $('launch-message').textContent = 'Diseño multietapa recuperado. Calcula para generar su trayectoria.'; } catch(e) { $('launch-message').textContent = `No se pudo cargar: ${e.message}`; } });
$('launch-csv').addEventListener('click', () => {
  try {
    const csv = 'time_s,altitude_m,radial_velocity_m_s,mass_kg,stage_index,energy_J_kg,escape_speed_m_s\n' + result.samples.map(s => [s.t,s.h,s.v,s.mass,s.stage,s.energy,s.escapeSpeed].join(',')).join('\n');
    downloadFile(csv, 'aerolab-lanzamiento.csv', 'text/csv'); $('launch-message').textContent = 'CSV descargado con todos los estados calculados; stage_index comienza en 0, número de etapas significa propulsión terminada.';
  } catch(e) { $('launch-message').textContent = e.message; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
function frame(now) {
  if (playing && result) {
    if (previousFrame !== null) clock = Math.min(result.final.t, clock + Math.min((now-previousFrame)/1000,.1) * Number($('launch-speed').value));
    previousFrame = now; display(); if (clock >= result.final.t) pause();
  }
  requestAnimationFrame(frame);
}
fill(clone(DEFAULT)); requestAnimationFrame(frame);

document.addEventListener('aerolab:tabchange', event=>{if(event.detail.tab!=='simulation')pause();});
registerSharePart('launch', {
  get: () => ({ configuration:config(), calculated:!!result, clock, speed:$('launch-speed').value }),
  validate(state) {
    budget(state.configuration); choice(state.speed,['1','10','60','300']);
    choice(state.calculated,[true,false]); numberIn(state.clock,0,state.configuration.horizon);
    if(!state.calculated && state.clock!==0)throw new Error('Reloj sin trayectoria calculada.');
    if(state.calculated && state.clock>simulate(state.configuration).final.t)throw new Error('Tiempo posterior al final de la trayectoria.');
  },
  apply(state) { fill(state.configuration); $('launch-speed').value=state.speed; if(state.calculated)calculateLaunch(false,state.clock); },
});
