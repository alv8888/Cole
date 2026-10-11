import { encodeLink } from '../navigation/share.js';

/** Narrow educational ranges; each experiment varies one quantity, holding the rest fixed. */
export const EXPERIMENTS = Object.freeze({
  space: { label: 'Altitud circular', unit: 'km', min: 100, max: 2000, step: 25, value: 400, metric: 1, y: 'Periodo', yUnit: 'min', question: '¿Una órbita más alta tarda más en completar una vuelta?' },
  aircraft: { label: 'Velocidad respecto al suelo', unit: 'm/s', min: 30, max: 90, step: 1, value: 50, metric: 0, y: 'Sustentación', yUnit: 'N', question: '¿Duplicar la velocidad duplica la sustentación?' },
  rocket: { label: 'Masa de propelente', unit: 'kg', min: 100, max: 600, step: 10, value: 200, metric: 0, y: 'Δv ideal', yUnit: 'm/s', question: 'Con empuje y duración fijos, ¿qué cambia al aumentar el propelente?' },
  structure: { label: 'Espesor de pared alar', unit: 'mm', min: 1, max: 4, step: .1, value: 2, metric: 2, y: 'Deflexión de punta', yUnit: 'mm', question: '¿Qué se gana y cuánto pesa aumentar el espesor?' },
});
export function experimentValue(id, value = EXPERIMENTS[id]?.value) {
  const definition = EXPERIMENTS[id];
  if (!definition || !Number.isFinite(value) || value < definition.min || value > definition.max) throw new Error('Parámetro del experimento fuera de límites.');
  return value;
}

/** Use the already versioned URL adapters; never write localStorage to transfer a case. */
export async function experimentLink(id, result, base) {
  if (id === 'space') throw new Error('Space se aplica explícitamente a A dentro de la misma página.');
  const view = { configuration: result.configuration, reference: null, yaw: 30, pitch: 20 };
  if (id === 'aircraft') return encodeLink(new URL('aircraft.html#engineering-form', base).href, id, { aircraft: view });
  if (id === 'rocket') {
    const { DEFAULT } = await import('../rocket/model.js');
    return encodeLink(new URL('rocket.html#engineering-form', base).href, id, { calculator: view, launch: { configuration: structuredClone(DEFAULT), calculated: false, clock: 0, speed: '60' } });
  }
  if (id === 'structure') {
    const { DEFAULT } = await import('../structure/materials.js');
    return encodeLink(new URL('structure.html#design-geometry-fields', base).href, id, {
      structure: { configuration: { ...DEFAULT }, reference: null, amplify: true },
      design: { configuration: result.configuration, magnification: 10, fraction: 100, mesh: true, nodes: true, display: 'field' },
    });
  }
  throw new Error('Laboratorio desconocido.');
}
