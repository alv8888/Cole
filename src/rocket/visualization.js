const NS = 'http://www.w3.org/2000/svg';
function node(tag, attributes, text) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (text !== undefined) el.textContent = text;
  return el;
}
export function chart(svg, samples, end, key, scale, unit) {
  svg.replaceChildren();
  const bounds = samples.reduce((b, s) => ({ min: Math.min(b.min, s[key] * scale), max: Math.max(b.max, s[key] * scale) }), { min: 0, max: 1 });
  const { min, max } = bounds, span = max - min;
  const x = t => 65 + t / Math.max(end, 1) * 480, y = value => 205 - (value - min) / span * 165;
  for (let i = 0; i <= 4; i++) {
    const value = min + span * i / 4;
    svg.append(node('line', { x1: 65, x2: 545, y1: y(value), y2: y(value), stroke: '#29374a' }));
    svg.append(node('text', { x: 60, y: y(value) + 4, 'text-anchor': 'end', fill: '#afbdd0', 'font-size': 11 }, value.toFixed(1)));
    svg.append(node('text', { x: 65 + 120 * i, y: 229, 'text-anchor': 'middle', fill: '#afbdd0', 'font-size': 11 }, (end * i / 4).toFixed(0)));
  }
  const skip = Math.max(1, Math.floor(samples.length / 600));
  const points = samples.filter((s, i) => i % skip === 0 || i === samples.length - 1);
  svg.append(node('polyline', { points: points.map(s => `${x(s.t)},${y(s[key] * scale)}`).join(' '), fill: 'none', stroke: '#8edfcc', 'stroke-width': 2 }));
  const last = samples.at(-1);
  if (last) svg.append(node('circle', { cx: x(last.t), cy: y(last[key] * scale), r: 4, fill: '#c0afff' }));
  svg.setAttribute('aria-label', `${unit} frente a tiempo en segundos; ${last?.t.toFixed(1) ?? 0} s reproducidos.`);
}
export function stageDiagram(svg, config, state) {
  svg.replaceChildren();
  svg.append(node('text', { x: 15, y: 22, fill: '#afbdd0', 'font-size': 12 }, 'Esquema de etapas · no es geometría dimensional'));
  svg.append(node('path', { d: 'M145 45 L175 45 L160 20 Z', fill: '#c0afff' }));
  config.stages.forEach((stage, index) => {
    const y = 50 + (config.stages.length - 1 - index) * 45;
    const discarded = state && index < state.stage && index < config.stages.length - 1;
    svg.append(node('rect', { x: 135, y, width: 50, height: 40, rx: 4, fill: discarded ? '#273345' : '#8edfcc', opacity: discarded ? 0.35 : 1 }));
    svg.append(node('text', { x: 200, y: y + 24, fill: '#afbdd0', 'font-size': 12 }, `Etapa ${index + 1}${discarded ? ' · separada' : ''}`));
  });
}
