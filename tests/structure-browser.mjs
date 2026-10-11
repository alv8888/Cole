import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8001';let count=0;
async function check(name,run){await run();count++;console.log(`PASS ${name}`);}
try{
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/structure.html`);await page.locator('#tab-analysis').click();await page.locator('#structure-legacy summary').first().click();
 await check('Voladizo: cálculo conocido y curva calculada con escala declarada',async()=>{
  for(const [key,value] of Object.entries({length:2,width:.1,height:.2,modulus:70,force:1000}))await page.locator(`#str-${key}`).fill(String(value));
  assert.equal(await page.locator('input[aria-invalid="undefined"]').count(),0);
  assert.match(await page.locator('#structure-summary').innerText(),/3,000 MPa/);assert.match(await page.locator('#structure-summary').innerText(),/0,571 mm/);assert.equal(await page.locator('#structure-diagram [data-deformation]').count(),1);
  const amplified=await page.locator('[data-deformation]').getAttribute('points');await page.locator('#structure-amplify').uncheck();assert.notEqual(await page.locator('[data-deformation]').getAttribute('points'),amplified);assert.match(await page.locator('#structure-scale-note').innerText(),/1,000/);
 });
 await check('Carga uniforme: cambio real de campos y resultados',async()=>{
  await page.locator('#structure-mode').selectOption('uniform');assert.ok(await page.locator('#str-force').isHidden());await page.locator('#str-distributed').fill('1000');assert.match(await page.locator('#structure-summary').innerText(),/0,429 mm/);
  await page.locator('#tab-analysis').click();assert.equal(await page.locator('#structure-samples tr').count(),81);assert.equal(await page.locator('#structure-moment polyline').count(),1);await page.locator('#tab-analysis').click();
 });
 await check('Compresión: acortamiento, pandeo y apoyos diferenciados',async()=>{
  await page.locator('#structure-mode').selectOption('compression');await page.locator('#str-diameter').fill('0.1');await page.locator('#str-thickness').fill('0.002');assert.match(await page.locator('#structure-summary').innerText(),/1,624 MPa/);assert.match(await page.locator('#structure-summary').innerText(),/0,046 mm/);
  assert.match(await page.locator('#structure-results').innerText(),/127\.728,1863/);
  await page.locator('#str-length').fill('0.1');assert.match(await page.locator('#structure-warnings').innerText(),/Euler no aplicable/);assert.match(await page.locator('#structure-results').innerText(),/no aplicable/);
 });
 await check('Materiales y referencias: propiedades reales del modelo y carbono explícito',async()=>{
  await page.locator('#structure-reset').click();await page.locator('#structure-reference').click();await page.locator('#structure-material').selectOption('carbon');assert.equal(await page.locator('#str-modulus').inputValue(),'70');assert.match(await page.locator('#structure-warnings').innerText(),/no un límite elástico/);assert.match(await page.locator('#structure-material-note').innerText(),/600 MPa/);
  await page.locator('#structure-material').selectOption('titanium');assert.equal(await page.locator('#str-modulus').inputValue(),'114');await page.locator('#structure-material').selectOption('steel');assert.equal(await page.locator('#str-compressive').inputValue(),'355');assert.match(await page.locator('#structure-reference-note').innerText(),/Aluminio/);
 });
 await check('Persistencia aislada, JSON y CSV con datos calculados',async()=>{
  await page.locator('#structure-save').click();await page.reload();await page.locator('#tab-analysis').click();await page.locator('#structure-legacy summary').first().click();await page.locator('#structure-load').click();assert.equal(await page.locator('#structure-material').inputValue(),'steel');
  const [json]=await Promise.all([page.waitForEvent('download'),page.locator('#structure-json').click()]);const record=JSON.parse(await readFile(await json.path(),'utf8'));assert.equal(record.module,'structure');assert.equal(record.configuration.modulus,210);
  await page.locator('#tab-analysis').click();const [csv]=await Promise.all([page.waitForEvent('download'),page.locator('#structure-csv').click()]);const text=await readFile(await csv.path(),'utf8');assert.equal(text.trim().split('\n').length,82);assert.match(text,/displacement_m,moment_N_m,stress_Pa/);await page.locator('#tab-analysis').click();
 });
 await check('Invalidación limpia gráficos y cero carga se distingue de errores',async()=>{
  await page.locator('#str-force').fill('');assert.ok(await page.locator('#structure-save').isDisabled());assert.equal(await page.locator('[data-deformation]').count(),0);assert.equal(await page.locator('#structure-samples tr').count(),0);
  await page.locator('#str-force').fill('0.000000000001');assert.ok(await page.locator('#structure-save').isDisabled());
  await page.locator('#str-force').fill('0');assert.match(await page.locator('#structure-summary').innerText(),/∞ \(sin carga\)/);
  await page.locator('#structure-mode').selectOption('compression');await page.locator('#str-thickness').fill('0.2');assert.equal(await page.locator('#str-thickness').getAttribute('aria-invalid'),'true');assert.ok(await page.locator('#structure-json').isDisabled());await page.locator('#structure-reset').click();
 });
 await check('Enlace exacto, referencias conservadas y URL inválida sin cambios parciales',async()=>{
  await page.locator('#str-force').fill('2000');await page.locator('#structure-reference').click();await page.locator('#str-force').fill('3000');await page.locator('#structure-amplify').uncheck();
  const saved=await page.evaluate(()=>localStorage.getItem('aerolab.structure.v1'));
  await page.locator('#share-simulation').click();await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('copiado'));const link=await page.evaluate(()=>navigator.clipboard.readText());await page.goto(link);await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('recuperada'));await page.locator('#tab-analysis').click();await page.locator('#structure-legacy summary').first().click();assert.equal(await page.locator('#str-force').inputValue(),'3000');assert.equal(await page.locator('#structure-amplify').isChecked(),false);assert.ok(await page.locator('#structure-clear').isEnabled());assert.equal(await page.evaluate(()=>localStorage.getItem('aerolab.structure.v1')),saved);
  const url=new URL(link),state=JSON.parse(url.searchParams.get('sim'));state.structure.configuration.length=-1;url.searchParams.set('sim',JSON.stringify(state));await page.goto(url.href);await page.waitForFunction(()=>document.querySelector('#share-status').textContent.includes('rechazado'));assert.equal(await page.locator('#str-force').inputValue(),'5000');
 });
 await check('Menús de cuatro módulos, pestañas por teclado y móviles',async()=>{
  await page.goto(`${base}/structure.html`);await page.locator('#tab-simulation').focus();await page.keyboard.press('ArrowRight');assert.ok(await page.locator('#panel-analysis').isVisible());await page.locator('.method-link').click();assert.ok(await page.locator('#panel-theory').isVisible());
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const tab of ['simulation','analysis','theory']){await page.locator(`#tab-${tab}`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
  await page.locator('#tab-analysis').click();await page.screenshot({path:'/tmp/aerolab-structure-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/aerolab-structure-mobile.png',fullPage:true});
  assert.equal(await page.locator('input:not([aria-describedby])').count(),0);
  for(const file of ['index.html','aircraft.html','rocket.html']){await page.goto(`${base}/${file}`);assert.equal(await page.locator('nav.modules a').count(),4);await page.locator('nav.modules a[href="structure.html"]').click();assert.ok(page.url().includes('structure.html'));}
 });
 assert.deepEqual(errors,[]);console.log(`${count} structure browser groups passed`);
}finally{await browser.close();}
