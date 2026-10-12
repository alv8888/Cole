import { createConvergenceStudy } from './convergence-ui.js';
import { createDesignComparison } from './comparison-ui.js';
import { groupInspector } from '../../navigation/inspector.js';
import { createCalculationState } from '../../navigation/calculation-state.js';
import { createLineChart } from '../../charts/line.js';
import { saveDesign, loadDesign } from "./storage.js";
import { registerSharePart } from "../../navigation/ui.js";
import {
  DEFAULT,
  MATERIALS,
  clone,
  validate,
  validateSettings,
  validateDesignState as checkState,
} from "./data.js";
import { analyzeDesign } from "./model.js";
import { downloadFile } from "../../files.js";
import {
  readSnapshot,
  importDesign,
  queueMass,
  applyMass,
} from "../../integration/bridge.js";
const $ = (id) => document.getElementById(id);
const displacementChart = createLineChart($("design-chart"), $("design-chart-readout"));
let physicsRevision = 0;
let draft = clone(DEFAULT),
  result = null,
  documentError = null,
  viewer = null,
  playing = false;
let calculationError = null, visualError = null;
const convergence=createConvergenceStudy(()=>({result,documentError}));
const designComparison=createDesignComparison(()=>({result,documentError,object:draft.object}));
function reviewTarget() {
  const invalid = [...document.querySelectorAll('#design-form [aria-invalid="true"],#design-load-form [aria-invalid="true"],#design-magnification[aria-invalid="true"],#design-fraction[aria-invalid="true"]')];
  // Inactive geometry is retained: focus its selector without changing the active model.
  const active = invalid.find(input=>!input.closest('[data-object][hidden]') && !input.closest('.field[hidden]'));
  if (active) return active;
  if (invalid.some(input=>input.closest('[data-object][hidden]'))) return $('design-object');
  if (invalid.length) return $('design-case');
  return $('design-object');
}
const calculationStates = ['design-form','design-load-form'].map((id,index)=>createCalculationState($(id),`design-${index?'load':'geometry'}-calculation-state`,{reviewTarget,reviewLabel:'Revisar entradas',label:'Estado del análisis estructural'}));
function refreshCalculationState() {
  const names = {aircraft:'Avión',rocket:'Cohete',sphere:'Envolvente esférica'};
  const inactive = [...new Set([...document.querySelectorAll('#design-geometry-fields [aria-invalid="true"]')].map(input=>input.closest('[data-object][hidden]')?.dataset.object).filter(Boolean))];
  const draftNote = inactive.length ? ` Borrador pendiente: ${inactive.map(object=>names[object]).join(', ')}. Selecciona ese objeto para corregirlo; revisar no cambia el objeto activo.` : '';
  const issues = [result && documentError ? `Documento completo pendiente: ${documentError}${draftNote}` : '',visualError ? `Vista pendiente: ${visualError}.${result?' Los resultados físicos se conservan.':''}` : ''].filter(Boolean);
  const state = !result ? 'invalid' : result.maximum === null ? 'partial' : issues.length ? 'warning' : 'ready';
  const detail = !result ? `Sin solución del objeto activo: ${calculationError}` : (result.maximum === null
    ? 'No se calculan esfuerzos ni deformación: la orientación UD en una esfera no está definida. Geometría y masa disponibles.'
    : `${result.model}. Solución estática educativa; no demuestra seguridad ni certificación.`);
  calculationStates.forEach(panel=>panel.update(state,[detail,...issues].join(' '),!result||!!issues.length));
}
const definitions = {
  wing: [
    ["span", "Envergadura", "m", 2, 40],
    ["root", "Cuerda raíz", "m", 0.2, 6],
    ["tip", "Cuerda punta", "m", 0.2, 6],
    ["sweep", "Flecha de borde de ataque", "°", -30, 45],
    ["dihedral", "Diedro", "°", -10, 20],
    ["ratio", "Espesor relativo NACA t/c", "1", 0.06, 0.25],
    ["camber", "Curvatura máxima NACA m/c", "1", 0, 0.08],
    ["camberPosition", "Posición de curvatura p/c", "1", 0.1, 0.8],
    ["thickness", "Espesor de piel", "m", 0.0001, 0.02],
  ],
  fuselage: [
    ["length", "Longitud elipsoidal", "m", 1, 30],
    ["diameter", "Diámetro máximo", "m", 0.2, 5],
    ["thickness", "Separación de semiejes de piel", "m", 0.0001, 0.03],
  ],
  rocket: [
    ["nose", "Longitud de ojiva", "m", 0.1, 5],
    ["finCount", "Número de aletas", "entero", 0, 6],
    ["finChord", "Cuerda de aletas", "m", 0.1, 3],
    ["finHeight", "Altura radial de aletas", "m", 0.05, 2],
    ["finThickness", "Espesor de aletas", "m", 0.001, 0.05],
  ],
  sphere: [
    ["radius", "Radio exterior", "m", 0.1, 5],
    ["thickness", "Espesor de envolvente", "m", 0.0001, 0.03],
  ],
  section: [
    ["length", "Longitud cilíndrica", "m", 0.2, 15],
    ["diameter", "Diámetro exterior", "m", 0.1, 5],
    ["thickness", "Espesor de pared", "m", 0.0001, 0.03],
  ],
  load: [
    ["force", "Fuerza total", "N", 0, 1e7],
    ["pressure", "Presión diferencial interna", "Pa", 0, 1e7],
    ["deltaT", "Cambio uniforme de temperatura", "K", -150, 150],
  ],
};
function field(path, d) {
  const [, label, unit, min, max] = d,
    id = `design-${path.replaceAll(".", "-")}`;
  return `<div class="field"><label for="${id}">${label} <span>${unit}</span></label><input id="${id}" data-path="${path}" type="number" min="${min}" max="${max}" step="${unit === "entero" ? "1" : "any"}" required aria-describedby="${id}-limit"><p class="limits" id="${id}-limit">${min}–${max} ${unit}</p></div>`;
}
function setPath(c, path, value) {
  const keys = path.split("."),
    last = keys.pop();
  keys.reduce((o, k) => o[k], c)[last] = value;
}
function getPath(c, path) {
  return path.split(".").reduce((o, k) => o[k], c);
}
function group(type, title, object) {
  return `<fieldset data-object="${object}"><legend>${title}</legend><div class="engineering-field-grid">${definitions[type].map((d) => field(`${type}.${d[0]}`, d)).join("")}</div></fieldset>`;
}
function buildFields() {
  $("design-geometry-fields").innerHTML =
    group("wing", "Semialas NACA · simetría bilateral", "aircraft") +
    group("fuselage", "Fuselaje elipsoidal · solo masa", "aircraft") +
    group("rocket", "Ojiva y aletas · solo masa", "rocket") +
    `<fieldset data-object="rocket"><legend>Secciones cilíndricas · base → punta</legend><div class="field"><label for="design-section-count">Número de secciones (1–4)</label><select id="design-section-count">${[1, 2, 3, 4].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></div><div class="field"><label for="design-nose-type">Forma de ojiva</label><select id="design-nose-type"><option value="cone">Cono</option><option value="ellipsoid">Semielipsoide</option></select></div>${draft.rocket.sections.map((s, i) => `<fieldset><legend>Sección ${i + 1}</legend><div class="engineering-field-grid">${definitions.section.map((d) => field(`rocket.sections.${i}.${d[0]}`, d)).join("")}</div></fieldset>`).join("")}</fieldset>` +
    group("sphere", "Envolvente esférica · satélite ideal", "sphere");
  groupInspector($("design-geometry-fields"));
  $("design-section-count").addEventListener("change", () => {
    read();
    const n = Number($("design-section-count").value);
    while (draft.rocket.sections.length < n)
      draft.rocket.sections.push(clone(draft.rocket.sections.at(-1)));
    draft.rocket.sections.length = n;
    buildFields();
    fillInputs();
    update();
  });
}
$("design-material").innerHTML = Object.entries(MATERIALS)
  .map(([k, m]) => `<option value="${k}">${m.name}</option>`)
  .join("");
$("design-load-fields").innerHTML = definitions.load
  .map((d) => field(d[0], d))
  .join("");
function cases() {
  const previous = draft.load,
    allowed =
      draft.object === "aircraft"
        ? ["lift", "thermal"]
        : draft.object === "rocket"
          ? ["compression", "pressure", "thermal"]
          : ["pressure", "thermal"],
    labels = {
      lift: "Flexión por sustentación uniforme",
      compression: "Compresión axial por empuje",
      pressure: "Presión interna · membrana",
      thermal: "Carga térmica uniforme",
    };
  if (!allowed.includes(previous)) draft.load = allowed[0];
  $("design-case").innerHTML = allowed
    .map((k) => `<option value="${k}">${labels[k]}</option>`)
    .join("");
  $("design-case").value = draft.load;
}
function fillInputs() {
  document
    .querySelectorAll("[data-path]")
    .forEach((el) => (el.value = getPath(draft, el.dataset.path)));
  $("design-object").value = draft.object;
  $("design-material").value = draft.material;
  $("design-elements").value = draft.elements;
  $("design-restraint").value = draft.restraint;
  $("design-section-count").value = draft.rocket.sections.length;
  $("design-nose-type").value = draft.rocket.noseType;
  cases();
}
function read() {
  draft.object = $("design-object").value;
  draft.material = $("design-material").value;
  draft.elements = $("design-elements").valueAsNumber;
  draft.load = $("design-case").value;
  draft.restraint = $("design-restraint").value;
  document
    .querySelectorAll("[data-path]")
    .forEach((el) => setPath(draft, el.dataset.path, el.valueAsNumber));
  draft.rocket.noseType = $("design-nose-type").value;
  return draft;
}
function settings() {
  return {
    magnification: $("design-magnification").valueAsNumber,
    fraction: $("design-fraction").valueAsNumber,
    mesh: $("design-mesh").checked,
    nodes: $("design-nodes").checked,
    display: $("design-display").value,
  };
}
const fmt = (value, digits = 3) =>
  value === null || value === undefined
    ? "—"
    : Number(value).toLocaleString("es-AR", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
function row(label, value) {
  const tr = document.createElement("tr"),
    a = document.createElement("th"),
    b = document.createElement("td");
  a.scope = "row";
  a.textContent = label;
  b.textContent = value;
  tr.append(a, b);
  return tr;
}
function graph() {
  displacementChart.render((result?.points ?? []).map(p => ({ x: p.position, y: p.displacement * 1000 })), {
    x: "Posición", xUnit: "m", y: "Desplazamiento", yUnit: "mm"
  });
}
function updateVisual() {
  visualError = null;
  for (const id of ["design-magnification", "design-fraction"]) {
    const input = $(id);
    input.setAttribute("aria-invalid", String(!input.checkValidity() || !Number.isFinite(input.valueAsNumber)));
  }
  try {
    validateSettings(settings());
    $("design-fraction-value").textContent = `${fmt(settings().fraction, 0)} %`;
    document.querySelector(".design-legend").hidden = settings().display === "geometry";
    $("design-display-note").textContent = settings().display === "geometry"
      ? "Geometría iluminada. Colores de material ilustrativos; consulta esfuerzos en las tablas."
      : "Campo por sección interpolado en superficie; no tensor FEM 3D. Colores estables sin iluminación.";
    $("design-save").disabled = $("design-json").disabled = !result || !!documentError;
    $("design-animate").disabled = !result;
    viewer?.update(result, { ...settings(), playing });
  } catch (e) {
    visualError = e.message;
    playing = false;
    $("design-animate").textContent = "Animar deformación";
    $("design-animate").setAttribute("aria-pressed", "false");
    $("design-display-note").textContent = `Vista pendiente: ${e.message}. Los resultados físicos se conservan.`;
    $("design-save").disabled = $("design-json").disabled = true;
    $("design-animate").disabled = true;
    viewer?.update(null, { ...settings(), playing: false });
  }
  refreshCalculationState();
}
function exportPreview() {
  try {
    if (!result) throw new Error("Diseño inválido.");
    const target = $("design-export-target").value,
      source = readSnapshot(target),
      packet = {
        version: 1,
        mass: result.mass,
        mode: $("design-export-mode").value,
        stage: $("design-export-stage").valueAsNumber - 1,
      },
      p = applyMass(target, source, packet);
    $("design-export-preview").textContent =
      `Propuesta: ${fmt(p.before)} → ${fmt(p.after)} kg. Se recalculará sobre la masa vigente al aplicar en destino.`;
    $("design-export").disabled = false;
  } catch (e) {
    $("design-export-preview").textContent = e.message;
    $("design-export").disabled = true;
  }
  $("design-export-stage").parentElement.hidden =
    $("design-export-target").value !== "launch";
  $("design-export-link").href =
    $("design-export-target").value === "aircraft"
      ? "aircraft.html"
      : "rocket.html";
}
function render() {
  const m = MATERIALS[draft.material];
  $("design-material-note").textContent = m.note;
  $("design-material-data").replaceChildren(
    ...[
      ["Densidad", `${fmt(m.rho, 0)} kg/m³`],
      [
        "E longitudinal / transversal",
        `${fmt(m.E / 1e9)} / ${fmt(m.E2 / 1e9)} GPa`,
      ],
      ["Poisson ν12", fmt(m.nu)],
      [
        "α longitudinal / transversal",
        `${fmt(m.alpha * 1e6)} / ${fmt(m.alpha2 * 1e6)} µm/(m·K)`,
      ],
      [
        "Referencia tracción / compresión longitudinal",
        `${fmt(m.Xt / 1e6)} / ${fmt(m.Xc / 1e6)} MPa`,
      ],
      [
        "Referencia transversal tracción / compresión",
        `${fmt(m.Yt / 1e6)} / ${fmt(m.Yc / 1e6)} MPa`,
      ],
    ].map(([a, b]) => row(a, b)),
  );
  document
    .querySelectorAll("[data-object]")
    .forEach((el) => (el.hidden = el.dataset.object !== draft.object));
  for (const d of definitions.load) {
    $(`design-${d[0]}`).parentElement.hidden =
      draft.load !==
      {
        force: draft.object === "aircraft" ? "lift" : "compression",
        pressure: "pressure",
        deltaT: "thermal",
      }[d[0]];
  }
  $("design-restraint-field").hidden = draft.load !== "thermal";
  $("design-restraint").options[0].textContent =
    draft.object === "sphere"
      ? "Envolvente libre"
      : "Base fija / extremo libre";
  $("design-restraint").options[1].textContent =
    draft.object === "sphere"
      ? "Dilatación impedida en dos direcciones"
      : "Ambos extremos fijos";
  $("design-object-label").textContent = {
    aircraft: "ALA / FUSELAJE",
    rocket: "SECCIONES / OJIVA",
    sphere: "ENVOLVENTE ESFÉRICA",
  }[draft.object];
  $("design-kpi-mass").textContent = result ? `${fmt(result.mass)} kg` : "—";
  $("design-kpi-stress").textContent =
    result?.maximum !== null && result
      ? `${fmt(result.maximum / 1e6)} MPa${!m.metal ? " axial" : ""}`
      : "—";
  $("design-kpi-safety").textContent =
    result?.safety !== null && result
      ? fmt(result.safety)
      : result?.index !== null && result?.index < 1e-12
        ? "∞ · esfuerzo nulo"
        : "—";
  $("design-kpi-safety").dataset.alert = String(
    result?.safety < 1 && result?.safety !== null,
  );
  $("design-model-label").textContent =
    result?.model ?? "Sin resultados vigentes.";
  $("design-load-note").textContent = result
    ? `${result.model}. Desplazamiento extremo: ${fmt(result.displacement === null ? null : result.displacement * 1000)} mm.`
    : "Corrige entradas: se ocultan campos y métricas.";
  $("design-warnings").replaceChildren(
    ...(result?.warnings ?? ["Entradas inválidas."]).map((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      return li;
    }),
  );
  $("design-results").replaceChildren(
    ...(result
      ? [
          ["Masa de superficies", `${fmt(result.mass)} kg`],
          ...Object.entries(result.massParts).map(([k, v]) => [
            {
              wings: "Piel alar",
              fuselage: "Piel del fuselaje",
              cylinders: "Cilindros",
              fairing: "Ojiva",
              fins: "Aletas",
              shell: "Esfera",
            }[k],
            `${fmt(v)} kg`,
          ]),
          [
            m.metal ? "Von Mises máximo" : "Esfuerzo axial máximo (UD)",
            `${fmt(result.maximum === null ? null : result.maximum / 1e6)} MPa`,
          ],
          ["Índice máximo / referencia", fmt(result.index, 6)],
          [
            "Factor material / pandeo aplicable",
            result.safety === null
              ? result.index !== null && result.index < 1e-12
                ? "∞ · esfuerzo nulo"
                : "No calculado"
              : fmt(result.safety),
          ],
          [
            "Desplazamiento extremo",
            `${fmt(result.displacement === null ? null : result.displacement * 1000)} mm`,
          ],
          [
            "Pandeo crítico global",
            result.critical === null
              ? "No calculado"
              : `${fmt(result.critical)} N${result.bucklingApplicable ? " · margen aplicable" : " · margen NO aplicable"}`,
          ],
          [
            "Nodos / elementos por eje",
            draft.object === "sphere"
              ? "Analítico, sin FEM"
              : `${result.points.length} / ${Math.max(0, result.points.length - 1)}`,
          ],
          [
            "Residuo relativo de equilibrio FEM",
            result.residual === null ? "—" : result.residual.toExponential(3),
          ],
        ]
      : [["Estado", "Sin solución válida"]]
    ).map(([a, b]) => row(a, b)),
  );
  $("design-points").replaceChildren(
    ...(result?.points ?? []).map((p) => {
      const tr = document.createElement("tr");
      [
        fmt(p.position),
        fmt(p.displacement * 1000),
        fmt(p.axial / 1e6),
        fmt(p.hoop / 1e6),
        fmt(p.equivalent === null ? null : p.equivalent / 1e6),
        fmt(p.index, 6),
      ].forEach((t) => {
        const td = document.createElement("td");
        td.textContent = t;
        tr.append(td);
      });
      return tr;
    }),
  );
  graph();
  ["design-save", "design-json", "design-csv"].forEach(
    (id) => ($(id).disabled = !result || (id !== "design-csv" && !!documentError)),
  );
  exportPreview();
  designComparison.render();
  convergence.invalidate();
}
function update() {
  read();
  calculationError = null;
  documentError = null;
  try {
    validate(draft);
  } catch (e) {
    documentError = e.message;
  }
  document
    .querySelectorAll(
      "#design-form input,#design-load-form input,#design-magnification,#design-fraction",
    )
    .forEach((el) =>
      el.setAttribute(
        "aria-invalid",
        String(!el.checkValidity() || !Number.isFinite(el.valueAsNumber)),
      ),
    );
  if (
    draft.wing.thickness >
    Math.min(draft.wing.root, draft.wing.tip) * draft.wing.ratio * 0.05
  )
    $("design-wing-thickness").setAttribute("aria-invalid", "true");
  draft.rocket.sections.forEach((s, i) => {
    if (s.thickness > s.diameter / 40)
      $(`design-rocket-sections-${i}-thickness`).setAttribute(
        "aria-invalid",
        "true",
      );
  });
  if (draft.sphere.thickness > draft.sphere.radius / 20)
    $("design-sphere-thickness").setAttribute("aria-invalid", "true");
  try {
    $("design-view").dataset.physicsRevision = String(++physicsRevision);
    result = analyzeDesign(draft);
    $("design-status").textContent =
      "Objeto activo calculado. Modelo lineal educativo; consulta campos, hipótesis y límites." + (documentError ? ` Para guardar/compartir el documento completo, corrige el borrador: ${documentError}` : "");
  } catch (e) {
    calculationError = e.message;
    result = null;
    playing = false;
    $("design-animate").textContent = "Animar deformación";
    $("design-animate").setAttribute("aria-pressed", "false");
    $("design-status").textContent = `Sin resultados: ${e.message}`;
  }
  $("design-fraction-value").textContent = `${fmt(settings().fraction, 0)} %`;
  $("design-animate").disabled = !result;
  render();
  updateVisual();
}
function apply(configuration) {
  draft = clone(configuration);
  playing = false;
  $("design-animate").textContent = "Animar deformación";
  $("design-animate").setAttribute("aria-pressed", "false");
  buildFields();
  fillInputs();
  update();
}
buildFields();
fillInputs();
update();
for (const input of document.querySelectorAll(
  "input[id^=design-]:not([aria-describedby])",
))
  input.setAttribute("aria-describedby", "design-input-help");
$("design-form").addEventListener("input", (e) => {
  if (e.target.id === "design-object") {
    read();
    cases();
  }
  update();
});
$("design-form").addEventListener("change", (e) => {
  if (e.target.id === "design-object") {
    read();
    cases();
  }
  update();
});
$("design-load-form").addEventListener("input", update);
$("design-load-form").addEventListener("change", update);
for (const id of [
  "design-magnification",
  "design-fraction",
  "design-mesh",
  "design-nodes",
  "design-display",
])
  $(id).addEventListener("input", updateVisual);
$("design-reset").addEventListener("click", () => apply(DEFAULT));
$("design-camera").addEventListener("click", () => viewer?.reset());
$("design-animate").addEventListener("click", () => {
  playing = !playing;
  $("design-animate").textContent = playing
    ? "Pausar deformación"
    : "Animar deformación";
  $("design-animate").setAttribute("aria-pressed", String(playing));
  if (playing && matchMedia("(prefers-reduced-motion: reduce)").matches)
    $("design-load-note").textContent =
      "Movimiento reducido activado: ajusta manualmente la fracción visual.";
  viewer?.update(result, { ...settings(), playing });
});
const get = () => ({ configuration: validate(read()), ...settings() });
function applyState(s) {
  checkState(s);
  $("design-magnification").value = s.magnification;
  $("design-fraction").value = s.fraction;
  $("design-mesh").checked = s.mesh;
  $("design-nodes").checked = s.nodes;
  $("design-display").value = s.display ?? "field";
  apply(s.configuration);
}
$("design-save").addEventListener("click", () => {
  try {
    saveDesign(get());
    $("design-status").textContent =
      "Diseño guardado localmente. El banco de pruebas anterior conserva su guardado independiente.";
  } catch (e) {
    $("design-status").textContent = `No se pudo guardar: ${e.message}`;
  }
});
$("design-load").addEventListener("click", () => {
  try {
    applyState(loadDesign());
    $("design-status").textContent = "Diseño recuperado; animación pausada.";
  } catch (e) {
    $("design-status").textContent = `No se pudo cargar: ${e.message}`;
  }
});
$("design-json").addEventListener("click", () =>
  downloadFile(
    JSON.stringify(
      {
        version: 2,
        state: get(),
        model: result.model,
        warnings: result.warnings,
      },
      null,
      2,
    ),
    "aerolab-structure-design.json",
    "application/json",
  ),
);
$("design-csv").addEventListener("click", () => {
  if (!result) return;
  downloadFile(
    "position_m,displacement_m,axial_Pa,hoop_Pa,von_mises_Pa,index\n" +
      result.points
        .map((p) =>
          [
            p.position,
            p.displacement,
            p.axial,
            p.hoop,
            p.equivalent ?? "",
            p.index,
          ].join(","),
        )
        .join("\n"),
    "aerolab-structure-field.csv",
    "text/csv",
  );
});
$("design-import").addEventListener("click", () => {
  try {
    const name = $("design-import-source").value,
      imported = importDesign(name, readSnapshot(name), read());
    apply(imported.configuration);
    $("design-import-status").textContent = imported.note;
  } catch (e) {
    $("design-import-status").textContent =
      `No se importó: ${e.message} Ajusta dimensiones/espesor si exceden el dominio del diseñador.`;
  }
});
for (const id of [
  "design-export-target",
  "design-export-mode",
  "design-export-stage",
])
  $(id).addEventListener("input", exportPreview);
$("design-export").addEventListener("click", () => {
  try {
    const target = $("design-export-target").value,
      p = queueMass(
        target,
        readSnapshot(target),
        result.mass,
        $("design-export-mode").value,
        $("design-export-stage").valueAsNumber - 1,
      );
    $("design-export-status").textContent =
      `Propuesta enviada: ${fmt(p.before)} → ${fmt(p.after)} kg. Abre destino y pulsa Aplicar tras revisar. Las fuerzas se recalculan allí.`;
  } catch (e) {
    $("design-export-status").textContent = `No se exportó: ${e.message}`;
  }
});
window.addEventListener("storage", exportPreview);
document.addEventListener("aerolab:tabchange", (e) => {
  const shell = $("design-view-shell");
  (e.detail.tab === "analysis"
    ? $("design-load-mount")
    : $("design-view-mount")
  ).append(shell);
});
$("design-view").addEventListener(
  "designer:error",
  (e) => {
    playing = false;
    $("design-animate").textContent = "Animar deformación";
    $("design-animate").setAttribute("aria-pressed", "false");
    $("design-view-status").textContent = e.detail;
  },
);
$("design-view").addEventListener("designer:ready", () => {
  $("design-view-status").textContent = "Contexto WebGL recuperado; resultados físicos conservados y animación pausada.";
  updateVisual();
});
import("./viewer.js")
  .then(({ createDesigner }) => {
    viewer = createDesigner($("design-view"));
    viewer.update(result, { ...settings(), playing: false });
    $("design-view-status").textContent =
      "Visor WebGL local · superficies paramétricas y nodos del modelo 1D.";
  })
  .catch((e) => {
    $("design-view-status").textContent =
      `3D no disponible: ${e.message}. Las tablas y el gráfico calculado siguen funcionando.`;
  });
registerSharePart("design", { get, validate: checkState, apply: applyState });
