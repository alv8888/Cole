// Optional integration check. Playwright is a test tool, not an app dependency.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

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
  await check('save/load after reload; reset retains saved configurations', async () => {
    await page.locator('#a-altitude').fill('550');
    await page.locator('#b-altitude').fill('1200');
    await page.locator('#save').click();
    await page.reload();
    await page.locator('#load').click();
    assert.equal(await page.locator('#a-altitude').inputValue(), '550');
    assert.equal(await page.locator('#b-altitude').inputValue(), '1200');
    await page.locator('#reset').click();
    assert.equal(await page.locator('#a-altitude').inputValue(), '400');
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
  await check('desktop and mobile widths, accessible controls, module availability', async () => {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
      assert.ok(await page.locator('#save').isVisible());
      assert.equal(await page.locator('nav.modules a').count(), 1);
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
