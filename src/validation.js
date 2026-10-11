import { BODIES } from './data.js';

export const LIMITS = Object.freeze({
  mu: { min: 0.001, max: 1e12, label: 'μ', unit: 'km³/s²' },
  radius: { min: 1, max: 1e6, label: 'Radio del cuerpo', unit: 'km' },
  altitude: { min: 1, max: 1e6, label: 'Altitud', unit: 'km' },
});

export function validateConfiguration(config) {
  const errors = {};
  if (!config || typeof config !== 'object') return { configuration: 'Configuración ausente.' };
  if (!['earth', 'moon', 'mars', 'custom'].includes(config.body)) errors.body = 'Selecciona un cuerpo válido.';
  const preset = BODIES[config.body];
  if (preset && (config.mu !== preset.mu || config.radius !== preset.radius)) errors.body = 'Los parámetros editados deben usar el cuerpo Personalizado.';
  for (const [key, limit] of Object.entries(LIMITS)) {
    const value = config[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < limit.min || value > limit.max) {
      errors[key] = `${limit.label}: introduce un número entre ${limit.min} y ${limit.max} ${limit.unit}.`;
    }
  }
  return errors;
}

export function isValidConfiguration(config) {
  return Object.keys(validateConfiguration(config)).length === 0;
}
