import test from 'node:test';
import assert from 'node:assert/strict';
import { ellipticOrbit, orbitalState, solveKepler } from '../src/elliptic.js';
import { circularOrbit } from '../src/physics.js';
import { BODIES } from '../src/data.js';
import { LIMITS, isValidConfiguration } from '../src/validation.js';

const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);
const earth = eccentricity => ellipticOrbit({ mu: BODIES.earth.mu * 1e9, radius: 6371000, altitude: 400000, eccentricity });

test('e=0 recupera los resultados y posiciones circulares', () => {
  const args = { mu: BODIES.earth.mu * 1e9, radius: 6371000, altitude: 400000 };
  const circle = circularOrbit(args);
  const ellipse = ellipticOrbit({ ...args, eccentricity: 0 });
  close(ellipse.semiMajor, circle.r);
  close(ellipse.periapsisVelocity, circle.velocity);
  close(ellipse.apoapsisVelocity, circle.velocity);
  close(ellipse.period, circle.period);
  close(ellipse.specificEnergy, circle.specificEnergy);
  const quarter = orbitalState(ellipse, ellipse.period / 4);
  close(quarter.x, 0, 1e-8);
  close(quarter.y, circle.r);
});
test('caso normalizado a=1, e=0.5, μ=1', () => {
  const orbit = ellipticOrbit({ mu: 1, radius: 0.25, altitude: 0.25, eccentricity: 0.5 });
  assert.equal(orbit.semiMajor, 1);
  assert.equal(orbit.periapsis, 0.5);
  assert.equal(orbit.apoapsis, 1.5);
  close(orbit.periapsisVelocity, Math.sqrt(3));
  close(orbit.apoapsisVelocity, Math.sqrt(1 / 3));
  close(orbit.period, 2 * Math.PI);
  assert.equal(orbit.specificEnergy, -0.5);
});
test('Tierra e=.5: referencia independiente Python', () => {
  const orbit = earth(0.5);
  close(orbit.semiMajor, 13542000);
  close(orbit.apoapsis, 20313000);
  close(orbit.periapsisVelocity, 9396.975770677078);
  close(orbit.apoapsisVelocity, 3132.3252568923594);
  close(orbit.period, 15683.218680060498);
});
test('periapsis, apoapsis, periodicidad y sentidos físicos', () => {
  const orbit = earth(0.5);
  const start = orbitalState(orbit, 0);
  close(start.x, orbit.periapsis);
  assert.equal(start.y, 0);
  close(start.vx, 0);
  assert.ok(start.vy > 0);
  close(start.speed, orbit.periapsisVelocity);
  const half = orbitalState(orbit, orbit.period / 2);
  close(half.x, -orbit.apoapsis);
  close(half.y, 0, 1e-7);
  close(half.speed, orbit.apoapsisVelocity);
  close(orbitalState(orbit, orbit.period).x, start.x);
  close(orbitalState(orbit, orbit.period).y, 0);
});
test('energía, momento angular, vis-viva y geometría en 120 fases', () => {
  for (const e of [0, 0.1, 0.5, 0.9]) {
    const orbit = earth(e);
    const expectedMomentum = Math.sqrt(orbit.mu * orbit.semiMajor * (1 - e * e));
    for (let step = 0; step < 120; step++) {
      const state = orbitalState(orbit, orbit.period * step / 120);
      close(Math.hypot(state.x, state.y), state.r);
      close(state.speed ** 2 / 2 - orbit.mu / state.r, orbit.specificEnergy);
      close(state.x * state.vy - state.y * state.vx, expectedMomentum);
      close(state.speed ** 2, orbit.mu * (2 / state.r - 1 / orbit.semiMajor));
      close(((state.x + orbit.semiMajor * e) / orbit.semiMajor) ** 2 + (state.y / orbit.semiMinor) ** 2, 1);
      assert.ok(state.r >= orbit.periapsis * (1 - 1e-12) && state.r <= orbit.apoapsis * (1 + 1e-12));
    }
  }
});
test('Kepler: raíz independiente Newton Python y residuo acotado', () => {
  close(solveKepler(Math.PI / 2, 0.5), 2.0209799380897704);
  for (const e of [0, 0.2, 0.5, 0.9]) {
    for (const mean of [0, 1e-12, 0.01, 1, Math.PI, 5, 2 * Math.PI - 1e-12]) {
      const E = solveKepler(mean, e);
      assert.ok(Math.abs(E - e * Math.sin(E) - mean) < 2e-14);
    }
  }
  close(solveKepler(-Math.PI / 2, 0.5), 2 * Math.PI - solveKepler(Math.PI / 2, 0.5));
});
test('segunda ley de Kepler: área barrida proporcional al tiempo', () => {
  const orbit = earth(0.7);
  const times = [0, orbit.period / 8, orbit.period / 4, orbit.period / 2];
  const area = times.map(t => {
    const E = orbitalState(orbit, t).eccentricAnomaly;
    return orbit.semiMajor * orbit.semiMinor / 2 * (E - orbit.eccentricity * Math.sin(E));
  });
  close(area[2] / area[1], 2);
  close(area[3] / area[1], 4);
});
test('entradas inválidas y el límite e=.9', () => {
  for (const eccentricity of [-0.1, 0.90001, 1, 2, NaN, Infinity, '0.5', null]) {
    assert.throws(() => earth(eccentricity), RangeError);
    assert.throws(() => solveKepler(0, eccentricity), RangeError);
  }
  assert.throws(() => solveKepler(Infinity, 0.5), RangeError);
  assert.throws(() => orbitalState(earth(0.5), NaN), RangeError);
  const edge = earth(0.9);
  close(edge.period, 175343.71537304905);
});
test('extremos de interfaz y altos periodos dan estados finitos', () => {
  for (const mu of [LIMITS.mu.min, LIMITS.mu.max]) {
    for (const radius of [LIMITS.radius.min, LIMITS.radius.max]) {
      for (const altitude of [LIMITS.altitude.min, LIMITS.altitude.max]) {
        for (const eccentricity of [0, 0.9]) {
          assert.ok(isValidConfiguration({ body: 'custom', mu, radius, altitude, eccentricity }));
          const orbit = ellipticOrbit({ mu: mu * 1e9, radius: radius * 1000, altitude: altitude * 1000, eccentricity });
          assert.ok(Object.values(orbitalState(orbit, orbit.period * 1000.25)).every(Number.isFinite));
        }
      }
    }
  }
});
