import { registerSharePart } from '../navigation/ui.js';
import { createCalculationState } from '../navigation/calculation-state.js';
import { choice } from '../navigation/share.js';
import { MATERIALS, DEFAULT, SUPPORTS, FIELDS, activeKeys } from './materials.js';
import { analyze, cleanConfiguration } from './model.js';
import { saveStructure,loadStructure } from './storage.js';
import { drawStructure,drawChart } from './visualization.js';
import { number } from '../units.js';
import { downloadFile } from '../files.js';
const $=id=>document.getElementById(id);
const calculationState=createCalculationState($('structure-form'),'structure-calculation-state');
let current=null,reference=null;
$('structure-material').replaceChildren(...Object.entries(MATERIALS).map(([value,data])=>new Option(data.name,value)));
$('structure-support').replaceChildren(...Object.entries(SUPPORTS).map(([value,data])=>new Option(`${data.name} · K=${data.k}`,value)));
$('structure-fields').innerHTML=Object.entries(FIELDS).map(([key,f])=>`<div class="field" id="structure-field-${key}"><label for="str-${key}">${f.label}<span>${f.unit}</span></label><input id="str-${key}" type="number" step="any" min="${f.min}" max="${f.max}" required aria-describedby="str-${key}-limit str-${key}-error"><p id="str-${key}-limit" class="limits">${f.minPositive?'0 o ≥ '+f.minPositive:f.min}–${f.max} ${f.unit}</p><p id="str-${key}-error" class="field-error"></p></div>`).join('');
function fill(c){const all={...DEFAULT,...c};$('structure-material').value=all.material;$('structure-mode').value=all.mode;$('structure-support').value=all.support;Object.keys(FIELDS).forEach(key=>$(`str-${key}`).value=all[key]);}
function read(){const mode=$('structure-mode').value;return {material:$('structure-material').value,mode,...Object.fromEntries(activeKeys(mode).map(key=>[key,$(`str-${key}`).valueAsNumber])),...(mode==='compression'?{support:$('structure-support').value}:{})};}
function status(message){$('structure-status').textContent=message;}
const rows=[['area','Área','m²',1],['inertia','Segundo momento de área','m⁴',1],['moment','Momento máximo de flexión','N·m',1],['stress','Esfuerzo máximo normal (flexión o compresión)','MPa',1e-6],['referenceStrength','Referencia resistente utilizada','MPa',1e-6],['materialFactor','Coeficiente frente a referencia resistente','sin unidad',1],['deflection','Deflexión máxima en punta','mm',1000],['shortening','Acortamiento axial máximo','mm',1000],['slenderness','Esbeltez KL/r','sin unidad',1],['criticalLoad','Carga crítica Euler (solo aplicable)','N',1],['bucklingFactor','Margen de pandeo Euler (solo aplicable)','sin unidad',1]];
function format(r,key,scale){
 if(!r)return '—';
 if(['criticalLoad','bucklingFactor'].includes(key)&&!r.eulerApplicable)return '— no aplicable';
 if(r[key]===null)return key==='materialFactor'||key==='bucklingFactor'?'∞ (sin carga)':'—';
 return number(r[key]*scale,key==='inertia'?9:4);
}
function renderResults(result){
 const baseline=reference?analyze(reference):null;
 $('structure-results').replaceChildren(...rows.map(([key,label,unit,scale])=>{const row=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=`${label} (${unit})`;row.append(th);[result,baseline].forEach(r=>{const td=document.createElement('td');td.textContent=format(r,key,scale);row.append(td);});return row;}));
 $('structure-reference-note').textContent=reference?`Referencia: ${MATERIALS[reference.material].name} · ${reference.mode==='compression'?'compresión':reference.mode==='tip'?'fuerza en punta':'carga uniforme'} · L=${number(reference.length)} m. Se comparan modelos ideales, no ensayos reales.`:'Sin referencia capturada. Un guion distingue resultados que no corresponden al tipo de carga.';
 $('structure-samples').replaceChildren(...(result?.samples??[]).map(p=>{const row=document.createElement('tr');[p.x,p.displacement*1000,p.moment,p.stress*1e-6].forEach(value=>{const td=document.createElement('td');td.textContent=number(value,5);row.append(td);});return row;}));
}
function visualize(result){$('structure-scale-note').textContent=drawStructure($('structure-diagram'),result,$('structure-amplify').checked);}
function update(){
 const c=read(),active=activeKeys(c.mode);
 Object.entries(FIELDS).forEach(([key,f])=>{const used=active.includes(key),input=$(`str-${key}`);$(`structure-field-${key}`).hidden=!used;input.disabled=!used;const bad=used&&(!Number.isFinite(c[key])||c[key]<f.min||c[key]>f.max||(!!f.minPositive&&c[key]>0&&c[key]<f.minPositive));input.setAttribute('aria-invalid',String(bad));$(`str-${key}-error`).textContent=bad?'Introduce un valor dentro de los límites.':'';});
 $('structure-support-field').hidden=c.mode!=='compression';$('structure-support').disabled=c.mode!=='compression';
 $('structure-support-note').textContent=`Longitud efectiva KL con K=${SUPPORTS[c.support]?.k??'—'}. Apoyos perfectos; no evalúa rigidez real de uniones.`;
 const preset=MATERIALS[c.material];
 const custom=preset&&['modulus','tensile','compressive'].some(key=>c[key]!==preset[key]);
 $('structure-material-note').textContent=`${custom?'Propiedades editadas: se calcula con las entradas actuales. ':''}${preset?.note??'Material inválido.'} Las propiedades mostradas son editables; al cambiar material se restablecen sus valores orientativos.`;
 let result=null,modelError=null;try{result=analyze(c);current=result.config;status('Cálculo analítico actualizado; referencias orientativas, sin certificación.');}catch(error){modelError=error.message;current=null;status(error.message);if(c.mode==='compression'&&c.thickness>=c.diameter/2){$('str-thickness').setAttribute('aria-invalid','true');$('str-thickness-error').textContent='Debe ser menor que D/2.';}}
 calculationState.update(result?'ready':'invalid',result?'Banco analítico recalculado. Es independiente del diseñador 3D; las referencias resistentes no certifican seguridad.':modelError);
 ['structure-reference','structure-save','structure-json','structure-csv'].forEach(id=>$(id).disabled=!result);$('structure-clear').disabled=!reference;
 renderResults(result);visualize(result);
 drawChart($('structure-displacement'),result,'displacement',1000,c.mode==='compression'?'Acortamiento axial (mm)':'Deflexión v(x) (mm)');
 drawChart($('structure-moment'),result,'moment',1,'Momento flector (N·m)');
 $('structure-summary').textContent=result?`σmáx=${number(result.stress*1e-6,3)} MPa · ${c.mode==='compression'?'Acortamiento':'Deflexión punta'}=${number((result.deflection??result.shortening)*1000,3)} mm · Coeficiente material ${result.materialFactor===null?'∞ (sin carga)':number(result.materialFactor,3)}. ${c.material==='carbon'?'Referencia de resistencia del laminado hipotético.':'Referencia de límite elástico orientativo.'}`:'Sin resultados vigentes: corrige las entradas.';
 $('structure-warnings').replaceChildren(...(result?.warnings??['No se muestran resultados calculados con entradas inválidas.']).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
}
fill(DEFAULT);update();
$('structure-form').addEventListener('submit',event=>event.preventDefault());
$('structure-form').addEventListener('input',event=>{if(event.target.id==='structure-material'){const p=MATERIALS[$('structure-material').value];['modulus','tensile','compressive'].forEach(key=>$(`str-${key}`).value=p[key]);}update();});
$('structure-amplify').addEventListener('change',()=>visualize(current?analyze(current):null));
$('structure-reference').addEventListener('click',()=>{reference={...current};update();status('Referencia capturada para comparación; no es un ensayo.');});
$('structure-clear').addEventListener('click',()=>{reference=null;update();});
$('structure-reset').addEventListener('click',()=>{fill(DEFAULT);update();status('Parámetros iniciales restaurados; referencia y guardado conservados.');});
$('structure-save').addEventListener('click',()=>{try{saveStructure(localStorage,current);status('Structure Lab guardado en este navegador.');}catch(error){status(`No se pudo guardar: ${error.message}`);}});
$('structure-load').addEventListener('click',()=>{try{fill(loadStructure(localStorage));update();status('Configuración estructural recuperada.');}catch(error){status(`No se pudo cargar: ${error.message}`);}});
$('structure-json').addEventListener('click',()=>{try{downloadFile(JSON.stringify({version:1,module:'structure',configuration:current},null,2),'aerolab-structure.json','application/json');status('JSON generado con configuración estructural.');}catch(error){status(error.message);}});
$('structure-csv').addEventListener('click',()=>{try{const r=analyze(current),c=r.config,prefix=[c.mode,c.material,c.length,c.modulus*1e9,c.tensile*1e6,c.compressive*1e6,c.width??'',c.height??'',c.diameter??'',c.thickness??'',c.force??'',c.distributed??'',SUPPORTS[c.support]?.k??''],csv='mode,material,length_m,modulus_Pa,tensile_reference_Pa,compression_reference_Pa,width_m,height_m,diameter_m,thickness_m,force_N,distributed_N_m,K,x_m,displacement_m,moment_N_m,stress_Pa\n'+r.samples.map(p=>[...prefix,p.x,p.displacement,p.moment,p.stress].join(',')).join('\n');downloadFile(csv,'aerolab-estructura.csv','text/csv');status('CSV generado con 81 puntos y unidades SI.');}catch(error){status(error.message);}});
registerSharePart('structure',{
 get:()=>({configuration:read(),reference,amplify:$('structure-amplify').checked}),
 validate(state){cleanConfiguration(state.configuration);if(state.reference!==null)cleanConfiguration(state.reference);choice(state.amplify,[true,false]);},
 apply(state){reference=state.reference;fill(cleanConfiguration(state.configuration));$('structure-amplify').checked=state.amplify;update();},
});
