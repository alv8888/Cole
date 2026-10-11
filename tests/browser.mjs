// Optional integration check. Playwright is a test tool, not an app dependency.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = process.env.AEROLAB_URL ?? 'http://127.0.0.1:8000';
let passed = 0;
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.waitForSelector('#orbit-a [data-satellite]');
  await check('initial calculations and local storage empty', async () => {
    assert.match(await page.locator('#results').innerText(), /7,67/);
    assert.match(await page.locator('#results').innerText(), /92,41/);
    await page.locator('#load').click();
    assert.match(await page.locator('#status').innerText(), /No hay/);
  });
  await check('comparison updates; invalid input hides affected values', async () => {
    await page.locator('#b-altitude').fill('400');
    const percentages = await page.locator('#results tr td:last-child').allTextContents();
    assert.ok(percentages.every(value => value === '0,00 %'));
    await page.locator('#a-altitude').fill('');
    assert.equal(await page.locator('#a-altitude').getAttribute('aria-invalid'), 'true');
    assert.ok(await page.locator('#save').isDisabled());
    assert.ok(await page.locator('#play').isDisabled());
    assert.equal(await page.locator('#orbit-a [data-satellite]').count(), 0);
    assert.equal(await page.locator('#results tr:first-child td:first-of-type').textContent(), '—');
    await page.locator('#a-altitude').fill('-1');
    assert.match(await page.locator('#a-altitude-error').innerText(), /entre/);
    await page.locator('#reset').click();
  });
  await check('presets and custom parameters, atmosphere and distance warnings', async () => {
    await page.locator('#a-body').selectOption('moon');
    assert.equal(await page.locator('#a-radius').inputValue(), '1737.4');
    assert.equal(await page.locator('#a-mu').inputValue(), '4902.800118');
    await page.locator('#a-mu').fill('5000');
    assert.equal(await page.locator('#a-body').inputValue(), 'custom');
    assert.match(await page.locator('#a-warning').innerText(), /Parámetros propios/);
    await page.locator('#a-body').selectOption('earth');
    await page.locator('#a-altitude').fill('10');
    assert.match(await page.locator('#a-warning').innerText(), /arrastre/);
    await page.locator('#a-altitude').fill('1000000');
    assert.match(await page.locator('#a-warning').innerText(), /terceros cuerpos/);
    await page.locator('#reset').click();
  });
  await check('elliptic geometry, results and invalid eccentricity', async () => {
    await page.locator('#a-eccentricity').fill('0.5');
    assert.match(await page.locator('#results').innerText(), /20\.313,00/);
    assert.match(await page.locator('#results').innerText(), /9,40/);
    assert.match(await page.locator('#results').innerText(), /3,13/);
    const geometry = await page.locator('#orbit-a [data-orbit-path]').evaluate(node => ({ cx: +node.getAttribute('cx'), rx: +node.getAttribute('rx'), ry: +node.getAttribute('ry') }));
    assert.ok(geometry.cx < 160 && geometry.rx > geometry.ry);
    assert.match(await page.locator('#orbit-a').getAttribute('aria-label'), /el|excentricidad/);
    await page.locator('#a-eccentricity').fill('1');
    assert.equal(await page.locator('#a-eccentricity').getAttribute('aria-invalid'), 'true');
    assert.ok(await page.locator('#play').isDisabled());
    await page.locator('#reset').click();
  });
  await check('legacy circular saves migrate without overwriting the original', async () => {
    await page.evaluate(() => {
      localStorage.setItem('aerolab.space.circular.v1', JSON.stringify({ version: 1, configurations: [
        { body: 'earth', mu: 398600.435507, radius: 6371, altitude: 777 },
        { body: 'earth', mu: 398600.435507, radius: 6371, altitude: 888 },
      ] }));
    });
    await page.locator('#load').click();
    assert.equal(await page.locator('#a-altitude').inputValue(), '777');
    assert.equal(await page.locator('#a-eccentricity').inputValue(), '0');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('aerolab.space.circular.v1')).version), 1);
    await page.locator('#reset').click();
  });
  await check('save/load after reload; reset retains saved configurations', async () => {
    await page.locator('#a-altitude').fill('550');
    await page.locator('#b-altitude').fill('1200');
    await page.locator('#a-eccentricity').fill('0.5');
    await page.locator('#save').click();
    await page.reload();
    await page.locator('#load').click();
    assert.equal(await page.locator('#a-altitude').inputValue(), '550');
    assert.equal(await page.locator('#b-altitude').inputValue(), '1200');
    assert.equal(await page.locator('#a-eccentricity').inputValue(), '0.5');
    await page.locator('#reset').click();
    assert.equal(await page.locator('#a-altitude').inputValue(), '400');
    assert.equal(await page.locator('#a-eccentricity').inputValue(), '0');
    await page.locator('#load').click();
    assert.equal(await page.locator('#a-altitude').inputValue(), '550');
  });
  await check('corrupted storage is reported without changing controls', async () => {
    await page.evaluate(() => localStorage.setItem('aerolab.space.circular.v1', '{broken'));
    await page.locator('#load').click();
    assert.match(await page.locator('#status').innerText(), /No se pudo cargar/);
    assert.equal(await page.locator('#a-altitude').inputValue(), '550');
    await page.locator('#reset').click();
  });
  await check('analytic animation moves, pauses, resets and changes speed', async () => {
    const before = await page.locator('#orbit-a [data-satellite]').getAttribute('cy');
    await page.locator('#speed').selectOption('600');
    await page.locator('#play').click();
    await page.waitForFunction(() => Number(document.querySelector('#orbit-a [data-satellite]').getAttribute('cy')) < 150);
    assert.notEqual(await page.locator('#orbit-a [data-satellite]').getAttribute('cy'), before);
    await page.locator('#play').click();
    assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'false');
    await page.locator('#restart-time').click();
    assert.equal(await page.locator('#elapsed').innerText(), '0 s');
    assert.equal(await page.locator('#orbit-a [data-satellite]').getAttribute('cy'), '160');
  });
  await check('elliptic animation updates distance and speed instead of constant angular motion', async () => {
    await page.locator('#a-eccentricity').fill('0.5');
    const before = await page.locator('#instant-a').innerText();
    await page.locator('#play').click();
    await page.waitForFunction(previous => document.querySelector('#instant-a').textContent !== previous, before);
    await page.locator('#play').click();
    assert.match(await page.locator('#instant-a').innerText(), /km\/s/);
    await page.locator('#reset').click();
  });
  await check('four studies load coherent configurations and show their scope', async () => {
    assert.equal(await page.locator('[data-scenario]').count(), 4);
    await page.locator('[data-scenario="kepler"]').click();
    assert.equal(await page.locator('#a-eccentricity').inputValue(), '0.5');
    assert.equal(await page.locator('#b-altitude').inputValue(), '4462.6');
    assert.match(await page.locator('#scenario-note').innerText(), /mismo μ/);
    const period = page.locator('#results tr').filter({ has: page.locator('th', { hasText: 'Periodo orbital' }) });
    assert.equal(await period.locator('td:last-child').innerText(), '0,00 %');
    await page.locator('[data-scenario="moon"]').click();
    assert.equal(await page.locator('#b-body').inputValue(), 'moon');
    await page.locator('#a-altitude').fill('200');
    assert.match(await page.locator('#scenario-note').innerText(), /Exploración propia/);
    await page.locator('#reset').click();
  });
  await check('timeline, apsis shortcuts, reference switching and curve markers', async () => {
    await page.locator('[data-scenario="eccentricity"]').click();
    await page.locator('#reference').selectOption('1');
    await page.locator('#go-apoapsis').click();
    assert.equal(await page.locator('#phase').inputValue(), '50');
    assert.match(await page.locator('#instant-b').innerText(), /20\.313,00 km/);
    const marker = Number(await page.locator('#radius-history [data-time-marker="1"]').getAttribute('cx'));
    assert.ok(Math.abs(marker - 300) < 1e-8);
    const time = await page.locator('#elapsed').innerText();
    await page.locator('#reference').selectOption('0');
    assert.equal(await page.locator('#elapsed').innerText(), time);
    await page.locator('#phase').fill('25');
    assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('#phase').inputValue(), '25');
    await page.locator('#phase').fill('100');
    assert.equal(await page.locator('#phase').inputValue(), '100');
    await page.locator('#go-periapsis').click();
    assert.equal(await page.locator('#elapsed').innerText(), '0 s');
    assert.equal(await page.locator('#radius-history [data-time-series]').count(), 2);
    await page.locator('#reset').click();
  });
  await check('predictions respond to current values and clear when parameters change', async () => {
    await page.locator('#prediction-answer').selectOption('lower');
    await page.locator('#check-prediction').click();
    assert.match(await page.locator('#prediction-feedback').innerText(), /Revisa/);
    await page.locator('#prediction-answer').selectOption('higher');
    await page.locator('#check-prediction').click();
    assert.match(await page.locator('#prediction-feedback').innerText(), /Correcto/);
    await page.locator('#b-altitude').fill('400');
    assert.doesNotMatch(await page.locator('#prediction-feedback').innerText(), /Correcto/);
    await page.locator('#prediction-answer').selectOption('equal');
    await page.locator('#check-prediction').click();
    assert.match(await page.locator('#prediction-feedback').innerText(), /Correcto/);
    await page.locator('#reset').click();
  });
  await check('JSON and CSV download actual portable data', async () => {
    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#export-json').click()]);
    assert.equal(jsonDownload.suggestedFilename(), 'aerolab-configuraciones.json');
    const saved = JSON.parse(await readFile(await jsonDownload.path(), 'utf8'));
    assert.equal(saved.version, 2);
    assert.equal(saved.configurations[0].altitude, 400);
    const [csvDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#export-csv').click()]);
    const csv = await readFile(await csvDownload.path(), 'utf8');
    assert.equal(csv.trim().split('\n').length, 483);
    assert.match(csv, /speed_km_s/);
  });
  await check('import button opens a chooser and imports validated JSON without saving', async () => {
    const previousSave = await page.evaluate(() => localStorage.getItem('aerolab.space.circular.v1'));
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#import-json').click()]);
    await chooser.setFiles({ name: 'experiment.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 2, configurations: [
      { body: 'earth', mu: 398600.435507, radius: 6371, altitude: 700, eccentricity: 0.3 },
      { body: 'earth', mu: 398600.435507, radius: 6371, altitude: 900, eccentricity: 0.4 },
    ] })) });
    await page.waitForFunction(() => document.querySelector('#a-altitude').value === '700');
    assert.equal(await page.locator('#b-eccentricity').inputValue(), '0.4');
    assert.equal(await page.evaluate(() => localStorage.getItem('aerolab.space.circular.v1')), previousSave);
  });
  await check('bad and oversized imports preserve current configurations', async () => {
    await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('No se pudo importar'));
    assert.equal(await page.locator('#a-altitude').inputValue(), '700');
    await page.locator('#import-file').setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(17000) });
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('16 KiB'));
    assert.equal(await page.locator('#a-altitude').inputValue(), '700');
    await page.locator('#reset').click();
    await page.locator('#a-altitude').fill('');
    for (const id of ['export-json', 'export-csv', 'phase', 'check-prediction']) assert.ok(await page.locator(`#${id}`).isDisabled());
    assert.equal(await page.locator('#radius-history [data-time-series]').count(), 1);
    await page.locator('#reset').click();
  });
  await check('parameter sweep computes actual values, selector and data table', async () => {
    await page.locator('#sweep-form button[type="submit"]').click();
    assert.equal(await page.locator('#sweep-table tr').count(), 41);
    assert.equal(await page.locator('[data-sweep-curve]').count(), 1);
    await page.locator('#sweep-sample').fill('40');
    assert.match(await page.locator('#sweep-result').innerText(), /2\.000,00 km/);
    await page.locator('.sweep-data summary').click();
    assert.ok(await page.locator('#sweep-table').isVisible());
    await page.locator('.sweep-data summary').click();
  });
  await check('sweep rejects invalid ranges and never keeps stale results', async () => {
    await page.locator('#sweep-min').fill('3000');
    assert.equal(await page.locator('#sweep-table tr').count(), 0);
    assert.ok(await page.locator('#apply-sweep').isDisabled());
    await page.locator('#sweep-form button[type="submit"]').click();
    assert.match(await page.locator('#sweep-status').innerText(), /Intervalo inválido/);
    assert.equal(await page.locator('#sweep-min').getAttribute('aria-invalid'), 'true');
    await page.locator('#sweep-min').fill('200');
    await page.locator('#sweep-form button[type="submit"]').click();
    await page.locator('#a-altitude').fill('');
    assert.equal(await page.locator('[data-sweep-curve]').count(), 0);
    await page.locator('#sweep-form button[type="submit"]').click();
    assert.match(await page.locator('#sweep-status').innerText(), /Corrige la configuración/);
    await page.locator('#reset').click();
  });
  await check('eccentricity sweep exports its real samples and applies only target B', async () => {
    await page.locator('#sweep-target').selectOption('1');
    await page.locator('#sweep-variable').selectOption('eccentricity');
    await page.locator('#sweep-count').selectOption('21');
    await page.locator('#sweep-metric').selectOption('apoapsisVelocity');
    await page.locator('#sweep-form button[type="submit"]').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export-sweep').click()]);
    const csv = await readFile(await download.path(), 'utf8');
    assert.equal(csv.trim().split('\n').length, 22);
    assert.match(csv, /period_s/);
    await page.locator('#sweep-sample').fill('20');
    const unchangedA = await page.locator('#a-eccentricity').inputValue();
    await page.locator('#apply-sweep').click();
    assert.equal(await page.locator('#b-eccentricity').inputValue(), '0.8');
    assert.equal(await page.locator('#a-eccentricity').inputValue(), unchangedA);
    assert.equal(await page.locator('#elapsed').innerText(), '0 s');
    assert.ok(await page.locator('#export-sweep').isDisabled());
    await page.locator('#reset').click();
  });
  await check('desktop and mobile widths, accessible controls, module availability', async () => {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
      assert.ok(await page.locator('#save').isVisible());
      assert.equal(await page.locator('nav.modules a').count(), 3);
      assert.equal(await page.locator('input:not([aria-describedby])').count(), 0);
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.screenshot({ path: '/tmp/aerolab-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '/tmp/aerolab-mobile.png', fullPage: true });
    await page.goto(base);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'Saltar al laboratorio');
  });
  await check('storage unavailable handled by the UI', async () => {
    const unavailable = await browser.newContext();
    await unavailable.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage disabled', 'SecurityError'); } });
    });
    const other = await unavailable.newPage();
    await other.goto(base);
    await other.locator('#save').click();
    assert.match(await other.locator('#status').innerText(), /No se pudo guardar/);
    await other.locator('#load').click();
    assert.match(await other.locator('#status').innerText(), /No se pudo cargar/);
    await unavailable.close();
  });
  assert.deepEqual(errors, []);
  console.log(`${passed} browser checks passed; no uncaught JS errors.`);
} finally {
  await browser.close();
}
