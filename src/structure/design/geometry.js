/** Four-digit NACA family with closed trailing edge; dimensional geometry in metres. */
export function profile(w, chord, count = 64) {
  const upper = [],
    lower = [];
  for (let i = 0; i <= count; i++) {
    const x = (1 - Math.cos((Math.PI * i) / count)) / 2,
      p = w.camberPosition,
      m = w.camber;
    const yc =
        x < p
          ? (m / p ** 2) * (2 * p * x - x * x)
          : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x * x),
      slope =
        x < p
          ? ((2 * m) / p ** 2) * (p - x)
          : ((2 * m) / (1 - p) ** 2) * (p - x),
      angle = Math.atan(slope),
      yt =
        5 *
        w.ratio *
        (0.2969 * Math.sqrt(x) -
          0.126 * x -
          0.3516 * x * x +
          0.2843 * x ** 3 -
          0.1036 * x ** 4);
    upper.push([
      (x - yt * Math.sin(angle)) * chord,
      (yc + yt * Math.cos(angle)) * chord,
    ]);
    lower.push([
      (x + yt * Math.sin(angle)) * chord,
      (yc - yt * Math.cos(angle)) * chord,
    ]);
  }
  return [...upper, ...lower.reverse().slice(1, -1)];
}
export function wingSection(w, chord) {
  const points = profile(w, chord),
    segments = points.map((p, i) => {
      const q = points[(i + 1) % points.length];
      return {
        length: Math.hypot(q[0] - p[0], q[1] - p[1]),
        mid: (p[1] + q[1]) / 2,
        dz: q[1] - p[1],
      };
    }),
    perimeter = segments.reduce((a, b) => a + b.length, 0),
    centroid = segments.reduce((a, b) => a + b.length * b.mid, 0) / perimeter;
  return {
    A: perimeter * w.thickness,
    I: segments.reduce(
      (a, b) =>
        a + b.length * w.thickness * ((b.mid - centroid) ** 2 + b.dz ** 2 / 12),
      0,
    ),
    c: Math.max(...points.map((p) => Math.abs(p[1] - centroid))),
    perimeter,
  };
}
export function rocketSection(s) {
  const R = s.diameter / 2,
    r = R - s.thickness;
  return {
    A: Math.PI * (R - r) * (R + r),
    I: (Math.PI / 4) * (R - r) * (R + r) * (R * R + r * r),
    c: R,
  };
}
export function discretize(c) {
  const n = c.elements;
  if (c.object === "aircraft") {
    const L = c.wing.span / 2;
    return Array.from({ length: n }, (_, i) => ({
      ...wingSection(
        c.wing,
        c.wing.root + ((c.wing.tip - c.wing.root) * (i + 0.5)) / n,
      ),
      length: L / n,
    }));
  }
  const total = c.rocket.sections.reduce((a, s) => a + s.length, 0),
    sections = [];
  // Resolve all diameter/area discontinuities; requested count is a target minimum.
  for (const s of c.rocket.sections) {
    const count = Math.max(1, Math.ceil((n * s.length) / total));
    for (let i = 0; i < count; i++)
      sections.push({
        ...rocketSection(s),
        length: s.length / count,
        diameter: s.diameter,
        thickness: s.thickness,
      });
  }
  return sections;
}
export function structuralMass(c, m) {
  if (c.object === "sphere") {
    const R = c.sphere.radius,
      t = c.sphere.thickness;
    return { shell: ((4 * Math.PI) / 3) * (R ** 3 - (R - t) ** 3) * m.rho };
  }
  if (c.object === "aircraft") {
    const n = 128,
      L = c.wing.span / 2,
      wing =
        ((Array.from(
          { length: n },
          (_, i) =>
            wingSection(
              c.wing,
              c.wing.root + ((c.wing.tip - c.wing.root) * (i + 0.5)) / n,
            ).A,
        ).reduce((a, b) => a + b, 0) *
          L) /
          n) *
        2 *
        Math.sqrt(1 + Math.tan((c.wing.dihedral * Math.PI) / 180) ** 2);
    const f = c.fuselage,
      a = f.length / 2,
      b = f.diameter / 2,
      t = f.thickness,
      body = ((4 * Math.PI) / 3) * (a * b * b - (a - t) * (b - t) ** 2);
    return { wings: wing * m.rho, fuselage: body * m.rho };
  }
  const r = c.rocket,
    cylinders = r.sections.reduce(
      (a, s) => a + rocketSection(s).A * s.length,
      0,
    ),
    R = r.sections.at(-1).diameter / 2,
    H = r.nose;
  let area = 0;
  for (let i = 0; i < 256; i++) {
    const z1 = (H * i) / 256,
      z2 = (H * (i + 1)) / 256,
      radius = (z) =>
        r.noseType === "cone"
          ? R * (1 - z / H)
          : R * Math.sqrt(Math.max(0, 1 - (z / H) ** 2)),
      a = radius(z1),
      b = radius(z2);
    area += Math.PI * (a + b) * Math.hypot(z2 - z1, b - a);
  }
  return {
    cylinders: cylinders * m.rho,
    fairing: area * r.sections.at(-1).thickness * m.rho,
    fins:
      ((r.finCount * r.finChord * r.finHeight) / 2) * r.finThickness * m.rho,
  };
}
