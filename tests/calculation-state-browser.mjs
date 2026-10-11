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
 await check('state panels remain readable on mobile without global overflow or script errors',async()=>{
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.locator('#launch-calculation-state').screenshot({path:'/tmp/aerolab-018-state-desktop.png'});
  await page.setViewportSize({width:390,height:900});await page.locator('#launch-calculation-state').screenshot({path:'/tmp/aerolab-018-state-mobile.png'});
  assert.deepEqual(errors,[]);
 });
}finally{await browser.close();}
console.log(`${groups} calculation state browser groups passed.`);
