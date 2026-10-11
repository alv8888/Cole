/** Geometry in metres: x forward, y lateral, z up. Not an aerodynamic CAD model. */
export function aircraftGeometry(c, r) {
  const length=Math.max(8,r.rootChord*4), front=r.rootChord/4, tipFront=front-c.span*.16;
  const meanChordY=c.span/6*(1+2*c.taper)/(1+c.taper);
  return {length, cg:[front-.32*meanChordY-r.meanChord*c.cg/100,0,.15],
    wing:[[front,0,0],[tipFront,c.span/2,0],[tipFront-r.tipChord,c.span/2,0],[front-r.rootChord,0,0],[tipFront-r.tipChord,-c.span/2,0],[tipFront,-c.span/2,0]]};
}
export function forceArrows(result, extent) {
  if(!result.available)return [];
  const maximum=Math.max(1,...Object.values(result.vectors).map(v=>Math.hypot(v.x,v.z)));
  return Object.entries(result.vectors).map(([name,v])=>({name, vector:[v.x,0,v.z], magnitude:Math.hypot(v.x,v.z),length:Math.hypot(v.x,v.z)/maximum*extent*.65}));
}
export function plumePower(config) {
  if(config.burnPercent>=100)return 0;
  return (config.thrustPercent??100)/100;
}
