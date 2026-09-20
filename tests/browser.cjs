const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
 async function download(){const wait=page.waitForEvent('download');await page.locator('#download').click();return fs.readFile(await (await wait).path(),'utf8');}
 await page.goto(base+'add-calendar.html');await page.waitForSelector('.event-card');
 assert.equal(await page.locator('.action-buttons button').count(),1);
 for(const session of [null,'evening','morning']) for(const kids of [false,true]){
  if(await page.locator('#clear').isVisible()) await page.locator('#clear').click();
  if(session)await page.locator(`input[value=${session}]`).check();
  if(kids)await page.locator('input[value=kdc]').check();
  const hasChoice=Boolean(session||kids);
  assert.equal(await page.locator('#download-label').textContent(),hasChoice?'Add selected events':'Add all events');
  const text=await download();
  assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,hasChoice?2+Number(Boolean(session))+Number(kids):4);
  assert.equal(text.includes('UID:chopda-pujan-morning'),session==='morning');
  assert.equal(text.includes('UID:chopra-pujan'),session==='evening'||!hasChoice);
  assert.equal(text.includes('UID:kids-diwali'),kids||!hasChoice);
 }
 await page.locator('input[value=evening]').check();await page.locator('input[value=morning]').check();
 assert.equal(await page.locator('input[name=pujan]:checked').count(),1);
 assert(!(await page.locator('input[value=evening]').isChecked()));
 for(const width of [320,390,778,1280]){
  await page.setViewportSize({width,height:863});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
  const boxes=await page.locator('.session-choice').evaluateAll(nodes=>nodes.map(n=>({y:n.getBoundingClientRect().y,x:n.getBoundingClientRect().x})));
  assert.equal(boxes[0].y,boxes[1].y);assert(boxes[0].x<boxes[1].x);
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/private/tmp/diwali-new.png',fullPage:true});
 await page.goto(base+'diwali-only.html');await page.waitForSelector('.event-card');
 assert.equal(await page.locator('.event-card').count(),2);assert.equal(await page.locator('input').count(),0);
 const text=await download();assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,2);assert(!text.includes('UID:kids'));assert(!text.includes('UID:chop'));
 await page.screenshot({path:'/private/tmp/diwali-only.png',fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: six selection states, exclusive Chopda sessions, single dynamic button, both-event page, downloads, responsive widths, no JS errors.');
})().catch(error=>{console.error(error);process.exit(1)});
