import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8014';
let groups=0;
try {
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
 await context.addInitScript(() => {
  window.aerolabFrameCount = 0;
  const original = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = callback => original(time => { window.aerolabFrameCount++; callback(time); });
 });
 const page=await context.newPage(),errors=[],positions={};page.on('pageerror',e=>errors.push(e.message));
 for(const [file,lab,selector] of [['index.html','space','#orbit-globe canvas'],['aircraft.html','aircraft','#engineering-canvas'],['rocket.html','rocket','#rocket-globe canvas'],['structure.html','structure','#design-view canvas']]) {
  await page.setViewportSize({width:390,height:900});await page.goto(`${base}/${file}`);
  if(lab==='space') {
   await page.waitForSelector('#home-orbit [data-satellite]');
   assert.ok((await page.locator('#home-orbit').boundingBox()).y<900,'homepage demonstration is available in the entry viewport');
   await page.locator('.home-actions a[href="#lab"]').click();
  }
  await page.waitForSelector(selector);positions[lab]=await page.locator(selector).evaluate(el=>el.getBoundingClientRect().top+scrollY);
  if(lab==='space') positions[lab]=(await page.locator(selector).boundingBox()).y;
  assert.ok(positions[lab]<900,`${lab}: scene begins too low (${positions[lab]})`);
  for(const width of [320,768,1440]) {
   await page.setViewportSize({width,height:900});
   for(const tab of ['simulation','analysis','theory']) {
    await page.locator(`#tab-${tab}`).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lab}/${tab}/${width}: overflow`);
   }
   await page.locator('#tab-simulation').click();
  }
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>document.body.style.zoom='2');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lab}: 200% CSS zoom overflow`);
  await page.evaluate(()=>document.body.style.zoom='');
  await page.setViewportSize({width:390,height:900});
  await page.screenshot({path:`/tmp/aerolab-014-${lab}-mobile.png`,fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:`/tmp/aerolab-014-${lab}-desktop.png`});
  console.log(`PASS ${lab}: early scene, responsive tabs and 200% CSS zoom`);groups++;
 }
 await page.goto(`${base}/structure.html`);await page.waitForFunction(()=>document.querySelector('#design-view').dataset.rendered==='true');
 const revision=await page.locator('#design-view').getAttribute('data-physics-revision');
 const physical=await page.locator('#design-results').innerText();
 await page.locator('#design-display').selectOption('geometry');
 await page.waitForFunction(()=>document.querySelector('#design-view').dataset.display==='geometry');
 await page.locator('#design-mesh').uncheck();await page.locator('#design-nodes').uncheck();
 await page.locator('#tab-analysis').click();
 const normalBefore=Number(await page.locator('#design-view').getAttribute('data-normal-updates'));
 await page.locator('#design-fraction').fill('50');await page.locator('#design-magnification').fill('60');
 await page.waitForFunction(before=>Number(document.querySelector('#design-view').dataset.normalUpdates)>before,normalBefore);
 assert.equal(await page.locator('#design-view').getAttribute('data-physics-revision'),revision);
 assert.equal(await page.locator('#design-results').innerText(),physical);
 await page.locator('#design-magnification').fill('');
 assert.equal(await page.locator('#design-magnification').getAttribute('aria-invalid'),'true');
 assert.equal(await page.locator('#design-save').isDisabled(),true);
 assert.equal(await page.locator('#design-results').innerText(),physical);
 await page.locator('#design-magnification').fill('60');
 assert.equal(await page.locator('#design-view').getAttribute('data-physics-revision'),revision);
 console.log('PASS visual controls preserve FEM revision/results; normals and invalid-view recovery');groups++;
 await page.locator('#tab-theory').click();await page.locator('#design-chart').focus();await page.keyboard.press('End');
 const last=await page.locator('#design-chart-readout').innerText();assert.match(last,/mm/);assert.match(last,/Posición/);
 await page.keyboard.press('Home');assert.match(await page.locator('#design-chart-readout').innerText(),/Nodo 1\//);
 assert.notEqual(await page.locator('#design-chart-readout').innerText(),last);
 assert.ok(await page.locator('#design-chart [data-axis=y]').count()>=3);
 assert.equal(await page.locator('#design-chart [data-zero=true]').count(),1);
 await page.locator('#design-chart').click({position:{x:200,y:80}});
 assert.match(await page.locator('#design-chart-readout').innerText(),/Nodo/);
 console.log('PASS quantitative signed axes, true zero and keyboard/pointer node inspection');groups++;
 await page.locator('#share-simulation').click();await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('copiado'));
 const link=await page.evaluate(()=>navigator.clipboard.readText());await page.goto(link);
 assert.equal(await page.locator('#design-display').inputValue(),'geometry');
 assert.equal(await page.locator('#design-magnification').inputValue(),'60');
 console.log('PASS display settings in exact shared state');groups++;
 await page.locator('#tab-simulation').click();
 const group=page.locator('#design-geometry-fields .inspector-group').first();
 const span=await page.locator('#design-wing-span').inputValue();
 const revisionAfterShare=await page.locator('#design-view').getAttribute('data-physics-revision');
 await group.locator('summary').focus();await page.keyboard.press('Enter');
 assert.equal(await group.getAttribute('open'),null);
 await page.keyboard.press('Enter');assert.notEqual(await group.getAttribute('open'),null);
 assert.equal(await page.locator('#design-wing-span').inputValue(),span);
 assert.equal(await page.locator('#design-view').getAttribute('data-physics-revision'),revisionAfterShare);
 console.log('PASS native inspector grouping preserves inputs and supports keyboard disclosure');groups++;

 const beforeLoss=await page.locator('#design-results').innerText();
 const extension=await page.locator('#design-view canvas').evaluate(canvas=>{
  window.aerolabRecovery=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
  window.aerolabRecovery?.loseContext();return !!window.aerolabRecovery;
 });assert.equal(extension,true);
 await page.waitForFunction(()=>document.querySelector('#design-view').dataset.rendered==='false');
 assert.equal(await page.locator('#design-results').innerText(),beforeLoss);
 await page.waitForTimeout(150);await page.evaluate(()=>window.aerolabRecovery.restoreContext());
 await page.waitForFunction(()=>document.querySelector('#design-view').dataset.rendered==='true');
 assert.match(await page.locator('#design-view-status').innerText(),/recuperado/);
 assert.equal(await page.locator('#design-results').innerText(),beforeLoss);
 console.log('PASS structural WebGL recovery preserves physics and resumes a paused view');groups++;
 for (const file of ['aircraft.html', 'rocket.html']) {
  await page.goto(`${base}/${file}`);
  await page.waitForFunction(() => document.querySelector('#engineering-canvas').dataset.valid === 'true');
  await page.waitForTimeout(250);
  const idle = await page.evaluate(() => window.aerolabFrameCount);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.aerolabFrameCount), idle, `${file}: idle RAF`);
  const button = file === 'aircraft.html' ? '#aircraft-flow-toggle' : '#launch-play';
  if (file === 'rocket.html') await page.locator('#launch-run').click();
  await page.locator(button).click();
  await page.waitForFunction(before => window.aerolabFrameCount > before + 2, idle);
  await page.locator(button).click();
  await page.waitForTimeout(100);
  const paused = await page.evaluate(() => window.aerolabFrameCount);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.aerolabFrameCount), paused, `${file}: paused RAF`);
 }
 console.log('PASS playback schedules frames when running and none at rest or after pause');groups++;
 assert.deepEqual(errors,[]);console.log(JSON.stringify({groups,mobileCanvasTop:positions}));
} finally {await browser.close();}
