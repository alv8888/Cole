import { BODIES, DEFAULTS } from './data.js';
import { LIMITS, validateConfiguration } from './validation.js';
import { kmToM, km3ToM3, mToKm, secondsToMinutes, number } from './units.js';
import { circularOrbit, percentageDifference } from './physics.js';
import { loadConfigurations, saveConfigurations } from './storage.js';
import { drawOrbit, moveSatellite, drawBars } from './visualization.js';

const $ = selector => document.querySelector(selector);
const letters = ['a', 'b'];
let configurations = DEFAULTS.map(config => ({ ...config }));
let orbits = [null, null];
let running = false;
let elapsed = 0;
let previousFrame = null;
let frameId = null;

function setStatus(message, error = false) {
  $('#status').textContent = message;
  $('#status').classList.toggle('error', error);
}

function createFields() {
  $('#configuration-fields').innerHTML = letters.map((letter, index) => `
    <fieldset data-index="${index}">
      <legend>CONFIGURACIÓN ${letter.toUpperCase()}</legend>
      <div class="field"><label for="${letter}-body">Cuerpo central</label>
        <select id="${letter}-body" name="body"><option value="earth">Tierra</option><option value="moon">Luna</option><option value="mars">Marte</option><option value="custom">Personalizado</option></select>
      </div>
      ${Object.entries(LIMITS).map(([key, limit]) => `
        <div class="field"><label for="${letter}-${key}">${limit.label}<span>${limit.unit}</span></label>
        <input id="${letter}-${key}" name="${key}" type="number" step="any" min="${limit.min}" max="${limit.max}" required aria-describedby="${letter}-${key}-limits ${letter}-${key}-error">
        <p id="${letter}-${key}-limits" class="limits">${number(limit.min, key === 'mu' ? 3 : 0)} – ${number(limit.max, 0)} ${limit.unit}</p>
        <p id="${letter}-${key}-error" class="field-error"></p></div>`).join('')}
      <p id="${letter}-warning" class="warning"></p>
    </fieldset>`).join('');
}

function fillFields() {
  configurations.forEach((config, index) => {
    for (const key of ['body', ...Object.keys(LIMITS)]) $(`#${letters[index]}-${key}`).value = config[key];
  });
}

function readFields() {
  return letters.map(letter => ({
    body: $(`#${letter}-body`).value,
    ...Object.fromEntries(Object.keys(LIMITS).map(key => {
      const input = $(`#${letter}-${key}`);
      return [key, input.value.trim() === '' ? NaN : input.valueAsNumber];
    })),
  }));
}

function warning(config) {
  const messages = [];
  if (config.body === 'custom') messages.push('Parámetros propios: no representan un cuerpo real sin una referencia externa.');
  if (config.body === 'earth' && config.altitude < 150) messages.push('Órbita terrestre muy baja: el arrastre atmosférico omitido puede impedir su permanencia.');
  if (config.altitude > config.radius * 10) messages.push('Gran distancia: terceros cuerpos pueden dominar; no se comprueba la esfera de influencia.');
  if (Math.sqrt(config.mu / (config.radius + config.altitude)) > 2997.92458) messages.push('Velocidad superior al 1 % de c: la aproximación no relativista requiere revisión.');
  if (messages.length === 0) messages.push('Sin atmósfera ni perturbaciones. No evalúa la viabilidad de una misión.');
  return messages.join(' ');
}

function update() {
  configurations = readFields();
  orbits = configurations.map((config, index) => {
    const errors = validateConfiguration(config);
    for (const key of Object.keys(LIMITS)) {
      const input = $(`#${letters[index]}-${key}`);
      input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
      $(`#${letters[index]}-${key}-error`).textContent = errors[key] ?? '';
    }
    $(`#${letters[index]}-warning`).textContent = Object.keys(errors).length ? 'Corrige las entradas para calcular.' : warning(config);
    if (Object.keys(errors).length) return null;
    try {
      return circularOrbit({ mu: km3ToM3(config.mu), radius: kmToM(config.radius), altitude: kmToM(config.altitude) });
    } catch (error) {
      $(`#${letters[index]}-warning`).textContent = error.message;
      return null;
    }
  });
  const allValid = orbits.every(Boolean);
  $('#save').disabled = !allValid;
  $('#play').disabled = !allValid;
  if (!allValid) pause();
  $('#result-message').textContent = allValid ? 'Solución analítica ideal. Porcentajes calculados con A como referencia.' : 'Hay entradas inválidas. Los resultados afectados se ocultan; no se muestran valores anteriores.';
  const rows = [
    ['Radio orbital', 'km', orbit => mToKm(orbit.r)],
    ['Velocidad orbital', 'km/s', orbit => mToKm(orbit.velocity)],
    ['Periodo orbital', 'min', orbit => secondsToMinutes(orbit.period)],
    ['Aceleración gravitatoria', 'm/s²', orbit => orbit.acceleration],
    ['Energía específica', 'MJ/kg', orbit => orbit.specificEnergy / 1e6],
  ];
  $('#results').replaceChildren(...rows.map(([label, unit, getter]) => {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = `${label} (${unit})`;
    row.append(heading);
    const values = orbits.map(orbit => orbit ? getter(orbit) : null);
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value === null ? '—' : number(value);
      row.append(cell);
    }
    const difference = document.createElement('td');
    const percent = allValid ? percentageDifference(...values) : null;
    difference.textContent = percent === null ? '—' : `${percent > 0 ? '+' : ''}${number(percent)} %`;
    row.append(difference);
    return row;
  }));
  drawBars($('#velocity-chart'), orbits.map(orbit => orbit ? mToKm(orbit.velocity) : null), 'km/s');
  drawBars($('#period-chart'), orbits.map(orbit => orbit ? secondsToMinutes(orbit.period) : null), 'min');
  const sameMu = allValid && configurations[0].mu === configurations[1].mu;
  $('#interpretation').textContent = !allValid ? 'Corrige las entradas para interpretar la comparación.' : sameMu ? 'Para el mismo μ, al aumentar el radio orbital disminuye la velocidad y aumenta el periodo. La masa del satélite no interviene en esta aproximación. Un porcentaje negativo en energía específica indica un valor menos negativo.' : 'Los cuerpos tienen distinto μ: no atribuyas los cambios solo a la altitud. Compara μ y radio orbital. La energía negativa representa una órbita ligada en el modelo ideal.';
  const maxRadius = Math.max(...orbits.filter(Boolean).map(orbit => orbit.r), 1);
  configurations.forEach((config, index) => {
    const letter = letters[index];
    drawOrbit($(`#orbit-${letter}`), config, orbits[index], index, maxRadius);
    $(`#caption-${letter}`).textContent = `${letter.toUpperCase()} · ${BODIES[config.body]?.name ?? 'Personalizado'}${orbits[index] ? ` · h = ${number(config.altitude)} km` : ' · sin cálculo'}`;
  });
  refreshPositions();
}

function refreshPositions() {
  letters.forEach((letter, index) => moveSatellite($(`#orbit-${letter}`), orbits[index], elapsed));
  $('#elapsed').textContent = `${number(elapsed, 0)} s`;
}

function pause() {
  running = false;
  previousFrame = null;
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  $('#play').textContent = 'Reproducir';
  $('#play').setAttribute('aria-pressed', 'false');
}

function tick(timestamp) {
  if (!running) return;
  if (previousFrame !== null) elapsed += Math.max(0, timestamp - previousFrame) / 1000 * Number($('#speed').value);
  previousFrame = timestamp;
  refreshPositions();
  frameId = requestAnimationFrame(tick);
}

createFields();
fillFields();
update();
$('#parameters').addEventListener('submit', event => event.preventDefault());
$('#parameters').addEventListener('input', event => {
  const fieldset = event.target.closest('fieldset');
  if (!fieldset) return;
  const letter = letters[Number(fieldset.dataset.index)];
  if (event.target.name === 'body' && BODIES[event.target.value]) {
    const preset = BODIES[event.target.value];
    $(`#${letter}-mu`).value = preset.mu;
    $(`#${letter}-radius`).value = preset.radius;
  } else if (['mu', 'radius'].includes(event.target.name)) {
    $(`#${letter}-body`).value = 'custom';
  }
  pause();
  elapsed = 0;
  update();
  setStatus(orbits.every(Boolean) ? 'Cálculos actualizados; tiempo reiniciado.' : 'Corrige los campos señalados.', !orbits.every(Boolean));
});
$('#play').addEventListener('click', () => {
  if (running) return pause();
  if (!orbits.every(Boolean)) return;
  running = true;
  previousFrame = null;
  $('#play').textContent = 'Pausar';
  $('#play').setAttribute('aria-pressed', 'true');
  frameId = requestAnimationFrame(tick);
});
$('#speed').addEventListener('change', () => { previousFrame = null; });
$('#restart-time').addEventListener('click', () => { elapsed = 0; previousFrame = null; refreshPositions(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
$('#save').addEventListener('click', () => {
  try {
    saveConfigurations(window.localStorage, configurations);
    setStatus('Ambas configuraciones guardadas en este navegador.');
  } catch (error) { setStatus(`No se pudo guardar: ${error.message}`, true); }
});
$('#load').addEventListener('click', () => {
  try {
    const saved = loadConfigurations(window.localStorage);
    if (!saved) return setStatus('No hay configuraciones guardadas.');
    configurations = saved;
    pause();
    elapsed = 0;
    fillFields();
    update();
    setStatus('Configuraciones recuperadas.');
  } catch (error) { setStatus(`No se pudo cargar: ${error.message}`, true); }
});
$('#reset').addEventListener('click', () => {
  configurations = DEFAULTS.map(config => ({ ...config }));
  pause();
  elapsed = 0;
  fillFields();
  update();
  setStatus('Parámetros iniciales restaurados. Tu guardado sigue disponible.');
});
