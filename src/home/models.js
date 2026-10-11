import { BODIES } from '../data.js';
import { ellipticOrbit, orbitalState } from '../elliptic.js';
import { experimentValue, EXPERIMENTS } from './experiments.js';
import { kmToM, km3ToM3 } from '../units.js';
/** Same SI model as Space Lab; demonstration state is independent of saved simulations. */
export function demoOrbit(eccentricity = .35, fraction = .25) {
  if (!Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity > .75 || !Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new Error('Demostración fuera de rango.');
  const config = { body: 'earth', mu: BODIES.earth.mu, radius: BODIES.earth.radius, altitude: 400, eccentricity };
  const orbit = ellipticOrbit({ mu: km3ToM3(config.mu), radius: kmToM(config.radius), altitude: kmToM(config.altitude), eccentricity });
  return { config, orbit, state: orbitalState(orbit, orbit.period * fraction) };
}
/** Lazy preview adapters call existing models, never a second implementation of the equations. */
export async function previewModel(id, input) {
  const value = experimentValue(id, input);
  if (id === 'space') {
    const { config } = demoOrbit(0, 0); config.altitude = value;
    const orbit = ellipticOrbit({ mu: km3ToM3(config.mu), radius: kmToM(config.radius), altitude: kmToM(value), eccentricity: 0 });
    return { configuration: config, inputs: `Tierra · altitud ${value} km · e = 0`, metrics: [['Velocidad', orbit.periapsisVelocity / 1000, 'km/s'], ['Periodo', orbit.period / 60, 'min']], note: 'Órbita circular ideal de dos cuerpos. Sin perturbaciones ni maniobras.' };
  }
  if (id === 'aircraft' || id === 'rocket') {
    const { PROFILES } = await import('../engineering/profiles.js');
    const profile = PROFILES[id], config = Object.fromEntries(profile.fields.map(field => [field.key, field.value]));
    if (id === 'aircraft') { config.dragMode = 'polar'; config.groundSpeed = value; }
    else config.propellant = value;
    const r = profile.compute(config);
    return id === 'aircraft'
      ? { configuration: config, inputs: `1.200 kg · ala 16 m² · aire ${value} m/s · CL = 0,6 · ρ = 1,225 kg/m³ · sin viento`, metrics: [['Sustentación', r.lift, 'N'], ['Peso', r.weight, 'N'], ['Arrastre', r.drag, 'N']], note: `Coeficientes hipotéticos. ${Math.abs(r.liftRatio - 1) > .005 ? 'L y W no están equilibrados; ' : ''}No demuestra vuelo nivelado ni estabilidad. ${profile.warnings(config, r).join(' ')}` }
      : { configuration: config, inputs: `Masa seca 100 kg · propelente ${value} kg · empuje 6.000 N · duración 40 s`, metrics: [['Δv ideal', r.deltaV, 'm/s'], ['Escape efectivo', r.exhaustVelocity, 'm/s'], ['Masa inicial', r.initialMass, 'kg']], note: 'Ejemplo de una etapa en vacío. Δv es cambio ideal de velocidad, no altitud ni velocidad de un lanzamiento real. Aquí el flujo y la velocidad efectiva de escape cambian al variar propelente: no es un motor fijo.' };
  }
  if (id === 'structure') {
    const [{ DEFAULT }, { analyzeDesign }] = await Promise.all([import('../structure/design/data.js'), import('../structure/design/model.js')]);
    const config = structuredClone(DEFAULT); config.wing.thickness = value / 1000;
    const r = analyzeDesign(config);
    return { configuration: config, inputs: `Ala 10 m · cuerdas 2/1,2 m · espesor ${value} mm · fuselaje 8 × 1,2 m, pared 2 mm · sustentación total 14.700 N · aluminio 7075-T6`, metrics: [['Masa modelada', r.mass, 'kg'], ['Esfuerzo máximo', r.maximum / 1e6, 'MPa'], ['Desplazamiento extremo', r.displacement * 1000, 'mm']], note: `${r.model}. Masa de superficies modeladas, sin equipos. Propiedades orientativas; no es una certificación de seguridad.` };
  }
  throw new Error('Laboratorio desconocido.');
}

/** Independent scenarios, not a time history or a new numerical integrator. */
export async function experimentCurve(id) {
  const definition = EXPERIMENTS[id];
  experimentValue(id);
  const points = [];
  for (let i = 0; i <= 20; i++) {
    const x = definition.min + (definition.max - definition.min) * i / 20;
    const result = await previewModel(id, x);
    points.push({ x, y: result.metrics[definition.metric][1] });
  }
  return points;
}
