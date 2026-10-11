import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfigurations, saveConfigurations, STORAGE_KEY } from '../src/storage.js';
import { DEFAULTS } from '../src/data.js';

function memoryStorage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}
test('guarda y recupera dos configuraciones sin compartir referencias', () => {
  const storage = memoryStorage();
  assert.equal(loadConfigurations(storage), null);
  saveConfigurations(storage, DEFAULTS);
  const loaded = loadConfigurations(storage);
  assert.deepEqual(loaded, DEFAULTS);
  loaded[0].altitude = 900;
  assert.equal(loadConfigurations(storage)[0].altitude, 400);
});
test('rechaza JSON dañado, versiones desconocidas y parámetros inválidos', () => {
  const storage = memoryStorage();
  for (const payload of ['broken', 'null', '{}', JSON.stringify({ version: 3, configurations: DEFAULTS }), JSON.stringify({ version: 1, configurations: [DEFAULTS[0]] }), JSON.stringify({ version: 1, configurations: [DEFAULTS[0], { ...DEFAULTS[1], altitude: -1 }] }), JSON.stringify({ version: 2, configurations: [DEFAULTS[0], { ...DEFAULTS[1], eccentricity: 1 }] })]) {
    storage.setItem(STORAGE_KEY, payload);
    assert.throws(() => loadConfigurations(storage));
  }
});
test('migra v1 conservando altitudes y añadiendo e=0', () => {
  const storage = memoryStorage();
  const legacy = DEFAULTS.map(({ eccentricity, ...config }) => config);
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, configurations: legacy }));
  assert.deepEqual(loadConfigurations(storage), DEFAULTS);
  const elliptic = DEFAULTS.map(config => ({ ...config, eccentricity: 0.5 }));
  saveConfigurations(storage, elliptic);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).version, 2);
  assert.deepEqual(loadConfigurations(storage), elliptic);
});
test('no guarda datos inválidos y propaga indisponibilidad/cuota', () => {
  const storage = memoryStorage();
  assert.throws(() => saveConfigurations(storage, []));
  assert.throws(() => saveConfigurations(storage, [{ ...DEFAULTS[0], mu: NaN }, DEFAULTS[1]]));
  const unavailable = { setItem() { throw new Error('QuotaExceededError'); }, getItem() { throw new Error('SecurityError'); } };
  assert.throws(() => saveConfigurations(unavailable, DEFAULTS), /QuotaExceededError/);
  assert.throws(() => loadConfigurations(unavailable), /SecurityError/);
});
