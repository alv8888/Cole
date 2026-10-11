import { EXPERIMENTS, experimentValue } from './experiments.js';

/** Compare the same quantities and units; percentages against zero are undefined. */
export function compareExperiments(reference, current) {
  if (!Array.isArray(reference?.metrics) || !Array.isArray(current?.metrics) || reference.metrics.length !== current.metrics.length) throw new Error('Resultados de comparación incompatibles.');
  return current.metrics.map(([label, value, unit], index) => {
    const [referenceLabel, baseline, referenceUnit] = reference.metrics[index];
    if (label !== referenceLabel || unit !== referenceUnit || !Number.isFinite(value) || !Number.isFinite(baseline)) throw new Error('Magnitudes o unidades incompatibles.');
    const delta = value - baseline;
    return { label, unit, reference: baseline, current: value, delta, percent: baseline === 0 ? null : delta / Math.abs(baseline) * 100 };
  });
}
const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
/** One rectangular UTF-8 CSV: comparison rows and independent sensitivity samples. */
export function experimentCSV(id, referenceInput, currentInput, reference, current, curve) {
  experimentValue(id, referenceInput); experimentValue(id, currentInput);
  const d = EXPERIMENTS[id], comparisons = compareExperiments(reference, current);
  if (!Array.isArray(curve) || curve.length !== 21 || curve.some(point => !Number.isFinite(point.y) || !Number.isFinite(point.x) || point.x < d.min || point.x > d.max)) throw new Error('Curva inválida.');
  const rows = [['lab','kind','parameter','parameter_unit','reference_input','current_input','metric','metric_unit','reference_value','current_value','delta','change_percent','model_note','reference_config_json','current_config_json']];
  for (const row of comparisons) rows.push([id,'comparison',d.label,d.unit,referenceInput,currentInput,row.label,row.unit,row.reference,row.current,row.delta,row.percent,current.note,JSON.stringify(reference.configuration),JSON.stringify(current.configuration)]);
  for (const point of curve) rows.push([id,'sweep',d.label,d.unit,'',point.x,d.y,d.yUnit,'',point.y,'','',current.note,'','']);
  return rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
