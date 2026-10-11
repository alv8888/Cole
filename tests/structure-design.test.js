import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT,
  clone,
  validate,
  MATERIALS,
} from "../src/structure/design/data.js";
import { beam, axial, factor } from "../src/structure/design/fem.js";
import { analyzeDesign, criterion } from "../src/structure/design/model.js";
import {
  profile,
  rocketSection,
  structuralMass,
  discretize,
} from "../src/structure/design/geometry.js";
import { applyMass, importDesign } from "../src/integration/bridge.js";
import { PROFILES } from "../src/engineering/profiles.js";
import { DEFAULT as LAUNCH } from "../src/rocket/model.js";
const near = (a, b, r = 1e-6) =>
    assert.ok(Math.abs(a - b) <= r * Math.max(1, Math.abs(b)), `${a} != ${b}`),
  sections = (n = 16) =>
    Array.from({ length: n }, () => ({
      length: 3 / n,
      I: (0.08 * 0.12 ** 3) / 12,
      A: 0.08 * 0.12,
      c: 0.06,
    }));
test("FEM beam: closed uniform-load deflection, root stress, equilibrium and Euler K=2", () => {
  const E = 71.7e9,
    F = 5000,
    I = sections()[0].I,
    c = 0.06,
    b = beam(sections(), E, F);
  near(b.tip, (F * 3 ** 3) / (8 * E * I), 1e-10);
  near(b.points[0].stress, (((F * 3) / 2) * c) / I, 1e-8);
  near(b.critical, (Math.PI ** 2 * E * I) / (2 * 3) ** 2, 2e-6);
  assert.ok(b.residual < 1e-8);
  assert.equal(b.points.at(-1).stress, 0);
});
test("Axial bar: PL/EA and signed stress, free and blocked thermal expansion", () => {
  const s = sections(),
    E = 70e9,
    P = -1000,
    a = axial(s, E, P),
    alpha = 23e-6,
    DT = 40;
  near(a.tip, (P * 3) / (E * s[0].A), 1e-12);
  a.stresses.forEach((v) => near(v, P / s[0].A));
  const free = axial(s, E, 0, alpha, DT),
    blocked = axial(s, E, 0, alpha, DT, true);
  near(free.tip, alpha * DT * 3, 1e-12);
  near(blocked.tip, 0);
  blocked.stresses.forEach((v) => near(v, -E * alpha * DT));
  assert.ok(a.residual < 1e-10);
});
test("Cylinder pressure: membrane stresses, Von Mises and Poisson axial displacement", () => {
  const c = clone(DEFAULT);
  c.object = "rocket";
  c.load = "pressure";
  c.rocket.sections = [{ length: 4, diameter: 0.6, thickness: 0.003 }];
  const r = analyzeDesign(c),
    m = r.material,
    h = (c.pressure * 0.2985) / 0.003;
  near(r.points[0].hoop, h);
  near(r.points[0].axial, h / 2);
  near(r.maximum, (Math.sqrt(3) / 2) * h);
  near(r.displacement, ((h / 2 - m.nu * h) / m.E) * 4, 1e-12);
  assert.ok(r.residual < 1e-9);
});
test("Sphere pressure and constrained thermal: independent biaxial formulas", () => {
  const c = clone(DEFAULT);
  c.object = "sphere";
  c.load = "pressure";
  const r = analyzeDesign(c),
    m = r.material,
    stress = c.pressure / (2 * c.sphere.thickness);
  near(r.maximum, stress);
  near(r.displacement, ((1 - m.nu) * stress) / m.E, 1e-12);
  c.load = "thermal";
  c.restraint = "fixed";
  const t = analyzeDesign(c);
  near(t.maximum, (m.E * m.alpha * c.deltaT) / (1 - m.nu));
  assert.equal(t.displacement, 0);
});
test("Orthotropic UD: distinct directional strengths, no Von Mises, no spherical solution", () => {
  const m = MATERIALS.carbon;
  assert.equal(criterion(m, 100e6, 10e6).equivalent, null);
  near(criterion(m, 0, 40e6).index, 1);
  near(criterion(m, -900e6).index, 1);
  const c = clone(DEFAULT);
  c.material = "carbon";
  c.object = "sphere";
  c.load = "pressure";
  const r = analyzeDesign(c);
  assert.equal(r.maximum, null);
  assert.equal(r.points.length, 0);
  assert.ok(r.mass > 0);
  assert.match(r.warnings.join(" "), /orientación/);
});
test("Zero loading is finite and buckling is not reported as global certification", () => {
  const c = clone(DEFAULT);
  c.force = 0;
  const r = analyzeDesign(c);
  assert.equal(r.index, 0);
  assert.equal(r.safety, null);
  assert.equal(r.displacement, 0);
  c.object = "rocket";
  c.load = "compression";
  const b = analyzeDesign(c);
  assert.ok(b.critical > 0);
  assert.match(b.warnings.join(" "), /pandeo local/);
});
test("NACA geometry closes, annular mass is independent and section boundaries are resolved", () => {
  const c = clone(DEFAULT),
    p = profile(c.wing, 2);
  assert.ok(p.every((q) => q.every(Number.isFinite)));
  assert.ok(Math.abs(p[64][1]) < 1e-14);
  const s = c.rocket.sections[0],
    a = rocketSection(s);
  near(
    a.A,
    (Math.PI / 4) * (s.diameter ** 2 - (s.diameter - 2 * s.thickness) ** 2),
    1e-12,
  );
  c.object = "rocket";
  const mass = structuralMass(c, MATERIALS.aluminum);
  near(mass.cylinders, a.A * 5 * MATERIALS.aluminum.rho, 1e-10);
  assert.equal(discretize(c).length, 17);
});
test("Tapered wing refinement 8/16/32 converges in deflection; no claim of 3D accuracy", () => {
  const c = clone(DEFAULT),
    values = [8, 16, 32].map((n) => {
      c.elements = n;
      return analyzeDesign(c).displacement;
    });
  assert.ok(Math.abs(values[2] - values[1]) < Math.abs(values[1] - values[0]));
  assert.ok(Math.abs(values[2] - values[1]) / values[2] < 0.01);
});
test("Invalid inputs, incompatible loads, thick shells and singular systems are rejected", () => {
  for (const edit of [
    (c) => (c.force = NaN),
    (c) => (c.elements = 4.5),
    (c) => (c.load = "pressure"),
    (c) => (c.wing.thickness = 0.02),
    (c) => (c.sphere.thickness = 0.2),
    (c) => (c.rocket.sections = []),
  ]) {
    const c = clone(DEFAULT);
    edit(c);
    assert.throws(() => validate(c));
  }
  assert.throws(() =>
    factor([
      [1, 1],
      [1, 1],
    ]),
  );
});
const defaults = (kind) => ({
  ...Object.fromEntries(PROFILES[kind].fields.map((f) => [f.key, f.value])),
  ...(kind === "aircraft" ? { dragMode: "polar" } : {}),
});
test("Aircraft bridge imports actual dimensions/lift and retains undefined profile geometry", () => {
  const s = defaults("aircraft"),
    c = clone(DEFAULT),
    r = importDesign("aircraft", s, c),
    a = PROFILES.aircraft.compute(s);
  near(r.configuration.force, a.lift);
  near(r.configuration.wing.root, a.rootChord);
  assert.equal(r.configuration.wing.sweep, c.wing.sweep);
  assert.match(r.note, /conservados/);
});
test("Rocket imports declared geometric partition; multistage preserves absent dimensions", () => {
  const c = clone(DEFAULT),
    s = defaults("rocket"),
    r = importDesign("calculator", s, c);
  near(r.configuration.rocket.nose, s.length * 0.2);
  near(r.configuration.force, PROFILES.rocket.compute(s).appliedThrust);
  const l = importDesign("launch", LAUNCH, c);
  assert.deepEqual(l.configuration.rocket, c.rocket);
  near(l.configuration.force, LAUNCH.stages[0].thrust);
});
test("Mass transfer adds to current value, alters only target mass, and rejects invalid proposals", () => {
  const c = defaults("aircraft"),
    original = clone(c),
    p = { version: 1, mass: 100, mode: "add", stage: 0 },
    r = applyMass("aircraft", c, p);
  near(r.after, c.mass + 100);
  assert.deepEqual(c, original);
  const expected = clone(c);
  expected.mass += 100;
  assert.deepEqual(r.configuration, expected);
  near(applyMass("aircraft", { ...c, mass: 2500 }, p).after, 2600);
  near(applyMass("aircraft", c, { ...p, mode: "replace" }).after, 100);
  assert.throws(() => applyMass("aircraft", c, { ...p, mass: NaN }));
  assert.throws(() => applyMass("launch", LAUNCH, { ...p, stage: 10 }));
  assert.throws(() => applyMass("aircraft", c, { ...p, mass: 1e12 }));
});

test("Design persistence is isolated, rejects corrupted records and clones decoded state", async () => {
  const { saveDesign, loadDesign, STORAGE_KEY, decodeDesignRecord } =
    await import("../src/structure/design/storage.js");
  const records = new Map([["aerolab.structure.v1", "unchanged"]]),
    storage = {
      getItem: (k) => records.get(k),
      setItem: (k, v) => records.set(k, v),
    },
    state = {
      configuration: clone(DEFAULT),
      magnification: 20,
      fraction: 100,
      mesh: true,
      nodes: true,
    };
  saveDesign(state, storage);
  const loaded = loadDesign(storage);
  assert.deepEqual(loaded, state);
  loaded.configuration.force = 0;
  assert.equal(loadDesign(storage).configuration.force, 14700);
  assert.equal(records.get("aerolab.structure.v1"), "unchanged");
  assert.throws(() => decodeDesignRecord({ version: 1, state }));
  records.set(STORAGE_KEY, "{}");
  assert.throws(() => loadDesign(storage));
  assert.throws(() => saveDesign({ ...state, fraction: 101 }, storage));
});
