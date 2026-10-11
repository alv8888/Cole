import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT} from '../src/structure/materials.js';
import {analyze,cleanConfiguration} from '../src/structure/model.js';
import {saveStructure,loadStructure,KEY} from '../src/structure/storage.js';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=Math.max(1e-14,Math.abs(expected)*1e-10),`${actual} != ${expected}`);
const beam={...DEFAULT,length:2,width:.1,height:.2,modulus:70,force:1000,distributed:1000};
test('Voladizo punta: referencia independiente Python, dimensiones y condiciones de encastre',()=>{
 const r=analyze(beam);close(r.inertia,6.666666666666668e-5);close(r.moment,2000);close(r.stress,3e6);close(r.deflection,.0005714285714285713);close(r.materialFactor,503/3);
 assert.equal(r.samples.length,81);assert.equal(r.samples[0].displacement,0);assert.equal(r.samples.at(-1).moment,0);close(r.samples.at(-1).displacement,r.deflection);assert.equal(r.shortening,null);
});
test('Carga uniforme: caso independiente Python y relación δpunta = 3/8 para igual carga total',()=>{
 const r=analyze({...beam,mode:'uniform'});close(r.stress,3e6);close(r.deflection,.00042857142857142844);close(r.samples.at(-1).displacement,r.deflection);
 const equalForce=analyze({...beam,force:beam.distributed*beam.length});close(r.deflection/equalForce.deflection,3/8);
});
test('Flexión: leyes de escala y material elástico no cambia el esfuerzo',()=>{
 const r=analyze(beam);close(analyze({...beam,modulus:140}).deflection,r.deflection/2);close(analyze({...beam,height:.4}).stress,r.stress/4);close(analyze({...beam,height:.4}).deflection,r.deflection/8);close(analyze({...beam,length:4}).deflection,r.deflection*8);close(analyze({...beam,modulus:140}).stress,r.stress);
});
test('Compresión: área, I, esfuerzo, acortamiento y Euler independientes Python',()=>{
 const c={...beam,mode:'compression',diameter:.1,thickness:.002,support:'pinned'},r=analyze(c);
 close(r.area,.0006157521601036007);close(r.inertia,7.395183442844236e-7);close(r.stress,1624030.031549949);close(r.shortening,4.6400858044284255e-5);close(r.criticalLoad,127728.18634512759);
 assert.equal(r.eulerApplicable,true);close(r.bucklingFactor,r.criticalLoad/c.force);close(analyze({...c,support:'cantilever'}).criticalLoad,r.criticalLoad/4);assert.equal(r.deflection,null);
});
test('Límites: carga cero, fibra sin límite elástico, fluencia, deformación y Euler no aplicable',()=>{
 const zero=analyze({...beam,force:0});assert.equal(zero.stress,0);assert.equal(zero.deflection,0);assert.equal(zero.materialFactor,null);
 const carbon=analyze({...beam,material:'carbon',tensile:600,compressive:400});close(carbon.materialFactor,400/3);assert.ok(carbon.warnings.some(x=>x.includes('no un límite elástico')));
 const overloaded=analyze({...beam,force:1e7});assert.ok(overloaded.warnings.some(x=>x.includes('alcanza/supera')));assert.ok(overloaded.warnings.some(x=>x.includes('5 %')));
 const short=analyze({...beam,mode:'compression',length:.1,diameter:.2,thickness:.01,support:'fixed'});assert.equal(short.eulerApplicable,false);assert.equal(short.bucklingFactor,null);
});
test('Entradas inválidas, propiedades no numéricas y tubo sin diámetro interior',()=>{
 for(const c of [{...beam,modulus:NaN},{...beam,material:'unknown'},{...beam,mode:'invalid'},{...beam,length:0},{...beam,force:'1000'},{...beam,force:1e-12},{...beam,mode:'compression',thickness:.1,diameter:.1},{...beam,mode:'compression',support:'bogus'}])assert.throws(()=>analyze(c),RangeError);
 const cleaned=cleanConfiguration({...beam,diameter:NaN,unexpected:'ignored'});assert.equal(Object.hasOwn(cleaned,'diameter'),false);assert.equal(Object.hasOwn(cleaned,'unexpected'),false);
});
test('Valores extremos admitidos permanecen finitos y advierten sus límites',()=>{
 for(const c of [{...beam,length:30,width:.005,height:.005,force:1e7},{...beam,mode:'compression',length:30,diameter:5,thickness:.0001,force:1e7}]){
  const r=analyze(c);assert.ok([r.stress,r.inertia,r.area,r.deflection??r.shortening,...r.samples.map(p=>p.displacement)].every(Number.isFinite));assert.ok(r.inertia>0);
 }
});
test('Persistencia estructural aislada valida, limpia y rechaza formatos corruptos',()=>{
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null};saveStructure(storage,beam);assert.deepEqual(loadStructure(storage),cleanConfiguration(beam));assert.deepEqual([...data.keys()],[KEY]);
 data.set(KEY,'{broken');assert.throws(()=>loadStructure(storage));data.set(KEY,JSON.stringify({version:2,module:'structure',configuration:beam}));assert.throws(()=>loadStructure(storage));assert.throws(()=>saveStructure(storage,{...beam,force:-1}));
});
