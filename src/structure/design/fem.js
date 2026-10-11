/** Dense scaled-pivot LU for small 1D FEM systems. No DOM/renderer dependencies. */
export function factor(A) {
  const a = A.map((row) => row.slice()),
    n = a.length,
    p = Array.from({ length: n }, (_, i) => i),
    scale = a.map((row) => Math.max(...row.map(Math.abs)));
  for (let k = 0; k < n; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++)
      if (
        Math.abs(a[i][k]) / (scale[i] || 1) >
        Math.abs(a[pivot][k]) / (scale[pivot] || 1)
      )
        pivot = i;
    if (Math.abs(a[pivot][k]) / (scale[pivot] || 1) < 1e-14)
      throw new Error(
        "Sistema singular o mal condicionado: revisa apoyos y geometría.",
      );
    [a[k], a[pivot]] = [a[pivot], a[k]];
    [scale[k], scale[pivot]] = [scale[pivot], scale[k]];
    [p[k], p[pivot]] = [p[pivot], p[k]];
    for (let i = k + 1; i < n; i++) {
      a[i][k] /= a[k][k];
      for (let j = k + 1; j < n; j++) a[i][j] -= a[i][k] * a[k][j];
    }
  }
  return (b) => {
    const x = p.map((i) => b[i]);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < i; j++) x[i] -= a[i][j] * x[j];
    for (let i = n - 1; i >= 0; i--) {
      for (let j = i + 1; j < n; j++) x[i] -= a[i][j] * x[j];
      x[i] /= a[i][i];
    }
    if (!x.every(Number.isFinite))
      throw new Error("Solución numérica no finita.");
    return x;
  };
}
const zeros = (n) => Array.from({ length: n }, () => Array(n).fill(0));
export function beam(sections, E, totalLoad) {
  const n = sections.length,
    nd = 2 * (n + 1),
    K = zeros(nd),
    G = zeros(nd),
    f = Array(nd).fill(0);
  sections.forEach((s, i) => {
    const l = s.length,
      k = (E * s.I) / l ** 3,
      q = totalLoad / sections.reduce((a, b) => a + b.length, 0),
      ids = [2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 3];
    const ke = [
      [12, 6 * l, -12, 6 * l],
      [6 * l, 4 * l * l, -6 * l, 2 * l * l],
      [-12, -6 * l, 12, -6 * l],
      [6 * l, 2 * l * l, -6 * l, 4 * l * l],
    ];
    const ge = [
      [36, 3 * l, -36, 3 * l],
      [3 * l, 4 * l * l, -3 * l, -l * l],
      [-36, -3 * l, 36, -3 * l],
      [3 * l, -l * l, -3 * l, 4 * l * l],
    ];
    const fe = [(q * l) / 2, (q * l * l) / 12, (q * l) / 2, (-q * l * l) / 12];
    ids.forEach((row, a) => {
      f[row] += fe[a];
      ids.forEach((col, b) => {
        K[row][col] += k * ke[a][b];
        G[row][col] += ge[a][b] / (30 * l);
      });
    });
  });
  const free = Array.from({ length: nd - 2 }, (_, i) => i + 2),
    Kr = free.map((i) => free.map((j) => K[i][j])),
    solve = factor(Kr),
    v = [0, 0, ...solve(f.slice(2))];
  // Largest eigenvalue of K^-1 G => smallest positive buckling load.
  let x = free.map((_, i) => Math.sin(((i + 1) / (free.length + 1)) * Math.PI)),
    previous = 0,
    lambda = 0,
    converged = false;
  for (let iteration = 0; iteration < 120; iteration++) {
    const gx = free.map((i) =>
        free.reduce((sum, j, b) => sum + G[i][j] * x[b], 0),
      ),
      y = solve(gx),
      norm = Math.hypot(...y);
    if (!norm) break;
    x = y.map((z) => z / norm);
    lambda = norm;
    if (Math.abs(lambda - previous) <= lambda * 1e-9) {
      converged = true;
      break;
    }
    previous = lambda;
  }
  const critical = converged ? 1 / lambda : null;
  const q = totalLoad / sections.reduce((a, s) => a + s.length, 0);
  const points = sections.map((s, i) => {
    const l = s.length,
      curvature =
        (-6 / l ** 2) * v[2 * i] -
        (4 / l) * v[2 * i + 1] +
        (6 / l ** 2) * v[2 * i + 2] -
        (2 / l) * v[2 * i + 3];
    return {
      position: sections.slice(0, i).reduce((a, b) => a + b.length, 0),
      displacement: v[2 * i],
      stress: Math.abs(E * curvature + (q * l * l) / (12 * s.I)) * s.c,
      A: s.A,
      I: s.I,
    };
  });
  points.push({
    ...points.at(-1),
    position: sections.reduce((a, b) => a + b.length, 0),
    displacement: v[2 * n],
    stress: 0,
  });
  return {
    displacements: v,
    points,
    critical,
    converged,
    tip: v[2 * n],
    residual:
      Math.max(
        ...free.map((i) =>
          Math.abs(K[i].reduce((sum, k, j) => sum + k * v[j], 0) - f[i]),
        ),
      ) / Math.max(1, ...f.map(Math.abs)),
  };
}
export function axial(
  sections,
  E,
  endForce,
  alpha = 0,
  deltaT = 0,
  fixed = false,
  elementForces = null,
  eigenstrains = null,
) {
  const n = sections.length,
    K = zeros(n + 1),
    f = Array(n + 1).fill(0);
  f[n] = endForce;
  sections.forEach((s, i) => {
    const k = (E * s.A) / s.length;
    K[i][i] += k;
    K[i + 1][i + 1] += k;
    K[i][i + 1] -= k;
    K[i + 1][i] -= k;
    const thermal =
      E * s.A * (eigenstrains?.[i] ?? alpha * deltaT) +
      (elementForces?.[i] ?? 0);
    f[i] -= thermal;
    f[i + 1] += thermal;
  });
  const free = Array.from({ length: fixed ? n - 1 : n }, (_, i) => i + 1),
    solve = factor(free.map((i) => free.map((j) => K[i][j]))),
    u = Array(n + 1).fill(0);
  solve(free.map((i) => f[i])).forEach((v, i) => (u[free[i]] = v));
  const stresses = sections.map(
    (s, i) =>
      E *
      ((u[i + 1] - u[i]) / s.length - (eigenstrains?.[i] ?? alpha * deltaT)),
  );
  const residual =
    Math.max(
      0,
      ...free.map((i) =>
        Math.abs(K[i].reduce((sum, k, j) => sum + k * u[j], 0) - f[i]),
      ),
    ) / Math.max(1, ...f.map(Math.abs));
  return { u, stresses, tip: u[n], residual };
}
