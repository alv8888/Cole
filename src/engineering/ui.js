import { registerSharePart } from '../navigation/ui.js';
import { numberIn, choice } from '../navigation/share.js';
import { G0 } from './models.js';
import { decodeAircraftRecord } from '../aircraft/configuration.js';
import { createAircraftForces } from '../aircraft/visualization.js';
import { PROFILES } from './profiles.js';
import { createView3D } from './view3d.js';
import { number } from '../units.js';
import { downloadFile } from '../files.js';

const kind=document.body.dataset.lab,profile=PROFILES[kind];
const $=id=>document.getElementById(id);
const defaults=()=>({...Object.fromEntries(profile.fields.map(field=>[field.key,field.value])),...(kind==='aircraft'?{dragMode:'polar'}:{})});
let reference=null,current=null;
const groups=[...new Set(profile.fields.map(field=>field.group))];
$('engineering-fields').innerHTML=groups.map(group=>`<fieldset><legend>${group}</legend><div class="engineering-field-grid">${profile.fields.filter(field=>field.group===group).map(field=>`<div class="field"><label for="eng-${field.key}">${field.label}<span>${field.unit}</span></label><input id="eng-${field.key}" type="number" min="${profile.ranges[field.key][0]}" max="${profile.ranges[field.key][1]}" step="any" required aria-describedby="limit-${field.key} error-${field.key}"><p id="limit-${field.key}" class="limits">${profile.ranges[field.key].join(' – ')} ${field.unit}</p><p id="error-${field.key}" class="field-error"></p></div>`).join('')}</div></fieldset>`).join('');
$('engineering-equations').textContent=profile.equations;
$('engineering-limits').textContent=profile.limits;
const view=createView3D($('engineering-canvas'),$('view-yaw'),$('view-pitch'),kind);
const forces=kind==='aircraft'?createAircraftForces($('aircraft-side'),$('aircraft-forces'),$('aircraft-balance'),$('aircraft-flow-toggle')):null;
function fill(config){profile.fields.forEach(field=>$(`eng-${field.key}`).value=config[field.key]??(field.key==='thrustPercent'?100:''));if(kind==='aircraft')$('aircraft-drag-mode').value=config.dragMode;}

function read(){return {...Object.fromEntries(profile.fields.map(field=>[field.key,$(`eng-${field.key}`).valueAsNumber])),...(kind==='aircraft'?{dragMode:$('aircraft-drag-mode').value}:{})};}
function status(message){$('engineering-status').textContent=message;}
function renderResults(result){
  const baseline=reference?profile.compute(reference):null;
  $('engineering-results').replaceChildren(...profile.results.map(field=>{
    const row=document.createElement('tr'),heading=document.createElement('th');heading.scope='row';heading.textContent=`${field.label} (${field.unit})`;row.append(heading);
    const value=result?.[field.key],base=baseline?.[field.key];
    for(const item of [value,base]){const cell=document.createElement('td');cell.textContent=item===null||item===undefined?'—':number(item*field.scale,3);row.append(cell);}
    const difference=document.createElement('td');difference.textContent=Number.isFinite(value)&&Number.isFinite(base)&&base!==0?`${number((value/base-1)*100)} %`:'—';row.append(difference);return row;
  }));
}
function drawGraph(config,result){
  const svg=$('engineering-graph');svg.replaceChildren();
  if(!result){svg.setAttribute('aria-label','Sin resultados válidos.');return;}
  const series=Array.from({length:81},(_,i)=>{
    if(kind==='aircraft'){
      const groundSpeed=10+i/80*110;
      if(groundSpeed-config.windAlong<=0)return null;
      const model=profile.compute({...config,groundSpeed});return {x:groundSpeed,y:model.lift};
    }
    const model=profile.compute({...config,burnPercent:i/80*100});return {x:model.time,y:model.currentDeltaV};
  }).filter(Boolean);
  const maxX=kind==='aircraft'?120:config.burnTime,maxY=Math.max(...series.map(p=>p.y),1)*1.08;
  const node=(tag,attrs,text)=>{const element=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,value));if(text!==undefined)element.textContent=text;return element;};
  for(let i=0;i<=4;i++){
    const y=190-i*40;
    svg.append(node('line',{x1:65,x2:525,y1:y,y2:y,stroke:'#273345'}));
    svg.append(node('text',{x:58,y:y+4,'text-anchor':'end',fill:'#a1afc2','font-size':11},(maxY*i/4).toExponential(1)));
    svg.append(node('text',{x:65+i*115,y:214,'text-anchor':'middle',fill:'#a1afc2','font-size':11},number(maxX*i/4,1)));
  }
  svg.append(node('polyline',{points:series.map(p=>`${65+p.x/maxX*460},${190-p.y/maxY*160}`).join(' '),fill:'none',stroke:'#8edfcc','stroke-width':2}));
  const x=kind==='aircraft'?config.groundSpeed:result.time,y=kind==='aircraft'?result.lift:result.currentDeltaV;
  svg.append(node('circle',{cx:65+x/maxX*460,cy:190-y/maxY*160,r:5,fill:'#c0afff'}));
  svg.setAttribute('aria-label',kind==='aircraft'?'Sustentación en N frente a velocidad respecto al suelo en m/s, con viento y coeficientes fijos.':'Δv ideal acumulado en m/s frente a tiempo en segundos.');
  $('graph-caption').textContent=kind==='aircraft'?'L (N) frente a velocidad respecto al suelo (m/s). Viento y coeficientes fijos; 81 muestras, excluidas las de flujo longitudinal invertido. No calcula pérdida dinámica.':'Δv ideal acumulado (m/s) frente al tiempo (s). 81 estados evaluados por Tsiolkovski, sin integrar una trayectoria.';
}
function update(preserveWeight=false){
  const config=read();let valid=true;
  profile.fields.forEach(field=>{
    const [min,max]=profile.ranges[field.key],bad=!Number.isFinite(config[field.key])||config[field.key]<min||config[field.key]>max;
    $(`eng-${field.key}`).setAttribute('aria-invalid',String(bad));$(`error-${field.key}`).textContent=bad?'Introduce un número dentro de los límites.':'';if(bad)valid=false;
  });
  let result=null;
  try{if(valid)result=profile.compute(config);}catch(error){status(error.message);}
  current=result?config:null;
  for(const id of ['capture-reference','engineering-save','engineering-export'])$(id).disabled=!result;
  $('clear-reference').disabled=!reference;
  renderResults(result);view.update(config,result);drawGraph(config,result);forces?.update(result);
  if(kind==='aircraft'){
    const weightValid=Number.isFinite(config.mass)&&config.mass>=100&&config.mass<=100000;
    if(!preserveWeight)$('aircraft-weight').value=Number.isFinite(config.mass)?config.mass*G0:'';
    $('aircraft-weight').setAttribute('aria-invalid',String(!weightValid));
    const direct=config.dragMode==='direct';
    $('eng-cdTotal').disabled=!direct;$('eng-cd0').disabled=direct;$('eng-oswald').disabled=direct;
    $('aircraft-drag-note').textContent=direct?'CD total impuesto activo. No se añade resistencia inducida; CD₀ y e quedan inactivos.':'Polar activa: CD = CD₀ + CL²/(πeAR). CD total impuesto queda inactivo.';
  }
  $('engineering-warnings').replaceChildren(...(result?profile.warnings(config,result):['Corrige las entradas. Se ocultan los cálculos afectados.']).map(text=>{const item=document.createElement('li');item.textContent=text;return item;}));
  if(result)status('Cálculos actualizados. Geometría ilustrativa; modelo físico declarado abajo.');else if(!valid)status('Entradas inválidas.');
}
fill(defaults());update();
$('engineering-form').addEventListener('submit',event=>event.preventDefault());
$('engineering-form').addEventListener('input',event=>{
  if(kind==='aircraft'&&event.target.id==='aircraft-weight')$('eng-mass').value=Number.isFinite(event.target.valueAsNumber)?event.target.valueAsNumber/G0:'';
  update(kind==='aircraft'&&event.target.id==='aircraft-weight');
});
$('capture-reference').addEventListener('click',()=>{reference={...current};update();status('Referencia capturada para comparar; no es un resultado experimental.');});
$('clear-reference').addEventListener('click',()=>{reference=null;update();});
$('engineering-reset').addEventListener('click',()=>{fill(defaults());update();status('Parámetros iniciales restaurados. La referencia se conserva.');});
const storageKey=`aerolab.${kind}.v1`;
$('engineering-save').addEventListener('click',()=>{try{localStorage.setItem(storageKey,JSON.stringify({version:2,module:kind,configuration:current}));status('Configuración guardada en este navegador.');}catch(error){status(`No se pudo guardar: ${error.message}`);}});
$('engineering-load').addEventListener('click',()=>{
  try{const raw=localStorage.getItem(storageKey);if(!raw)return status('No hay guardado para este módulo.');const saved=JSON.parse(raw);let loaded=saved.configuration,migrated=false;if(kind==='aircraft'){const decoded=decodeAircraftRecord(saved,profile.compute);loaded=decoded.configuration;migrated=decoded.migrated;}else{if(![1,2].includes(saved.version)||saved.module!==kind)throw new Error('Formato incompatible.');if(saved.version===2&&loaded?.thrustPercent===undefined)throw new Error('Falta el porcentaje de empuje.');profile.compute(loaded);}fill(loaded);update();status(migrated?'Guardado anterior cargado: empuje hipotético de 1200 N y polar original; se conserva el guardado anterior hasta pulsar Guardar.':'Configuración cargada.');}
  catch(error){status(`No se pudo cargar: ${error.message}`);}
});
$('engineering-export').addEventListener('click',()=>{try{downloadFile(JSON.stringify({version:2,module:kind,configuration:current},null,2),`aerolab-${kind}.json`,'application/json');status('JSON generado con parámetros y módulo identificados.');}catch(error){status(error.message);}});

registerSharePart(kind==='aircraft'?'aircraft':'calculator', {
  get: () => ({ configuration:read(), reference, yaw:$('view-yaw').valueAsNumber, pitch:$('view-pitch').valueAsNumber }),
  validate(state) {
    const validateConfig = config => {
      if (!config || typeof config !== 'object') throw new Error('Configuración incompleta.');
      profile.fields.forEach(field=>numberIn(config[field.key]===undefined&&field.key==='thrustPercent'?100:config[field.key],...profile.ranges[field.key]));
      if(kind==='aircraft')choice(config.dragMode,['polar','direct']);
      profile.compute(config);
    };
    validateConfig(state.configuration);
    if(state.reference!==null)validateConfig(state.reference);
    numberIn(state.yaw,0,360); numberIn(state.pitch,-80,80);
  },
  apply(state) {
    reference=state.reference; fill(state.configuration); update();
    $('view-yaw').value=state.yaw; $('view-pitch').value=state.pitch;
    $('view-yaw').dispatchEvent(new Event('input')); $('view-pitch').dispatchEvent(new Event('input'));
  },
});
