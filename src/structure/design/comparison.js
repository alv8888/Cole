import {validate} from './data.js';
import {analyzeDesign} from './model.js';

/** Compare calculated quantities, never mixed stress criteria or different physical axes. */
export function compareDesigns(reference, current) {
  for (const result of [reference, current]) {
    if (!result?.config || typeof result.material?.metal!=='boolean' || !Number.isFinite(result.mass) ||
        [result.maximum,result.displacement].some(value=>value!==null&&!Number.isFinite(value))) {
      throw new Error('Resultados estructurales incompletos o no finitos.');
    }
  }
  const sameCase=reference.config.object===current.config.object && reference.config.load===current.config.load;
  const sameCriterion=reference.material.metal===current.material.metal;
  const metrics=[
    ['mass','Masa de superficies','kg',1,true,''],
    ['maximum','Esfuerzo máximo · Von Mises / axial UD','MPa',1e-6,sameCase&&sameCriterion,
      !sameCase?'Objeto o caso de carga distinto.':'Criterios distintos: Von Mises y esfuerzo axial UD.'],
    ['displacement','Desplazamiento extremo firmado','mm',1000,sameCase,'Objeto o caso de carga distinto: no se comparan ejes físicos diferentes.'],
  ];
  return metrics.map(([key,label,unit,scale,compatible,reason])=>{
    const baseline=reference[key]===null?null:reference[key]*scale;
    const value=current[key]===null?null:current[key]*scale;
    if(baseline===null||value===null){compatible=false;reason='Magnitud no calculada en alguno de los modelos.';}
    const delta=compatible?value-baseline:null;
    return {key,label,unit,reference:baseline,current:value,delta,
      percent:delta===null||baseline===0?null:delta/Math.abs(baseline)*100,compatible,reason:compatible?'':reason};
  });
}
const cell=value=>`"${String(value??'').replaceAll('"','""')}"`;
/** Recompute from full validated configurations; UI rounding never enters exported data. */
export function designComparisonCSV(referenceConfig,currentConfig) {
  const reference=analyzeDesign(validate(referenceConfig)),current=analyzeDesign(validate(currentConfig));
  const rows=[['metric','unit','reference_value','current_value','delta','change_percent','compatible','reason','reference_config_json','current_config_json','model_note']];
  for(const metric of compareDesigns(reference,current)) {
    rows.push([metric.label,metric.unit,metric.reference,metric.current,metric.delta,metric.percent,metric.compatible,metric.reason,
      JSON.stringify(reference.config),JSON.stringify(current.config),
      'Modelos educativos estáticos. Masa de superficies, sin equipos; cambio porcentual no demuestra mejora ni seguridad.']);
  }
  return rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
