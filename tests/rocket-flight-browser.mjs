import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
let count=0;
async function check(name,fn){await fn();console.log(`PASS ${name}`);count++;}
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.AEROLAB_URL??'http://127.0.0.1:8001'}/rocket.html`);
  await check('multietapa: campos, presupuesto y edición de etapas',async()=>{
    assert.equal(await page.locator('#launch-stages fieldset').count(),2);
    assert.match(await page.locator('#launch-budget').innerText(),/3100.0 kg/);
    await page.locator('#launch-count').selectOption('4');assert.equal(await page.locator('#launch-stages fieldset').count(),4);
    await page.locator('#stage-3-thrust').fill('20000');
    await page.locator('#launch-count').selectOption('1');assert.equal(await page.locator('#launch-stages fieldset').count(),1);
    await page.locator('#launch-reset').click();assert.equal(await page.locator('#launch-stages fieldset').count(),2);
  });
  await check('multietapa: caída, eventos, gráficas y exportación real',async()=>{
    await page.locator('#launch-run').click();assert.equal(await page.locator('#launch-play').innerText(),'Reproducir');
    const end=await page.locator('#launch-timeline').getAttribute('max');
    await page.locator('#launch-timeline').fill(end);
    assert.match(await page.locator('#launch-outcome').innerText(),/impacto calculado/);
    assert.match(await page.locator('#launch-events').innerText(),/Separación/);
    assert.equal(await page.locator('#launch-altitude polyline').count(),1);assert.equal(await page.locator('#launch-velocity polyline').count(),1);
    await page.locator('#tab-analysis').click();
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#launch-csv').click()]);
    const csv=await readFile(await download.path(),'utf8'),lines=csv.trim().split('\n');
    assert.match(lines[0],/altitude_m,radial_velocity_m_s/);assert.ok(lines.length>16000);
    await page.locator('#tab-simulation').click();
    assert.equal(Number(lines.at(-1).split(',')[1]),0);assert.ok(Number(lines.at(-1).split(',')[2])<0);
  });
  await check('multietapa: escape lunar, reproducción y pausa',async()=>{
    await page.locator('#launch-body').selectOption('moon');assert.ok(await page.locator('#launch-play').isDisabled());
    await page.locator('#launch-run').click();await page.locator('#launch-play').click();
    await page.waitForFunction(()=>Number(document.getElementById('launch-timeline').value)>0.5);
    await page.locator('#launch-play').click();const time=await page.locator('#launch-timeline').inputValue();
    await page.waitForTimeout(150);assert.equal(await page.locator('#launch-timeline').inputValue(),time);
    await page.locator('#launch-timeline').fill(await page.locator('#launch-timeline').getAttribute('max'));
    assert.match(await page.locator('#launch-outcome').innerText(),/Escape energético/);
  });
  await check('multietapa: entradas inválidas retiran resultados antiguos',async()=>{
    await page.locator('#stage-0-propellant').fill('');assert.ok(await page.locator('#launch-run').isDisabled());
    assert.ok(await page.locator('#launch-csv').isDisabled());assert.equal(await page.locator('#launch-altitude polyline').count(),0);
    await page.locator('#launch-reset').click();assert.ok(await page.locator('#launch-run').isEnabled());
    await page.locator('#stage-0-thrust').fill('10000000');await page.locator('#stage-0-propellant').fill('1');
    assert.ok(await page.locator('#launch-run').isDisabled());assert.match(await page.locator('#launch-message').innerText(),/escape efectivo/);
    await page.locator('#launch-reset').click();
  });
  await check('multietapa: guardado separado, recarga y datos corruptos',async()=>{
    await page.locator('#launch-payload').fill('150');await page.locator('#launch-save').click();await page.reload();await page.locator('#launch-load').click();
    assert.equal(await page.locator('#launch-payload').inputValue(),'150');
    await page.evaluate(()=>localStorage.setItem('aerolab.rocket.launch.v1','{bad'));
    await page.locator('#launch-load').click();assert.match(await page.locator('#launch-message').innerText(),/No se pudo cargar/);
    assert.equal(await page.locator('#launch-payload').inputValue(),'150');
    await page.locator('#launch-reset').click();
  });
  await check('multietapa: límite temporal y ausencia de despegue',async()=>{
    await page.locator('#launch-horizon').fill('60');await page.locator('#launch-run').click();await page.locator('#launch-timeline').fill('100');
    assert.match(await page.locator('#launch-outcome').innerText(),/desenlace no resuelto/);
    await page.locator('#launch-count').selectOption('1');await page.locator('#stage-0-thrust').fill('100');await page.locator('#launch-run').click();
    await page.locator('#launch-timeline').fill(await page.locator('#launch-timeline').getAttribute('max'));
    assert.match(await page.locator('#launch-outcome').innerText(),/desenlace no resuelto/);
    await page.locator('#launch-horizon').fill('300');await page.locator('#launch-run').click();
    await page.locator('#launch-timeline').fill(await page.locator('#launch-timeline').getAttribute('max'));
    assert.match(await page.locator('#launch-outcome').innerText(),/No despega/);
  });
  await check('multietapa: móvil, etiquetas y capturas',async()=>{
    await page.locator('#launch-reset').click();await page.locator('#launch-run').click();
    await page.locator('#launch-timeline').focus();await page.locator('#launch-timeline').press('End');
    assert.match(await page.locator('#launch-outcome').innerText(),/impacto calculado/);
    await page.locator('#launch-timeline').press('Home');await page.locator('#launch-timeline').press('ArrowRight');
    assert.ok(Number(await page.locator('#launch-timeline').inputValue())>0);
    await page.locator('#launch-timeline').fill('12');
    for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
    assert.equal(await page.locator('#launch-form input:not([aria-describedby])').count(),0);
    await page.setViewportSize({width:1440,height:1000});await page.locator('#launch-lab').screenshot({path:'/tmp/aerolab-launch-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.locator('#launch-lab').screenshot({path:'/tmp/aerolab-launch-mobile.png'});
  });
  assert.deepEqual(errors,[]);console.log(`${count} launch browser checks passed.`);
} finally {await browser.close();}
