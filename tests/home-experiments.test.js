import test from 'node:test';
import assert from 'node:assert/strict';
import { previewModel, experimentCurve } from '../src/home/models.js';
import { EXPERIMENTS, experimentValue, experimentLink } from '../src/home/experiments.js';
import { decodeLink } from '../src/navigation/share.js';
import { DEFAULT as DESIGN_DEFAULT, validateDesignState } from '../src/structure/design/data.js';
import { cleanConfiguration } from '../src/structure/model.js';
import { budget } from '../src/rocket/model.js';

const metric = (result, index) => result.metrics[index][1];
test('preview sweeps preserve independent equations and one-variable assumptions', async () => {
  const spaceLow = await previewModel('space', 100), spaceHigh = await previewModel('space', 2000);
  assert.ok(Math.abs(metric(spaceHigh,1)/metric(spaceLow,1)-((6371+2000)/(6371+100))**1.5)<1e-12);
  const slow = await previewModel('aircraft',30), fast = await previewModel('aircraft',60);
  assert.equal(metric(fast,0),metric(slow,0)*4); assert.equal(metric(fast,1),metric(slow,1));
  assert.match(slow.note,/no están equilibrados/);
  const rocket = await previewModel('rocket',600);
  assert.equal(metric(rocket,1),6000/(600/40));
  assert.ok(Math.abs(metric(rocket,0)-400*Math.log(7))<1e-12);
  assert.match(rocket.note,/no es un motor fijo/);
});
test('structural experiment converts mm to m and separates mass from stiffness', async () => {
  const snapshot = JSON.stringify(DESIGN_DEFAULT);
  const thin = await previewModel('structure',1), thick = await previewModel('structure',4);
  assert.equal(thin.configuration.wing.thickness,.001);
  assert.equal(thick.configuration.wing.thickness,.004);
  assert.ok(metric(thick,0)>metric(thin,0)); assert.ok(metric(thick,2)<metric(thin,2));
  assert.equal(JSON.stringify(DESIGN_DEFAULT),snapshot);
});
test('curves cover each declared range with 21 finite, independently calculated cases', async () => {
  for(const [id,d] of Object.entries(EXPERIMENTS)) {
    const curve=await experimentCurve(id);
    assert.equal(curve.length,21); assert.equal(curve[0].x,d.min); assert.equal(curve.at(-1).x,d.max);
    assert.ok(curve.every(point=>Number.isFinite(point.y)));
    assert.equal(curve[10].y,metric(await previewModel(id,curve[10].x),d.metric));
    for(const value of [NaN,Infinity,d.min-1,d.max+1]) {
      assert.throws(()=>experimentValue(id,value)); await assert.rejects(previewModel(id,value));
    }
  }
  await assert.rejects(experimentCurve('unknown'));
});
test('continuation URLs preserve actual configurations and satisfy multipart state contracts', async () => {
  const base='https://example.test/aerolab/index.html?sim=old#catalogo';
  for(const [id,value] of [['aircraft',70],['rocket',450],['structure',3]]) {
    const result=await previewModel(id,value),link=await experimentLink(id,result,base),state=decodeLink(link,id);
    assert.ok(new URL(link).pathname.endsWith(`/${id}.html`));
    const config=id==='structure'?state.design.configuration:state[id==='aircraft'?'aircraft':'calculator'].configuration;
    assert.deepEqual(config,result.configuration);
    if(id==='rocket') {budget(state.launch.configuration);assert.equal(state.launch.calculated,false);assert.equal(state.launch.clock,0);}
    if(id==='structure') {validateDesignState(state.design);cleanConfiguration(state.structure.configuration);}
  }
  await assert.rejects(experimentLink('space',await previewModel('space'),base));
});
