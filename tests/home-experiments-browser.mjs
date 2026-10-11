import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8060';
let groups=0;
async function ready(page){await page.waitForFunction(()=>document.querySelector('#home-preview').getAttribute('aria-busy')==='false');}
async function check(name,run){await run();groups++;console.log(`PASS ${name}`);}
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 await check('live Aircraft experiment, meaningful curve, keyboard samples and reset',async()=>{
  await page.locator('[data-home-preview=aircraft]').click();await ready(page);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'home-experiment-value');
  await page.locator('#home-experiment-value').fill('60');await ready(page);
  assert.match(await page.locator('#home-preview-metrics').innerText(),/21\.168,00 N/);
  assert.match(await page.locator('#home-experiment-chart').getAttribute('aria-label'),/m\/s/);
  await page.locator('#home-experiment-chart').focus();await page.keyboard.press('End');
  assert.match(await page.locator('#home-experiment-readout').innerText(),/Caso 21\/21/);
  assert.match(await page.locator('#home-experiment-readout').innerText(),/90 m\/s/);
  await page.keyboard.press('Home');assert.match(await page.locator('#home-experiment-readout').innerText(),/30 m\/s/);
  await page.locator('#home-experiment-reset').click();await ready(page);
  assert.equal(await page.locator('#home-experiment-value').inputValue(),'50');
 });
 await check('invalid values clear metrics, curve and continuation; rapid edits keep latest case',async()=>{
  await page.locator('#home-experiment-value').fill('');
  assert.equal(await page.locator('#home-experiment-value').getAttribute('aria-invalid'),'true');
  assert.equal(await page.locator('#home-preview-metrics>div').count(),0);
  assert.ok(await page.locator('#home-experiment-figure').isHidden());assert.ok(await page.locator('#home-preview-open').isHidden());
  await page.locator('#home-experiment-value').fill('100');assert.ok(await page.locator('#home-preview-open').isHidden());
  await page.locator('#home-experiment-value').fill('40');await page.locator('#home-experiment-value').fill('70');await ready(page);
  assert.match(await page.locator('#home-preview-metrics').innerText(),/28\.812,00 N/);
  const sim=JSON.parse(new URL(await page.locator('#home-preview-open').getAttribute('href')).searchParams.get('sim'));
  assert.equal(sim.aircraft.configuration.groundSpeed,70);
 });
 await check('continuation restores Aircraft, Rocket and Structure cases without writing saves',async()=>{
  // Seed real saved cases distinct from the experiments, using their original controls.
  await page.goto(`${base}/aircraft.html`); await page.locator('#eng-groundSpeed').fill('55'); await page.locator('#engineering-save').click();
  await page.goto(`${base}/rocket.html`); await page.locator('#eng-propellant').fill('300'); await page.locator('#engineering-save').click();
  await page.locator('#launch-save').click();
  await page.goto(`${base}/structure.html`); await page.locator('#design-wing-thickness').fill('0.0015'); await page.locator('#design-save').click();
  await page.locator('#tab-analysis').click(); await page.locator('#structure-legacy summary').first().click(); await page.locator('#structure-save').click();
  await page.evaluate(()=>localStorage.setItem('aerolab.test.preserve','original'));
  for(const [id,value,target] of [['aircraft','70','#eng-groundSpeed'],['rocket','450','#eng-propellant'],['structure','3','#design-wing-thickness']]) {
   await page.goto(base);await page.locator(`[data-home-preview=${id}]`).click();await ready(page);
   await page.locator('#home-experiment-value').fill(value);await ready(page);
   const storage=await page.evaluate(()=>({...localStorage}));
   await page.locator('#home-preview-open').click();
   await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('recuperad'));
   assert.equal(await page.locator(target).inputValue(),id==='structure'?'0.003':value);
   const after=await page.evaluate(()=>({...localStorage}));
   // Entering labs already updates these live import snapshots; saved configurations must be identical.
   const snapshots=new Set(['aerolab.bridge.snapshot.aircraft.v1','aerolab.bridge.snapshot.calculator.v1','aerolab.bridge.snapshot.launch.v1']);
   for(const object of [storage,after])for(const key of snapshots)delete object[key];
   assert.deepEqual(after,storage);
   if(id==='aircraft') {await page.locator('#engineering-load').click();assert.equal(await page.locator(target).inputValue(),'55');}
   if(id==='rocket') {await page.locator('#engineering-load').click();assert.equal(await page.locator(target).inputValue(),'300');}
   if(id==='structure') {await page.locator('#design-load').click();assert.equal(await page.locator(target).inputValue(),'0.0015');}
   if(id==='rocket'){assert.equal(await page.locator('#eng-dryMass').inputValue(),'100');assert.ok(await page.locator('#launch-play').isDisabled());}
   if(id==='structure')assert.match(await page.locator('#design-model-label').innerText(),/FEM 1D/);
  }
 });
 await check('Space example changes A explicitly and preserves B and localStorage',async()=>{
  await page.goto(base);await page.locator('#b-altitude').fill('1800');await page.locator('#save').click();
  const storage=await page.evaluate(()=>({...localStorage}));
  await page.locator('[data-home-preview=space]').click();await ready(page);
  await page.locator('#home-experiment-value').fill('1500');await ready(page);
  assert.equal(await page.locator('#a-altitude').inputValue(),'400');
  await page.locator('#home-preview-open').click();
  assert.equal(await page.locator('#a-altitude').inputValue(),'1500');assert.equal(await page.locator('#b-altitude').inputValue(),'1800');
  assert.equal(await page.locator('#a-eccentricity').inputValue(),'0');assert.deepEqual(await page.evaluate(()=>({...localStorage})),storage);
 });
 await check('experimental chart stays locally scrollable at mobile widths and 200% zoom',async()=>{
  await page.goto(base);await page.locator('[data-home-preview=structure]').click();await ready(page);
  for(const width of [320,390,768,1440]) {
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.evaluate(()=>document.body.style.zoom='2');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>document.body.style.zoom='');
  await page.setViewportSize({width:1440,height:1000});await page.locator('#home-preview').screenshot({path:'/tmp/aerolab-016-experiment-desktop.png'});
  await page.setViewportSize({width:390,height:900});await page.locator('#home-preview').screenshot({path:'/tmp/aerolab-016-experiment-mobile.png'});
  assert.deepEqual(errors,[]);
 });
} finally {await browser.close();}
console.log(`${groups} experiment browser groups passed.`);
