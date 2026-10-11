import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
let count = 0;
async function check(name, run) { await run(); console.log(`PASS ${name}`); count++; }
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${process.env.AEROLAB_URL??'http://127.0.0.1:8001'}/aircraft.html`);
  await check('Aircraft lateral: cuatro flechas, barras y referencia inicial',async()=>{
    assert.equal(await page.locator('#aircraft-side [data-force]').count(),4);
    assert.equal(await page.locator('#aircraft-forces [data-force-bar]').count(),4);
    assert.match(await page.locator('#aircraft-balance').innerText(),/26,00 N/);
    assert.match(await page.locator('#aircraft-balance').innerText(),/2\.932,02 N/);
    assert.equal(await page.locator('#aircraft-flow-toggle').getAttribute('aria-pressed'),'false');
  });
  await check('Aircraft lateral: peso/masa bidireccionales y escritura gradual',async()=>{
    await page.locator('#aircraft-weight').fill('');await page.locator('#aircraft-weight').pressSequentially('19613.3');
    assert.equal(await page.locator('#aircraft-weight').inputValue(),'19613.3');
    assert.ok(Math.abs(Number(await page.locator('#eng-mass').inputValue())-2000)<1e-9);
    await page.locator('#eng-mass').fill('1000');assert.ok(Math.abs(Number(await page.locator('#aircraft-weight').inputValue())-9806.65)<1e-9);
    await page.locator('#aircraft-weight').fill('1');assert.equal(await page.locator('#aircraft-weight').getAttribute('aria-invalid'),'true');
    assert.equal(await page.locator('#aircraft-forces rect').count(),0);
    await page.locator('#engineering-reset').click();
  });
  await check('Aircraft lateral: CD directo y equilibrio calculado',async()=>{
    await page.locator('#aircraft-drag-mode').selectOption('direct');assert.ok(await page.locator('#eng-cdTotal').isEnabled());assert.ok(await page.locator('#eng-cd0').isDisabled());
    await page.locator('#eng-density').fill('1.2');await page.locator('#eng-area').fill('20');await page.locator('#eng-mass').fill('1000');
    await page.locator('#eng-cl').fill(String(9806.65/30000));await page.locator('#eng-cdTotal').fill('0.03');await page.locator('#eng-thrust').fill('900');
    assert.match(await page.locator('#aircraft-balance').innerText(),/Eje horizontal: equilibrio aproximado/);
    assert.match(await page.locator('#aircraft-balance').innerText(),/Eje vertical: equilibrio aproximado/);
    const liftWidth=Number(await page.locator('[data-force-bar=lift]').getAttribute('width'));
    const weightWidth=Number(await page.locator('[data-force-bar=weight]').getAttribute('width'));assert.ok(Math.abs(liftWidth-weightWidth)<1e-8);
    await page.locator('#eng-thrust').fill('1800');assert.match(await page.locator('#aircraft-balance').innerText(),/fuerza neta hacia delante/);
  });
  await check('Aircraft lateral: proyección vertical, viento lateral e invalidez',async()=>{
    await page.locator('#engineering-reset').click();await page.locator('#eng-windVertical').fill('10');
    assert.ok(Number(await page.locator('[data-force=lift]').getAttribute('x2'))>270);
    await page.locator('#eng-windCross').fill('1');assert.match(await page.locator('#aircraft-balance').innerText(),/solo magnitudes/);
    assert.equal(await page.locator('#aircraft-side [data-force]').count(),0);assert.equal(await page.locator('#aircraft-forces rect').count(),4);
    await page.locator('#eng-area').fill('');assert.equal(await page.locator('#aircraft-forces rect').count(),0);
    assert.ok(await page.locator('#aircraft-flow-toggle').isDisabled());assert.ok(await page.locator('#engineering-save').isDisabled());
    await page.locator('#engineering-reset').click();
  });
  await check('Aircraft lateral: animación ilustrativa inicia, pausa y no altera fuerzas',async()=>{
    const before=await page.locator('#aircraft-balance').innerText();await page.locator('#aircraft-flow-toggle').click();
    await page.waitForFunction(()=>Number(document.querySelector('.aircraft-flow').getAttribute('stroke-dashoffset'))>0);
    assert.equal(await page.locator('#aircraft-balance').innerText(),before);
    await page.locator('#aircraft-flow-toggle').click();const offset=await page.locator('.aircraft-flow').getAttribute('stroke-dashoffset');
    await page.waitForTimeout(120);assert.equal(await page.locator('.aircraft-flow').getAttribute('stroke-dashoffset'),offset);
    assert.equal(await page.locator('#aircraft-flow-toggle').getAttribute('aria-pressed'),'false');
  });
  await check('Aircraft lateral: migración sin sobrescritura y persistencia/exportación v2',async()=>{
    const legacy=await page.evaluate(()=>{
      const c=Object.fromEntries([...document.querySelectorAll('#engineering-fields input')].map(input=>[input.id.slice(4),Number(input.value)]));
      delete c.thrust;delete c.cdTotal;const raw=JSON.stringify({version:1,module:'aircraft',configuration:c});localStorage.setItem('aerolab.aircraft.v1',raw);return raw;
    });
    await page.locator('#engineering-load').click();assert.match(await page.locator('#engineering-status').innerText(),/Guardado anterior/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('aerolab.aircraft.v1')),legacy);
    await page.locator('#aircraft-drag-mode').selectOption('direct');await page.locator('#eng-cdTotal').fill('0.04');await page.locator('#eng-thrust').fill('2000');
    await page.locator('#engineering-save').click();await page.reload();await page.locator('#engineering-load').click();
    assert.equal(await page.locator('#aircraft-drag-mode').inputValue(),'direct');assert.equal(await page.locator('#eng-thrust').inputValue(),'2000');
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#engineering-export').click()]);
    const saved=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(saved.version,2);assert.equal(saved.configuration.cdTotal,.04);assert.equal(saved.configuration.dragMode,'direct');
    await page.evaluate(()=>localStorage.setItem('aerolab.aircraft.v1',JSON.stringify({version:2,module:'aircraft',configuration:{mass:1000}})));
    await page.locator('#engineering-load').click();assert.match(await page.locator('#engineering-status').innerText(),/No se pudo cargar/);assert.equal(await page.locator('#eng-thrust').inputValue(),'2000');
  });
  await check('Aircraft lateral: controles etiquetados, móviles y capturas',async()=>{
    await page.locator('#engineering-reset').click();
    for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
    assert.equal(await page.locator('#engineering-form input:not([aria-describedby])').count(),0);
    await page.setViewportSize({width:1440,height:1000});await page.locator('.engineering-layout').screenshot({path:'/tmp/aerolab-aircraft-forces-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.locator('.engineering-visual').screenshot({path:'/tmp/aerolab-aircraft-forces-mobile.png'});
  });
  assert.deepEqual(errors,[]);console.log(`${count} aircraft force browser checks passed.`);
} finally { await browser.close(); }
