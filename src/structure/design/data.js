export const MATERIALS = {
  aluminum: {
    name: "Aluminio 7075-T6",
    E: 71.7e9,
    E2: 71.7e9,
    nu: 0.33,
    rho: 2810,
    alpha: 23.6e-6,
    alpha2: 23.6e-6,
    Xt: 503e6,
    Xc: 503e6,
    Yt: 503e6,
    Yc: 503e6,
    metal: true,
    note: "Ejemplo típico orientativo; no mínimo garantizado por producto o lote.",
  },
  carbon: {
    name: "Carbono unidireccional · ejemplo hipotético",
    E: 135e9,
    E2: 10e9,
    nu: 0.3,
    rho: 1600,
    alpha: -0.2e-6,
    alpha2: 30e-6,
    Xt: 1500e6,
    Xc: 900e6,
    Yt: 40e6,
    Yc: 150e6,
    metal: false,
    note: "Datos supuestos de una lámina UD; fibras alineadas con el eje de la viga/tubo. Sin laminados, delaminación ni interacción de fallo.",
  },
  titanium: {
    name: "Titanio Ti-6Al-4V",
    E: 114e9,
    E2: 114e9,
    nu: 0.34,
    rho: 4430,
    alpha: 8.6e-6,
    alpha2: 8.6e-6,
    Xt: 830e6,
    Xc: 830e6,
    Yt: 830e6,
    Yc: 830e6,
    metal: true,
    note: "Ejemplo orientativo; condición de producto y temperatura sin certificar.",
  },
  steel: {
    name: "Acero inoxidable 301 · recocido orientativo",
    E: 193e9,
    E2: 193e9,
    nu: 0.29,
    rho: 8030,
    alpha: 16.9e-6,
    alpha2: 16.9e-6,
    Xt: 205e6,
    Xc: 205e6,
    Yt: 205e6,
    Yc: 205e6,
    metal: true,
    note: "Ejemplo recocido; no representa 301 endurecido por trabajo en frío.",
  },
};
export const DEFAULT = {
  object: "aircraft",
  material: "aluminum",
  elements: 16,
  load: "lift",
  force: 14700,
  pressure: 100000,
  deltaT: 40,
  restraint: "free",
  wing: {
    span: 10,
    root: 2,
    tip: 1.2,
    sweep: 15,
    dihedral: 5,
    ratio: 0.12,
    camber: 0.02,
    camberPosition: 0.4,
    thickness: 0.002,
  },
  fuselage: { length: 8, diameter: 1.2, thickness: 0.002 },
  rocket: {
    nose: 1.2,
    noseType: "cone",
    finCount: 3,
    finChord: 0.8,
    finHeight: 0.3,
    finThickness: 0.008,
    sections: [
      { length: 3, diameter: 0.6, thickness: 0.003 },
      { length: 2, diameter: 0.6, thickness: 0.003 },
    ],
  },
  sphere: { radius: 1, thickness: 0.003 },
};
export const clone = (value) => JSON.parse(JSON.stringify(value));
export function range(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new Error(`${label}: ${min}–${max}.`);
}
export function validate(c, { activeOnly = false } = {}) {
  if (
    !c ||
    !["aircraft", "rocket", "sphere"].includes(c.object) ||
    !Object.hasOwn(MATERIALS, c.material)
  )
    throw new Error("Objeto/material inválido.");
  range(c.elements, 4, 48, "Elementos");
  if (!Number.isInteger(c.elements))
    throw new Error("El número de elementos debe ser entero.");
  const allowed =
    c.object === "aircraft"
      ? ["lift", "thermal"]
      : c.object === "rocket"
        ? ["compression", "pressure", "thermal"]
        : ["pressure", "thermal"];
  if (!allowed.includes(c.load) || !["free", "fixed"].includes(c.restraint))
    throw new Error("Caso de carga o restricción incompatible.");
  range(c.force, 0, 1e7, "Fuerza (N)");
  range(c.pressure, 0, 1e7, "Presión diferencial (Pa)");
  range(c.deltaT, -150, 150, "ΔT (K)");
  const w = c.wing,
    f = c.fuselage,
    r = c.rocket,
    s = c.sphere;
  if (!w || !f || !r || !s) throw new Error("Geometría incompleta.");
  if (!activeOnly || c.object === "aircraft") {
    for (const [key, min, max] of [
      ["span", 2, 40],
      ["root", 0.2, 6],
      ["tip", 0.2, 6],
      ["sweep", -30, 45],
      ["dihedral", -10, 20],
      ["ratio", 0.06, 0.25],
      ["camber", 0, 0.08],
      ["camberPosition", 0.1, 0.8],
      ["thickness", 0.0001, 0.02],
    ])
      range(w[key], min, max, `Ala ${key}`);
    if (w.thickness > Math.min(w.root, w.tip) * w.ratio * 0.05)
      throw new Error(
        "Pared alar demasiado gruesa para el modelo de sección delgada: t ≤ 5 % de la altura mínima.",
      );
    for (const [key, min, max] of [
      ["length", 1, 30],
      ["diameter", 0.2, 5],
      ["thickness", 0.0001, 0.03],
    ])
      range(f[key], min, max, `Fuselaje ${key}`);
  }
  if (!activeOnly || c.object === "rocket") {
    range(r.nose, 0.1, 5, "Longitud de ojiva");
    if (!["cone", "ellipsoid"].includes(r.noseType))
      throw new Error("Tipo de ojiva inválido.");
    range(r.finCount, 0, 6, "Número de aletas");
    if (!Number.isInteger(r.finCount))
      throw new Error("Número de aletas entero requerido.");
    range(r.finChord, 0.1, 3, "Cuerda de aleta");
    range(r.finHeight, 0.05, 2, "Altura de aleta");
    range(r.finThickness, 0.001, 0.05, "Espesor de aleta");
    if (
      !Array.isArray(r.sections) ||
      r.sections.length < 1 ||
      r.sections.length > 4
    )
      throw new Error("Se requieren 1–4 secciones cilíndricas.");
    for (const section of r.sections) {
      range(section.length, 0.2, 15, "Longitud de sección");
      range(section.diameter, 0.1, 5, "Diámetro de sección");
      range(section.thickness, 0.0001, 0.03, "Pared de sección");
      if (section.thickness > section.diameter / 40)
        throw new Error(
          "Pared tubular: t/D ≤ 1/40 para presión de pared delgada.",
        );
    }
  }
  if (!activeOnly || c.object === "sphere") {
    range(s.radius, 0.1, 5, "Radio de esfera");
    range(s.thickness, 0.0001, 0.03, "Espesor de esfera");
    if (s.thickness > s.radius / 20)
      throw new Error("Esfera delgada: t/R ≤ 1/20.");
  }
  return clone(c);
}

export function validateSettings(s) {
  range(s.magnification, 1, 200, "Amplificación");
  range(s.fraction, 0, 100, "Fracción");
  if (typeof s.mesh !== "boolean" || typeof s.nodes !== "boolean")
    throw new Error("Opciones de malla inválidas.");
}
export function validateDesignState(s) {
  if (!s || typeof s !== "object") throw new Error("Diseño incompleto.");
  validate(s.configuration);
  validateSettings(s);
}
