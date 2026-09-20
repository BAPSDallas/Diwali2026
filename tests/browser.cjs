const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
// Safari's visible content height (100svh, i.e. toolbars expanded) on the target phones.
// These must fit with no scrolling.
const PHONES=[['17 Pro',402,740],['17 Pro Max',440,820]];
// Below the 700px threshold the layout deliberately releases its fixed height and
// scrolls; the promise there is only that no card text is clipped.
const SHORT=[['SE',375,560],['13 mini',375,629],['landscape',874,340]];
// Photos are swapped by hand, so any resolution or aspect must fill its panel
// exactly: no layout shift, no overflow, no letterboxing.
async function photosFill(page,name){
 for(const [w,h] of [[4000,1000],[800,2400],[500,500],[3000,2000],[120,80]]){
  const r=await page.evaluate(async ([w,h])=>{
   const c=document.createElement('canvas');c.width=w;c.height=h;
   c.getContext('2d').fillRect(0,0,w,h);
   const url=c.toDataURL('image/png');
   await Promise.all([...document.querySelectorAll('.event-photo img')].map(i=>new Promise(go=>{i.onload=go;i.onerror=go;i.src=url})));
   const p=document.querySelector('.event-photo').getBoundingClientRect(),i=document.querySelector('.event-photo img').getBoundingClientRect();
   return {dw:Math.abs(p.width-i.width),dh:Math.abs(p.height-i.height),over:document.documentElement.scrollHeight-innerHeight};
  },[w,h]);
  assert(r.dw<1&&r.dh<1,`${name}: ${w}x${h} photo does not fill its panel`);
  assert(r.over<=0,`${name}: ${w}x${h} photo pushes the page into scroll`);
 }
 await page.reload();await page.waitForSelector('.event-card');
}
async function fits(page,name){
 for(const [label,width,height] of PHONES){
  await page.setViewportSize({width,height});
  const over=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
  assert(over<=0,`${name} scrolls on ${label}: ${over}px over`);
 }
 for(const [label,width,height] of SHORT){
  await page.setViewportSize({width,height});
  const clipped=await page.evaluate(()=>[...document.querySelectorAll('.event-body')].filter(n=>n.scrollHeight>n.clientHeight+1).length);
  assert.equal(clipped,0,`${name} clips card text on ${label}`);
 }
}
 async function download(){const wait=page.waitForEvent('download');await page.locator('#download').click();return fs.readFile(await (await wait).path(),'utf8');}
 await page.goto(base+'add-calendar.html');await page.waitForSelector('.event-card');
 // A phone gets only the calendar it can use; an unknown agent gets both, because
 // hiding the wrong one there would leave the visitor no way to add anything.
 assert.equal(await page.locator('.action-buttons button').count(),2,'both buttons exist in the DOM');
 assert.equal(await page.locator('.action-buttons.show-both').count(),1,'unknown agent sees both');
 assert(await page.locator('#download').isVisible()&&await page.locator('#gcal').isVisible());
 assert.equal(await page.locator('#download-label').textContent(),'Add to Apple Calendar');
 assert(await page.locator('#pujan-included').isChecked());
 assert(await page.locator('input[value=evening]').isChecked());
 const initial=await download();assert.equal((initial.match(/BEGIN:VEVENT/g)||[]).length,3);
 assert.deepEqual(await page.locator('input[name=pujan]').evaluateAll(nodes=>nodes.map(n=>n.value)),['morning','evening']);
 for(const session of [null,'evening','morning']) for(const kids of [false,true]){
  if(await page.locator('#clear').isVisible()) await page.locator('#clear').click();
  if(session){await page.locator('#pujan-included').check();await page.locator(`.session-choice:has(input[value=${session}])`).click();}
  if(kids)await page.locator('input[value=kdc]').check();
  const hasChoice=Boolean(session||kids);
  assert.equal(await page.locator('#download-label').textContent(),'Add to Apple Calendar');
  assert.match(await page.locator('#selection-count').textContent(),hasChoice?/^\d+ events selected$/:/^4 events · evening pujan included$/);
  const text=await download();
  assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,hasChoice?2+Number(Boolean(session))+Number(kids):4);
  assert.equal(text.includes('UID:chopda-pujan-morning'),session==='morning');
  assert.equal(text.includes('UID:chopra-pujan'),session==='evening'||!hasChoice);
  assert.equal(text.includes('UID:kids-diwali'),kids||!hasChoice);
 }
 await page.locator('.session-choice:has(input[value=evening])').click();await page.locator('.session-choice:has(input[value=morning])').click();
 assert.equal(await page.locator('input[name=pujan]:checked').count(),1);
 assert(!(await page.locator('input[value=evening]').isChecked()));
 // Tapping the pujan card body includes/removes it like the KDC card, keeping any chosen session.
 const pujan=async()=>({i:await page.locator('#pujan-included').isChecked(),m:await page.locator('input[value=morning]').isChecked()});
 await page.locator('#pujan-included').check();
 await page.locator('.pujan-card h2').click();assert.deepEqual(await pujan(),{i:false,m:true},'card tap removes, morning kept');
 await page.locator('.pujan-card .address').click();assert.deepEqual(await pujan(),{i:true,m:true},'card tap restores morning');
 await page.locator('.session-choice:has(input[value=evening])').click();
 assert.deepEqual(await pujan(),{i:true,m:false},'session tap must not toggle the card');
 await page.locator('.pujan-card h2').click();await page.locator('.pujan-card h2').click();
 assert(await page.locator('input[value=evening]').isChecked(),'evening is the fallback session');
 const selected=Number(((await page.locator('#selection-count').textContent()).match(/^(\d+)/)||[])[1]);
 assert(selected>0,'expected a non-zero selection count');
 for(const width of [320,390,778,1280]){
  await page.setViewportSize({width,height:863});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
  const boxes=await page.locator('.session-choice').evaluateAll(nodes=>nodes.map(n=>({y:n.getBoundingClientRect().y,x:n.getBoundingClientRect().x})));
  assert.equal(boxes[0].y,boxes[1].y);assert(boxes[0].x<boxes[1].x);
 }
 // The fireworks wash belongs to the Dallas Annakut alone and must actually load.
 assert.equal(await page.locator('.has-fireworks').count(),1,'exactly one fireworks column');
 assert((await page.locator('.event-card:has(.has-fireworks) h2').textContent()).includes('Dallas'),'fireworks is on the Dallas card');
 const fwUrl=await page.locator('.has-fireworks').evaluate(n=>getComputedStyle(n).getPropertyValue('--fireworks').replace(/^url\(['"]?|['"]?\)$/g,'').trim());
 assert((await page.request.get(new URL(fwUrl,page.url()).href)).ok(),`fireworks image missing: ${fwUrl}`);
 // Google Calendar path: one link per selected event, correctly formed.
 await page.locator('#gcal').click();await page.waitForSelector('#gcal-sheet:not([hidden])');
 assert.equal(await page.locator('.gcal-item').count(),selected,`sheet lists ${selected} events`);
 for(const href of await page.locator('.gcal-add').evaluateAll(a=>a.map(x=>x.href))){
  const u=new URL(href);
  assert.equal(u.host,'calendar.google.com');
  assert.equal(u.searchParams.get('action'),'TEMPLATE');
  assert.equal(u.searchParams.get('ctz'),'America/Chicago');
  assert(/^\d{8}T\d{6}\/\d{8}T\d{6}$/.test(u.searchParams.get('dates')),`bad dates: ${u.searchParams.get('dates')}`);
  assert(u.searchParams.get('location'),'location missing');
 }
 await page.locator('#sheet-close').click();
 assert(await page.locator('#gcal-sheet').isHidden(),'sheet closes');
 for(const title of await page.locator('h2').allTextContents()){
  assert(/·\s*(Dallas|Frisco)$/.test(title.replace(/\s+/g,' ').trim()),`title missing its city: "${title}"`);
 }
 await photosFill(page,'add-calendar');
 await fits(page,'add-calendar');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/private/tmp/diwali-new.png',fullPage:true});
 await page.goto(base+'diwali-only.html');await page.waitForSelector('.event-card');
 assert.equal(await page.locator('.event-card').count(),2);assert.equal(await page.locator('input').count(),0);
 const photoBox=await page.locator('.event-photo').first().boundingBox();
 const detailBox=await page.locator('.event-body').first().boundingBox();
 assert(photoBox.y+photoBox.height<=detailBox.y+1);
 assert(await page.locator('.event-photo img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
 const text=await download();assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,2);assert(!text.includes('UID:kids'));assert(!text.includes('UID:chop'));
 await photosFill(page,'diwali-only');
 await fits(page,'diwali-only');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/private/tmp/diwali-only.png',fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: Google Calendar links per event, no scroll on iPhone 17 Pro/Pro Max, no clipping on short screens, any photo aspect fills its panel, Dallas-only fireworks wash, clickable pujan card, six selection states, exclusive Chopda sessions, one calendar per phone platform and both when unknown, cities in every title, both-event page, downloads, responsive widths, no JS errors.');
})().catch(error=>{console.error(error);process.exit(1)});
