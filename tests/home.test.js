import test from 'node:test';
import assert from 'node:assert/strict';
import { demoOrbit, previewModel } from '../src/home/models.js';
import { selectCatalog, CATALOG } from '../src/home/catalog.js';

test('home demo reuses circular reference, vis-viva and orbital period scaling', () => {
  const circular = demoOrbit(0, 0), ellipse = demoOrbit(.5, .5);
  assert.ok(Math.abs(circular.state.speed / 1000 - 7.6725985878) < 1e-9);
  assert.ok(Math.abs(circular.orbit.period - 5544.85513975) < 1e-6);
  assert.ok(Math.abs(ellipse.orbit.period / circular.orbit.period - 2 ** 1.5) < 1e-12);
  assert.ok(Math.abs(ellipse.state.r / ellipse.orbit.apoapsis - 1) < 1e-12);
  assert.ok(Math.abs(ellipse.state.speed ** 2 - ellipse.orbit.mu * (2 / ellipse.state.r - 1 / ellipse.orbit.semiMajor)) < 1e-7);
  for (const value of [NaN, Infinity, -.01, .76]) assert.throws(() => demoOrbit(value));
  for (const value of [NaN, Infinity, -.01, 1.01]) assert.throws(() => demoOrbit(0, value));
});
test('catalog groups include each real laboratory exactly once and existing entry routes', () => {
  assert.equal(selectCatalog().length, 4);
  assert.deepEqual(selectCatalog('motion').map(x => x.id), ['space', 'rocket']);
  assert.deepEqual(selectCatalog('forces').map(x => x.id), ['aircraft', 'structure']);
  assert.equal(new Set(CATALOG.map(x => x.href)).size, 4);
  assert.deepEqual(CATALOG.map(x => x.href), ['#lab', 'aircraft.html', 'rocket.html', 'structure.html']);
});
test('preview adapters agree with independent force and Tsiolkovsky calculations', async () => {
  const aircraft = await previewModel('aircraft'), rocket = await previewModel('rocket');
  assert.equal(aircraft.metrics[0][1], .5 * 1.225 * 50 ** 2 * 16 * .6);
  assert.equal(aircraft.metrics[1][1], 1200 * 9.80665);
  assert.ok(Math.abs(rocket.metrics[0][1] - 1200 * Math.log(3)) < 1e-10);
  assert.equal(rocket.metrics[2][1], 300);
  const structure = await previewModel('structure');
  assert.ok(structure.metrics.every(([,value]) => Number.isFinite(value)));
  assert.match(structure.note, /FEM 1D/);
  assert.match(structure.note, /no es una certificación/);
  await assert.rejects(previewModel('future'));
});
