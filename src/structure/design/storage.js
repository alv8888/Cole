import { clone, validateDesignState } from "./data.js";
export const STORAGE_KEY = "aerolab.structure.design.v2";
export function decodeDesignRecord(record) {
  if (record?.version !== 2) throw new Error("Versión incompatible.");
  validateDesignState(record.state);
  return clone(record.state);
}
export function saveDesign(state, storage = localStorage) {
  validateDesignState(state);
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, state }));
}
export function loadDesign(storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) throw new Error("No hay diseño guardado.");
  return decodeDesignRecord(JSON.parse(raw));
}
