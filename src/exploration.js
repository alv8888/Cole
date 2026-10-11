import { orbitalState, ellipticOrbit } from './elliptic.js';
import { kmToM, km3ToM3 } from './units.js';
import { isValidConfiguration } from './validation.js';

export function periodFraction(time, period) {
  if (!Number.isFinite(time) || time < 0 || !Number.isFinite(period) || period <= 0) throw new RangeError('Tiempo o periodo inválidos.');
  const remainder = time % period;
  return remainder === 0 && time > 0 ? 1 : remainder / period;
}

export function sampleOrbit(orbit, segments = 240) {
  if (!Number.isInteger(segments) || segments < 24 || segments > 720) throw new RangeError('Muestreo: de 24 a 720 segmentos.');
  return Array.from({ length: segments + 1 }, (_, index) => {
    const fraction = index / segments;
    const time = orbit.period * fraction;
    return { fraction, time, ...orbitalState(orbit, time) };
  });
}

export function orbitFromConfiguration(config) {
  if (!isValidConfiguration(config)) throw new Error('Configuración inválida.');
  return ellipticOrbit({ mu: km3ToM3(config.mu), radius: kmToM(config.radius), altitude: kmToM(config.altitude), eccentricity: config.eccentricity });
}

export function exportOrbitCSV(configurations) {
  if (!Array.isArray(configurations) || configurations.length !== 2) throw new Error('Se requieren dos configuraciones.');
  const header = 'configuration,orbit_fraction,time_s,radius_km,speed_km_s,x_km,y_km,mu_km3_s2,body_radius_km,periapsis_altitude_km,eccentricity';
  const rows = configurations.flatMap((config, index) => sampleOrbit(orbitFromConfiguration(config)).map(state => [
    index === 0 ? 'A' : 'B', state.fraction, state.time, state.r / 1000, state.speed / 1000,
    state.x / 1000, state.y / 1000, config.mu, config.radius, config.altitude, config.eccentricity,
  ].map(value => typeof value === 'number' ? value.toPrecision(15) : value).join(',')));
  return [header, ...rows].join('\n') + '\n';
}

export function assessPrediction(orbits, metric, answer) {
  if (!Array.isArray(orbits) || orbits.length !== 2 || orbits.some(orbit => !orbit)) throw new Error('Corrige ambas órbitas primero.');
  if (!['period', 'periapsisVelocity', 'apoapsisVelocity'].includes(metric) || !['higher', 'equal', 'lower'].includes(answer)) throw new Error('Selecciona una magnitud y una predicción válidas.');
  const ratio = orbits[1][metric] / orbits[0][metric];
  const expected = Math.abs(ratio - 1) <= 1e-10 ? 'equal' : ratio > 1 ? 'higher' : 'lower';
  return { correct: answer === expected, expected, ratio };
}
