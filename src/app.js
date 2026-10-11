import { BODIES, DEFAULTS } from './data.js';
import { LIMITS, validateConfiguration } from './validation.js';
import { kmToM, km3ToM3, mToKm, secondsToMinutes, number } from './units.js';
import { percentageDifference } from './physics.js';
import { ellipticOrbit } from './elliptic.js';
import { loadConfigurations, saveConfigurations } from './storage.js';
import { drawOrbit, moveSatellite, drawBars, drawTimeChart, moveTimeMarkers } from './visualization.js';
import { SCENARIOS } from './scenarios.js';
import { sampleOrbit, exportOrbitCSV, assessPrediction, periodFraction } from './exploration.js';
import { serializeConfigurations, parseConfigurations, MAX_IMPORT_BYTES } from './configuration.js';
import { downloadFile } from './files.js';
import { createSensitivity } from './sensitivity-ui.js';

const $ = selector => document.querySelector(selector);
const letters = ['a', 'b'];
let configurations = DEFAULTS.map(config => ({ ...config }));
let orbits = [null, null];
let running = false;
let elapsed = 0;
let previousFrame = null;
let frameId = null;
let revision = 0;
let sensitivity = null;

function selectStudy(id) {
  const scenario = SCENARIOS.find(item => item.id === id);
  $('#scenario-note').textContent = scenario?.description ?? 'Exploración propia: cambiaste o cargaste parámetros. Puedes regresar a un escenario para aislar una relación física.';
  document.querySelectorAll('[data-scenario]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.scenario === id));
  });
}

function applyConfigurations(configs, message, study = null) {
  configurations = configs.map(config => ({ ...config }));
  revision++;
  pause();
  elapsed = 0;
  fillFields();
  selectStudy(study);
  update();
  setStatus(message);
}

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
        <p id="${letter}-${key}-limits" class="limits">${number(limit.min, key === 'mu' ? 3 : 0)} – ${number(limit.max, key === 'eccentricity' ? 1 : 0)} ${limit.unit}${key === 'eccentricity' ? ' · 0 = circular' : ''}</p>
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
  const apoapsis = (config.radius + config.altitude) * (1 + config.eccentricity) / (1 - config.eccentricity);
  if (apoapsis - config.radius > config.radius * 10) messages.push('Gran distancia en apoapsis: terceros cuerpos pueden dominar; no se comprueba la esfera de influencia.');
  if (Math.sqrt(config.mu / (config.radius + config.altitude) * (1 + config.eccentricity)) > 2997.92458) messages.push('Velocidad superior al 1 % de c: la aproximación no relativista requiere revisión.');
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
      return ellipticOrbit({ mu: km3ToM3(config.mu), radius: kmToM(config.radius), altitude: kmToM(config.altitude), eccentricity: config.eccentricity });
    } catch (error) {
      $(`#${letters[index]}-warning`).textContent = error.message;
      return null;
    }
  });
  const allValid = orbits.every(Boolean);
  $('#save').disabled = !allValid;
  $('#play').disabled = !allValid;
  for (const id of ['export-json', 'export-csv', 'check-prediction', 'phase', 'reference', 'go-periapsis', 'go-apoapsis']) $(`#${id}`).disabled = !allValid;
  $('#prediction-feedback').textContent = allValid ? 'Elige una magnitud y predice su relación. La respuesta se comprobará con tus parámetros actuales.' : 'Corrige ambas configuraciones para comprobar una predicción.';
  if (!allValid) pause();
  $('#result-message').textContent = allValid ? 'Modelo ideal de dos cuerpos. Velocidades extremas, no velocidad constante de una elipse. Porcentajes con A como referencia.' : 'Hay entradas inválidas. Los resultados afectados se ocultan; no se muestran valores anteriores.';
  const rows = [
    ['Radio de periapsis', 'km', orbit => mToKm(orbit.periapsis)],
    ['Radio de apoapsis', 'km', orbit => mToKm(orbit.apoapsis)],
    ['Semieje mayor', 'km', orbit => mToKm(orbit.semiMajor)],
    ['Velocidad en periapsis', 'km/s', orbit => mToKm(orbit.periapsisVelocity)],
    ['Velocidad en apoapsis', 'km/s', orbit => mToKm(orbit.apoapsisVelocity)],
    ['Periodo orbital', 'min', orbit => secondsToMinutes(orbit.period)],
    ['Aceleración en periapsis', 'm/s²', orbit => orbit.periapsisAcceleration],
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
  drawBars($('#velocity-chart'), orbits.map(orbit => orbit ? mToKm(orbit.periapsisVelocity) : null), 'km/s');
  drawBars($('#period-chart'), orbits.map(orbit => orbit ? secondsToMinutes(orbit.period) : null), 'min');
  const samples = orbits.map(orbit => orbit ? sampleOrbit(orbit) : null);
  drawTimeChart($('#radius-history'), samples, 'r', 'km');
  drawTimeChart($('#speed-history'), samples, 'speed', 'km/s');
  const sameMu = allValid && configurations[0].mu === configurations[1].mu;
  $('#interpretation').textContent = !allValid ? 'Corrige las entradas para interpretar la comparación.' : sameMu ? 'Para el mismo μ y periapsis, aumentar e eleva el apoapsis, el periodo y la velocidad en periapsis. En una elipse el satélite acelera al acercarse al cuerpo y frena al alejarse. Un porcentaje negativo en energía indica un valor menos negativo.' : 'Los cuerpos tienen distinto μ: compara también el periapsis y la excentricidad. La energía negativa representa una órbita ligada en el modelo ideal.';
  const maxRadius = Math.max(...orbits.filter(Boolean).map(orbit => orbit.apoapsis), 1);
  configurations.forEach((config, index) => {
    const letter = letters[index];
    drawOrbit($(`#orbit-${letter}`), config, orbits[index], index, maxRadius);
    $(`#caption-${letter}`).textContent = `${letter.toUpperCase()} · ${BODIES[config.body]?.name ?? 'Personalizado'}${orbits[index] ? ` · hₚ = ${number(config.altitude)} km` : ' · sin cálculo'}`;
  });
  sensitivity?.refresh();
  refreshPositions();
}

function refreshPositions() {
  const states = letters.map((letter, index) => {
    const state = moveSatellite($(`#orbit-${letter}`), orbits[index], elapsed);
    $(`#instant-${letter}`).textContent = state ? `r actual = ${number(mToKm(state.r))} km · v actual = ${number(mToKm(state.speed))} km/s` : 'Sin estado orbital: corrige las entradas.';
    return state;
  });
  $('#elapsed').textContent = `${number(elapsed, 0)} s`;
  const reference = orbits[Number($('#reference').value)];
  const fraction = reference ? periodFraction(elapsed, reference.period) : 0;
  $('#phase').value = fraction * 100;
  $('#phase-value').textContent = `${number(fraction * 100, 1)} %`;
  $('#phase').setAttribute('aria-valuetext', `${number(fraction * 100, 1)} por ciento del periodo de ${$('#reference').selectedOptions[0].textContent}`);
  moveTimeMarkers($('#radius-history'), orbits, states, elapsed, 'r');
  moveTimeMarkers($('#speed-history'), orbits, states, elapsed, 'speed');
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

$('#scenarios').replaceChildren(...SCENARIOS.map(scenario => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scenario-card';
  button.dataset.scenario = scenario.id;
  const tag = document.createElement('span');
  tag.textContent = scenario.tag;
  const title = document.createElement('strong');
  title.textContent = scenario.title;
  button.append(tag, title);
  button.addEventListener('click', () => applyConfigurations(scenario.configurations, `Escenario cargado: ${scenario.title}.`, scenario.id));
  return button;
}));
selectStudy('altitude');
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
  revision++;
  selectStudy(null);
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
$('#phase').addEventListener('input', () => {
  const reference = orbits[Number($('#reference').value)];
  if (!reference) return;
  pause();
  elapsed = Number($('#phase').value) / 100 * reference.period;
  refreshPositions();
});
$('#reference').addEventListener('change', refreshPositions);
$('#go-periapsis').addEventListener('click', () => { pause(); elapsed = 0; refreshPositions(); });
$('#go-apoapsis').addEventListener('click', () => {
  const reference = orbits[Number($('#reference').value)];
  if (!reference) return;
  pause();
  elapsed = reference.period / 2;
  refreshPositions();
});
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
    applyConfigurations(saved, 'Configuraciones recuperadas.');
  } catch (error) { setStatus(`No se pudo cargar: ${error.message}`, true); }
});
$('#reset').addEventListener('click', () => {
  applyConfigurations(DEFAULTS, 'Parámetros iniciales restaurados. Tu guardado sigue disponible.', 'altitude');
});
$('#export-json').addEventListener('click', () => {
  try {
    downloadFile(serializeConfigurations(configurations), 'aerolab-configuraciones.json', 'application/json');
    setStatus('Archivo JSON generado con ambas configuraciones.');
  } catch (error) { setStatus(`No se pudo exportar: ${error.message}`, true); }
});
$('#export-csv').addEventListener('click', () => {
  try {
    downloadFile(exportOrbitCSV(configurations), 'aerolab-orbitas.csv', 'text/csv;charset=utf-8');
    setStatus('CSV generado: 241 estados por órbita, con segundos y unidades en las columnas.');
  } catch (error) { setStatus(`No se pudo exportar: ${error.message}`, true); }
});
$('#import-json').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  const initialRevision = revision;
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new Error('El archivo supera el máximo de 16 KiB.');
    const configs = parseConfigurations(await file.text());
    if (revision !== initialRevision) throw new Error('Cambiaste parámetros durante la lectura. Vuelve a seleccionar el archivo.');
    applyConfigurations(configs, 'Configuraciones importadas. Pulsa Guardar si deseas conservarlas en este navegador.');
  } catch (error) { setStatus(`No se pudo importar: ${error.message}`, true); }
  finally { event.target.value = ''; }
});
function resetPrediction() { $('#prediction-feedback').textContent = 'Predicción cambiada. Pulsa Comprobar para verificarla con tus parámetros.'; }
$('#prediction-metric').addEventListener('change', resetPrediction);
$('#prediction-answer').addEventListener('change', resetPrediction);
$('#check-prediction').addEventListener('click', () => {
  try {
    const result = assessPrediction(orbits, $('#prediction-metric').value, $('#prediction-answer').value);
    const words = { higher: 'mayor', equal: 'igual', lower: 'menor' };
    $('#prediction-feedback').textContent = `${result.correct ? 'Correcto.' : 'Revisa tu predicción.'} El valor de B es ${words[result.expected]} al de A; B/A = ${number(result.ratio, 4)}. La comparación usa el modelo de dos cuerpos con las entradas actuales, sin datos de una misión real.`;
  } catch (error) { $('#prediction-feedback').textContent = error.message; }
});

sensitivity = createSensitivity({
  getConfigurations: () => configurations,
  applyConfiguration: (target, config) => applyConfigurations(
    configurations.map((current, index) => index === target ? config : current),
    `Muestra aplicada a ${target === 0 ? 'A' : 'B'}. La otra configuración se conserva; tiempo reiniciado.`,
  ),
});
