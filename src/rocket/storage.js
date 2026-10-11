import { validate, clone } from './model.js';
const KEY = 'aerolab.rocket.launch.v1';
export function saveLaunch(config, storage = localStorage) {
  storage.setItem(KEY, JSON.stringify({ version: 1, config: validate(config) }));
}
export function loadLaunch(storage = localStorage) {
  const raw = storage.getItem(KEY);
  if (!raw) throw new Error('No hay un diseño multietapa guardado.');
  const value = JSON.parse(raw);
  if (value.version !== 1) throw new Error('Versión de guardado incompatible.');
  return clone(validate(value.config));
}
