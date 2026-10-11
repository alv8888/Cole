import { LIMITS, isValidConfiguration } from './validation.js';
import { orbitFromConfiguration } from './exploration.js';

export const SWEEP_VARIABLES = Object.freeze({
  altitude: Object.freeze({ label: 'Altitud de periapsis', unit: 'km' }),
  eccentricity: Object.freeze({ label: 'Excentricidad', unit: 'sin unidad' }),
});
export const SWEEP_METRICS = Object.freeze({
  period: Object.freeze({ label: 'Periodo orbital', unit: 'min', convert: value => value / 60 }),
  periapsisVelocity: Object.freeze({ label: 'Velocidad en periapsis', unit: 'km/s', convert: value => value / 1000 }),
  apoapsisVelocity: Object.freeze({ label: 'Velocidad en apoapsis', unit: 'km/s', convert: value => value / 1000 }),
});

export function parameterSweep(config, { variable, minimum, maximum, count = 41 }) {
  if (!isValidConfiguration(config)) throw new Error('Corrige la configuración de referencia antes de calcular.');
  if (!Object.hasOwn(SWEEP_VARIABLES, variable)) throw new Error('Solo se admite barrer altitud o excentricidad.');
  const limits = LIMITS[variable];
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum < limits.min || maximum > limits.max || minimum >= maximum) {
    throw new RangeError(`Intervalo inválido: mínimo < máximo, entre ${limits.min} y ${limits.max} ${limits.unit}.`);
  }
  if (!Number.isInteger(count) || count < 3 || count > 101) throw new RangeError('Usa entre 3 y 101 muestras.');
  return Array.from({ length: count }, (_, index) => {
    const value = index === 0 ? minimum : index === count - 1 ? maximum : minimum + (maximum - minimum) * index / (count - 1);
    const configuration = Object.freeze({ ...config, [variable]: value });
    return Object.freeze({ value, configuration, orbit: orbitFromConfiguration(configuration) });
  });
}

export function exportSweepCSV(config, options) {
  const samples = parameterSweep(config, options);
  const header = 'sample,mu_km3_s2,body_radius_km,periapsis_altitude_km,eccentricity,period_s,periapsis_speed_km_s,apoapsis_speed_km_s,semimajor_axis_km';
  return [header, ...samples.map((sample, index) => [
    index + 1, sample.configuration.mu, sample.configuration.radius, sample.configuration.altitude,
    sample.configuration.eccentricity, sample.orbit.period, sample.orbit.periapsisVelocity / 1000,
    sample.orbit.apoapsisVelocity / 1000, sample.orbit.semiMajor / 1000,
  ].map(value => value.toPrecision(15)).join(','))].join('\n') + '\n';
}
