import test from 'node:test';
import assert from 'node:assert/strict';
import { aircraft, G0 } from '../src/engineering/models.js';
import { PROFILES } from '../src/engineering/profiles.js';
import { decodeAircraftRecord } from '../src/aircraft/configuration.js';
const config=()=>({...Object.fromEntries(PROFILES.aircraft.fields.map(f=>[f.key,f.value])),dragMode:'polar'});
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);

test('Aircraft: cuatro fuerzas y aceleraciones de referencia horizontal',()=>{
  const c=config(),r=aircraft(c);
  near(r.thrust,1200);near(r.netX,26.0013607717933);near(r.netZ,2932.02);
  near(r.accelerationX,r.netX/1200);near(r.accelerationZ,2.44335);
  assert.equal(r.balancedX,false);assert.equal(r.balancedZ,false);
  near(r.vectors.drag.x,-r.drag);near(r.vectors.lift.z,r.lift);
});

test('Aircraft: equilibrio exacto y umbral pedagógico por eje',()=>{
  const c={...config(),dragMode:'direct',density:1.2,area:20,mass:1000,cdTotal:.03,thrust:900};
  c.cl=c.mass*G0/(.5*c.density*c.groundSpeed**2*c.area);
  const r=aircraft(c);near(r.lift,9806.65);near(r.drag,900);near(r.netX,0);near(r.netZ,0);
  assert.equal(r.balancedX,true);assert.equal(r.balancedZ,true);
  assert.equal(aircraft({...c,thrust:904}).balancedX,true);
  const extra=aircraft({...c,thrust:910});assert.equal(extra.balancedX,false);near(extra.accelerationX,.01);
  assert.ok(aircraft({...c,cl:c.cl/2}).netZ<0);
});

test('Aircraft: CD impuesto evita sumar resistencia inducida y admite arrastre cero',()=>{
  const c={...config(),dragMode:'direct',cdTotal:.04},r=aircraft(c);
  near(r.drag,980);near(r.dragCoefficient,.04);
  near(aircraft({...c,oswald:.3,cd0:.2}).drag,r.drag);
  near(aircraft({...c,cdTotal:.08}).drag,2*r.drag);
  const zero=aircraft({...c,cdTotal:0,thrust:0});near(zero.drag,0);near(zero.netX,0);assert.equal(zero.balancedX,true);
});

test('Aircraft: proyección con viento vertical y balance lateral no resuelto',()=>{
  const c={...config(),windVertical:10},r=aircraft(c),gamma=Math.atan2(-10,50);
  near(r.netX,c.thrust-r.drag*Math.cos(gamma)-r.lift*Math.sin(gamma));
  near(r.netZ,r.lift*Math.cos(gamma)-r.drag*Math.sin(gamma)-r.weight);
  near(Math.hypot(r.vectors.lift.x,r.vectors.lift.z),r.lift);
  near(Math.hypot(r.vectors.drag.x,r.vectors.drag.z),r.drag);
  const side=aircraft({...c,windCross:1});assert.equal(side.available,false);assert.equal(side.netX,null);assert.equal(side.accelerationZ,null);
  assert.equal(side.vectors,null);assert.ok(Number.isFinite(side.lift));
});

test('Aircraft: nuevas entradas rechazan datos inválidos',()=>{
  for(const dragMode of ['unknown',null,undefined])assert.throws(()=>aircraft({...config(),dragMode}));
  for(const thrust of [-1,NaN,Infinity,'1200',1000001])assert.throws(()=>aircraft({...config(),thrust}));
  for(const cdTotal of [-.1,1.1,NaN,'0.04'])assert.throws(()=>aircraft({...config(),cdTotal}));
});

test('Aircraft: migración v1 conserva física anterior y v2 exige parámetros completos',()=>{
  const old=config();delete old.dragMode;delete old.thrust;delete old.cdTotal;
  const record={version:1,module:'aircraft',configuration:old},decoded=decodeAircraftRecord(record,aircraft);
  assert.equal(decoded.migrated,true);assert.deepEqual(record.configuration,old);
  near(aircraft(decoded.configuration).drag,1173.9986392282067);assert.equal(decoded.configuration.thrust,1200);
  const current={...config(),dragMode:'direct',cdTotal:.04,thrust:2000};
  assert.deepEqual(decodeAircraftRecord({version:2,module:'aircraft',configuration:current},aircraft).configuration,current);
  assert.throws(()=>decodeAircraftRecord({...record,version:2},aircraft));
  assert.throws(()=>decodeAircraftRecord({...record,module:'rocket'},aircraft));
  assert.throws(()=>decodeAircraftRecord({...record,version:3},aircraft));
});
