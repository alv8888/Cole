import { createAnimationLoop } from '../rendering/clock.js';
import { number } from '../units.js';
const NS = 'http://www.w3.org/2000/svg';
const COLORS = { lift: '#8edfcc', weight: '#ffbd8a', thrust: '#c0afff', drag: '#85c5ff' };
const LABELS = { lift: 'L · Sustentación', weight: 'W · Peso', thrust: 'T · Empuje', drag: 'D · Arrastre' };
function node(tag, attributes, text) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (text !== undefined) el.textContent = text;
  return el;
}
function arrow(svg, key, vector, scale) {
  const origin = { x: 270, y: 160 }, dx = vector.x * scale, dy = -vector.z * scale;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return;
  const x = origin.x + dx, y = origin.y + dy, ux = dx / length, uy = dy / length;
  svg.append(node('line', { x1: origin.x, y1: origin.y, x2: x, y2: y, stroke: COLORS[key], 'stroke-width': 3, 'data-force': key }));
  const head = Math.min(8, length / 2);
  svg.append(node('polygon', { points: `${x},${y} ${x-ux*head-uy*head/2},${y-uy*head+ux*head/2} ${x-ux*head+uy*head/2},${y-uy*head-ux*head/2}`, fill: COLORS[key] }));
}
export function drawAircraftSide(svg, result) {
  svg.replaceChildren();
  if (!result) { svg.setAttribute('aria-label','Sin perfil de fuerzas válido; corrige las entradas.'); return; }
  const flow = node('g', { class: 'aircraft-flow', transform: `rotate(${-result.flightAngle} 270 160)` });
  for (const y of [95,115,210,230]) flow.append(node('line', { x1: 100, x2: 440, y1: y, y2: y, stroke: '#446777', 'stroke-dasharray': '12 12', 'stroke-width': 1.5 }));
  svg.append(flow);
  svg.append(node('path', { d: 'M140 170 C260 130 380 125 390 160 C392 182 270 180 140 170 Z', fill: '#537b90', stroke: '#b3d5df', 'stroke-width': 2 }));
  svg.append(node('circle', { cx: 270, cy: 160, r: 4, fill: '#e6edf5' }));
  if (result.available) {
    const scale = 96 / Math.max(result.lift, result.weight, result.thrust, result.drag, 1);
    for (const [key, vector] of Object.entries(result.vectors)) arrow(svg, key, vector, scale);
  }
  const positions = {lift:[270,28,'middle'],weight:[270,291,'middle'],thrust:[420,155,'start'],drag:[18,155,'start']};
  for (const [key,[x,y,anchor]] of Object.entries(positions)) {
    svg.append(node('text',{x,y,fill:COLORS[key],'font-size':12,'text-anchor':anchor},LABELS[key]));
    svg.append(node('text',{x,y:y+18,fill:COLORS[key],'font-size':12,'text-anchor':anchor},`${number(result[key],1)} N`));
  }
  svg.setAttribute('aria-label', result.available ? 'Perfil lateral ilustrativo con cuatro fuerzas a escala común, expresadas en N.' : 'Perfil lateral ilustrativo; magnitudes calculadas, direcciones 2D no resueltas por viento lateral.');
}
export function drawForceChart(svg, result) {
  svg.replaceChildren();
  if (!result) { svg.setAttribute('aria-label','Sin datos válidos para el balance de fuerzas.'); return; }
  const max = Math.max(result.lift, result.weight, result.thrust, result.drag, 1) * 1.08;
  for(let i=0;i<=4;i++) {
    const x=155+i*90;
    svg.append(node('line',{x1:x,x2:x,y1:25,y2:229,stroke:'#273345'}));
    svg.append(node('text',{x,y:247,fill:'#a1afc2','font-size':11,'text-anchor':'middle'},(max*i/4).toExponential(1)));
  }
  ['lift','weight','thrust','drag'].forEach((key,i)=>{
    const y=32+i*49;
    svg.append(node('text',{x:12,y:y+15,fill:COLORS[key],'font-size':12},LABELS[key]));
    svg.append(node('rect',{x:155,y,width:result[key]/max*360,height:15,fill:COLORS[key],'data-force-bar':key}));
    svg.append(node('text',{x:155,y:y+32,fill:'#c0cad8','font-size':11},`${number(result[key],2)} N`));
  });
  svg.setAttribute('aria-label', `Magnitudes a escala común: sustentación ${number(result.lift,2)} N, peso ${number(result.weight,2)} N, empuje ${number(result.thrust,2)} N, arrastre ${number(result.drag,2)} N. El texto describe el balance vectorial.`);
}
export function createAircraftForces(side, chart, summary, button) {
  let current = null, animating = false, previous = null, phase = 0;
  const playback = createAnimationLoop(frame);
  function stop() { playback.stop();animating=false;previous=null;button.textContent='Animar aire ilustrativo';button.setAttribute('aria-pressed','false'); }
  button.addEventListener('click',()=>{if(animating)stop();else if(current){animating=true;previous=null;button.textContent='Pausar aire ilustrativo';button.setAttribute('aria-pressed','true');playback.start();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  document.addEventListener('aerolab:tabchange',event=>{if(event.detail.tab!=='simulation')stop();});
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
  function frame(now) {
    if(animating && current) {
      if(previous!==null)phase=(phase+Math.min((now-previous)/1000,.1)*Math.min(current.airSpeed,120))%24;
      previous=now;
      side.querySelector('.aircraft-flow')?.setAttribute('stroke-dashoffset',phase);
    }
    return animating && !!current;
  }
  return { update(result) {
    current=result;button.disabled=!result;drawAircraftSide(side,result);drawForceChart(chart,result);
    if(!result){stop();summary.textContent='Corrige las entradas: perfil, gráfico y balance sin resultados vigentes.';return;}
    if(!result.available){summary.textContent='Viento lateral distinto de cero: solo magnitudes. El balance longitudinal 2D y sus direcciones no se han calculado.';return;}
    const x=result.balancedX?'equilibrio aproximado':result.netX>0?'fuerza neta hacia delante':'fuerza neta hacia atrás';
    const z=result.balancedZ?'equilibrio aproximado':result.netZ>0?'fuerza neta hacia arriba':'fuerza neta hacia abajo';
    summary.textContent=`Eje horizontal: ${x}; Fx=${number(result.netX,2)} N, ax=${number(result.accelerationX,3)} m/s². Eje vertical: ${z}; Fz=${number(result.netZ,2)} N, az=${number(result.accelerationZ,3)} m/s². Tolerancia visual: 0,5 % de la mayor componente por eje. Es un balance instantáneo, sin trayectoria ni estabilidad calculadas.`;
  } };
}
