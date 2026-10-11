/** Display adapter for static 1D fields. SI inputs; amplification is visual only. */
export function sampleField(points, position) {
  if (!points.length) return { displacement: 0, index: 0, axial: 0, hoop: 0 };
  let i = 0;
  while (i < points.length - 2 && points[i + 1].position < position) i++;
  const a = points[i], b = points[i + 1] ?? a;
  const fraction = Math.max(0, Math.min(1,
    (position - a.position) / (b.position - a.position || 1)));
  return Object.fromEntries(['displacement', 'index', 'axial', 'hoop'].map(key =>
    [key, a[key] + (b[key] - a[key]) * fraction]));
}

export function transverseStrain(config, material, point) {
  const thermal = config.load === 'thermal' ? material.alpha2 * config.deltaT : 0;
  // Orthotropic reciprocity: nu21/E2 = nu12/E1. No circumferential restraint.
  return thermal + point.hoop / material.E2 - material.nu * point.axial / material.E;
}

export function deformVertex(result, x, y, z, position, active, amplitude) {
  if (!active || !result.points.length) return [x, y, z];
  const c = result.config, p = sampleField(result.points, position);
  const u = p.displacement * amplitude;
  if (c.object === 'aircraft') {
    return c.load === 'lift' ? [x, y, z + u] : [x, y + Math.sign(y) * u, z];
  }
  if (c.object === 'sphere') {
    const scale = 1 + result.displacement / c.sphere.radius * amplitude;
    return [x * scale, y * scale, z * scale];
  }
  const strain = transverseStrain(c, result.material, p);
  return [x * (1 + strain * amplitude), y * (1 + strain * amplitude), z + u];
}
