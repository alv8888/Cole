import { balanceForces } from '../aircraft/forces.js';

export const G0 = 9.80665;

function requireRanges(config, ranges) {
  for (const [key, range] of Object.entries(ranges)) {
    if (!Number.isFinite(config[key]) || config[key] < range[0] || config[key] > range[1]) {
      throw new RangeError(`${key}: valor requerido entre ${range[0]} y ${range[1]}.`);
    }
  }
}

export const AIRCRAFT_RANGES = Object.freeze({
  thrust: [0, 1000000], cdTotal: [0, 1],
  mass: [100, 100000], area: [2, 500], span: [3, 80], taper: [0.2, 1], cg: [5, 60],
  groundSpeed: [10, 120], windAlong: [-40, 40], windCross: [-40, 40], windVertical: [-10, 10],
  density: [0.1, 1.5], cl: [0, 2], clMax: [0.1, 3], cd0: [0.005, 0.2], oswald: [0.3, 1],
  beamWidth: [0.02, 0.5], beamHeight: [0.02, 0.8], modulus: [1, 250], efficiency: [0.1, 1], carbon: [0, 1500],
});
export const ROCKET_RANGES = Object.freeze({
  dryMass: [1, 100000], propellant: [1, 1000000], thrust: [1, 10000000], burnTime: [1, 1000],
  thrustPercent: [1, 100], gravity: [0, 20], burnPercent: [0, 100], diameter: [0.2, 10], length: [1, 80],
});

export function aircraft(config) {
  requireRanges(config, AIRCRAFT_RANGES);
  const c = config;
  if (!['polar', 'direct'].includes(c.dragMode)) throw new RangeError('Selecciona resistencia polar o CD total impuesto.');
  const forward = c.groundSpeed - c.windAlong;
  if (forward <= 0) throw new RangeError('La componente longitudinal relativa debe ser positiva. Reduce el viento de cola o aumenta la velocidad respecto al suelo.');
  const airSpeed = Math.hypot(forward, c.windCross, c.windVertical);
  const dynamicPressure = 0.5 * c.density * airSpeed ** 2;
  const aspectRatio = c.span ** 2 / c.area;
  const induced = c.cl ** 2 / (Math.PI * c.oswald * aspectRatio);
  const dragCoefficient = c.dragMode === 'direct' ? c.cdTotal : c.cd0 + induced;
  const lift = dynamicPressure * c.area * c.cl;
  const drag = dynamicPressure * c.area * dragCoefficient;
  const weight = c.mass * G0;
  const liftRatio = lift / weight;
  const stallSpeed = Math.sqrt(2 * weight / (c.density * c.area * c.clMax));
  const rootChord = 2 * c.area / (c.span * (1 + c.taper));
  const tipChord = rootChord * c.taper;
  const meanChord = 2 / 3 * rootChord * (1 + c.taper + c.taper ** 2) / (1 + c.taper);
  // Independent rectangular beam; uniform net aerodynamic lift, no inertial weight.
  const inertia = c.beamWidth * c.beamHeight ** 3 / 12;
  const rootMoment = lift * c.span / 8;
  const stress = rootMoment * c.beamHeight / (2 * inertia);
  const deflection = lift * c.span ** 3 / (128 * c.modulus * 1e9 * inertia);
  const power = drag * airSpeed / c.efficiency;
  const emissions = power * c.carbon / 1e6;
  const balance = balanceForces(c, { lift, drag, weight, flightAngle: Math.atan2(-c.windVertical, forward) * 180 / Math.PI });
  return Object.freeze({ airSpeed, dynamicPressure, aspectRatio, dragCoefficient, lift, drag, weight,
    thrust: c.thrust, ...balance,
    liftRatio, stallSpeed, rootChord, tipChord, meanChord, inertia, rootMoment, stress, deflection,
    power, emissions, sideslip: Math.atan2(-c.windCross, forward) * 180 / Math.PI,
    flightAngle: Math.atan2(-c.windVertical, Math.hypot(forward, c.windCross)) * 180 / Math.PI });
}

export function rocket(config) {
  const c = {...config, thrustPercent:config.thrustPercent===undefined?100:config.thrustPercent};
  requireRanges(c, ROCKET_RANGES);
  const appliedThrust=c.thrust*c.thrustPercent/100;
  const initialMass = c.dryMass + c.propellant;
  const massFlow = c.propellant / c.burnTime;
  const exhaustVelocity = appliedThrust / massFlow;
  const deltaV = exhaustVelocity * Math.log1p(c.propellant / c.dryMass);
  const time = c.burnTime * c.burnPercent / 100;
  const consumed = c.propellant * c.burnPercent / 100;
  const currentMass = initialMass - consumed;
  const currentDeltaV = exhaustVelocity * Math.log(initialMass / currentMass);
  return Object.freeze({ appliedThrust, initialMass, finalMass: c.dryMass, massFlow, exhaustVelocity,
    specificImpulse: exhaustVelocity / G0, deltaV, time, consumed, currentMass, currentDeltaV,
    thrustWeight: c.gravity === 0 ? null : appliedThrust / (initialMass * c.gravity),
    acceleration: appliedThrust / currentMass - c.gravity,
    gravityPenalty: c.gravity * time, verticalDeltaV: currentDeltaV - c.gravity * time });
}
