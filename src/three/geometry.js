/** SI model coordinates -> render units: one unit = central-body radius. */
function positive(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} debe ser positivo y finito.`);
}
export function orbitPoint(state, radius) {
  positive(radius, 'Radio');
  if (![state.x, state.y].every(Number.isFinite)) throw new RangeError('Estado orbital inválido.');
  return [state.x / radius, 0, state.y / radius];
}
export function orbitPath(orbit, radius, count = 512) {
  positive(radius,'Radio');
  if (!Number.isInteger(count) || count < 32 || count > 4096) throw new RangeError('Muestreo orbital inválido.');
  positive(orbit.semiMajor,'Semieje mayor');positive(orbit.semiMinor,'Semieje menor');
  if (!Number.isFinite(orbit.eccentricity) || orbit.eccentricity < 0 || orbit.eccentricity > .9) throw new RangeError('Excentricidad inválida.');
  return Array.from({length:count},(_,i)=>{
    const E=i/count*2*Math.PI;
    return [orbit.semiMajor*(Math.cos(E)-orbit.eccentricity)/radius,0,orbit.semiMinor*Math.sin(E)/radius];
  });
}
export function rocketPoint(state, radius) {
  positive(radius,'Radio');
  if (!Number.isFinite(state.h) || state.h < 0) throw new RangeError('Altitud inválida.');
  return [0,1+state.h/radius,0];
}
export function rocketPath(samples, radius, limit = 1200) {
  positive(radius,'Radio');
  if (!Array.isArray(samples) || samples.length === 0) throw new RangeError('Trayectoria vacía.');
  if (!Number.isInteger(limit) || limit < 2 || limit > 4096) throw new RangeError('Muestreo de trayectoria inválido.');
  const count=Math.min(samples.length,limit), indices=Array.from({length:count},(_,i)=>Math.round(i/(count-1||1)*(samples.length-1)));
  const selected=indices.map(i=>samples[i]);
  const points=selected.map(s=>rocketPoint(s,radius));
  const times=selected.map(s=>s.t);
  if(times.some((t,i)=>!Number.isFinite(t)||t<0||(i>0&&t<times[i-1])))throw new RangeError('Tiempos inválidos.');
  return {points,times};
}
export function visibleCount(times, time) {
  if (!Number.isFinite(time)) throw new RangeError('Tiempo inválido.');
  let low=0,high=times.length;
  while(low<high){const mid=Math.floor((low+high)/2);if(times[mid]<=time)low=mid+1;else high=mid;}
  return low;
}
