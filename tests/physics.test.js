import test from 'node:test';
import assert from 'node:assert/strict';
import { circularOrbit, positionAtPhase, percentageDifference } from '../src/physics.js';
import { kmToM, km3ToM3, mToKm, secondsToMinutes } from '../src/units.js';
import { DEFAULTS, BODIES } from '../src/data.js';
import { LIMITS, validateConfiguration, isValidConfiguration } from '../src/validation.js';

const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual / expected - 1) <= tolerance, `${actual} ≠ ${expected}`);
const earth = altitude => circularOrbit({ mu: km3ToM3(BODIES.earth.mu), radius: kmToM(BODIES.earth.radius), altitude: kmToM(altitude) });

test('Tierra, h=400 km: referencia independiente Python, no ISS real', () => {
  const orbit = earth(400);
  assert.equal(orbit.r, 6771000);
  close(orbit.velocity, 7672.598587818517);
  close(orbit.period, 5544.8551397511565);
});
test('radio 42164 km: periodo próximo al día sidéreo', () => {
  const orbit = earth(42164 - BODIES.earth.radius);
  close(orbit.velocity, 3074.666259856669);
  close(orbit.period, 86163.5712307423);
  assert.ok(Math.abs(orbit.period - 86164.0905) < 1); // rounded geosynchronous radius
});
test('caso normalizado exacto μ=1, r=1', () => {
  const orbit = circularOrbit({ mu: 1, radius: 0.5, altitude: 0.5 });
  assert.equal(orbit.velocity, 1);
  assert.equal(orbit.period, 2 * Math.PI);
  assert.equal(orbit.acceleration, 1);
  assert.equal(orbit.specificEnergy, -0.5);
});
test('tercera ley de Kepler y leyes de escala', () => {
  const a = circularOrbit({ mu: 4, radius: 1, altitude: 1 });
  const b = circularOrbit({ mu: 4, radius: 1, altitude: 7 });
  close(b.period / a.period, 8);
  close(b.velocity / a.velocity, 0.5);
  close(a.period ** 2 / a.r ** 3, 4 * Math.PI ** 2 / 4);
  const c = circularOrbit({ mu: 16, radius: 1, altitude: 1 });
  close(c.velocity / a.velocity, 2);
  close(c.period / a.period, 0.5);
});
test('balance centrípeto y energía específica', () => {
  const orbit = earth(400);
  close(orbit.velocity ** 2 / orbit.r, orbit.acceleration);
  close(orbit.velocity ** 2 / 2 - km3ToM3(BODIES.earth.mu) / orbit.r, orbit.specificEnergy);
});
test('órbita periódica, radio constante y fase inicial', () => {
  const orbit = earth(400);
  assert.deepEqual(positionAtPhase(orbit.r, 0), { x: orbit.r, y: 0 });
  for (const phase of [0.1, Math.PI / 2, Math.PI, 2 * Math.PI]) {
    const pos = positionAtPhase(orbit.r, phase);
    close(Math.hypot(pos.x, pos.y), orbit.r);
  }
  const full = positionAtPhase(orbit.r, orbit.angularVelocity * orbit.period);
  close(full.x, orbit.r);
  assert.ok(Math.abs(full.y) < 1e-7);
});
test('conversiones SI y diferencia porcentual con energía negativa', () => {
  assert.equal(kmToM(400), 400000);
  assert.equal(km3ToM3(1), 1e9);
  assert.equal(mToKm(7650), 7.65);
  assert.equal(secondsToMinutes(5400), 90);
  close(percentageDifference(100, 120), 20);
  assert.equal(percentageDifference(-10, -5), -50);
  assert.throws(() => percentageDifference(0, 1), RangeError);
});
test('rechaza entradas no físicas, no numéricas y desbordamiento', () => {
  for (const key of ['mu', 'radius', 'altitude']) {
    for (const bad of [0, -1, Infinity, NaN, '1', null, undefined]) {
      assert.throws(() => circularOrbit({ mu: 1, radius: 1, altitude: 1, [key]: bad }), RangeError);
    }
  }
  assert.throws(() => circularOrbit({ mu: Number.MAX_VALUE, radius: Number.MAX_VALUE, altitude: Number.MAX_VALUE }), RangeError);
  assert.throws(() => positionAtPhase(0, 0), RangeError);
  assert.throws(() => positionAtPhase(1, Infinity), RangeError);
});
test('límites admitidos por interfaz: resultados finitos; un km es idealizado', () => {
  for (const mu of [LIMITS.mu.min, LIMITS.mu.max]) {
    for (const radius of [LIMITS.radius.min, LIMITS.radius.max]) {
      for (const altitude of [LIMITS.altitude.min, LIMITS.altitude.max]) {
        const config = { body: 'custom', mu, radius, altitude };
        assert.ok(isValidConfiguration(config));
        const result = circularOrbit({ mu: km3ToM3(mu), radius: kmToM(radius), altitude: kmToM(altitude) });
        assert.ok(result.velocity > 0 && result.period > 0);
      }
    }
  }
});
test('validación no acepta entradas vacías, límites excedidos o cuerpo desconocido', () => {
  assert.ok(DEFAULTS.every(isValidConfiguration));
  for (const key of Object.keys(LIMITS)) {
    for (const value of ['', null, NaN, Infinity, LIMITS[key].min / 2, LIMITS[key].max * 2]) {
      assert.ok(validateConfiguration({ ...DEFAULTS[0], [key]: value })[key]);
    }
  }
  assert.ok(!isValidConfiguration({ ...DEFAULTS[0], body: 'unknown' }));
  assert.ok(!isValidConfiguration({ ...DEFAULTS[0], mu: 1 }));
  assert.ok(!isValidConfiguration(null));
});
