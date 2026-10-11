import { number, mToKm } from './units.js';
import { positionAtPhase } from './physics.js';
import { BODIES } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#8edfcc', '#c0afff'];
function element(tag, attributes = {}, content) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (content !== undefined) node.textContent = content;
  return node;
}

export function drawOrbit(svg, config, orbit, index, maxRadius) {
  svg.replaceChildren();
  if (!orbit) {
    svg.append(element('text', { x: 160, y: 160, 'text-anchor': 'middle', fill: '#ffb2ac', 'font-size': 12 }, 'Parámetros inválidos'));
    svg.setAttribute('aria-label', 'Órbita no disponible: corrige los parámetros.');
    return;
  }
  const scale = 128 / maxRadius;
  const pixelRadius = orbit.r * scale;
  const bodyRadius = config.radius * 1000 * scale;
  const label = index === 0 ? 'A' : 'B';
  svg.setAttribute('aria-label', `Órbita ${label}: radio ${number(mToKm(orbit.r))} km, cuerpo ${number(config.radius)} km. Misma escala en ambas vistas.`);
  svg.append(element('title', {}, `Órbita circular ${label}`));
  for (let offset = 32; offset < 320; offset += 32) {
    svg.append(element('line', { x1: offset, y1: 16, x2: offset, y2: 304, stroke: '#243144', 'stroke-opacity': '.45' }));
    svg.append(element('line', { x1: 16, y1: offset, x2: 304, y2: offset, stroke: '#243144', 'stroke-opacity': '.45' }));
  }
  svg.append(element('line', { x1: 160, y1: 16, x2: 160, y2: 304, stroke: '#42516a', 'stroke-dasharray': '3 5' }));
  svg.append(element('line', { x1: 16, y1: 160, x2: 304, y2: 160, stroke: '#42516a', 'stroke-dasharray': '3 5' }));
  svg.append(element('circle', { cx: 160, cy: 160, r: bodyRadius, fill: BODIES[config.body]?.color ?? '#798fba', 'fill-opacity': '.17', stroke: BODIES[config.body]?.color ?? '#798fba', 'stroke-opacity': '.7' }));
  svg.append(element('circle', { cx: 160, cy: 160, r: pixelRadius, fill: 'none', stroke: COLORS[index], 'stroke-width': 1.5 }));
  svg.append(element('line', { x1: 160, y1: 160, x2: 160 + pixelRadius, y2: 160, stroke: COLORS[index], 'stroke-opacity': '.4', 'stroke-dasharray': '3 4' }));
  svg.append(element('circle', { cx: 160 + pixelRadius, cy: 160, r: 4, fill: COLORS[index], 'data-satellite': '', 'data-radius': pixelRadius }));
  svg.append(element('circle', { cx: 160, cy: 160, r: 1.5, fill: '#c4cedc' }));
  svg.append(element('text', { x: 160, y: 309, 'text-anchor': 'middle', fill: COLORS[index], 'font-size': 10 }, `r = ${number(mToKm(orbit.r))} km`));
  if (pixelRadius < 12 || bodyRadius < 1) svg.append(element('text', { x: 160, y: 24, 'text-anchor': 'middle', fill: '#dfc799', 'font-size': 9 }, 'Detalle pequeño a esta escala'));
}

export function moveSatellite(svg, orbit, time) {
  const point = svg.querySelector('[data-satellite]');
  if (!point || !orbit) return;
  // Reduce time before evaluating trig to avoid large-angle precision loss.
  const phase = (time % orbit.period) * orbit.angularVelocity;
  const pos = positionAtPhase(Number(point.dataset.radius), phase);
  point.setAttribute('cx', 160 + pos.x);
  point.setAttribute('cy', 160 - pos.y); // SVG y grows downward; physics y upward.
}

export function drawBars(svg, values, unit) {
  svg.replaceChildren();
  if (values.some(value => value === null)) {
    svg.append(element('text', { x: 16, y: 60, fill: '#a1afc2', 'font-size': 13 }, 'Corrige ambas configuraciones para comparar.'));
    svg.setAttribute('aria-label', 'Comparación no disponible.');
    return;
  }
  const max = Math.max(...values);
  svg.setAttribute('aria-label', `A: ${number(values[0])} ${unit}. B: ${number(values[1])} ${unit}. Eje desde cero.`);
  svg.append(element('line', { x1: 35, y1: 10, x2: 35, y2: 94, stroke: '#42516a' }));
  values.forEach((value, index) => {
    const y = 20 + index * 42;
    svg.append(element('text', { x: 10, y: y + 17, fill: COLORS[index], 'font-size': 13 }, index === 0 ? 'A' : 'B'));
    svg.append(element('rect', { x: 35, y, width: value / max * 290, height: 25, rx: 3, fill: COLORS[index], 'fill-opacity': '.75' }));
    svg.append(element('text', { x: 45 + value / max * 290, y: y + 17, fill: '#e8edf5', 'font-size': 12 }, number(value)));
  });
  svg.append(element('text', { x: 35, y: 114, fill: '#a1afc2', 'font-size': 10 }, '0'));
  svg.append(element('text', { x: 325, y: 114, 'text-anchor': 'end', fill: '#a1afc2', 'font-size': 10 }, `${number(max)} ${unit}`));
}
