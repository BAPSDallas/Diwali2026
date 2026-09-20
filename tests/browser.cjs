const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/add-calendar.html');
  await page.waitForSelector('.event-card');
  assert.equal(await page.locator('.event-card').count(),5);
  assert.equal(await page.locator('#included input').count(),0);
  assert.equal(await page.locator('input[type=checkbox]').count(),3);
  for(let mask=0;mask<8;mask++) {
    for(let i=0;i<3;i++) await page.locator('input[type=checkbox]').nth(i).setChecked(Boolean(mask & (1<<i)));
    const count=2+[0,1,2].filter(i=>mask&(1<<i)).length;
    const pending=page.waitForEvent('download');
    await page.locator('#download').click();
    const download=await pending;
    const text=await fs.readFile(await download.path(),'utf8');
    assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,count);
    assert.equal(download.suggestedFilename(),`Diwali_2026_${count}_Events.ics`);
  }
  await page.getByRole('button',{name:'Clear optional'}).click();
  assert.equal(await page.locator('input:checked').count(),0);
  const allDownload = page.waitForEvent('download');
  await page.getByRole('button',{name:'Add all events'}).click();
  const allText = await fs.readFile(await (await allDownload).path(), 'utf8');
  assert.equal((allText.match(/BEGIN:VEVENT/g)||[]).length,5);
  assert.equal(await page.locator('input:checked').count(),0);
  await page.locator('label.event-card').first().locator('h2').click();
  assert(await page.locator('input[value=evening]').isChecked());
  assert.deepEqual(await page.locator('#optional input').evaluateAll(inputs=>inputs.map(i=>i.value)), ['evening','kdc','morning']);
  assert.equal(await page.locator('h1,.section-heading,.eyebrow,#select-all').count(),0);
  assert(!(await page.locator('.address').first().textContent()).includes('BAPS'));
  for(const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'/private/tmp/diwali-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  await page.screenshot({path:'/private/tmp/diwali-desktop.png',fullPage:true});
  assert.deepEqual(errors,[]);
  await browser.close();
  console.log('PASS: all 8 browser downloads, optional card toggles, add all/clear optional, no overflow at 320/390/768/1280px, no JS errors.');
})().catch(error=>{console.error(error);process.exit(1)});
