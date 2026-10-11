/** Numeric axis independent from SVG and DOM; zero is always inside the domain. */
export function axis(values, intervals = 4) {
  if (!values.length || !values.every(Number.isFinite)) throw new RangeError('Serie no finita o vacía.');
  if (!Number.isInteger(intervals) || intervals < 2 || intervals > 10) throw new RangeError('Divisiones inválidas.');
  let lo = Math.min(0, ...values), hi = Math.max(0, ...values);
  if (lo === hi) { lo = -1; hi = 1; }
  const raw = (hi - lo) / intervals, order = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find(v => v * order >= raw) * order;
  const first = Math.floor(lo / step), last = Math.ceil(hi / step);
  const ticks = Array.from({length: last - first + 1}, (_, i) => (first + i) * step);
  return { min: first * step, max: last * step, ticks, step };
}
export function project(value, domain, start, end) {
  return start + (value - domain.min) / (domain.max - domain.min) * (end - start);
}
export function nearestPoint(points, x) {
  if (!points.length || !Number.isFinite(x)) throw new RangeError('Cursor inválido.');
  return points.reduce((best, p, i) => Math.abs(p.x - x) < Math.abs(points[best].x - x) ? i : best, 0);
}
