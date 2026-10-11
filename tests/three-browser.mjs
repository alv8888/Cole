import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const executablePath=process.env.CHROMIUM_PATH??'/usr/bin/chromium',base=process.env.AEROLAB_URL??'http://127.0.0.1:8001';
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let count=0;
async function check(name,run){await run();count++;console.log(`PASS ${name}`);}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url());});
  await page.goto(`${base}/index.html#lab`);
  await check('Three.js: WebGL y textura terrestre locales, cámara real',async()=>{
    await page.waitForSelector('#orbit-globe .globe-host[data-state=ready][data-texture=ready]',{timeout:20000});
    assert.equal(await page.locator('#orbit-globe canvas[data-webgl=true]').count(),1);
    assert.equal(await page.locator('#orbit-globe .globe-host').getAttribute('data-path-points'),'512');
    const canvas=page.locator('#orbit-globe canvas'),before=await canvas.screenshot();
    await page.locator('#orbit-globe [data-camera=right]').click();const after=await canvas.screenshot();assert.notDeepEqual(before,after);
    await page.locator('#orbit-globe [data-camera=in]').click();assert.notDeepEqual(after,await canvas.screenshot());
    await page.locator('#orbit-globe [data-camera=reset]').click();
    const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+40,{steps:4});await page.mouse.up();
    assert.notDeepEqual(before,await canvas.screenshot());
  });
  await check('Three.js: marcador sigue Kepler, selección A/B y cuerpos correctos',async()=>{
    const before=await page.locator('#orbit-globe .globe-host').getAttribute('data-marker');
    await page.locator('#go-apoapsis').click();const after=await page.locator('#orbit-globe .globe-host').getAttribute('data-marker');assert.notEqual(before,after);
    const point=JSON.parse(after);assert.ok(point[0]<0);
    await page.locator('#globe-configuration').selectOption('1');
    await page.locator('#b-body').selectOption('moon');await page.waitForFunction(()=>document.querySelector('#orbit-globe .globe-host').dataset.body==='moon');
    assert.equal(await page.locator('#orbit-globe .globe-host').getAttribute('data-texture'),'not-applicable');
    await page.locator('#b-altitude').fill('');assert.equal(await page.locator('#orbit-globe .globe-host').getAttribute('data-path-points'),'0');
    await page.locator('#b-altitude').fill('400');assert.equal(await page.locator('#orbit-globe .globe-host').getAttribute('data-path-points'),'512');
    await page.locator('#globe-configuration').selectOption('0');
  });
  await check('Three.js: anchuras y captura orbital',async()=>{
    for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await page.setViewportSize({width:1440,height:1000});await page.locator('#orbit-globe').screenshot({path:'/tmp/aerolab-three-orbit-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.locator('#orbit-globe').screenshot({path:'/tmp/aerolab-three-orbit-mobile.png'});
  });
  await page.goto(`${base}/rocket.html`);
  await check('Three.js: trayectoria radial reproducida y limpieza al editar',async()=>{
    await page.locator('#launch-run').click();await page.waitForSelector('#rocket-globe .globe-host[data-state=ready][data-texture=ready]',{timeout:20000});
    await page.locator('#launch-timeline').fill('12');
    const host=page.locator('#rocket-globe .globe-host'),point=JSON.parse(await host.getAttribute('data-marker'));
    assert.equal(point[0],0);assert.equal(point[2],0);assert.ok(point[1]>1);assert.ok(Number(await host.getAttribute('data-visible-points'))>1);
    await page.locator('#launch-timeline').fill('100');const end=JSON.parse(await host.getAttribute('data-marker'));assert.equal(end[1],1);
    assert.equal(await host.getAttribute('data-visible-points'),await host.getAttribute('data-path-points'));
    await page.locator('#launch-payload').fill('200');assert.equal(await host.getAttribute('data-path-points'),'0');
    await page.locator('#launch-reset').click();await page.locator('#launch-run').click();await page.locator('#launch-timeline').fill('40');
    await page.setViewportSize({width:1440,height:1000});await page.locator('#rocket-globe').screenshot({path:'/tmp/aerolab-three-rocket-desktop.png'});
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#rocket-globe').screenshot({path:'/tmp/aerolab-three-rocket-mobile.png'});
    await page.locator('#launch-body').selectOption('moon');await page.locator('#launch-run').click();assert.equal(await host.getAttribute('data-body'),'moon');assert.equal(await host.getAttribute('data-texture'),'not-applicable');
  });
  await check('Three.js: pérdida de contexto informada sin romper física',async()=>{
    await page.locator('#rocket-globe canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.waitForSelector('#rocket-globe .globe-host[data-state=lost]');assert.match(await page.locator('#rocket-globe .globe-status').innerText(),/perdió el contexto/);
    assert.ok(await page.locator('#rocket-globe [data-camera=reset]').isDisabled());
    assert.ok(await page.locator('#launch-run').isEnabled());
  });
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const noTexture=await browser.newPage();
  await noTexture.route('**/assets/textures/**',route=>route.abort());await noTexture.goto(`${base}/index.html#lab`);
  await check('Three.js: fallo de textura mantiene esfera, cámara y física',async()=>{
    await noTexture.waitForSelector('#orbit-globe .globe-host[data-state=ready][data-texture=error]');
    assert.match(await noTexture.locator('#orbit-globe .globe-status').innerText(),/No se pudo cargar la textura/);
    assert.equal(await noTexture.locator('#orbit-globe .globe-host').getAttribute('data-path-points'),'512');
    assert.match(await noTexture.locator('#results').innerText(),/7,67/);assert.ok(await noTexture.locator('#orbit-globe [data-camera=reset]').isEnabled());
    await noTexture.locator('#a-altitude').fill('1000');assert.equal(await noTexture.locator('#orbit-globe .globe-host').getAttribute('data-texture'),'error');
  });
}finally{await browser.close();}
const fallback=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-webgl']});
try{
  const page=await fallback.newPage();await page.goto(`${base}/index.html#lab`);
  await check('Three.js: sin WebGL, cálculos y SVG siguen funcionando',async()=>{
    await page.waitForSelector('#orbit-globe .globe-host[data-state=unavailable]');
    assert.match(await page.locator('#results').innerText(),/7,67/);
    assert.ok(await page.locator('#orbit-globe [data-camera=reset]').isDisabled());
    await page.locator('#a-altitude').fill('1000');assert.match(await page.locator('#results').innerText(),/104,97/);
  });
}finally{await fallback.close();}
console.log(`${count} Three.js browser checks passed.`);
