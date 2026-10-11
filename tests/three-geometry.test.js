import test from 'node:test';
import assert from 'node:assert/strict';
import { orbitPath, orbitPoint, rocketPath, rocketPoint, visibleCount } from '../src/three/geometry.js';
import { ellipticOrbit, orbitalState } from '../src/elliptic.js';
import { simulate, DEFAULT, BODIES } from '../src/rocket/model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('3D orbital: foco y radios coinciden con modelo, sin alterar unidades',()=>{
  const radius=6371000,orbit=ellipticOrbit({mu:3.98600435507e14,radius,altitude:400000,eccentricity:.5});
  const points=orbitPath(orbit,radius);
  near(Math.hypot(...points[0])*radius,orbit.periapsis);near(Math.hypot(...points[256])*radius,orbit.apoapsis);
  const marker=orbitPoint(orbitalState(orbit,orbit.period/4),radius);near(Math.hypot(...marker)*radius,orbitalState(orbit,orbit.period/4).r);
  assert.ok(points.every(p=>p[1]===0)); // The physical orbit stays planar in 3D.
  const circle=ellipticOrbit({mu:1,radius:1,altitude:1,eccentricity:0});
  for(const p of orbitPath(circle,1,64))near(Math.hypot(...p),2);
});
test('3D cohete: radial, escala y extremos exactos, sin curva lateral ficticia',()=>{
  const r=simulate(DEFAULT),radius=BODIES.earth.radius,path=rocketPath(r.samples,radius,100);
  assert.equal(path.points.length,100);near(path.points[0][1],1);near(path.points.at(-1)[1],1);
  near(path.times.at(-1),r.final.t);assert.ok(path.points.every(p=>p[0]===0&&p[2]===0));
  const state=r.samples[5000];near(rocketPoint(state,radius)[1]*radius-radius,state.h);
  assert.equal(visibleCount(path.times,-1),0);assert.equal(visibleCount(path.times,0),1);assert.equal(visibleCount(path.times,r.final.t),100);
  assert.equal(visibleCount([0,1,1,2],1),3);
});
test('3D conversiones: casos cortos y entradas inválidas',()=>{
  assert.deepEqual(rocketPath([{t:0,h:0}],1),{points:[[0,1,0]],times:[0]});
  assert.throws(()=>orbitPoint({x:1,y:2},0));assert.throws(()=>orbitPoint({x:NaN,y:0},1));
  assert.throws(()=>orbitPath({semiMajor:1,semiMinor:1,eccentricity:1},1));
  assert.throws(()=>rocketPath([],1));assert.throws(()=>rocketPoint({h:-1},1));assert.throws(()=>rocketPath([{t:NaN,h:0}],1));
  assert.throws(()=>rocketPath([{t:0,h:0}],1,1));assert.throws(()=>visibleCount([0],NaN));
});
