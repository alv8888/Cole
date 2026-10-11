import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8001';
let count=0, rocketState;
try {
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const [file,lab,input,value] of [['index.html','space','#a-altitude','555'],['aircraft.html','aircraft','#eng-area','24'],['rocket.html','rocket','#launch-payload','250']]) {
  await page.goto(`${base}/${file}`);await page.locator(input).fill(value);
  assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);
  await page.locator('#tab-simulation').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#tab-analysis').getAttribute('aria-selected'),'true');assert.ok(await page.locator('#panel-analysis').isVisible());
  await page.keyboard.press('End');assert.ok(await page.locator('#panel-theory').isVisible());
  await page.keyboard.press('Home');assert.equal(await page.locator(input).inputValue(),value);
  if(lab==='aircraft'){await page.locator('#capture-reference').click();await page.locator('#eng-area').fill('26');}
  if(lab==='rocket'){await page.locator('#eng-dryMass').fill('135');await page.locator('#launch-run').click();await page.locator('#launch-timeline').fill('42');}
  if(lab==='space'){await page.locator('#phase').fill('42');await page.locator('#globe-configuration').selectOption('1');}
  const snapshot=lab==='rocket'?await page.locator('#launch-state').textContent():null;
  await page.locator('#share-simulation').click();await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('copiado'));
  const link=await page.evaluate(()=>navigator.clipboard.readText());assert.equal(new URL(link).searchParams.get('lab'),lab);
  if(lab==='rocket')rocketState=JSON.parse(new URL(link).searchParams.get('sim'));
  const storage=await page.evaluate(()=>JSON.stringify(localStorage));await page.goto(link);await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('recuperada'));
  assert.equal(await page.locator(input).inputValue(),lab==='aircraft'?'26':value);
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),storage);
  if(lab==='rocket'){assert.equal(await page.locator('#launch-state').textContent(),snapshot);assert.equal(await page.locator('#launch-play').textContent(),'Reproducir');assert.equal(await page.locator('#eng-dryMass').inputValue(),'135');}
  if(lab==='space'){assert.equal(await page.locator('#phase').inputValue(),'42');assert.equal(await page.locator('#play').textContent(),'Reproducir');}
  if(lab==='aircraft'){await page.locator('#tab-analysis').click();assert.match(await page.locator('#engineering-results').innerText(),/22\.050,000/);}
  await page.locator('.method-link').click();assert.ok(await page.locator('#panel-theory').isVisible());
  await page.setViewportSize({width:360,height:780});await page.locator('#tab-simulation').click();
  for(const tab of ['analysis','theory','simulation']) {
   await page.locator(`#tab-${tab}`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.screenshot({path:`/tmp/aerolab-tabs-${lab}-mobile.png`,fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  console.log(`PASS ${lab}: tabs, keyboard, URL, clipboard, replay, anchors and mobile`);count++;
 }
 rocketState.calculator.configuration.dryMass=777;rocketState.launch.configuration.payload=null;
 await page.goto(`${base}/rocket.html?lab=rocket&v=1&sim=${encodeURIComponent(JSON.stringify(rocketState))}`);
 await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('rechazado'));
 assert.equal(await page.locator('#eng-dryMass').inputValue(),'100');assert.equal(await page.locator('#launch-payload').inputValue(),'100');
 console.log('PASS invalid multi-part URL is rejected atomically');count++;
 await page.goto(`${base}/index.html`);await page.locator('#a-altitude').fill('');await page.locator('#share-simulation').click();assert.match(await page.locator('#share-status').textContent(),/No se pudo compartir/);
 await page.locator('#reset').click();await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('blocked'))},configurable:true}));
 await page.locator('#share-simulation').click();await page.locator('#share-manual').waitFor({state:'visible'});assert.ok((await page.locator('#share-url').inputValue()).includes('sim='));assert.match(await page.locator('#share-status').textContent(),/manualmente/);
 assert.deepEqual(errors,[]);console.log('PASS invalid inputs and denied clipboard fallback');count++;
 console.log(`${count} browser groups passed`);
} finally {await browser.close();}
