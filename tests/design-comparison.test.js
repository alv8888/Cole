import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT,clone} from '../src/structure/design/data.js';
import {analyzeDesign} from '../src/structure/design/model.js';
import {compareDesigns,designComparisonCSV} from '../src/structure/design/comparison.js';
const model=changes=>analyzeDesign({...clone(DEFAULT),...changes});
test('structural comparison follows linear load scaling without mutating either configuration',()=>{
 const original=clone(DEFAULT),reference=analyzeDesign(original),current=model({force:DEFAULT.force*2});
 const rows=compareDesigns(reference,current);
 assert.equal(rows[0].delta,0);
 assert.ok(Math.abs(rows[1].percent-100)<1e-7);
 assert.ok(Math.abs(rows[2].percent-100*Math.sign(reference.displacement))<1e-7);
 assert.equal(rows[2].unit,'mm');assert.equal(rows[1].unit,'MPa');
 assert.deepEqual(original,DEFAULT);
});
test('different stress criteria and load cases cannot produce misleading deltas',()=>{
 const reference=model({}),carbon=model({material:'carbon'});
 const mixed=compareDesigns(reference,carbon);
 assert.equal(mixed[0].compatible,true);assert.equal(mixed[1].compatible,false);
 assert.equal(mixed[1].delta,null);assert.match(mixed[1].reason,/Criterios distintos/);
 assert.equal(mixed[2].compatible,true);
 const thermal=compareDesigns(reference,model({load:'thermal',deltaT:30}));
 assert.equal(thermal[1].delta,null);assert.equal(thermal[2].delta,null);
});
test('zero load and unsupported sphere UD preserve absent versus zero results',()=>{
 const sphere={object:'sphere',load:'pressure',pressure:0};
 const reference=model(sphere),current=model({...sphere,pressure:10000});
 const rows=compareDesigns(reference,current);
 assert.equal(rows[1].reference,0);assert.equal(rows[1].percent,null);
 const expected=10000*DEFAULT.sphere.radius/(2*DEFAULT.sphere.thickness)/1e6;
 assert.ok(Math.abs(rows[1].current-expected)<1e-10);
 const unsupported=compareDesigns(reference,model({...sphere,material:'carbon'}));
 assert.equal(unsupported[1].current,null);assert.equal(unsupported[1].delta,null);
 assert.equal(unsupported[2].current,null);assert.equal(unsupported[0].compatible,true);
 assert.throws(()=>compareDesigns({...reference,mass:NaN},current));
 const thermal=model({object:'sphere',load:'thermal',deltaT:-20});
 const warmer=model({object:'sphere',load:'thermal',deltaT:-10});
 assert.equal(compareDesigns(thermal,warmer)[2].percent,50);
});
test('comparison CSV recomputes exact configurations and refuses invalid inactive drafts',()=>{
 const ref=clone(DEFAULT),current={...clone(DEFAULT),force:DEFAULT.force*2};
 const csv=designComparisonCSV(ref,current);
 assert.equal(csv.split('\r\n').length,5);
 assert.match(csv,/reference_config_json/);assert.match(csv,/"MPa"/);
 assert.ok(csv.includes(JSON.stringify(ref).replaceAll('"','""')));
 assert.ok(csv.includes(JSON.stringify(current).replaceAll('"','""')));
 const invalid=clone(DEFAULT);invalid.sphere.radius=NaN;
 assert.throws(()=>designComparisonCSV(ref,invalid));
});
