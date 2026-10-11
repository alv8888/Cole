import test from 'node:test';
import assert from 'node:assert/strict';
import { compareExperiments, experimentCSV } from '../src/home/comparison.js';
import { previewModel, experimentCurve } from '../src/home/models.js';

function parseCSV(text) {
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if(c==='\r'&&!quoted&&text[i+1]==='\n'){row.push(cell);rows.push(row);row=[];cell='';i++;}
    else cell+=c;
  }
  return rows;
}
test('comparison reports actual changes and does not imply improvement',async()=>{
  const reference=await previewModel('aircraft',50),current=await previewModel('aircraft',60);
  const rows=compareExperiments(reference,current);
  assert.equal(rows[0].delta,6468);assert.equal(rows[0].percent,44);
  assert.equal(rows[1].delta,0);assert.equal(rows[1].percent,0);
  assert.equal(compareExperiments(reference,reference)[0].percent,0);
});
test('zero references and incompatible units are handled explicitly',()=>{
  const result=value=>({metrics:[['Velocity',value,'m/s']]});
  assert.equal(compareExperiments(result(0),result(2))[0].percent,null);
  assert.equal(compareExperiments(result(-2),result(-1))[0].percent,50);
  assert.throws(()=>compareExperiments(result(1),{metrics:[['Velocity',2,'km/s']]}));
  assert.throws(()=>compareExperiments(result(1),{metrics:[]}));
  assert.throws(()=>compareExperiments(result(1),result(NaN)));
});
test('CSV preserves units, numeric values, complete comparison inputs and 21 independent cases',async()=>{
  for(const id of ['space','aircraft','rocket','structure']) {
    const reference=await previewModel(id),curve=await experimentCurve(id);
    const d=(await import('../src/home/experiments.js')).EXPERIMENTS[id];
    const current=await previewModel(id,d.max);
    const text=experimentCSV(id,d.value,d.max,reference,current,curve),rows=parseCSV(text),header=rows.shift();
    assert.equal(rows.length,current.metrics.length+21);assert.ok(rows.every(row=>row.length===header.length));
    const column=key=>header.indexOf(key);
    const comparison=rows[0];assert.equal(Number(comparison[column('current_value')]),current.metrics[0][1]);
    assert.equal(comparison[column('metric_unit')],current.metrics[0][2]);
    assert.deepEqual(JSON.parse(comparison[column('current_config_json')]),current.configuration);
    assert.deepEqual(JSON.parse(comparison[column('reference_config_json')]),reference.configuration);
    const samples=rows.filter(row=>row[column('kind')]==='sweep');
    assert.equal(Number(samples.at(-1)[column('current_input')]),d.max);
    assert.equal(Number(samples.at(-1)[column('current_value')]),curve.at(-1).y);
  }
});
test('CSV correctly quotes commas, quotes and line breaks and rejects invalid curves',async()=>{
  const reference=await previewModel('aircraft'),curve=await experimentCurve('aircraft');
  const current={...reference,note:'Example, "quoted"\nSecond line'};
  const rows=parseCSV(experimentCSV('aircraft',50,50,reference,current,curve));
  assert.equal(rows[1][12],current.note);
  assert.throws(()=>experimentCSV('aircraft',50,NaN,reference,current,curve));
  assert.throws(()=>experimentCSV('aircraft',50,50,reference,current,curve.slice(1)));
});
