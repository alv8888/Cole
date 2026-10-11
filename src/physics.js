/** Circular two-body orbit, negligible satellite mass, SI inputs and outputs.
 * No integration: double-precision evaluation of the analytic solution.
 */
export function circularOrbit({ mu, radius, altitude }) {
  for (const [key, value] of Object.entries({ mu, radius, altitude })) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${key} debe ser finito y positivo (SI).`);
    }
  }
  const r = radius + altitude;
  const velocity = Math.sqrt(mu / r);
  const angularVelocity = velocity / r;
  const period = 2 * Math.PI / angularVelocity;
  const acceleration = mu / r / r;
  const specificEnergy = -mu / (2 * r);
  const result = { r, velocity, angularVelocity, period, acceleration, specificEnergy };
  if (Object.values(result).some(value => !Number.isFinite(value)) || period <= 0 || velocity <= 0 || acceleration <= 0) {
    throw new RangeError('Los parámetros exceden el rango numérico del modelo.');
  }
  return Object.freeze(result);
}

export function positionAtPhase(r, phase) {
  if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(phase)) throw new RangeError('Radio o fase inválidos.');
  return { x: r * Math.cos(phase), y: r * Math.sin(phase) };
}

export function percentageDifference(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) throw new RangeError('Referencia inválida.');
  return (b / a - 1) * 100;
}
