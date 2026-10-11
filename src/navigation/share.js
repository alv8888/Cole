/** Versioned URL transport. Model-specific validators run before any UI changes. */
export const MAX_LINK_LENGTH = 24000;
const keys = ['lab', 'v', 'sim'];
export function encodeLink(base, lab, state) {
  const url = new URL(base);
  const json = JSON.stringify(state, (_, value) => {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Corrige las entradas antes de compartir.');
    return value;
  });
  url.searchParams.set('lab', lab);
  url.searchParams.set('v', '1');
  url.searchParams.set('sim', json);
  if (url.href.length > MAX_LINK_LENGTH) throw new Error('El enlace supera el tamaño permitido.');
  return url.href;
}
export function decodeLink(base, lab) {
  const url = new URL(base);
  if (!keys.some(key => url.searchParams.has(key))) return null;
  if (url.href.length > MAX_LINK_LENGTH || keys.some(key => url.searchParams.getAll(key).length !== 1)) throw new Error('Enlace incompleto, repetido o demasiado largo.');
  if (url.searchParams.get('lab') !== lab || url.searchParams.get('v') !== '1') throw new Error('Laboratorio o versión del enlace incompatible.');
  const state = JSON.parse(url.searchParams.get('sim'));
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Estado de simulación inválido.');
  return state;
}
export function numberIn(value, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error('Valor del enlace fuera de límites.');
  return value;
}
export function choice(value, options) {
  if (!options.includes(value)) throw new Error('Opción del enlace inválida.');
  return value;
}
