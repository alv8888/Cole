import test from 'node:test';
import assert from 'node:assert/strict';
import { parameterSweep, exportSweepCSV } from '../src/sensitivity.js';
import { DEFAULTS } from '../src/data.js';

const close = (a, b) => assert.ok(Math.abs(a / b - 1) < 1e-10, `${a} ≠ ${b}`);

test('altura: extremos exactos, controles fijos y leyes de escala', () => {
  const source = { ...DEFAULTS[0], eccentricity: 0.3 };
  const samples = parameterSweep(source, { variable: 'altitude', minimum: 400, maximum: 2000 });
  assert.equal(samples.length, 41);
  assert.equal(samples[0].value, 400);
  assert.equal(samples.at(-1).value, 2000);
  assert.ok(samples.every(sample => sample.configuration.eccentricity === 0.3 && sample.configuration.mu === source.mu && sample.configuration.radius === source.radius));
  for (let i = 1; i < samples.length; i++) {
    assert.ok(samples[i].orbit.period > samples[i - 1].orbit.period);
    assert.ok(samples[i].orbit.periapsisVelocity < samples[i - 1].orbit.periapsisVelocity);
  }
  const start = samples[0].orbit;
  const end = samples.at(-1).orbit;
  const ratio = end.periapsis / start.periapsis;
  close(end.period / start.period, ratio ** 1.5);
  close(end.periapsisVelocity / start.periapsisVelocity, ratio ** -0.5);
  assert.equal(source.altitude, 400);
});
test('excentricidad: periapsis fijo y relaciones analíticas', () => {
  const samples = parameterSweep(DEFAULTS[0], { variable: 'eccentricity', minimum: 0, maximum: 0.9, count: 101 });
  assert.equal(samples.at(-1).value, 0.9);
  const circle = samples[0].orbit;
  for (const sample of samples) {
    assert.equal(sample.orbit.periapsis, circle.periapsis);
    close(sample.orbit.period / circle.period, (1 - sample.value) ** -1.5);
    close(sample.orbit.periapsisVelocity / circle.periapsisVelocity, Math.sqrt(1 + sample.value));
    close(sample.orbit.apoapsisVelocity / circle.apoapsisVelocity, (1 - sample.value) / Math.sqrt(1 + sample.value));
  }
  assert.ok(samples.at(-1).orbit.apoapsisVelocity < circle.apoapsisVelocity);
});
test('rechaza intervalos invertidos, fuera de límites, no finitos y tamaños inválidos', () => {
  const valid = { variable: 'altitude', minimum: 100, maximum: 1000, count: 41 };
  for (const invalid of [{ minimum: 1000 }, { minimum: 0 }, { maximum: 1e6 + 1 }, { minimum: NaN }, { maximum: Infinity }, { count: 2 }, { count: 102 }, { count: 3.5 }, { variable: '__proto__' }]) {
    assert.throws(() => parameterSweep(DEFAULTS[0], { ...valid, ...invalid }));
  }
  assert.throws(() => parameterSweep(DEFAULTS[0], { variable: 'eccentricity', minimum: 0, maximum: 1 }));
  assert.throws(() => parameterSweep({ ...DEFAULTS[0], mu: 0 }, valid));
});
test('CSV reproduce muestras y todas las condiciones físicas, con unidades', () => {
  const options = { variable: 'altitude', minimum: 400, maximum: 1000, count: 21 };
  const lines = exportSweepCSV(DEFAULTS[0], options).trim().split('\n');
  assert.equal(lines.length, 22);
  assert.match(lines[0], /period_s,periapsis_speed_km_s/);
  const first = lines[1].split(',').map(Number);
  close(first[1], DEFAULTS[0].mu);
  close(first[2], DEFAULTS[0].radius);
  assert.equal(first[3], 400);
  close(first[5], 5544.8551397511565);
  assert.equal(Number(lines.at(-1).split(',')[3]), 1000);
});
