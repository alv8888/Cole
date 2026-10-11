// GM: JPL Solar System Dynamics, Astrodynamic Parameters (DE440).
// Mean radii: NASA planetary fact sheets. Rounded spherical approximation.
export const BODIES = Object.freeze({
  earth: Object.freeze({ name: 'Tierra', mu: 398600.435507, radius: 6371, color: '#74bfdf' }),
  moon: Object.freeze({ name: 'Luna', mu: 4902.800118, radius: 1737.4, color: '#b2b8c6' }),
  mars: Object.freeze({ name: 'Marte', mu: 42828.375816, radius: 3389.5, color: '#dba18b' }),
});
export const DEFAULTS = Object.freeze([
  Object.freeze({ body: 'earth', mu: BODIES.earth.mu, radius: BODIES.earth.radius, altitude: 400, eccentricity: 0 }),
  Object.freeze({ body: 'earth', mu: BODIES.earth.mu, radius: BODIES.earth.radius, altitude: 1000, eccentricity: 0 }),
]);
