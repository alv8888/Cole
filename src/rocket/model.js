/** Vertical educational flight in vacuum. SI throughout; no vehicle design data. */
export const BODIES = Object.freeze({
  earth: { name: 'Tierra', mu: 3.98600435507e14, radius: 6371000 },
  moon: { name: 'Luna', mu: 4.902800118e12, radius: 1737400 },
});
export const DEFAULT = { body: 'earth', payload: 100, horizon: 1800, stages: [
  { dry: 300, propellant: 2000, thrust: 60000, duration: 100 },
  { dry: 100, propellant: 600, thrust: 15000, duration: 100 },
] };
export const clone = value => JSON.parse(JSON.stringify(value));
function range(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${label}: introduce un número entre ${min} y ${max}.`);
}
export function validate(c) {
  if (!c || !BODIES[c.body]) throw new RangeError('Cuerpo central inválido.');
  range(c.payload, 1, 100000, 'Carga útil (kg)');
  range(c.horizon, 60, 7200, 'Duración máxima (s)');
  if (!Array.isArray(c.stages) || c.stages.length < 1 || c.stages.length > 4) throw new RangeError('Se requieren entre 1 y 4 etapas.');
  c.stages.forEach((s, i) => {
    if (!s) throw new RangeError('Etapa incompleta.');
    range(s.dry, 1, 100000, `Etapa ${i + 1}: masa seca (kg)`);
    range(s.propellant, 1, 1000000, `Etapa ${i + 1}: propelente (kg)`);
    range(s.thrust, 1, 10000000, `Etapa ${i + 1}: empuje (N)`);
    range(s.duration, 1, 600, `Etapa ${i + 1}: duración (s)`);
    range(s.thrust * s.duration / s.propellant, 1, 50000, `Etapa ${i + 1}: escape efectivo derivado (m/s)`);
  });
  return c;
}
export function budget(config) {
  const c = validate(config);
  let mass = c.payload + c.stages.reduce((sum, s) => sum + s.dry + s.propellant, 0);
  const initialMass = mass;
  const stages = c.stages.map((s, index) => {
    const before = mass, after = before - s.propellant, flow = s.propellant / s.duration;
    const exhaust = s.thrust / flow, deltaV = exhaust * Math.log1p(s.propellant / after);
    const dropped = index < c.stages.length - 1 ? s.dry : 0;
    mass = after - dropped;
    return { before, after, dropped, flow, exhaust, deltaV };
  });
  return { initialMass, finalMass: mass, deltaV: stages.reduce((sum, s) => sum + s.deltaV, 0), stages };
}
// RK4 uses the continuously decreasing mass at all four substeps.
function rk4(h, v, mass, flow, thrust, body, dt) {
  const acceleration = (height, elapsed) => thrust / (mass - flow * elapsed) - body.mu / (body.radius + height) ** 2;
  const a = acceleration(h, 0);
  const vh = v + a * dt / 2, b = acceleration(h + v * dt / 2, dt / 2);
  const vc = v + b * dt / 2, d = acceleration(h + vh * dt / 2, dt / 2);
  const ve = v + d * dt, e = acceleration(h + vc * dt, dt);
  return { h: h + dt * (v + 2 * vh + 2 * vc + ve) / 6, v: v + dt * (a + 2 * b + 2 * d + e) / 6 };
}
export function simulate(config, options = {}) {
  const c = clone(validate(config)), summary = budget(c), body = BODIES[c.body];
  const step = options.step ?? 0.1;
  range(step, 0.01, 0.5, 'Paso de integración (s)');
  let t = 0, h = 0, v = 0, mass = summary.initialMass, stage = 0, elapsed = 0, airborne = false;
  const events = [], samples = [];
  const record = () => samples.push({ t, h, v, mass, stage, energy: v * v / 2 - body.mu / (body.radius + h), escapeSpeed: Math.sqrt(2 * body.mu / (body.radius + h)) });
  let outcome = 'horizon';
  record();
  while (t < c.horizon - 1e-9) {
    const engine = c.stages[stage], flow = engine ? summary.stages[stage].flow : 0, thrust = engine?.thrust ?? 0;
    let dt = Math.min(step, c.horizon - t, engine ? engine.duration - elapsed : Infinity);
    // Pad supports the vehicle until T exceeds local weight. Burning continues.
    const gSurface = body.mu / body.radius ** 2;
    if (!airborne && engine && thrust > mass * gSurface) {
      airborne = true; events.push({ t, type: 'liftoff', stage });
    }
    if (!airborne && engine && thrust <= mass * gSurface) {
      const crossing = (mass - thrust / gSurface) / flow;
      if (crossing > 1e-9 && crossing < dt) dt = crossing;
    }
    const previous = { t, h, v, mass };
    if (airborne) {
      const next = rk4(h, v, mass, flow, thrust, body, dt);
      if (next.h < 0 && next.v < 0) {
        let low = 0, high = dt;
        for (let i = 0; i < 35; i++) {
          const mid = (low + high) / 2;
          if (rk4(h, v, mass, flow, thrust, body, mid).h >= 0) low = mid; else high = mid;
        }
        dt = (low + high) / 2;
        v = rk4(h, v, mass, flow, thrust, body, dt).v; h = 0;
        t += dt; mass -= flow * dt;
        events.push({ t, type: 'impact', stage }); outcome = 'impact'; record(); break;
      }
      h = next.h; v = next.v;
    }
    t += dt; mass -= flow * dt; elapsed += dt;
    // Roundoff at the pad boundary must not stall the integrator.
    if (!airborne && engine && thrust >= mass * gSurface && elapsed < engine.duration - 1e-8) {
      airborne = true; events.push({ t, type: 'liftoff', stage });
    }
    if (engine && elapsed >= engine.duration - 1e-8) {
      mass = summary.stages[stage].after;
      events.push({ t, type: 'burnout', stage });
      if (stage < c.stages.length - 1) {
        mass -= engine.dry; events.push({ t, type: 'separation', stage });
      }
      stage++; elapsed = 0;
    }
    if (previous.v > 0 && v <= 0) events.push({ t, type: 'apogee', stage });
    record();
    if (stage === c.stages.length) {
      if (!airborne) { outcome = 'pad'; break; }
      const energy = samples.at(-1).energy;
      // Marginal escape is deliberately unresolved within a numerical deadband.
      if (v > 0 && energy > body.mu / body.radius * 1e-7) { outcome = 'escape'; break; }
    }
  }
  const final = samples.at(-1);
  if (outcome === 'horizon' && stage === c.stages.length && final.energy < -body.mu / body.radius * 1e-7) outcome = 'bound';
  return { config: c, summary, samples, events, outcome, maxHeight: samples.reduce((max, sample) => Math.max(max, sample.h), 0), final };
}
