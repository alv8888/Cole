import { parameterSweep, exportSweepCSV, SWEEP_VARIABLES, SWEEP_METRICS } from './sensitivity.js';
import { LIMITS } from './validation.js';
import { number } from './units.js';
import { downloadFile } from './files.js';

const NS = 'http://www.w3.org/2000/svg';
function svgNode(tag, attributes, text) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  return node;
}
function axisNumber(value) {
  return value >= 1000 || (value > 0 && value < 0.01) ? value.toExponential(1) : number(value);
}

export function createSensitivity({ getConfigurations, applyConfiguration }) {
  const $ = id => document.getElementById(id);
  let samples = null;
  let base = null;
  let options = null;
  let target = 0;
  let activeMetric = 'period';

  function invalidate(message = 'Los parámetros cambiaron. Calcula de nuevo para ver resultados actuales.') {
    samples = null;
    base = null;
    options = null;
    for (const id of ['sweep-sample', 'apply-sweep', 'export-sweep']) $(id).disabled = true;
    $('sweep-status').textContent = message;
    $('sweep-y-label').textContent = `${SWEEP_METRICS[$('sweep-metric').value].label} (${SWEEP_METRICS[$('sweep-metric').value].unit})`;
    $('sweep-x-label').textContent = `${SWEEP_VARIABLES[$('sweep-variable').value].label} (${SWEEP_VARIABLES[$('sweep-variable').value].unit})`;
    $('sweep-result').textContent = 'Sin resultados vigentes.';
    $('sweep-table').replaceChildren();
    $('sweep-chart').replaceChildren(svgNode('text', { x: 30, y: 100, fill: '#a1afc2', 'font-size': 14 }, 'Calcula un barrido para explorar.'));
    $('sweep-chart').setAttribute('aria-label', 'Barrido sin resultados vigentes.');
  }

  function setLimits() {
    const variable = $('sweep-variable').value;
    const limit = LIMITS[variable];
    for (const id of ['sweep-min', 'sweep-max']) {
      $(id).min = limit.min;
      $(id).max = limit.max;
      $(id).setAttribute('aria-invalid', 'false');
    }
    $('sweep-min').value = variable === 'altitude' ? 200 : 0;
    $('sweep-max').value = variable === 'altitude' ? 2000 : 0.8;
    $('sweep-limits').textContent = `Intervalo permitido: ${limit.min} a ${limit.max} ${limit.unit}. El mínimo debe ser menor que el máximo.`;
  }

  function selectSample() {
    if (!samples) return;
    const index = Number($('sweep-sample').value);
    const sample = samples[index];
    const metric = SWEEP_METRICS[activeMetric];
    const variable = SWEEP_VARIABLES[options.variable];
    $('sweep-result').textContent = `Muestra ${index + 1}/${samples.length}: ${variable.label} = ${number(sample.value, options.variable === 'eccentricity' ? 4 : 2)} ${variable.unit}; ${metric.label} = ${number(metric.convert(sample.orbit[activeMetric]), 4)} ${metric.unit}. Aplicar modifica solo ${target === 0 ? 'A' : 'B'}.`;
    $('sweep-sample').setAttribute('aria-valuetext', `Muestra ${index + 1} de ${samples.length}: ${number(sample.value, 4)} ${variable.unit}`);
    const marker = $('sweep-chart').querySelector('[data-sweep-marker]');
    marker.setAttribute('cx', 68 + index / (samples.length - 1) * 462);
    marker.setAttribute('cy', 210 - metric.convert(sample.orbit[activeMetric]) / Number($('sweep-chart').dataset.maximum) * 178);
  }

  function drawChart() {
    const svg = $('sweep-chart');
    svg.replaceChildren();
    const metric = SWEEP_METRICS[activeMetric];
    const values = samples.map(sample => metric.convert(sample.orbit[activeMetric]));
    const maximum = Math.max(...values) * 1.08;
    svg.dataset.maximum = maximum;
    for (let tick = 0; tick <= 4; tick++) {
      const value = maximum * tick / 4;
      const y = 210 - value / maximum * 178;
      svg.append(svgNode('line', { x1: 68, x2: 530, y1: y, y2: y, stroke: '#273345' }));
      svg.append(svgNode('text', { x: 61, y: y + 4, fill: '#a1afc2', 'font-size': 12, 'text-anchor': 'end' }, axisNumber(value)));
      const input = options.minimum + (options.maximum - options.minimum) * tick / 4;
      svg.append(svgNode('text', { x: 68 + tick / 4 * 462, y: 232, fill: '#a1afc2', 'font-size': 12, 'text-anchor': 'middle' }, axisNumber(input)));
    }
    svg.append(svgNode('polyline', { points: values.map((value, i) => `${68 + i / (values.length - 1) * 462},${210 - value / maximum * 178}`).join(' '), fill: 'none', stroke: '#8edfcc', 'stroke-width': 2, 'data-sweep-curve': '' }));
    svg.append(svgNode('circle', { cx: 68, cy: 210 - values[0] / maximum * 178, r: 5, fill: '#c0afff', 'data-sweep-marker': '' }));
    svg.setAttribute('aria-label', `${metric.label} (${metric.unit}) frente a ${SWEEP_VARIABLES[options.variable].label}, entre ${options.minimum} y ${options.maximum}. ${samples.length} cálculos, eje vertical desde cero.`);
    $('sweep-y-label').textContent = `${metric.label} (${metric.unit})`;
    $('sweep-x-label').textContent = `${SWEEP_VARIABLES[options.variable].label} (${SWEEP_VARIABLES[options.variable].unit})`;
  }

  function calculate(event) {
    event?.preventDefault();
    invalidate('Calculando…');
    for (const id of ['sweep-min', 'sweep-max']) $(id).setAttribute('aria-invalid', 'false');
    try {
      const selectedTarget = Number($('sweep-target').value);
      const source = getConfigurations()[selectedTarget];
      const nextOptions = { variable: $('sweep-variable').value, minimum: $('sweep-min').valueAsNumber, maximum: $('sweep-max').valueAsNumber, count: Number($('sweep-count').value) };
      const nextSamples = parameterSweep(source, nextOptions);
      samples = nextSamples;
      base = { ...source };
      options = nextOptions;
      target = selectedTarget;
      activeMetric = $('sweep-metric').value;
      const metric = SWEEP_METRICS[activeMetric];
      drawChart();
      $('sweep-table').replaceChildren(...samples.map((sample, index) => {
        const row = document.createElement('tr');
        for (const [column, value] of [index + 1, sample.value, metric.convert(sample.orbit[activeMetric])].entries()) {
          const cell = document.createElement('td');
          cell.textContent = number(value, column === 0 ? 0 : 4);
          row.append(cell);
        }
        return row;
      }));
      $('sweep-input-heading').textContent = `${SWEEP_VARIABLES[options.variable].label} (${SWEEP_VARIABLES[options.variable].unit})`;
      $('sweep-output-heading').textContent = `${metric.label} (${metric.unit})`;
      $('sweep-sample').max = samples.length - 1;
      $('sweep-sample').value = 0;
      for (const id of ['sweep-sample', 'apply-sweep', 'export-sweep']) $(id).disabled = false;
      $('sweep-status').textContent = `${samples.length} modelos independientes de ${target === 0 ? 'A' : 'B'}. Fijos: μ=${number(base.mu, 6)} km³/s²; R=${number(base.radius)} km; ${options.variable === 'altitude' ? `e=${number(base.eccentricity, 4)}` : `hₚ=${number(base.altitude)} km`}. No es una evolución temporal ni una garantía de viabilidad.`;
      if (base.body === 'earth' && (options.variable === 'altitude' ? options.minimum : base.altitude) < 150) {
        $('sweep-status').textContent += ' Incluye periapsis terrestres muy bajos: se omite un arrastre atmosférico importante.';
      }
      selectSample();
    } catch (error) {
      invalidate(error.message);
      const minimum = $('sweep-min').valueAsNumber;
      const maximum = $('sweep-max').valueAsNumber;
      const limit = LIMITS[$('sweep-variable').value];
      $('sweep-min').setAttribute('aria-invalid', String(!Number.isFinite(minimum) || minimum < limit.min || minimum >= maximum));
      $('sweep-max').setAttribute('aria-invalid', String(!Number.isFinite(maximum) || maximum > limit.max || minimum >= maximum));
    }
  }

  $('sweep-form').addEventListener('submit', calculate);
  $('sweep-form').addEventListener('input', event => {
    if (event.target.id === 'sweep-variable') setLimits();
    invalidate();
  });
  $('sweep-sample').addEventListener('input', selectSample);
  $('apply-sweep').addEventListener('click', () => {
    if (!samples) return;
    const config = { ...samples[Number($('sweep-sample').value)].configuration };
    applyConfiguration(target, config);
  });
  $('export-sweep').addEventListener('click', () => {
    if (!samples) return;
    try { downloadFile(exportSweepCSV(base, options), 'aerolab-barrido.csv', 'text/csv;charset=utf-8'); }
    catch (error) { $('sweep-status').textContent = error.message; }
  });
  setLimits();
  calculate();
  return { refresh: () => invalidate() };
}
