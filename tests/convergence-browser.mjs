import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8060';let groups=0;
async function check(name,run){await run();groups++;console.log(`PASS ${name}`);}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/structure.html`);
 const physical=await page.locator('#design-results').textContent(),revision=await page.locator('#design-view').getAttribute('data-physics-revision');
 await page.locator('#tab-theory').click();await page.locator('.design-convergence > summary').click();
 await check('five real solutions leave the active design intact and export complete CSV',async()=>{
  assert.equal(await page.locator('#design-convergence-rows tr').count(),0);
  await page.locator('#design-convergence-run').click();assert.equal(await page.locator('#design-convergence-rows tr').count(),5);
  assert.equal(await page.locator('#design-elements').inputValue(),'16');assert.equal(await page.locator('#design-results').textContent(),physical);
  assert.equal(await page.locator('#design-view').getAttribute('data-physics-revision'),revision);
  await page.locator('#design-convergence-chart').focus();await page.keyboard.press('End');assert.match(await page.locator('#design-convergence-readout').innerText(),/48.*mm/);
  await page.locator('#design-convergence-metric').selectOption('stress');await page.locator('#design-convergence-chart').focus();await page.keyboard.press('End');assert.match(await page.locator('#design-convergence-readout').innerText(),/MPa/);
  const pending=page.waitForEvent('download');await page.locator('#design-convergence-csv').click();const csv=await readFile(await (await pending).path(),'utf8');
  assert.equal(csv.split('\r\n').length,7);assert.match(csv,/relative_equilibrium_residual/);assert.match(csv,/"48","48"/);assert.match(csv,/configuration_json/);
 });
 await check('visual settings preserve the study; physical edits invalidate stale results; sphere is excluded',async()=>{
  await page.locator('#tab-analysis').click();await page.locator('#design-magnification').fill('40');await page.locator('#tab-theory').click();
  assert.equal(await page.locator('#design-convergence-rows tr').count(),5);
  await page.locator('#tab-analysis').click();await page.locator('#design-force').fill('20000');await page.locator('#tab-theory').click();
  assert.equal(await page.locator('#design-convergence-rows tr').count(),0);assert.ok(await page.locator('#design-convergence-csv').isDisabled());
  await page.locator('#tab-simulation').click();await page.locator('#design-object').selectOption('sphere');await page.locator('#tab-theory').click();
  assert.ok(await page.locator('#design-convergence-run').isDisabled());assert.match(await page.locator('#design-convergence-status').innerText(),/analítico/);
 });
 await check('rocket actual counts, scientific warnings, keyboard and responsive charts remain usable',async()=>{
  await page.locator('#tab-simulation').click();await page.locator('#design-object').selectOption('rocket');await page.locator('#tab-theory').click();await page.locator('#design-convergence-run').click();
  const first=page.locator('#design-convergence-rows tr').first();assert.equal(await first.locator('td').nth(0).innerText(),'4');assert.equal(await first.locator('td').nth(1).innerText(),'5');
  assert.ok(await page.locator('#design-convergence-warnings li').count()>0);
  assert.match(await first.locator('td').nth(6).innerText(),/E-/);
  await page.evaluate(()=>document.body.style.zoom='2');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>document.body.style.zoom='');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.locator('.design-convergence').screenshot({path:'/tmp/aerolab-021-convergence-desktop.png'});
  await page.setViewportSize({width:390,height:900});await page.locator('.design-convergence').screenshot({path:'/tmp/aerolab-021-convergence-mobile.png'});
  await page.locator('.design-convergence > summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.design-convergence').getAttribute('open'),null);
  assert.deepEqual(errors,[]);
 });
}finally{await browser.close();}
console.log(`${groups} convergence browser groups passed.`);
