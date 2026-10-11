import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8060';let groups=0;
const ready=page=>page.waitForFunction(()=>document.querySelector('#home-preview').getAttribute('aria-busy')==='false');
async function check(name,run){await run();groups++;console.log(`PASS ${name}`);}
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await check('reference comparison has exact changes, custom capture and independent resets',async()=>{
  await page.locator('[data-home-preview=aircraft]').click();await ready(page);
  await page.locator('#home-experiment-comparison summary').click();
  await page.locator('#home-experiment-value').fill('60');await ready(page);
  assert.match(await page.locator('#home-comparison-rows tr').first().innerText(),/\+44,00 %/);
  await page.locator('#home-reference-capture').click();
  assert.match(await page.locator('#home-comparison-reference').innerText(),/60,00 m\/s/);
  await page.locator('#home-experiment-value').fill('70');await ready(page);
  assert.match(await page.locator('#home-comparison-rows tr').first().innerText(),/\+36,11 %/);
  await page.locator('#home-experiment-reset').click();await ready(page);
  assert.match(await page.locator('#home-comparison-reference').innerText(),/Referencia:.*60,00/);
  await page.locator('#home-reference-reset').click();
  assert.match(await page.locator('#home-comparison-rows tr').first().innerText(),/0,00 %/);
  assert.ok(await page.locator('#home-reference-reset').isDisabled());
 });
 await check('references remain isolated by laboratory and never write saves',async()=>{
  const before=await page.evaluate(()=>({...localStorage}));
  await page.locator('#home-experiment-value').fill('65');await ready(page);await page.locator('#home-reference-capture').click();
  await page.locator('[data-home-preview=rocket]').click();await ready(page);
  assert.match(await page.locator('#home-comparison-reference').innerText(),/200,00 kg/);
  await page.locator('[data-home-preview=aircraft]').click();await ready(page);
  assert.match(await page.locator('#home-comparison-reference').innerText(),/65,00 m\/s/);
  assert.deepEqual(await page.evaluate(()=>({...localStorage})),before);
  await page.locator('#home-experiment-value').fill('');
  assert.ok(await page.locator('#home-experiment-comparison').isHidden());
  assert.ok(await page.locator('#home-comparison-csv').isDisabled());assert.equal(await page.locator('#home-comparison-rows tr').count(),0);
  await page.locator('#home-experiment-value').fill('70');await ready(page);
  assert.match(await page.locator('#home-comparison-reference').innerText(),/65,00 m\/s/);
 });
 await check('download contains current reference and samples; pending edits cannot export stale data',async()=>{
  const pending=page.waitForEvent('download');await page.locator('#home-comparison-csv').click();const download=await pending;
  assert.equal(download.suggestedFilename(),'aerolab-aircraft-experimento.csv');
  const csv=await readFile(await download.path(),'utf8');
  assert.match(csv,/"comparison"/);assert.match(csv,/"65","70"/);assert.match(csv,/"28812"/);
  assert.equal((csv.match(/"sweep"/g)??[]).length,21);assert.match(csv,/current_config_json/);
  await page.locator('#home-experiment-value').fill('100');assert.ok(await page.locator('#home-comparison-csv').isDisabled());
  await page.locator('#home-experiment-value').fill('70');await ready(page);
 });
 await check('comparison supports keyboard disclosure, mobile scrolling and clean console',async()=>{
  const summary=page.locator('#home-experiment-comparison summary');await summary.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#home-experiment-comparison').getAttribute('open'),null);
  await page.keyboard.press('Enter');assert.notEqual(await page.locator('#home-experiment-comparison').getAttribute('open'),null);
  for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.evaluate(()=>document.body.style.zoom='2');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>document.body.style.zoom='');
  await page.locator('#home-experiment-comparison').screenshot({path:'/tmp/aerolab-017-comparison-desktop.png'});
  await page.setViewportSize({width:390,height:900});await page.locator('#home-experiment-comparison').screenshot({path:'/tmp/aerolab-017-comparison-mobile.png'});
  assert.deepEqual(errors,[]);
 });
} finally {await browser.close();}
console.log(`${groups} comparison browser groups passed.`);
