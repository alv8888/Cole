import {validate} from './data.js';
import {analyzeDesign} from './model.js';
export const TARGETS=Object.freeze([4,8,16,32,48]);
const change=(previous,current)=>previous===null||previous===0?null:100*Math.abs(current-previous)/Math.abs(previous);
/** Successive solutions, not an error estimate against an exact solution. */
export function convergenceStudy(configuration) {
  const config=validate(configuration);
  if(config.object==='sphere')throw new Error('La esfera usa un modelo analítico: no tiene discretización FEM que refinar.');
  let previous=null,model;
  const rows=TARGETS.map(target=>{
    const result=analyzeDesign({...config,elements:target});
    model=result.model;
    if(!Number.isFinite(result.displacement)||!Number.isFinite(result.maximum)||!Number.isFinite(result.residual))throw new Error('Solución no finita en el estudio.');
    const row={target,actual:result.points.length-1,displacement:result.displacement,stress:result.maximum,residual:result.residual,
      displacementChange:change(previous?.displacement??null,result.displacement),stressChange:change(previous?.stress??null,result.maximum),
      configuration:result.config,warnings:[...result.warnings]};
    previous=row;return row;
  });
  return {configuration:config,model,rows};
}
const cell=value=>`"${String(value??'').replaceAll('"','""')}"`;
export function convergenceCSV(study) {
  if(!Array.isArray(study?.rows)||study.rows.length!==TARGETS.length)throw new Error('Estudio incompleto.');
  const rows=[['target_elements','actual_elements','tip_displacement_m','maximum_stress_Pa','displacement_change_percent','stress_change_percent','relative_equilibrium_residual','configuration_json','warnings_json','model_note']];
  for(const row of study.rows)rows.push([row.target,row.actual,row.displacement,row.stress,row.displacementChange,row.stressChange,row.residual,JSON.stringify(row.configuration),JSON.stringify(row.warnings),
    'Diferencias sucesivas, sin estimación del error exacto ni validación física. Contorno y cuadratura de masa fijos; no estudia convergencia de pandeo.']);
  return rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
