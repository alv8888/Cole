import test from 'node:test';
import assert from 'node:assert/strict';
import { BODIES, DEFAULT, clone, budget, simulate, validate } from '../src/rocket/model.js';
import { saveLaunch, loadLaunch } from '../src/rocket/storage.js';
const near = (a,b,tolerance=1e-8) => assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);

test('multietapa: Tsiolkovski incluye etapas superiores y conserva masa', () => {
  const c = {body:'earth',payload:10,horizon:60,stages:[{dry:20,propellant:100,thrust:10000,duration:10},{dry:5,propellant:25,thrust:3000,duration:5}]};
  const b=budget(c);
  near(b.initialMass,160); near(b.stages[0].after,60); near(b.stages[1].before,40); near(b.finalMass,15);
  near(b.deltaV,1000*Math.log(160/60)+600*Math.log(40/15));
  const r=simulate(c);
  for(const event of r.events.filter(e=>e.type==='burnout')) {
    const sample=r.samples.find(s=>Math.abs(s.t-event.t)<1e-8);
    near(sample.mass,event.stage===0?40:15,1e-7);
  }
  assert.equal(r.events.filter(e=>e.type==='separation').length,1);
});

test('despegue tardío con consumo en plataforma y caso que nunca despega', () => {
  const g=BODIES.earth.mu/BODIES.earth.radius**2;
  const c={body:'earth',payload:10,horizon:60,stages:[{dry:10,propellant:100,thrust:70*g,duration:10}]};
  const r=simulate(c), liftoff=r.events.find(e=>e.type==='liftoff');
  near(liftoff.t,5,1e-7);
  for(const s of r.samples.filter(s=>s.t<=5)) {near(s.h,0);near(s.v,0);}
  c.stages[0].thrust=100;
  const pad=simulate(c);assert.equal(pad.outcome,'pad');near(pad.final.mass,20);near(pad.final.h,0);near(pad.final.v,0);
});

test('Tierra: caída e impacto localizados; Luna: escape con motores terminados', () => {
  const earth=simulate(DEFAULT);
  assert.equal(earth.outcome,'impact');near(earth.final.h,0);assert.ok(earth.final.v<0);
  assert.ok(earth.samples.every(s=>s.h>=0));assert.ok(earth.events.some(e=>e.type==='apogee'));
  const moon=simulate({...clone(DEFAULT),body:'moon'});
  assert.equal(moon.outcome,'escape');assert.equal(moon.final.stage,2);assert.ok(moon.final.v>moon.final.escapeSpeed);
  assert.ok(moon.final.energy>0);
});

test('RK4: convergencia por reducción de paso y energía conservada en vuelo balístico', () => {
  const c={...clone(DEFAULT),horizon:1200};
  const coarse=simulate(c,{step:.2}),fine=simulate(c,{step:.1}), finer=simulate(c,{step:.05});
  assert.ok(Math.abs(fine.final.h-finer.final.h)<.05);
  assert.ok(Math.abs(coarse.final.h-finer.final.h)<.2);
  const coast=fine.samples.filter(s=>s.stage===2),energy=coast[0].energy;
  for(const s of coast) assert.ok(Math.abs(s.energy-energy)/Math.abs(energy)<1e-9);
});

test('horizonte distingue ascenso ligado y motores aún activos', () => {
  const bound=simulate({...clone(DEFAULT),horizon:300});assert.equal(bound.outcome,'bound');assert.ok(bound.final.energy<0);
  const unfinished=simulate({...clone(DEFAULT),horizon:60});assert.equal(unfinished.outcome,'horizon');assert.equal(unfinished.final.stage,0);
  const r=simulate({...clone(DEFAULT),body:'moon',stages:[{dry:100,propellant:1000,thrust:40000,duration:10}]});
  // Independent impulse reference; numerical gravity loss must be positive.
  const ideal=400*Math.log(1200/200);
  assert.ok(r.samples.find(s=>Math.abs(s.t-10)<1e-8).v<ideal);
});

test('referencia independiente de punto medio Python en fin de propulsión', () => {
  const r=simulate({...clone(DEFAULT),horizon:300});
  const end=r.samples.find(s=>Math.abs(s.t-200)<1e-8);
  // Independent midpoint Python, dt=0.001 s; tolerance includes its truncation error.
  near(end.h,381207.82789451675,.001);
  near(end.v,4678.573728593203,.00001);
  near(r.summary.deltaV,6574.011697860054,.00000001);
});

test('validación rechaza entradas corruptas y extremos fuera de límites', () => {
  for(const key of ['payload','horizon']) for(const invalid of [NaN,Infinity,-1,'10']) {
    const c=clone(DEFAULT);c[key]=invalid;assert.throws(()=>validate(c));
  }
  for(const key of ['dry','propellant','thrust','duration']) {
    const c=clone(DEFAULT);c.stages[0][key]=0;assert.throws(()=>validate(c));
  }
  for(const stages of [[],Array(5).fill(DEFAULT.stages[0]),null]) assert.throws(()=>validate({...clone(DEFAULT),stages}));
  assert.throws(()=>simulate(DEFAULT,{step:0}));assert.throws(()=>validate({...clone(DEFAULT),body:'mars'}));
  const edge=clone(DEFAULT);edge.stages=[{dry:1,propellant:1000000,thrust:10000000,duration:600}];edge.horizon=60;
  assert.ok(simulate(edge).samples.every(s=>Object.values(s).every(Number.isFinite)));
});

test('persistencia multietapa independiente valida antes de cargar', () => {
  const map=new Map(),storage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)??null};
  saveLaunch(DEFAULT,storage);const loaded=loadLaunch(storage);assert.deepEqual(loaded,DEFAULT);loaded.stages[0].dry=999;assert.equal(DEFAULT.stages[0].dry,300);
  assert.equal(map.has('aerolab.rocket.v1'),false);
  map.set('aerolab.rocket.launch.v1','{bad');assert.throws(()=>loadLaunch(storage));
  map.set('aerolab.rocket.launch.v1',JSON.stringify({version:1,config:{}}));assert.throws(()=>loadLaunch(storage));
  assert.throws(()=>saveLaunch(DEFAULT,{setItem(){throw new Error('blocked');}}));
});
