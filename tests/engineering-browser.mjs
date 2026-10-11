import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base=process.env.AEROLAB_URL??'http://127.0.0.1:8001';
let count=0;
async function check(name,run){await run();count++;console.log(`PASS ${name}`);}
try{
  for(const kind of ['aircraft','rocket']){
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/${kind}.html`);
    await check(`${kind}: known calculations and camera geometry`,async()=>{
      await page.waitForSelector('#engineering-results tr');
      assert.match(await page.locator('#engineering-results').innerText(),kind==='aircraft'?/14\.700,000/:/1\.318,335/);
      const before=await page.locator('#engineering-canvas').evaluate(canvas=>canvas.toDataURL());
      await page.locator('#view-yaw').fill('120');
      const after=await page.locator('#engineering-canvas').evaluate(canvas=>canvas.toDataURL());
      assert.notEqual(after,before);
      await page.locator('#view-pitch').fill('50');
      assert.notEqual(await page.locator('#engineering-canvas').evaluate(canvas=>canvas.toDataURL()),after);
    });
    await check(`${kind}: reference, invalid data and restoration`,async()=>{
      await page.locator('#capture-reference').click();
      const key=kind==='aircraft'?'groundSpeed':'burnPercent';
      await page.locator(`#eng-${key}`).fill(kind==='aircraft'?'60':'100');
      assert.match(await page.locator('#engineering-results').innerText(),kind==='aircraft'?/21\.168,000/:/100,000/);
      await page.locator(`#eng-${key}`).fill('');
      assert.equal(await page.locator(`#eng-${key}`).getAttribute('aria-invalid'),'true');
      assert.ok(await page.locator('#engineering-save').isDisabled());
      await page.locator('#engineering-reset').click();
      await page.locator('#clear-reference').click();
      assert.ok(await page.locator('#clear-reference').isDisabled());
    });
    await check(`${kind}: module-specific save/load/export and corrupted storage`,async()=>{
      const key=kind==='aircraft'?'mass':'dryMass';
      await page.locator(`#eng-${key}`).fill(kind==='aircraft'?'1400':'120');
      await page.locator('#engineering-save').click();await page.reload();await page.locator('#engineering-load').click();
      assert.equal(await page.locator(`#eng-${key}`).inputValue(),kind==='aircraft'?'1400':'120');
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#engineering-export').click()]);
      const json=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(json.module,kind);
      await page.evaluate(module=>localStorage.setItem(`aerolab.${module}.v1`,'{bad'),kind);
      await page.locator('#engineering-load').click();assert.match(await page.locator('#engineering-status').innerText(),/No se pudo cargar/);
      assert.equal(await page.locator(`#eng-${key}`).inputValue(),kind==='aircraft'?'1400':'120');
    });
    await check(`${kind}: physically relevant edge cases`,async()=>{
      await page.locator('#engineering-reset').click();
      if(kind==='aircraft'){
        await page.locator('#eng-windAlong').fill('20');assert.match(await page.locator('#engineering-results').innerText(),/30,000/);
        await page.locator('#eng-groundSpeed').fill('10');assert.match(await page.locator('#engineering-status').innerText(),/componente longitudinal/);
        assert.ok(await page.locator('#capture-reference').isDisabled());
      }else{
        await page.locator('#eng-gravity').fill('0');assert.match(await page.locator('#engineering-results').innerText(),/—/);
        await page.locator('#eng-burnPercent').fill('100');assert.match(await page.locator('#engineering-results').innerText(),/1\.318,335/);
      }
      await page.locator('#engineering-reset').click();
    });
    await check(`${kind}: mobile layout, links and labeled inputs`,async()=>{
      for(const width of [1440,768,390,320]){
        await page.setViewportSize({width,height:900});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${kind} overflow ${width}`);
        assert.equal(await page.locator('input:not([aria-describedby])').count(),0);
        assert.equal(await page.locator('nav.modules a').count(),3);
      }
      await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`/tmp/aerolab-${kind}-desktop.png`,fullPage:true});
      await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`/tmp/aerolab-${kind}-mobile.png`,fullPage:true});
    });
    assert.deepEqual(errors,[]);await page.close();
  }
  console.log(`${count} engineering browser checks passed.`);
}finally{await browser.close();}
