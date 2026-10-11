import { number } from '../units.js';
const ns='http://www.w3.org/2000/svg';
function node(tag,attrs,text){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
export function drawStructure(svg,result,amplify){
  svg.replaceChildren();if(!result){svg.setAttribute('aria-label','Sin estructura válida.');return 'Corrige las entradas para visualizar.';}
  const c=result.config,L=c.length,s=480/L,last=result.samples.at(-1).displacement;
  const factor=amplify&&last>0?Math.min(1e6,80/(last*s)):1;
  svg.setAttribute('aria-label',c.mode==='compression'?'Tubo comprimido y acortamiento axial calculado.':'Voladizo y curva de deflexión calculada.');
  svg.append(node('line',{x1:60,x2:540,y1:160,y2:160,stroke:'#a1afc2','stroke-dasharray':'6 5','stroke-width':2}));
  if(c.mode==='compression'){
    const displacement=Math.min(480,last*s*factor),end=540-displacement;
    svg.append(node('rect',{x:60,y:130,width:Math.max(1,end-60),height:60,fill:'#14353e',stroke:'#8edfcc','stroke-width':2}));
    svg.append(node('line',{x1:60,x2:end,y1:160,y2:160,stroke:'#0b1019','stroke-width':22}));
    svg.append(node('text',{x:300,y:115,'text-anchor':'middle',fill:'#c0afff'},`P = ${number(c.force)} N · carga centrada`));
    svg.append(node('path',{d:`M ${end+45} 160 H ${end+6} l 12 -7 m -12 7 l 12 7`,stroke:'#ffcf70',fill:'none','stroke-width':3}));
    svg.append(node('text',{x:60,y:220,fill:'#a1afc2'},'Sin forma lateral de pandeo: no se calcula pospandeo.'));
  }else{
    svg.append(node('rect',{x:45,y:95,width:15,height:105,fill:'#35465b'}));
    const points=result.samples.map(p=>`${60+p.x*s},${160+p.displacement*s*factor}`).join(' ');
    svg.append(node('polyline',{points,fill:'none',stroke:'#8edfcc','stroke-width':5,'data-deformation':'true'}));
    if(c.mode==='tip')svg.append(node('path',{d:'M 540 85 V 135 l -7 -12 m 7 12 l 7 -12',stroke:'#ffcf70',fill:'none','stroke-width':3}));
    else for(let i=1;i<=8;i++){const x=60+i*60;svg.append(node('path',{d:`M ${x} 95 V 135 l -5 -9 m 5 9 l 5 -9`,stroke:'#ffcf70',fill:'none','stroke-width':2}));}
    svg.append(node('text',{x:300,y:70,'text-anchor':'middle',fill:'#ffcf70'},c.mode==='tip'?`P = ${number(c.force)} N`:`q = ${number(c.distributed)} N/m`));
  }
  svg.append(node('text',{x:300,y:285,'text-anchor':'middle',fill:'#a1afc2'},`L = ${number(L,3)} m · línea discontinua: estado inicial`));
  const clipped=!amplify&&last*s>(c.mode==='compression'?480:120);
  return `Deformación representada × ${number(factor,3)}. ${last===0?'Sin desplazamiento calculado.':clipped?'La deformación excede el encuadre y se recorta visualmente: activa escala automática.':'La escala de deformación se indica separadamente de la longitud.'} El esquema no es CAD ni una predicción de fallo.`;
}
export function drawChart(svg,result,key,scale,label){
  svg.replaceChildren();if(!result){svg.setAttribute('aria-label','Sin resultados válidos.');return;}
  const samples=result.samples,max=Math.max(...samples.map(p=>p[key]*scale),1e-12),L=result.config.length;
  for(let i=0;i<=4;i++){
    const y=195-i*40;
    svg.append(node('line',{x1:80,x2:540,y1:y,y2:y,stroke:'#273345'}));
    svg.append(node('text',{x:72,y:y+4,'text-anchor':'end',fill:'#a1afc2','font-size':11},(max*i/4).toExponential(2)));
    svg.append(node('text',{x:80+i*115,y:217,'text-anchor':'middle',fill:'#a1afc2','font-size':11},number(L*i/4,2)));
  }
  svg.append(node('polyline',{points:samples.map(p=>`${80+p.x/L*460},${195-p[key]*scale/max*160}`).join(' '),fill:'none',stroke:'#8edfcc','stroke-width':2}));
  svg.append(node('text',{x:300,y:18,'text-anchor':'middle',fill:'#c0afff'},label));
  svg.append(node('text',{x:300,y:240,'text-anchor':'middle',fill:'#a1afc2'},'Posición x (m)'));
  svg.setAttribute('aria-label',`${label} frente a posición x en metros; 81 puntos analíticos.`);
}
