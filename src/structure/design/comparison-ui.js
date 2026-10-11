import {clone,validate,MATERIALS} from './data.js';
import {analyzeDesign} from './model.js';
import {compareDesigns,designComparisonCSV} from './comparison.js';
import {downloadFile} from '../../files.js';

/** Temporary independent references: never change saves, shared state or the active object. */
export function createDesignComparison(getCurrent) {
  const references=new Map();
  const $=id=>document.getElementById(id);
  const format=value=>value===null?'—':value.toLocaleString('es-AR',{maximumFractionDigits:4});
  function describe(result) {
    const c=result.config;
    const load={lift:`Sustentación total ${format(c.force)} N`,compression:`Compresión ${format(c.force)} N`,pressure:`Presión ${format(c.pressure)} Pa`,thermal:`ΔT ${format(c.deltaT)} K`}[c.load];
    const geometry=c.object==='aircraft'?`Envergadura ${format(c.wing.span)} m · piel ${format(c.wing.thickness*1000)} mm`:c.object==='rocket'?`${c.rocket.sections.length} secciones · longitud cilíndrica ${format(c.rocket.sections.reduce((sum,s)=>sum+s.length,0))} m`:`Radio ${format(c.sphere.radius)} m · piel ${format(c.sphere.thickness*1000)} mm`;
    return `${{aircraft:'Avión',rocket:'Cohete',sphere:'Envolvente'}[c.object]} · ${MATERIALS[c.material].name} · ${load} · ${geometry}`;
  }
  function render() {
    const {result,documentError,object}=getCurrent(),reference=references.get(object);
    $('design-comparison-capture').disabled=!result||!!documentError;
    $('design-comparison-clear').disabled=!reference;
    $('design-comparison-csv').disabled=!result||!reference||!!documentError;
    $('design-comparison-reference').textContent=reference?`Referencia: ${describe(reference)}`:'Sin referencia para este objeto. Captura un diseño válido y modifica sus entradas para comparar.';
    $('design-comparison-current').textContent=result?`Actual: ${describe(result)}`:'Sin resultado actual. La referencia se conserva; corrige las entradas.';
    $('design-comparison-rows').replaceChildren();
    if(!result||!reference)return;
    for(const metric of compareDesigns(reference,result)) {
      const row=document.createElement('tr'),label=document.createElement('th');
      label.scope='row';label.textContent=`${metric.label} (${metric.unit})`;row.append(label);
      for(const value of [metric.reference,metric.current,metric.delta]) {
        const td=document.createElement('td');td.textContent=format(value);row.append(td);
      }
      const percent=document.createElement('td');
      percent.textContent=!metric.compatible?metric.reason:metric.reference===0?'— (referencia cero)':`${format(metric.percent)} %`;
      row.append(percent);$('design-comparison-rows').append(row);
    }
  }
  $('design-comparison-capture').addEventListener('click',()=>{
    try {
      const {result,documentError}=getCurrent();
      if(!result||documentError)throw new Error('Corrige el documento completo antes de capturar una referencia.');
      references.set(result.config.object,analyzeDesign(validate(clone(result.config))));
      render();$('design-comparison-status').textContent='Referencia capturada en memoria para este objeto. No cambia guardados ni parámetros.';
    }catch(error){$('design-comparison-status').textContent=error.message;}
  });
  $('design-comparison-clear').addEventListener('click',()=>{
    const {object}=getCurrent();references.delete(object);
    render();$('design-comparison-status').textContent='Referencia de este objeto eliminada. El diseño actual se conserva.';
  });
  $('design-comparison-csv').addEventListener('click',()=>{
    try {
      const {result,documentError,object}=getCurrent(),reference=references.get(object);
      if(!result||!reference||documentError)throw new Error('La comparación exportable requiere referencia y documento válido.');
      downloadFile(designComparisonCSV(reference.config,result.config),'aerolab-structure-comparison.csv','text/csv');
      $('design-comparison-status').textContent='CSV descargado con unidades y configuraciones completas. Las diferencias incompatibles quedan vacías.';
    }catch(error){$('design-comparison-status').textContent=error.message;}
  });
  return {render};
}
