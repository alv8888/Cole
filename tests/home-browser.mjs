import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.AEROLAB_URL ?? 'http://127.0.0.1:8060';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
let groups = 0;
async function check(name, run) { await run(); groups++; console.log(`PASS ${name}`); }
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url()));
  await page.goto(base); await page.waitForSelector('#home-orbit [data-satellite]');
  await check('entry uses an independent calculated SVG demo and defers orbital WebGL', async () => {
    assert.equal(await page.locator('[data-home-card]').count(),4);
    assert.equal(await page.locator('#home-play').getAttribute('aria-pressed'),'false');
    assert.equal(await page.locator('#orbit-globe .globe-host').getAttribute('data-state'),'deferred');
    assert.equal(requests.filter(url=>url.includes('/vendor/three/')).length,0);
    assert.ok((await page.locator('#home-orbit').boundingBox()).y < 900);
    const old = await page.locator('#a-eccentricity').inputValue();
    await page.locator('#home-e').fill('0');
    assert.match(await page.locator('#home-speed').innerText(),/7,67/);
    assert.match(await page.locator('#home-period').innerText(),/92,4/);
    await page.locator('#home-e').fill('0.5'); await page.locator('#home-time').fill('50');
    assert.match(await page.locator('#home-altitude').innerText(),/13\.942/);
    assert.match(await page.locator('#home-period').innerText(),/261,4/);
    assert.equal(await page.locator('#a-eccentricity').inputValue(),old);
  });
  await check('play, pause and leaving the demo stop playback', async () => {
    await page.locator('#home-play').click();
    await page.waitForFunction(()=>Number(document.querySelector('#home-time').value)>50);
    await page.locator('#home-play').click();
    assert.equal(await page.locator('#home-play').getAttribute('aria-pressed'),'false');
    await page.locator('#home-play').click(); await page.locator('.home-actions a[href="#catalogo"]').click();
    await page.waitForFunction(()=>document.querySelector('#home-play').getAttribute('aria-pressed')==='false');
  });
  await check('thematic filtering and numerical previews use available experiences', async () => {
    await page.locator('[data-home-filter=forces]').click();
    assert.equal(await page.locator('[data-home-card]:visible').count(),2);
    await page.locator('[data-home-preview=aircraft]').click();
    await page.waitForFunction(()=>document.querySelector('#home-preview').getAttribute('aria-busy')==='false');
    assert.match(await page.locator('#home-preview-metrics').innerText(),/14\.700,00 N/);
    assert.match(await page.locator('#home-preview-note').innerText(),/no están equilibrados/);
    await page.locator('#home-preview-close').focus(); await page.keyboard.press('Escape');
    assert.ok(await page.locator('#home-preview').isHidden());
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.homePreview),'aircraft');
    await page.locator('[data-home-filter=all]').click();
    for(const [id,match] of [['rocket',/1\.318,33 m\/s/],['structure',/305,51 kg/],['space',/7,67 km\/s/]]) {
      await page.locator(`[data-home-preview=${id}]`).click();
      await page.waitForFunction(()=>document.querySelector('#home-preview').getAttribute('aria-busy')==='false');
      assert.match(await page.locator('#home-preview-metrics').innerText(),match);
    }
    await page.locator('[data-home-filter=motion]').click();
    assert.ok(await page.locator('#home-preview').isHidden());
    assert.equal(await page.locator('[data-home-card]:visible').count(),2);
  });
  await check('explicit demo application preserves B and local saves; existing Space controls work', async () => {
    await page.locator('#b-altitude').fill('1300'); await page.locator('#save').click();
    const saved = await page.evaluate(()=>({...localStorage}));
    await page.locator('#home-e').fill('0.5'); await page.locator('#home-apply').click();
    assert.equal(await page.locator('#a-eccentricity').inputValue(),'0.5');
    assert.equal(await page.locator('#b-altitude').inputValue(),'1300');
    assert.deepEqual(await page.evaluate(()=>({...localStorage})),saved);
    assert.ok(page.url().endsWith('#lab'));
    await page.locator('#go-apoapsis').click();
    assert.match(await page.locator('#instant-a').innerText(),/km/);
    await page.locator('#load').click(); assert.equal(await page.locator('#a-eccentricity').inputValue(),'0');
  });
  await check('direct laboratory routes and shared return-to-catalog navigation', async () => {
    for (const file of ['aircraft.html','rocket.html','structure.html']) {
      await page.goto(`${base}/index.html#catalogo`);
      await page.locator(`[data-home-card] a[href="${file}"]`).click();
      assert.ok(page.url().endsWith(file));
      await page.locator('.catalog-return').click();
      assert.ok(page.url().endsWith('index.html#catalogo'));
      await page.waitForSelector('[data-home-card]');
    }
  });
  await check('entry and catalog reflow at 320–1440px and 200% zoom', async () => {
    await page.goto(base);
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
      await page.locator('[data-home-preview=structure]').click();
      await page.waitForFunction(()=>document.querySelector('#home-preview').getAttribute('aria-busy')==='false');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`preview overflow ${width}`);
      await page.locator('#home-preview-close').click();
    }
    await page.evaluate(()=>document.body.style.zoom='2');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.evaluate(()=>document.body.style.zoom='');
    await page.goto(base);
    await page.screenshot({path:'/tmp/aerolab-015-home-desktop.png'});
    await page.locator('#catalogo').screenshot({path:'/tmp/aerolab-015-catalog-desktop.png'});
    await page.setViewportSize({width:390,height:900}); await page.goto(base);
    await page.screenshot({path:'/tmp/aerolab-015-home-mobile.png'});
    await page.locator('#catalogo').screenshot({path:'/tmp/aerolab-015-catalog-mobile.png'});
  });
  await check('failed lazy preview is reported and stale results cannot replace another selection', async () => {
    const bad = await context.newPage(); await bad.route('**/src/structure/design/model.js',route=>route.abort());
    await bad.goto(base); await bad.locator('[data-home-preview=structure]').click();
    await bad.waitForFunction(()=>document.querySelector('#home-preview-note').textContent.includes('No se pudo cargar'));
    assert.equal(await bad.locator('#home-preview-metrics>div').count(),0);
    assert.equal(await bad.locator('#home-preview-open').getAttribute('href'),'structure.html');
    await bad.locator('[data-home-preview=aircraft]').click();
    await bad.waitForFunction(()=>document.querySelector('#home-preview-metrics').textContent.includes('14.700'));
    assert.equal(await bad.locator('#home-preview-title').innerText(),'Aircraft Lab');
    await bad.close();
    const race = await context.newPage(); let release;
    const gate = new Promise(resolve => release = resolve);
    await race.route('**/src/structure/design/model.js', async route => { await gate; await route.continue(); });
    await race.goto(base); await race.locator('[data-home-preview=structure]').click();
    await race.locator('[data-home-preview=aircraft]').click();
    await race.waitForFunction(()=>document.querySelector('#home-preview-metrics').textContent.includes('14.700'));
    release();
    await race.waitForResponse(response => response.url().includes('/src/structure/design/model.js'));
    // Complete the pending model work before checking that it did not overwrite Aircraft.
    await race.evaluate(async () => { const {previewModel}=await import('./src/home/models.js'); await previewModel('structure'); });
    assert.equal(await race.locator('#home-preview-title').innerText(),'Aircraft Lab');
    assert.match(await race.locator('#home-preview-metrics').innerText(),/14\.700,00 N/);
    await race.close();
  });
  await check('no new external requests or uncaught JavaScript errors', async () => {
    assert.deepEqual(errors,[]);
    assert.deepEqual(requests.filter(url=>!url.startsWith(base)&&!url.startsWith('data:')),[]);
  });
} finally { await browser.close(); }
console.log(`${groups} homepage browser checks passed.`);
