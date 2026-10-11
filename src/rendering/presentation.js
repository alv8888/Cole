/** Shared display policy. Lighting is an illustration, not an astronomical Sun model. */
export function setupPresentation(THREE, renderer, scene) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  scene.add(new THREE.HemisphereLight(0xc9e5ff, 0x132337, 1.35));
  const key = new THREE.DirectionalLight(0xfff1df, 2.2);
  key.position.set(8, -6, 12);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8caeff, 1.4);
  rim.position.set(-7, 4, 3);
  scene.add(rim);
}

/** Linear interpolation in display sRGB; clamp the colour, never the physical index. */
export function fieldColor(index) {
  if (!Number.isFinite(index) || index < 0) throw new RangeError('Índice de campo inválido.');
  const anchors = [[32, 199, 173], [214, 203, 39], [233, 49, 41]];
  const value = Math.min(1, index), segment = value < .5 ? 0 : 1;
  const fraction = (value - segment * .5) * 2;
  return anchors[segment].map((v, i) => (v + (anchors[segment + 1][i] - v) * fraction) / 255);
}

/** Distance that fits a centred bounding sphere in both axes of a perspective camera. */
export function framingDistance(radius, aspect, fov = 45) {
  if (![radius, aspect, fov].every(Number.isFinite) || radius <= 0 || aspect <= 0 || fov <= 0 || fov >= 180)
    throw new RangeError('Encuadre inválido.');
  const vertical = fov * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * aspect);
  return radius / Math.sin(Math.min(vertical, horizontal)) * 1.12;
}

/** Fit all eight corners of an axis-aligned box for the chosen viewing direction. */
export function framingBoxDistance(size, aspect, direction, up = [0, 0, 1], fov = 45) {
  framingDistance(1, aspect, fov);
  if (!Array.isArray(size) || size.length !== 3 || !size.every(v => Number.isFinite(v) && v >= 0) || !size.some(v => v > 0))
    throw new RangeError('Dimensiones de encuadre inválidas.');
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normalize = v => {
    if (!Array.isArray(v) || v.length !== 3 || !v.every(Number.isFinite) || Math.hypot(...v) < 1e-12)
      throw new RangeError('Dirección de cámara inválida.');
    const length = Math.hypot(...v); return v.map(x => x / length);
  };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const forward = normalize(direction), right = normalize(cross(normalize(up), forward));
  const vertical = cross(forward, right), tangent = Math.tan(fov * Math.PI / 360);
  let distance = 0;
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const point = [x*size[0]/2, y*size[1]/2, z*size[2]/2], depth = dot(point, forward);
    distance = Math.max(distance, Math.abs(dot(point, right))/(tangent*aspect)+depth, Math.abs(dot(point, vertical))/tangent+depth);
  }
  return distance * 1.12;
}
