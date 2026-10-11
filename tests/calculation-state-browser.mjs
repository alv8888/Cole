import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8060';let groups=0;
async function check(name,run){await run();groups++;console.log(`PASS ${name}`);}
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/aircraft.html`);
 await check('aircraft status survives saving and reveals invalid collapsed fields by keyboard',async()=>{
  const state=page.locator('#engineering-calculation-state');
  assert.equal(await state.getAttribute('data-state'),'ready');
  await page.locator('#engineering-save').click();assert.equal(await state.getAttribute('data-state'),'ready');
  await page.locator('#eng-area').fill('');
  assert.equal(await state.getAttribute('data-state'),'invalid');assert.ok(await page.locator('#engineering-export').isDisabled());
  await page.locator('#eng-area').evaluate(el=>el.closest('details').open=false);
  await state.locator('button').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'eng-area');
  assert.ok(await page.locator('#eng-area').isVisible());
  await page.locator('#eng-area').fill('16');assert.equal(await state.getAttribute('data-state'),'ready');
  await page.locator('#eng-groundSpeed').fill('20');await page.locator('#eng-windAlong').fill('30');assert.equal(await state.getAttribute('data-state'),'invalid');
  assert.match(await state.innerText(),/viento|flujo|velocidad/i);
  await page.locator('#engineering-reset').click();
 });
 await page.goto(`${base}/rocket.html`);
 await check('launch states distinguish uncomputed, calculated, saved and invalidated designs',async()=>{
  const state=page.locator('#launch-calculation-state');
  assert.equal(await state.getAttribute('data-state'),'pending');
  await page.locator('#launch-run').click();assert.equal(await state.getAttribute('data-state'),'ready');
  await page.locator('#launch-save').click();assert.equal(await state.getAttribute('data-state'),'ready');
  await page.locator('#launch-payload').fill('150');assert.equal(await state.getAttribute('data-state'),'pending');
  assert.ok(await page.locator('#launch-play').isDisabled());
  await page.locator('#stage-0-propellant').fill('');assert.equal(await state.getAttribute('data-state'),'invalid');
  await page.locator('#stage-0-propellant').evaluate(el=>el.closest('details').open=false);
  await state.locator('button').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'stage-0-propellant');
  await page.locator('#stage-0-propellant').fill('600');assert.equal(await state.getAttribute('data-state'),'pending');
  await page.locator('#launch-reset').click();assert.equal(await state.getAttribute('data-state'),'pending');
  assert.equal(await page.locator('#engineering-calculation-state').getAttribute('data-state'),'ready');
 });
 await page.goto(`${base}/index.html#lab`);
 await check('Space keeps independent valid results and reveals only the invalid configuration',async()=>{
  const a=page.locator('#space-a-calculation-state'),b=page.locator('#space-b-calculation-state');
  assert.equal(await a.getAttribute('data-state'),'ready');assert.equal(await b.getAttribute('data-state'),'ready');
  const resultA=await page.locator('#results tr').first().locator('td').first().innerText();
  await page.locator('#b-altitude').fill('');
  assert.equal(await a.getAttribute('data-state'),'ready');assert.equal(await b.getAttribute('data-state'),'invalid');
  assert.equal(await page.locator('#results tr').first().locator('td').first().innerText(),resultA);
  assert.equal(await page.locator('#results tr').first().locator('td').nth(1).innerText(),'—');
  assert.ok(await page.locator('#play').isDisabled());
  await page.locator('#b-altitude').evaluate(el=>el.closest('details').open=false);
  await page.setViewportSize({width:390,height:900});
  assert.ok((await b.boundingBox()).width>=280,'Space status must not be compressed into a narrow half-width column');
  await b.screenshot({path:'/tmp/aerolab-019-space-mobile.png'});
  await b.locator('button').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'b-altitude');
  await page.locator('#b-altitude').fill('800');assert.equal(await b.getAttribute('data-state'),'ready');
  await page.locator('#a-altitude').fill('');await page.locator('#b-altitude').fill('');
  assert.equal(await a.getAttribute('data-state'),'invalid');assert.match(await b.innerText(),/No hay órbitas válidas/);
  await page.locator('#a-altitude').fill('400');await page.locator('#b-altitude').fill('800');
 });
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(`${base}/structure.html`);
 await check('Structure preserves active solution and inactive drafts during review',async()=>{
  const panel=page.locator('#design-geometry-calculation-state');
  assert.equal(await panel.getAttribute('data-state'),'ready');
  await page.locator('#design-wing-thickness').fill('0.02');assert.equal(await panel.getAttribute('data-state'),'invalid');
  await page.locator('#design-object').selectOption('rocket');
  assert.equal(await panel.getAttribute('data-state'),'warning');assert.ok(await page.locator('#design-save').isDisabled());
  assert.ok(await page.locator('#design-csv').isEnabled());
  const physical=await page.locator('#design-results').innerText();
  await panel.locator('button').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'design-object');
  assert.equal(await page.locator('#design-object').inputValue(),'rocket');assert.equal(await page.locator('#design-results').innerText(),physical);
  await page.locator('#design-object').selectOption('aircraft');assert.equal(await page.locator('#design-wing-thickness').inputValue(),'0.02');
  await panel.locator('button').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'design-wing-thickness');
  await page.locator('#design-wing-thickness').fill('0.002');assert.equal(await panel.getAttribute('data-state'),'ready');
 });
 await check('Structure distinguishes invalid viewing settings and focuses controls in the loads tab without recalculating',async()=>{
  await page.locator('#tab-analysis').click();
  const panel=page.locator('#design-load-calculation-state');
  const revision=await page.locator('#design-view').getAttribute('data-physics-revision');
  const physical=await page.locator('#design-results').innerText();
  await page.locator('#design-magnification').fill('');assert.equal(await panel.getAttribute('data-state'),'warning');
  assert.match(await panel.innerText(),/resultados físicos se conservan/);
  await page.locator('#tab-simulation').click();await page.locator('#design-geometry-calculation-state button').click();
  assert.equal(await page.locator('#tab-analysis').getAttribute('aria-selected'),'true');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'design-magnification');
  assert.equal(await page.locator('#design-view').getAttribute('data-physics-revision'),revision);
  assert.equal(await page.locator('#design-results').innerText(),physical);
  await page.locator('#design-magnification').fill('20');assert.equal(await panel.getAttribute('data-state'),'ready');
  await page.locator('#design-force').fill('');assert.equal(await panel.getAttribute('data-state'),'invalid');
  await page.locator('#tab-simulation').click();await page.locator('#design-geometry-calculation-state button').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'design-force');
  await page.locator('#design-force').fill('14700');assert.equal(await panel.getAttribute('data-state'),'ready');
 });
 await check('Unsupported sphere UD analysis is explicitly geometry and mass only; legacy bank stays independent',async()=>{
  await page.locator('#tab-simulation').click();await page.locator('#design-object').selectOption('sphere');await page.locator('#design-material').selectOption('carbon');
  assert.equal(await page.locator('#design-geometry-calculation-state').getAttribute('data-state'),'partial');
  assert.match(await page.locator('#design-geometry-calculation-state').innerText(),/No se calculan esfuerzos/);
  await page.locator('#tab-analysis').click();await page.locator('#structure-legacy summary').first().click();
  assert.equal(await page.locator('#structure-calculation-state').getAttribute('data-state'),'ready');
  await page.locator('#str-length').fill('');assert.equal(await page.locator('#structure-calculation-state').getAttribute('data-state'),'invalid');
  await page.locator('#structure-calculation-state button').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'str-length');
  assert.equal(await page.locator('#tab-analysis').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#design-load-calculation-state').getAttribute('data-state'),'partial');
  await page.locator('#str-length').fill('2');await page.locator('#tab-simulation').click();await page.locator('#design-reset').click();
 });
 await check('state panels remain readable on mobile without global overflow or script errors',async()=>{
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.locator('#design-geometry-calculation-state').screenshot({path:'/tmp/aerolab-019-state-desktop.png'});
  await page.setViewportSize({width:390,height:900});await page.locator('#design-geometry-calculation-state').screenshot({path:'/tmp/aerolab-019-state-mobile.png'});
  assert.deepEqual(errors,[]);
 });
}finally{await browser.close();}
console.log(`${groups} calculation state browser groups passed.`);
