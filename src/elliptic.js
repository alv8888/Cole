import { circularOrbit } from './physics.js';

const TAU = 2 * Math.PI;

/** Bound two-body orbit. altitude is PERIAPSIS height; SI except eccentricity. */
export function ellipticOrbit({ mu, radius, altitude, eccentricity = 0 }) {
  const circular = circularOrbit({ mu, radius, altitude });
  if (!Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity > 0.9) {
    throw new RangeError('La excentricidad debe estar entre 0 y 0,9.');
  }
  const periapsis = circular.r;
  const semiMajor = periapsis / (1 - eccentricity);
  const apoapsis = semiMajor * (1 + eccentricity);
  const semiMinor = semiMajor * Math.sqrt(1 - eccentricity ** 2);
  const meanMotion = Math.sqrt(mu / semiMajor) / semiMajor;
  const period = TAU / meanMotion;
  const periapsisVelocity = Math.sqrt(mu / periapsis * (1 + eccentricity));
  const apoapsisVelocity = Math.sqrt(mu / apoapsis * (1 - eccentricity));
  const specificEnergy = -mu / (2 * semiMajor);
  const result = { mu, eccentricity, periapsis, apoapsis, semiMajor, semiMinor,
    meanMotion, period, periapsisVelocity, apoapsisVelocity, specificEnergy,
    periapsisAcceleration: circular.acceleration };
  if (Object.values(result).some(value => !Number.isFinite(value)) || period <= 0 || meanMotion <= 0 || periapsisVelocity <= 0 || apoapsisVelocity <= 0) {
    throw new RangeError('Los parámetros exceden el rango numérico de la elipse.');
  }
  return Object.freeze(result);
}

/** Solve M = E - e sin(E) using a monotone bracket and 50 bisections.
 * For 0 <= e <= .9, derivative >= .1 and the root is unique.
 * Absolute angle error <= 2π/2^51 before floating-point rounding.
 */
export function solveKepler(meanAnomaly, eccentricity) {
  if (!Number.isFinite(meanAnomaly) || !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity > 0.9) {
    throw new RangeError('Anomalía o excentricidad inválidas.');
  }
  const remainder = meanAnomaly % TAU;
  const normalized = remainder < 0 ? remainder + TAU : remainder;
  if (normalized === 0 || eccentricity === 0) return normalized;
  let low = 0;
  let high = TAU;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    if (mid - eccentricity * Math.sin(mid) < normalized) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Position and velocity relative to central focus; starts at periapsis. */
export function orbitalState(orbit, time) {
  if (!Number.isFinite(time)) throw new RangeError('Tiempo no finito.');
  const meanAnomaly = (time % orbit.period) * orbit.meanMotion;
  const eccentricAnomaly = solveKepler(meanAnomaly, orbit.eccentricity);
  const cos = Math.cos(eccentricAnomaly);
  const sin = Math.sin(eccentricAnomaly);
  const denominator = 1 - orbit.eccentricity * cos;
  const anomalyRate = orbit.meanMotion / denominator;
  const x = orbit.semiMajor * (cos - orbit.eccentricity);
  const y = orbit.semiMinor * sin;
  const vx = -orbit.semiMajor * sin * anomalyRate;
  const vy = orbit.semiMinor * cos * anomalyRate;
  return { x, y, vx, vy, r: orbit.semiMajor * denominator, speed: Math.hypot(vx, vy), eccentricAnomaly };
}
