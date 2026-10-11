import { MATERIALS, validate } from "./data.js";
import { discretize, structuralMass } from "./geometry.js";
import { beam, axial } from "./fem.js";
export function criterion(material, axialStress, hoop = 0, bending = false) {
  if (material.metal) {
    const equivalent = Math.sqrt(
      axialStress ** 2 + hoop ** 2 - axialStress * hoop,
    );
    return { equivalent, index: equivalent / material.Xt };
  }
  const longitudinal = bending
    ? Math.min(material.Xt, material.Xc)
    : axialStress >= 0
      ? material.Xt
      : material.Xc;
  return {
    equivalent: null,
    index: Math.max(
      Math.abs(axialStress) / longitudinal,
      Math.abs(hoop) / (hoop >= 0 ? material.Yt : material.Yc),
    ),
  };
}
export function analyzeDesign(input) {
  const c = validate(input, { activeOnly: true }),
    material = MATERIALS[c.material],
    massParts = structuralMass(c, material),
    mass = Object.values(massParts).reduce((a, b) => a + b, 0),
    warnings = [
      material.note,
      "Masa de superficies modeladas; excluye motores, equipos, uniones, tapas y carga útil. No es la masa seca completa de un vehículo real.",
    ];
  let points = [],
    displacement = null,
    critical = null,
    bucklingApplicable = false,
    residual = null,
    model = "";
  if (c.object === "sphere") {
    model = "Membrana esférica analítica";
    if (!material.metal) {
      warnings.push(
        "UD en esfera: no se define una orientación global de fibras. Solo geometría/masa; esfuerzos y deformación no calculados.",
      );
      return {
        config: c,
        material,
        mass,
        massParts,
        points,
        displacement,
        critical,
        bucklingApplicable,
        residual,
        model,
        maximum: null,
        index: null,
        safety: null,
        warnings,
      };
    }
    const { radius: R, thickness: t } = c.sphere;
    let stress = 0;
    if (c.load === "pressure") {
      stress = (c.pressure * R) / (2 * t);
      displacement = ((1 - material.nu) * stress * R) / material.E;
    } else if (c.restraint === "fixed") {
      stress = (-material.E * material.alpha * c.deltaT) / (1 - material.nu);
      displacement = 0;
    } else displacement = material.alpha * c.deltaT * R;
    const value = criterion(material, stress, stress);
    points = [
      { position: 0, displacement, axial: stress, hoop: stress, ...value },
      { position: R, displacement, axial: stress, hoop: stress, ...value },
    ];
    warnings.push(
      "Esfera hueca ideal; no modelo de planeta, gravedad propia, pandeo de cascarón ni uniones.",
    );
  } else {
    const sections = discretize(c),
      length = sections.reduce((a, s) => a + s.length, 0);
    if (c.object === "aircraft" && c.load === "lift") {
      const result = beam(sections, material.E, c.force / 2);
      residual = result.residual;
      displacement = result.tip;
      points = result.points.map((p) => ({
        ...p,
        axial: p.stress,
        hoop: 0,
        ...criterion(material, p.stress, 0, true),
      }));
      model = "FEM 1D Euler–Bernoulli · semiala";
      warnings.push(
        "Carga total repartida por igual entre semialas y uniforme en envergadura proyectada. Sección de piel delgada NACA; sin cortante, torsión ni acoplamientos de flecha/diedro. Fuselaje incluido en masa, sin campo de esfuerzos.",
      );
      if (Math.abs(displacement) / length > 0.05)
        warnings.push(
          "Deflexión > 5 % de la longitud: pequeñas deformaciones no justificadas.",
        );
    } else {
      let result,
        hoops = sections.map(() => 0);
      if (c.load === "pressure") {
        hoops = sections.map(
          (s) =>
            (c.pressure * (s.diameter / 2 - s.thickness / 2)) / s.thickness,
        );
        const stresses = hoops.map((h) => h / 2),
          forces = sections.map((s, i) => stresses[i] * s.A),
          eigen = hoops.map((h) => (-material.nu * h) / material.E);
        result = axial(sections, material.E, 0, 0, 0, false, forces, eigen);
        model = "FEM axial + membranas cilíndricas locales";
        warnings.push(
          "Presión diferencial positiva, extremos cerrados ideales. Membranas de pared delgada; empalmes, ojiva, aletas y esfuerzos locales no analizados.",
        );
      } else if (c.load === "thermal") {
        result = axial(
          sections,
          material.E,
          0,
          material.alpha,
          c.deltaT,
          c.restraint === "fixed",
        );
        model = "FEM axial termoelástico";
        warnings.push(
          "ΔT uniforme; base fija y extremo libre o ambos extremos fijos. E y resistencias constantes, sin gradientes ni degradación térmica.",
        );
      } else {
        result = axial(sections, material.E, -c.force);
        model = "FEM axial · compresión";
        const buckle = beam(sections, material.E, 0);
        critical = buckle.critical;
        const limit = material.Xc,
          minimumArea = Math.min(...sections.map((s) => s.A));
        bucklingApplicable =
          critical !== null && critical / minimumArea <= limit / 2;
        if (!bucklingApplicable)
          warnings.push(
            "Margen de pandeo no aplicable: falta convergencia o el filtro elástico Pcr/Amin ≤ resistencia/2 no se cumple.",
          );
        warnings.push(
          "Pandeo FEM lineal de columna empotrada–libre, sin pandeo local de pared, imperfecciones ni pospandeo. Empuje aplicado como carga nodal ideal, no distribución real de esfuerzos de un lanzamiento.",
        );
      }
      displacement = result.tip;
      residual = result.residual;
      let x = 0;
      points = sections.map((s, i) => {
        const point = {
          position: x,
          displacement: result.u[i],
          axial: result.stresses[i],
          hoop: hoops[i],
          ...criterion(material, result.stresses[i], hoops[i]),
        };
        x += s.length;
        return point;
      });
      points.push({
        ...points.at(-1),
        position: length,
        displacement: result.tip,
      });
    }
  }
  if (!material.metal)
    warnings.push(
      "Carbono UD: criterio de máximo esfuerzo longitudinal/transversal, no Von Mises ni límite elástico. Sin interacción ni delaminación; no diseño de laminado validado.",
    );
  if (residual !== null && residual > 1e-6)
    warnings.push(
      "Residuo relativo elevado: verifica condición numérica y refina la malla.",
    );
  if (
    c.object !== "sphere" &&
    Math.abs(displacement) / (points.at(-1)?.position || 1) > 0.05 &&
    c.load !== "lift"
  )
    warnings.push(
      "Desplazamiento axial > 5 %: solución lineal fuera de pequeñas deformaciones.",
    );
  const index = Math.max(...points.map((p) => p.index)),
    maximum = material.metal
      ? Math.max(...points.map((p) => p.equivalent))
      : Math.max(...points.map((p) => Math.abs(p.axial))),
    materialSafety = index > 1e-12 ? 1 / index : null;
  const safety =
    bucklingApplicable && c.force > 0
      ? Math.min(materialSafety ?? Infinity, critical / c.force)
      : materialSafety;
  if (index >= 1)
    warnings.push(
      "Referencia resistente alcanzada/superada: solución lineal no predice el fallo ni el estado posterior.",
    );
  if (bucklingApplicable && c.force >= critical)
    warnings.push(
      "Carga alcanza/supera el pandeo ideal; deformación axial no describe pospandeo.",
    );
  if (
    points.some(
      (p) => !Number.isFinite(p.displacement) || !Number.isFinite(p.index),
    )
  )
    throw new Error("Resultados numéricos no finitos.");
  return {
    config: c,
    material,
    mass,
    massParts,
    points,
    displacement,
    critical,
    bucklingApplicable,
    residual,
    model,
    maximum,
    index,
    safety,
    warnings,
  };
}
