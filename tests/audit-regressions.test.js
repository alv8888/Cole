import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT as LAUNCH, validate as validateLaunch, simulate } from '../src/rocket/model.js';
import { DEFAULT, clone, validate } from '../src/structure/design/data.js';
import { analyzeDesign } from '../src/structure/design/model.js';
import { transverseStrain, deformVertex } from '../src/structure/design/deformation.js';
import { rocket } from '../src/engineering/models.js';
import { PROFILES } from '../src/engineering/profiles.js';
import { queueMass, applyMass, consumeMassProposal } from '../src/integration/bridge.js';
const config = kind => ({...Object.fromEntries(PROFILES[kind].fields.map(f=>[f.key,f.value])), ...(kind==='aircraft'?{dragMode:'polar'}:{})});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
test('Rocket rejects inherited catalogue properties before calculation',()=>{
 for(const body of ['constructor','toString','__proto__',null]) assert.throws(()=>validateLaunch({...clone(LAUNCH),body}),/Cuerpo central/);
});
test('Rocket accepted trajectories contain finite states throughout',()=>{
 for(const body of ['earth','moon']) {
  const flight=simulate({...clone(LAUNCH),body,horizon:300});
  assert.ok(flight.samples.length>1);
  for(const point of flight.samples) assert.ok(Object.values(point).every(Number.isFinite));
 }
});
test('Structure active analysis tolerates inactive invalid drafts without changing them',()=>{
 const c=clone(DEFAULT);c.wing.thickness=.02;c.object='rocket';c.load='compression';
 assert.throws(()=>validate(c));
 assert.ok(Number.isFinite(analyzeDesign(c).mass));assert.equal(c.wing.thickness,.02);
 c.object='aircraft';c.load='lift';assert.throws(()=>analyzeDesign(c));
 c.wing.thickness=.002;c.rocket.sections[0].thickness=.3;
 assert.ok(Number.isFinite(analyzeDesign(c).mass));assert.throws(()=>validate(c));
});
test('Constrained thermal cylinder radial strain includes Poisson coupling',()=>{
 const c={...clone(DEFAULT),object:'rocket',load:'thermal',restraint:'fixed',deltaT:40};
 const r=analyzeDesign(c),p=r.points[0],m=r.material;
 close(p.axial,-m.E*m.alpha*40);
 close(transverseStrain(c,m,p),.00125552);
 const original=JSON.stringify(r);
 close(deformVertex(r,1,0,0,0,true,1)[0],1.00125552);
 close(deformVertex(r,1,0,0,0,true,10)[0],1.0125552);
 assert.equal(JSON.stringify(r),original);
 c.restraint='free';const free=analyzeDesign(c);close(transverseStrain(c,free.material,free.points[0]),.000944);
});
test('Cylinder pressure/compression and UD strain use declared directional moduli',()=>{
 const c={...clone(DEFAULT),object:'rocket',load:'compression'};
 const r=analyzeDesign(c);assert.ok(transverseStrain(c,r.material,r.points[0])>0);
 c.material='carbon';c.load='pressure';const p=analyzeDesign(c),point=p.points[0];
 close(transverseStrain(c,p.material,point),point.hoop/p.material.E2-p.material.nu*point.axial/p.material.E);
});
test('100 percent burn is a post-cut state without losing accumulated delta-v',()=>{
 const c={...config('rocket'),burnPercent:100};const end=rocket(c),before=rocket({...c,burnPercent:99.999});
 assert.equal(end.currentThrust,0);assert.equal(end.engineActive,false);assert.equal(end.acceleration,-c.gravity);
 assert.ok(before.currentThrust>0);assert.ok(before.acceleration>0);close(end.currentDeltaV,end.deltaV);
});
test('Mass proposal retains full source and supports explicit source/current review',()=>{
 const store=storage(),source={...config('aircraft'),mass:2500,area:24},key='aerolab.bridge.mass.aircraft.v1';
 queueMass('aircraft',source,300,'add',0,store);
 const packet=JSON.parse(store.getItem(key));source.mass=4000;
 assert.equal(packet.version,2);assert.equal(packet.source.mass,2500);
 const origin=applyMass('aircraft',packet.source,packet).configuration;
 assert.equal(origin.mass,2800);assert.equal(origin.area,24);
 const current=applyMass('aircraft',config('aircraft'),packet).configuration;
 assert.equal(current.mass,1500);assert.equal(current.area,16);
 assert.throws(()=>applyMass('aircraft',source,{...packet,target:'launch'}));
 assert.throws(()=>applyMass('aircraft',source,{...packet,source:null}));
});
test('Consumption refuses stale or repeated proposals and preserves newer ones',()=>{
 const store=storage(),key='aerolab.bridge.mass.aircraft.v1';
 store.setItem(key,'new');assert.throws(()=>consumeMassProposal('aircraft','old',store));assert.equal(store.getItem(key),'new');
 consumeMassProposal('aircraft','new',store);assert.throws(()=>consumeMassProposal('aircraft','new',store));
 const old=applyMass('aircraft',config('aircraft'),{version:1,mode:'add',mass:100});assert.equal(old.after,1300);
});
