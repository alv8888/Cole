import { serializeConfigurations, parseConfigurations } from './configuration.js';

export const STORAGE_KEY = 'aerolab.space.circular.v1';
export function saveConfigurations(storage, configurations) {
  storage.setItem(STORAGE_KEY, serializeConfigurations(configurations));
}

export function loadConfigurations(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  return parseConfigurations(raw);
}
