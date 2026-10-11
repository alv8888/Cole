import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8060';let groups=0;
async function check(name,run){await run();groups++;console.log(`PASS ${name}`);}
function parseCSV(text){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(value);value='';}
  else if(c==='\r'&&!quoted&&text[i+1]==='\n'){row.push(value);rows.push(row);row=[];value='';i++;}
  else value+=c;
 }return rows;
}
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/structure.html`);
 const rows=page.locator('#design-comparison-rows tr');
 await page.locator('#tab-theory').click();await page.locator('.design-comparison summary').click();
 const before=await page.evaluate(()=>({...localStorage}));
 await check('reference captures real design and reports linear load changes with a reproducible CSV',async()=>{
  await page.locator('#design-comparison-capture').click();assert.equal(await rows.count(),3);
  await page.locator('#tab-analysis').click();await page.locator('#design-force').fill('29400');await page.locator('#tab-theory').click();
  assert.equal(await rows.nth(0).locator('td').nth(2).innerText(),'0');
  assert.match(await rows.nth(1).locator('td').nth(3).innerText(),/^100 %$/);
  const pending=page.waitForEvent('download');await page.locator('#design-comparison-csv').click();const download=await pending;
  assert.equal(download.suggestedFilename(),'aerolab-structure-comparison.csv');
  const csv=parseCSV(await readFile(await download.path(),'utf8'));
  assert.equal(csv.length,4);assert.ok(csv.every(row=>row.length===11));
  assert.equal(JSON.parse(csv[1][8]).force,14700);assert.equal(JSON.parse(csv[1][9]).force,29400);
  assert.equal(Number(csv[2][5]),100);assert.equal(csv[2][6],'true');
  assert.deepEqual(await page.evaluate(()=>({...localStorage})),before);
  const revision=await page.locator('#design-view').getAttribute('data-physics-revision');
  await page.locator('#tab-analysis').click();await page.locator('#design-magnification').fill('');await page.locator('#tab-theory').click();
  assert.ok(await page.locator('#design-comparison-csv').isEnabled());assert.equal(await rows.count(),3);
  assert.equal(await page.locator('#design-view').getAttribute('data-physics-revision'),revision);
  await page.locator('#tab-analysis').click();await page.locator('#design-magnification').fill('20');await page.locator('#tab-theory').click();
 });
 await check('references survive resets and invalid inputs without exporting stale results',async()=>{
  await page.locator('#design-comparison-capture').click();await page.locator('#tab-simulation').click();await page.locator('#design-reset').click();await page.locator('#tab-theory').click();
  assert.match(await rows.nth(1).locator('td').nth(3).innerText(),/^-50 %$/);
  await page.locator('#tab-analysis').click();await page.locator('#design-force').fill('');await page.locator('#tab-theory').click();
  assert.equal(await rows.count(),0);assert.ok(await page.locator('#design-comparison-csv').isDisabled());
  assert.match(await page.locator('#design-comparison-reference').innerText(),/29\.400/);
  await page.locator('#tab-analysis').click();await page.locator('#design-force').fill('14700');await page.locator('#tab-theory').click();
  assert.equal(await rows.count(),3);assert.match(await rows.nth(1).locator('td').nth(3).innerText(),/^-50 %$/);
 });
 await check('references are isolated by object and incompatible physical criteria remain explicit',async()=>{
  await page.locator('#tab-simulation').click();await page.locator('#design-object').selectOption('rocket');await page.locator('#tab-theory').click();
  assert.equal(await rows.count(),0);await page.locator('#design-comparison-capture').click();
  await page.locator('#tab-simulation').click();await page.locator('#design-object').selectOption('aircraft');await page.locator('#design-wing-thickness').fill('0.02');await page.locator('#design-object').selectOption('rocket');await page.locator('#tab-theory').click();
  assert.equal(await rows.count(),3);assert.ok(await page.locator('#design-comparison-csv').isDisabled());assert.ok(await page.locator('#design-comparison-capture').isDisabled());
  await page.locator('#tab-simulation').click();await page.locator('#design-object').selectOption('aircraft');await page.locator('#design-wing-thickness').fill('0.002');await page.locator('#tab-theory').click();
  await page.locator('#tab-simulation').click();await page.locator('#design-object').selectOption('aircraft');await page.locator('#design-material').selectOption('carbon');await page.locator('#tab-theory').click();
  assert.match(await rows.nth(1).innerText(),/Criterios distintos/);assert.equal(await rows.nth(1).locator('td').nth(2).innerText(),'—');
  await page.locator('#tab-analysis').click();await page.locator('#design-case').selectOption('thermal');await page.locator('#tab-theory').click();
  assert.match(await rows.nth(2).innerText(),/caso de carga distinto/);
  await page.locator('#tab-simulation').click();await page.locator('#design-reset').click();await page.locator('#design-object').selectOption('sphere');await page.locator('#tab-theory').click();await page.locator('#design-comparison-capture').click();
  await page.locator('#tab-simulation').click();await page.locator('#design-material').selectOption('carbon');await page.locator('#tab-theory').click();
  assert.match(await rows.nth(1).innerText(),/Magnitud no calculada/);assert.match(await rows.nth(2).innerText(),/Magnitud no calculada/);
 });
 await check('comparison is keyboard accessible and scrolls locally on mobile; reload clears temporary references',async()=>{
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.evaluate(()=>document.body.style.zoom='2');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>document.body.style.zoom='');
  await page.locator('.design-comparison').screenshot({path:'/tmp/aerolab-020-comparison-desktop.png'});
  await page.setViewportSize({width:390,height:900});await page.locator('.design-comparison').screenshot({path:'/tmp/aerolab-020-comparison-mobile.png'});
  await page.locator('.design-comparison summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.design-comparison').getAttribute('open'),null);
  await page.keyboard.press('Enter');await page.locator('#design-comparison-clear').click();assert.equal(await rows.count(),0);
  await page.reload();await page.locator('#tab-theory').click();await page.locator('.design-comparison summary').click();
  assert.equal(await rows.count(),0);assert.ok(await page.locator('#design-comparison-csv').isDisabled());assert.deepEqual(errors,[]);
 });
}finally{await browser.close();}
console.log(`${groups} design comparison browser groups passed.`);
