import test from 'node:test';
import assert from 'node:assert/strict';
import { aircraft, rocket, G0 } from '../src/engineering/models.js';
import { PROFILES } from '../src/engineering/profiles.js';
const config=kind=>Object.fromEntries(PROFILES[kind].fields.map(field=>[field.key,field.value]));
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('aeronave: referencia independiente, dimensiones y fuerzas',()=>{
  const c=config('aircraft'),r=aircraft(c);
  assert.equal(r.airSpeed,50);assert.equal(r.dynamicPressure,1531.25);assert.equal(r.lift,14700);
  close(r.weight,11767.98);close(r.aspectRatio,6.25);
  close(r.drag,1173.9986392282067);
  close(r.rootMoment,18375);
  close(r.inertia,0.0001953125);
  close(r.stress,11760000);close(r.deflection,0.0084);
});
test('viento relativo y escalas de velocidad, densidad y coeficientes',()=>{
  const c=config('aircraft'),a=aircraft(c);
  const head=aircraft({...c,windAlong:-10}),tail=aircraft({...c,windAlong:10});
  assert.equal(head.airSpeed,60);assert.equal(tail.airSpeed,40);
  close(head.lift/a.lift,1.44);close(tail.lift/a.lift,0.64);
  close(aircraft({...c,density:c.density/2}).lift,a.lift/2);
  close(aircraft({...c,windCross:30}).airSpeed,Math.sqrt(3400));
  assert.throws(()=>aircraft({...c,groundSpeed:20,windAlong:30}),RangeError);
  assert.equal(aircraft({...c,cl:0}).lift,0);
});
test('planta trapezoidal, viga y contabilidad energética',()=>{
  const c=config('aircraft'),r=aircraft(c);
  close(c.span*(r.rootChord+r.tipChord)/2,c.area);
  const stiffer=aircraft({...c,modulus:140});close(stiffer.deflection,r.deflection/2);
  const taller=aircraft({...c,beamHeight:.5});close(taller.deflection,r.deflection/8);close(taller.stress,r.stress/4);
  close(r.power,r.drag*r.airSpeed/c.efficiency);
  close(r.emissions,r.power/1000*c.carbon/1000);
  assert.equal(aircraft({...c,carbon:0}).emissions,0);
  const movedCG=aircraft({...c,cg:50});assert.equal(movedCG.lift,r.lift);
});
test('cohete: balance de masa, Tsiolkovski y condiciones inicial/final',()=>{
  const c=config('rocket'),r=rocket(c);
  assert.equal(r.initialMass,300);assert.equal(r.massFlow,5);assert.equal(r.exhaustVelocity,1200);
  close(r.deltaV,1318.3347464017316);close(r.specificImpulse,1200/G0);
  assert.equal(r.currentDeltaV,0);assert.equal(r.currentMass,300);
  const end=rocket({...c,burnPercent:100});assert.equal(end.currentMass,c.dryMass);close(end.currentDeltaV,r.deltaV);
  close(end.verticalDeltaV,r.deltaV-c.gravity*c.burnTime);
  const half=rocket({...c,burnPercent:50});assert.equal(half.consumed,100);assert.equal(half.currentMass,200);close(half.currentDeltaV,1200*Math.log(1.5));
});
test('cohete: vacío sin gravedad, escalas y geometría independiente',()=>{
  const c=config('rocket'),r=rocket({...c,gravity:0,burnPercent:50});
  assert.equal(r.thrustWeight,null);assert.equal(r.gravityPenalty,0);assert.equal(r.verticalDeltaV,r.currentDeltaV);
  const doubled=rocket({...c,thrust:c.thrust*2});close(doubled.deltaV,rocket(c).deltaV*2);
  close(rocket({...c,diameter:3,length:20}).deltaV,rocket(c).deltaV);
  assert.ok(PROFILES.rocket.warnings({...c,thrust:10},rocket({...c,thrust:10})).some(s=>s.includes('≤ 1')));
});
test('ambos modelos rechazan valores no numéricos y fuera de límites',()=>{
  for(const kind of ['aircraft','rocket'])for(const [key,[min,max]] of Object.entries(PROFILES[kind].ranges)){
    for(const value of [NaN,Infinity,'1',min-1,max+1])assert.throws(()=>PROFILES[kind].compute({...config(kind),[key]:value}),RangeError);
  }
});
