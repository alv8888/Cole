import { isValidConfiguration } from './validation.js';

export const MAX_IMPORT_BYTES = 16384;

function clean(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Configuración ausente o inválida.');
  const { body, mu, radius, altitude, eccentricity } = config;
  return { body, mu, radius, altitude, eccentricity };
}

export function serializeConfigurations(configurations) {
  if (!Array.isArray(configurations) || configurations.length !== 2 || !configurations.every(isValidConfiguration)) {
    throw new Error('Corrige los parámetros antes de guardar o exportar.');
  }
  return JSON.stringify({ version: 2, configurations: configurations.map(clean) }, null, 2);
}

export function parseConfigurations(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES) {
    throw new Error('El archivo de configuración debe ser texto JSON de hasta 16 KiB.');
  }
  let saved;
  try { saved = JSON.parse(raw); }
  catch { throw new Error('El archivo no contiene JSON válido.'); }
  if (![1, 2].includes(saved?.version) || !Array.isArray(saved.configurations) || saved.configurations.length !== 2) {
    throw new Error('Se requieren dos configuraciones y una versión admitida (1 o 2).');
  }
  const configs = saved.configurations.map(config => {
    const result = clean(config);
    if (saved.version === 1) result.eccentricity = 0;
    return result;
  });
  if (!configs.every(isValidConfiguration)) throw new Error('Los parámetros del archivo son inválidos. No se han aplicado.');
  return configs;
}
