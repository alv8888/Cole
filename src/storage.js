import { isValidConfiguration } from './validation.js';

export const STORAGE_KEY = 'aerolab.space.circular.v1';
export function saveConfigurations(storage, configurations) {
  if (!Array.isArray(configurations) || configurations.length !== 2 || !configurations.every(isValidConfiguration)) {
    throw new Error('Corrige los parámetros antes de guardar.');
  }
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, configurations }));
}

export function loadConfigurations(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const saved = JSON.parse(raw);
  if (![1, 2].includes(saved?.version) || !Array.isArray(saved.configurations) || saved.configurations.length !== 2) {
    throw new Error('El guardado local no tiene un formato válido. No se ha aplicado.');
  }
  const configs = saved.configurations.map(({ body, mu, radius, altitude, eccentricity }) => ({
    body, mu, radius, altitude, eccentricity: saved.version === 1 ? 0 : eccentricity,
  }));
  if (!configs.every(isValidConfiguration)) throw new Error('Los parámetros guardados son inválidos. No se han aplicado.');
  return configs;
}
