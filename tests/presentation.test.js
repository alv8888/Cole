import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldColor, framingDistance, framingBoxDistance} from '../src/rendering/presentation.js';
import {axis, project, nearestPoint} from '../src/charts/scales.js';
import {createAnimationLoop} from '../src/rendering/clock.js';
import {validateSettings} from '../src/structure/design/data.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)));
test('Field colors match the quantitative legend and saturate only the display',()=>{
 assert.deepEqual(fieldColor(0),[32,199,173].map(v=>v/255));
 assert.deepEqual(fieldColor(.5),[214,203,39].map(v=>v/255));
 assert.deepEqual(fieldColor(1),[233,49,41].map(v=>v/255));
 assert.deepEqual(fieldColor(4),fieldColor(1));
 for(const x of [-1,NaN,Infinity])assert.throws(()=>fieldColor(x));
});
test('Camera framing fits a bounding sphere in landscape and portrait',()=>{
 for(const aspect of [.5,1,2]) {
  const d=framingDistance(10,aspect,45),v=45*Math.PI/360,h=Math.atan(Math.tan(v)*aspect);
  assert.ok(Math.asin(10/d)<Math.min(v,h));
  near(framingDistance(20,aspect)/d,2);
 }
 assert.ok(framingDistance(10,.5)>framingDistance(10,2));
 assert.throws(()=>framingDistance(0,1));assert.throws(()=>framingDistance(1,0));
});
test('Scientific axes retain signs and contain zero, including zero load',()=>{
 for(const values of [[0,2,3],[-3,-2,0],[-2,3],[0,0],[1e-8,3e-8]]) {
  const domain=axis(values);assert.ok(domain.min<=Math.min(...values,0));assert.ok(domain.max>=Math.max(...values,0));
  assert.ok(domain.ticks.some(t=>t===0));assert.ok(domain.max>domain.min);
  near(project(domain.min,domain,225,30),225);near(project(domain.max,domain,225,30),30);
 }
 assert.throws(()=>axis([NaN]));assert.throws(()=>axis([]));
});
test('Chart cursor selects an actual closest node and handles domain extremes',()=>{
 const points=[{x:0,y:0},{x:1,y:-2},{x:2,y:-4}];
 assert.equal(nearestPoint(points,1.1),1);assert.equal(nearestPoint(points,-10),0);assert.equal(nearestPoint(points,10),2);
});
test('Demand playback schedules nothing at rest, no duplicates and stops at completion',()=>{
 let next=0,ticks=0;const callbacks=new Map();
 const loop=createAnimationLoop(()=>++ticks<2,{request:cb=>{callbacks.set(++next,cb);return next;},cancel:id=>callbacks.delete(id)});
 assert.equal(callbacks.size,0);loop.start();loop.start();assert.equal(callbacks.size,1);
 const run=()=>{const [id,cb]=callbacks.entries().next().value;callbacks.delete(id);cb(100);};
 run();assert.equal(callbacks.size,1);run();assert.equal(callbacks.size,0);assert.equal(loop.active,false);
 loop.start();assert.equal(callbacks.size,1);loop.stop();assert.equal(callbacks.size,0);
});
test('Display mode validates declared choices and accepts legacy settings',()=>{
 const old={magnification:20,fraction:100,mesh:true,nodes:true};validateSettings(old);
 for(const display of ['field','geometry'])validateSettings({...old,display});
 assert.throws(()=>validateSettings({...old,display:'fake-fem'}));
});

test('Box framing fits all corners without excessive sphere padding for thin geometry',()=>{
 const size=[8,10,1], aspect=1.8, d=framingBoxDistance(size,aspect,[1,0,0]);
 const tangent=Math.tan(45*Math.PI/360);
 for(const x of [-4,4])for(const y of [-5,5])for(const z of [-.5,.5]) {
  assert.ok(Math.abs(y)/(d-x)<tangent*aspect);assert.ok(Math.abs(z)/(d-x)<tangent);
 }
 assert.ok(d<framingDistance(Math.hypot(...size)/2,aspect));
 assert.throws(()=>framingBoxDistance([0,0,0],1,[1,0,0]));
 assert.throws(()=>framingBoxDistance(size,1,[0,0,1]));
});
