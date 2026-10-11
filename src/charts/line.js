import { axis, project, nearestPoint } from './scales.js';
const NS = 'http://www.w3.org/2000/svg';
const format = value => value.toLocaleString('es-AR', {maximumSignificantDigits: 4});
/** SVG chart with signed quantitative ticks, pointer/keyboard inspection and text output. */
export function createLineChart(svg, readout) {
  let data = [], xDomain, yDomain, cursor = null, index = 0, labels;
  const left = 85, right = 690, top = 30, bottom = 225;
  function node(tag, attrs, text) {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (text !== undefined) el.textContent = text;
    svg.append(el);
    return el;
  }
  function select(next) {
    if (!data.length) return;
    index = Math.max(0, Math.min(data.length - 1, next));
    const p = data[index];
    cursor.setAttribute('cx', project(p.x, xDomain, left, right));
    cursor.setAttribute('cy', project(p.y, yDomain, bottom, top));
    readout.textContent = `${labels.sampleLabel ?? 'Nodo'} ${index + 1}/${data.length} · ${labels.x}: ${format(p.x)} ${labels.xUnit} · ${labels.y}: ${format(p.y)} ${labels.yUnit}`;
  }
  svg.addEventListener('pointerdown', event => {
    if (!data.length) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    const x = project(point.x, {min: left, max: right}, xDomain.min, xDomain.max);
    select(nearestPoint(data, x));
  });
  svg.addEventListener('keydown', event => {
    if (!data.length) return;
    const next = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: data.length - 1}[event.key];
    if (next !== undefined) { event.preventDefault(); select(next); }
  });
  return {
    render(points, description) {
      data = points; labels = description; index = 0; svg.replaceChildren();
      svg.classList.add('scientific-chart'); svg.setAttribute('viewBox', '0 0 720 280');
      if (!data.length) {
        svg.removeAttribute('tabindex'); svg.setAttribute('aria-label', 'Sin campo válido.');
        readout.textContent = 'Sin desplazamientos vigentes.'; return;
      }
      xDomain = axis(data.map(p => p.x)); yDomain = axis(data.map(p => p.y));
      svg.setAttribute('tabindex', '0'); svg.setAttribute('aria-describedby', readout.id);
      svg.setAttribute('aria-label', `${labels.y} (${labels.yUnit}) frente a ${labels.x} (${labels.xUnit}). Flechas inspeccionan ${labels.sampleLabel ? 'muestras' : 'nodos'}; Inicio/Fin seleccionan extremos.`);
      for (const x of xDomain.ticks) {
        const px = project(x, xDomain, left, right);
        node('line', {x1: px, x2: px, y1: top, y2: bottom, class: 'chart-grid'});
        node('text', {x: px, y: bottom + 22, fill: '#bfccde', 'text-anchor': 'middle', 'data-axis': 'x'}, format(x));
      }
      for (const y of yDomain.ticks) {
        const py = project(y, yDomain, bottom, top);
        node('line', {x1: left, x2: right, y1: py, y2: py, class: y === 0 ? 'chart-zero' : 'chart-grid', 'data-zero': String(y === 0)});
        node('text', {x: left - 10, y: py + 5, fill: '#bfccde', 'text-anchor': 'end', 'data-axis': 'y'}, format(y));
      }
      node('text', {x: left, y: 18, fill: '#e0e9f5'}, `${labels.y} (${labels.yUnit})`);
      node('text', {x: (left + right) / 2, y: 270, fill: '#e0e9f5', 'text-anchor': 'middle'}, `${labels.x} (${labels.xUnit})`);
      node('polyline', {points: data.map(p => `${project(p.x, xDomain, left, right)},${project(p.y, yDomain, bottom, top)}`).join(' '), class: 'chart-curve'});
      cursor = node('circle', {r: 5, class: 'chart-cursor'}); select(0);
    }
  };
}
