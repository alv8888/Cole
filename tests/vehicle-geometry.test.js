import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILES } from '../src/engineering/profiles.js';
import { aircraftGeometry,forceArrows,plumePower } from '../src/engineering/vehicle-geometry.js';
const config=kind=>({...Object.fromEntries(PROFILES[kind].fields.map(f=>[f.key,f.value])),...(kind==='aircraft'?{dragMode:'polar'}:{})});
test('3D geometry retains wing area and moves CG without changing computed forces',()=>{
 const c=config('aircraft'),r=PROFILES.aircraft.compute(c),g=aircraftGeometry(c,r);
 assert.equal(g.wing[1][1]-g.wing[5][1],c.span);
 assert.ok(Math.abs(c.span*(r.rootChord+r.tipChord)/2-c.area)<1e-12);
 const moved=aircraftGeometry({...c,cg:50},r);assert.ok(moved.cg[0]<g.cg[0]);assert.equal(moved.cg[2],g.cg[2]);
});
test('3D arrows preserve force directions, ratios, common scale and absence of lateral model',()=>{
 const c=config('aircraft'),r=PROFILES.aircraft.compute({...c,windVertical:8}),arrows=forceArrows(r,10);
 assert.equal(arrows.length,4);
 for(const a of arrows){assert.deepEqual(a.vector,[r.vectors[a.name].x,0,r.vectors[a.name].z]);assert.ok(Math.abs(a.length/a.magnitude-arrows[0].length/arrows[0].magnitude)<1e-12);}
 assert.deepEqual(forceArrows(PROFILES.aircraft.compute({...c,windCross:1}),10),[]);
 const zero=forceArrows(PROFILES.aircraft.compute({...c,cl:0,thrust:0,dragMode:'direct',cdTotal:0}),10);
 assert.ok(zero.filter(a=>a.name!=='weight').every(a=>a.length===0));
});
test('Throttle alters ideal thrust and delta-v with imposed flow; old records default to 100%',()=>{
 const c=config('rocket'),full=PROFILES.rocket.compute(c),half=PROFILES.rocket.compute({...c,thrustPercent:50});
 assert.equal(half.appliedThrust,3000);assert.equal(half.massFlow,full.massFlow);assert.equal(half.deltaV,full.deltaV/2);
 assert.equal(half.currentMass,full.currentMass);assert.equal(half.exhaustVelocity,600);
 const old={...c};delete old.thrustPercent;assert.deepEqual(PROFILES.rocket.compute(old),full);
 for(const thrustPercent of [0,101,'50',NaN,null])assert.throws(()=>PROFILES.rocket.compute({...c,thrustPercent}));
});
test('Plume power follows throttle and turns off at exhaustion, not linearly with consumed mass',()=>{
 const c=config('rocket');assert.equal(plumePower({...c,thrustPercent:50}),.5);
 assert.equal(plumePower({...c,thrustPercent:50,burnPercent:99}),.5);assert.equal(plumePower({...c,burnPercent:100}),0);
 delete c.thrustPercent;assert.equal(plumePower(c),1);
});
