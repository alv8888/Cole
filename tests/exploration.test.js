import test from 'node:test';
import assert from 'node:assert/strict';
import { parseConfigurations, serializeConfigurations, MAX_IMPORT_BYTES } from '../src/configuration.js';
import { sampleOrbit, orbitFromConfiguration, exportOrbitCSV, assessPrediction, periodFraction } from '../src/exploration.js';
import { SCENARIOS } from '../src/scenarios.js';
import { DEFAULTS } from '../src/data.js';

const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('JSON portable conserva parámetros y descarta propiedades ajenas', () => {
  const configs = DEFAULTS.map(config => ({ ...config, eccentricity: 0.5, extra: '<script>invalid</script>' }));
  const restored = parseConfigurations(serializeConfigurations(configs));
  assert.ok(restored.every(config => config.eccentricity === 0.5 && !('extra' in config)));
  assert.equal(restored[0].altitude, 400);
  const payload = JSON.parse(serializeConfigurations(DEFAULTS));
  Object.defineProperty(payload.configurations[0], '__proto__', { value: { injected: true }, enumerable: true });
  assert.deepEqual(parseConfigurations(JSON.stringify(payload)), DEFAULTS);
  assert.equal({}.injected, undefined);
});
test('importación rechaza archivos dañados, incompletos, grandes o no físicos', () => {
  for (const raw of ['<html>', 'null', '{}', JSON.stringify({ version: 2, configurations: [null, null] }), JSON.stringify({ version: 2, configurations: [DEFAULTS[0], { ...DEFAULTS[1], mu: 0 }] }), ' '.repeat(MAX_IMPORT_BYTES + 1), '😀'.repeat(MAX_IMPORT_BYTES / 2)]) {
    assert.throws(() => parseConfigurations(raw));
  }
  assert.throws(() => serializeConfigurations([{ ...DEFAULTS[0], altitude: -1 }, DEFAULTS[1]]));
  const legacy = DEFAULTS.map(({ eccentricity, ...config }) => config);
  assert.deepEqual(parseConfigurations(JSON.stringify({ version: 1, configurations: legacy })), DEFAULTS);
});
test('muestreo incluye extremos y sus valores corresponden al modelo', () => {
  const config = { ...DEFAULTS[0], eccentricity: 0.5 };
  const orbit = orbitFromConfiguration(config);
  const samples = sampleOrbit(orbit);
  assert.equal(samples.length, 241);
  assert.equal(samples[0].time, 0);
  close(samples[120].r, orbit.apoapsis);
  close(samples[120].speed, orbit.apoapsisVelocity);
  close(samples[240].r, orbit.periapsis);
  close(samples[240].time, orbit.period);
  close(samples[0].speed, orbit.periapsisVelocity);
  assert.throws(() => sampleOrbit(orbit, 1), RangeError);
  assert.throws(() => sampleOrbit(orbit, 721), RangeError);
});
test('CSV contiene 482 estados, unidades explícitas y tiempos propios', () => {
  const lines = exportOrbitCSV(DEFAULTS).trim().split('\n');
  assert.equal(lines.length, 483);
  assert.match(lines[0], /time_s,radius_km,speed_km_s/);
  const first = lines[1].split(',');
  assert.equal(first[0], 'A');
  close(Number(first[3]), 6771);
  close(Number(first[4]), orbitFromConfiguration(DEFAULTS[0]).periapsisVelocity / 1000);
  const lastA = lines[241].split(',');
  const lastB = lines[482].split(',');
  assert.equal(lastB[0], 'B');
  close(Number(lastA[2]), orbitFromConfiguration(DEFAULTS[0]).period);
  close(Number(lastB[2]), orbitFromConfiguration(DEFAULTS[1]).period);
  assert.notEqual(Number(lastA[2]), Number(lastB[2]));
  assert.throws(() => exportOrbitCSV([]));
});
test('escenarios son válidos y aíslan las relaciones anunciadas', () => {
  const cases = Object.fromEntries(SCENARIOS.map(scenario => [scenario.id, scenario.configurations.map(orbitFromConfiguration)]));
  assert.ok(cases.altitude[1].period > cases.altitude[0].period);
  assert.ok(cases.altitude[1].periapsisVelocity < cases.altitude[0].periapsisVelocity);
  assert.equal(cases.eccentricity[0].periapsis, cases.eccentricity[1].periapsis);
  close(cases.kepler[0].semiMajor, cases.kepler[1].semiMajor);
  close(cases.kepler[0].period, cases.kepler[1].period);
  assert.notEqual(cases.kepler[0].eccentricity, cases.kepler[1].eccentricity);
  assert.notEqual(cases.moon[0].mu, cases.moon[1].mu);
});
test('predicciones se evalúan sobre resultados actuales, no respuestas prefijadas', () => {
  const orbits = DEFAULTS.map(orbitFromConfiguration);
  assert.ok(assessPrediction(orbits, 'period', 'higher').correct);
  assert.ok(!assessPrediction(orbits, 'period', 'lower').correct);
  assert.ok(assessPrediction([...orbits].reverse(), 'period', 'lower').correct);
  assert.ok(assessPrediction([orbits[0], orbits[0]], 'period', 'equal').correct);
  assert.throws(() => assessPrediction([null, orbits[1]], 'period', 'higher'));
  assert.throws(() => assessPrediction(orbits, 'unknown', 'higher'));
  assert.throws(() => assessPrediction(orbits, 'period', 'unknown'));
});
test('fracción temporal conserva el extremo al completar una vuelta', () => {
  assert.equal(periodFraction(0, 100), 0);
  assert.equal(periodFraction(50, 100), 0.5);
  assert.equal(periodFraction(100, 100), 1);
  assert.equal(periodFraction(101, 100), 0.01);
  assert.throws(() => periodFraction(-1, 100));
  assert.throws(() => periodFraction(1, 0));
});
