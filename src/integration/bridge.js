import { PROFILES } from "../engineering/profiles.js";
import { budget } from "../rocket/model.js";
import { clone, validate } from "../structure/design/data.js";
const sources = ["aircraft", "calculator", "launch"];
const key = (name) => `aerolab.bridge.snapshot.${name}.v1`;
const transferKey = (name) => `aerolab.bridge.mass.${name}.v1`;
export function validateSource(name, c) {
  if (!sources.includes(name)) throw new Error("Origen desconocido.");
  return name === "launch"
    ? budget(c)
    : PROFILES[name === "calculator" ? "rocket" : name].compute(c);
}
export function publishSnapshot(name, configuration) {
  try {
    validateSource(name, configuration);
    localStorage.setItem(
      key(name),
      JSON.stringify({ version: 1, configuration }),
    );
  } catch {
    /* Optional bridge storage; original lab remains usable. */
  }
}
export function readSnapshot(name) {
  let raw = localStorage.getItem(key(name));
  if (!raw) {
    const legacy = {
      aircraft: "aerolab.aircraft.v1",
      calculator: "aerolab.rocket.v1",
      launch: "aerolab.rocket.launch.v1",
    };
    raw = localStorage.getItem(legacy[name]);
  }
  if (!raw)
    throw new Error(
      "Abre el laboratorio de origen y configura un caso válido primero.",
    );
  const record = JSON.parse(raw),
    c = record.configuration ?? record.config;
  if (![1, 2].includes(record.version))
    throw new Error("Versión de origen incompatible.");
  validateSource(name, c);
  return clone(c);
}
export function importDesign(name, source, design) {
  const result = validateSource(name, source),
    c = clone(design);
  let note;
  if (name === "aircraft") {
    c.object = "aircraft";
    c.load = "lift";
    c.wing.span = source.span;
    c.wing.root = result.rootChord;
    c.wing.tip = result.tipChord;
    c.force = result.lift;
    note =
      "Envergadura, cuerdas derivadas de área/taper y sustentación actual importadas. Perfil NACA, flecha, diedro, fuselaje y espesores conservados: el origen no los define.";
  } else if (name === "calculator") {
    c.object = "rocket";
    c.load = "compression";
    c.rocket.sections = [
      {
        length: source.length * 0.8,
        diameter: source.diameter,
        thickness: c.rocket.sections[0].thickness,
      },
    ];
    c.rocket.nose = source.length * 0.2;
    c.force = result.appliedThrust;
    note =
      "Longitud y diámetro importados; reparto geométrico explícito: cilindro 80 %, ojiva 20 %. Pared y aletas conservadas. Fuerza = empuje aplicado del calculador.";
  } else {
    c.object = "rocket";
    c.load = "compression";
    c.force = source.stages[0].thrust;
    note =
      "Empuje inicial multietapa importado. Se conservan todas las dimensiones: el simulador de lanzamiento no define geometría ni espesores. Sus etapas de combustible no son una malla estructural.";
  }
  return { configuration: validate(c), note };
}
export function applyMass(name, configuration, packet) {
  if (
    !sources.includes(name) ||
    packet?.version !== 1 ||
    !["add", "replace"].includes(packet.mode) ||
    !Number.isFinite(packet.mass) ||
    packet.mass <= 0
  )
    throw new Error("Transferencia de masa inválida.");
  const c = clone(configuration);
  let before;
  if (name === "launch") {
    if (
      !Number.isInteger(packet.stage) ||
      packet.stage < 0 ||
      packet.stage >= c.stages.length
    )
      throw new Error("La etapa ya no existe.");
    before = c.stages[packet.stage].dry;
    c.stages[packet.stage].dry =
      packet.mode === "add" ? before + packet.mass : packet.mass;
  } else {
    const field = name === "aircraft" ? "mass" : "dryMass";
    before = c[field];
    c[field] = packet.mode === "add" ? before + packet.mass : packet.mass;
  }
  validateSource(name, c);
  return {
    configuration: c,
    before,
    after: packet.mode === "add" ? before + packet.mass : packet.mass,
  };
}
export function queueMass(name, source, mass, mode, stage) {
  const packet = {
    version: 1,
    mass,
    mode,
    stage,
    description:
      "Masa de superficies Structure Lab; no masa seca total certificada.",
  };
  const preview = applyMass(name, source, packet);
  localStorage.setItem(transferKey(name), JSON.stringify(packet));
  return preview;
}
export function attachMassInbox({ target, get, apply, root }) {
  let packet;
  try {
    const raw = localStorage.getItem(transferKey(target));
    if (!raw) return;
    packet = JSON.parse(raw);
  } catch {
    return;
  }
  const box = document.createElement("section");
  box.className = "panel mass-inbox";
  box.innerHTML =
    '<h2>Masa recibida de Structure Lab</h2><p role="status"></p><div class="action-row"><button type="button">Aplicar masa revisada</button><button type="button" class="quiet">Descartar</button></div>';
  root.prepend(box);
  const message = box.querySelector("p"),
    [accept, discard] = box.querySelectorAll("button");
  function preview() {
    try {
      const p = applyMass(target, get(), packet);
      message.textContent = `${packet.description} ${packet.mode === "add" ? "Añadir" : "Sustituir"} ${packet.mass.toFixed(3)} kg: ${p.before.toFixed(3)} → ${p.after.toFixed(3)} kg${target === "launch" ? ` en etapa ${packet.stage + 1}` : ""}. Revisa si esa masa ya está incluida. No se guarda automáticamente.`;
      accept.disabled = false;
    } catch (e) {
      message.textContent = `No aplicable: ${e.message}`;
      accept.disabled = true;
    }
  }
  preview();
  root.addEventListener("input", preview);
  root.addEventListener("change", preview);
  function remove() {
    localStorage.removeItem(transferKey(target));
    root.removeEventListener("input", preview);
    root.removeEventListener("change", preview);
    box.remove();
  }
  accept.addEventListener("click", () => {
    try {
      const p = applyMass(target, get(), packet);
      remove();
      apply(p.configuration);
    } catch (e) {
      message.textContent = e.message;
    }
  });
  discard.addEventListener("click", () => {
    try {
      remove();
    } catch (e) {
      message.textContent = `No se pudo descartar: ${e.message}`;
    }
  });
}
