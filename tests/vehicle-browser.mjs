import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8001';let count=0;
async function check(name,run){await run();count++;console.log(`PASS ${name}`);}
try {
 const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const kind of ['aircraft','rocket']){
  await page.goto(`${base}/${kind}.html`);const canvas=page.locator('#engineering-canvas');await page.waitForSelector('#engineering-canvas[data-state=ready]');
  await check(`${kind}: native WebGL rotation, wheel zoom, mouse pan and keyboard camera`,async()=>{
   assert.equal(await canvas.getAttribute('data-webgl'),'true');const before=await canvas.screenshot();
   await page.locator('#view-yaw').fill('230');assert.notDeepEqual(await canvas.screenshot(),before);
   await canvas.scrollIntoViewIfNeeded();await canvas.hover();const camera=await canvas.getAttribute('data-camera');await page.mouse.wheel(0,-150);await page.waitForTimeout(120);assert.notEqual(await canvas.getAttribute('data-camera'),camera);
   const box=await canvas.boundingBox(),pan=JSON.parse(await canvas.getAttribute('data-camera')).slice(3);
   await page.mouse.move(box.x+box.width/2,box.y+180);await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width/2+65,box.y+210);await page.mouse.up({button:'right'});
   assert.notDeepEqual(JSON.parse(await canvas.getAttribute('data-camera')).slice(3),pan);
   await page.locator('[data-vehicle-camera=reset]').click();
  });
  if(kind==='aircraft')await check('aircraft: force vectors, CG, oblique wind, absent lateral model and invalidation',async()=>{
   const arrows=JSON.parse(await canvas.getAttribute('data-forces'));assert.equal(arrows.length,4);assert.equal(arrows.find(a=>a.name==='weight').vector[2],-11767.98);
   const cg=await canvas.getAttribute('data-cg');await page.locator('#eng-cg').fill('50');assert.notEqual(await canvas.getAttribute('data-cg'),cg);
   await page.locator('#eng-windVertical').fill('8');assert.notEqual(JSON.parse(await canvas.getAttribute('data-forces')).find(a=>a.name==='lift').vector[0],0);
   await page.locator('#eng-windCross').fill('1');assert.equal(await canvas.getAttribute('data-forces'),'[]');assert.match(await page.locator('#vehicle-legend').innerText(),/ocultan/);
   await page.locator('#eng-area').fill('');assert.equal(await canvas.getAttribute('data-valid'),'false');await page.locator('#engineering-reset').click();
  });
  if(kind==='rocket')await check('rocket: real throttle changes results; plume animation, shutdown and persistence',async()=>{
   assert.equal(await canvas.getAttribute('data-plume-power'),'1');assert.equal(await canvas.getAttribute('data-animating'),'false');
   await page.locator('#eng-thrustPercent').fill('50');assert.equal(await canvas.getAttribute('data-plume-power'),'0.5');assert.equal(await canvas.getAttribute('data-applied-thrust'),'3000');
   assert.match(await page.locator('#engineering-results').innerText(),/659,167/);
   await page.locator('#plume-animation').click();await page.waitForFunction(()=>!!document.querySelector('#engineering-canvas').dataset.frame);const before=await canvas.screenshot();await page.waitForTimeout(110);assert.notDeepEqual(await canvas.screenshot(),before);
   await page.locator('#tab-analysis').click();assert.equal(await canvas.getAttribute('data-animating'),'false');await page.locator('#tab-simulation').click();
   await page.locator('#eng-burnPercent').fill('100');assert.equal(await canvas.getAttribute('data-plume-power'),'0');assert.ok(await page.locator('#plume-animation').isDisabled());
   await page.locator('#engineering-save').click();await page.reload();await page.locator('#engineering-load').click();await page.waitForSelector('#engineering-canvas[data-state=ready]');assert.equal(await page.locator('#eng-thrustPercent').inputValue(),'50');
   await page.locator('#engineering-reset').click();
  });
  await check(`${kind}: tabs resize, mobile layout and screenshot`,async()=>{
   await page.locator('#tab-theory').click();await page.locator('#tab-simulation').click();
   await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await canvas.screenshot({path:`/tmp/aerolab-vehicle-${kind}-mobile.png`});
   await page.setViewportSize({width:1280,height:900});await canvas.screenshot({path:`/tmp/aerolab-vehicle-${kind}-desktop.png`});
  });
 }
 await check('context loss disables camera while retaining physics, then restores WebGL',async()=>{
  await page.locator('#engineering-canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2');window.vehicleLoss=gl.getExtension('WEBGL_lose_context');window.vehicleLoss.loseContext();});
  await page.waitForSelector('#engineering-canvas[data-state=lost]');assert.ok(await page.locator('[data-vehicle-camera=in]').isDisabled());
  await page.locator('#eng-thrustPercent').fill('25');assert.match(await page.locator('#engineering-results').innerText(),/329,584/);
  await page.evaluate(()=>window.vehicleLoss.restoreContext());await page.waitForSelector('#engineering-canvas[data-state=ready]');assert.ok(await page.locator('[data-vehicle-camera=in]').isEnabled());
 });
 await check('missing WebGL leaves calculations and SVG usable',async()=>{
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.startsWith('webgl'))return null;return original.call(this,type,...args);};});
  await fallback.goto(`${base}/aircraft.html`);await fallback.waitForSelector('#engineering-canvas[data-state=unavailable]');assert.match(await fallback.locator('#vehicle-status').textContent(),/no disponible/);await fallback.locator('#eng-area').fill('24');assert.match(await fallback.locator('#engineering-results').innerText(),/22\.050,000/);await fallback.close();
 });
 assert.deepEqual(errors,[]);console.log(`${count} vehicle browser groups passed`);
} finally {await browser.close();}
