import {convergenceStudy,convergenceCSV} from './convergence.js';
import {createLineChart} from '../../charts/line.js';
import {downloadFile} from '../../files.js';
export function createConvergenceStudy(getCurrent) {
  const $=id=>document.getElementById(id),chart=createLineChart($('design-convergence-chart'),$('design-convergence-readout'));
  let study=null;
  const format=value=>value===null?'—':(value===0?0:value).toLocaleString('es-AR',{maximumSignificantDigits:5,notation:value!==0&&(Math.abs(value)<1e-4||Math.abs(value)>=1e6)?'scientific':'standard'});
  function draw(){
    const stress=$('design-convergence-metric').value==='stress';
    chart.render((study?.rows??[]).map(row=>({x:row.actual,y:stress?row.stress/1e6:row.displacement*1000})),
      {x:'Elementos reales',xUnit:'1',y:stress?'Esfuerzo máximo':'Desplazamiento extremo',yUnit:stress?'MPa':'mm',sampleLabel:'Solución'});
  }
  function invalidate(){
    study=null;$('design-convergence-rows').replaceChildren();$('design-convergence-warnings').replaceChildren();$('design-convergence-csv').disabled=true;draw();
    const {result,documentError}=getCurrent();
    $('design-convergence-run').disabled=!result||!!documentError||result.config.object==='sphere';
    $('design-convergence-status').textContent=!result?'Corrige el diseño activo. No hay estudio vigente.':documentError?'Corrige el documento completo para estudiar y exportar configuraciones reproducibles.':result.config.object==='sphere'?'Envolvente esférica: cálculo analítico, sin malla FEM.':'Estudio pendiente. Calcula cinco soluciones sin modificar la discretización del diseño activo.';
  }
  $('design-convergence-run').addEventListener('click',()=>{
    try{
      const {result,documentError}=getCurrent();if(!result||documentError)throw new Error('Diseño completo inválido.');
      study=convergenceStudy(result.config);$('design-convergence-rows').replaceChildren();
      for(const row of study.rows){
        const tr=document.createElement('tr');
        for(const value of [row.target,row.actual,row.displacement*1000,row.stress/1e6,row.displacementChange,row.stressChange,row.residual]){
          const td=document.createElement('td');td.textContent=format(value);tr.append(td);
        }$('design-convergence-rows').append(tr);
      }
      $('design-convergence-warnings').replaceChildren(...[...new Set(study.rows.flatMap(row=>row.warnings))].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
      draw();$('design-convergence-csv').disabled=false;
      $('design-convergence-status').textContent=`${study.model}: cinco soluciones calculadas. No se estima error respecto a una solución exacta ni se certifica convergencia física. Revisa también las advertencias del diseño.`;
    }catch(error){invalidate();$('design-convergence-status').textContent=error.message;}
  });
  $('design-convergence-metric').addEventListener('change',draw);
  $('design-convergence-csv').addEventListener('click',()=>{
    try{if(!study)throw new Error('No hay estudio vigente.');downloadFile(convergenceCSV(study),'aerolab-structure-convergence.csv','text/csv');}
    catch(error){$('design-convergence-status').textContent=error.message;}
  });
  return {invalidate};
}
