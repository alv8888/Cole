/** Instantaneous forces in the longitudinal vertical plane. No trajectory integrator. */
export const BALANCE_TOLERANCE = 0.005;
export function balanceForces(config, result) {
  const thrust = config.thrust;
  if (config.windCross !== 0) return { available: false, thrust, vectors: null, netX: null, netZ: null,
    accelerationX: null, accelerationZ: null, balancedX: false, balancedZ: false };
  const angle = result.flightAngle * Math.PI / 180;
  const vectors = {
    lift: { x: -result.lift * Math.sin(angle), z: result.lift * Math.cos(angle) },
    drag: { x: -result.drag * Math.cos(angle), z: -result.drag * Math.sin(angle) },
    thrust: { x: thrust, z: 0 }, weight: { x: 0, z: -result.weight },
  };
  const netX = Object.values(vectors).reduce((sum, v) => sum + v.x, 0);
  const netZ = Object.values(vectors).reduce((sum, v) => sum + v.z, 0);
  const scaleX = Math.max(1, ...Object.values(vectors).map(v => Math.abs(v.x)));
  const scaleZ = Math.max(1, ...Object.values(vectors).map(v => Math.abs(v.z)));
  return { available: true, thrust, vectors, netX, netZ, accelerationX: netX / config.mass,
    accelerationZ: netZ / config.mass, balancedX: Math.abs(netX) <= BALANCE_TOLERANCE * scaleX,
    balancedZ: Math.abs(netZ) <= BALANCE_TOLERANCE * scaleZ };
}
