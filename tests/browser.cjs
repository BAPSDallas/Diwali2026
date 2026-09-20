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
 // The cards are meant to read as a calendar, so their rendered order must match
 // the event dates — not the order the ids happen to be listed in.
 async function chronological(page,name){
  const dates=await page.evaluate(()=>{
   const label=c=>c.querySelector('.date-labels').textContent+' '+c.querySelector('.date-num').textContent;
   return [...document.querySelectorAll('.event-card')].map(label);
  });
  const key=await page.evaluate(()=>[...document.querySelectorAll('.event-card')].map(c=>{
   const day=c.querySelector('.date-num').textContent.padStart(2,'0');
   const month={OCT:'10',NOV:'11'}[c.querySelector('.date-labels').textContent.split('· ')[1]];
   return month+day;
  }));
  assert.deepEqual(key,[...key].sort(),`${name} cards must run oldest first, got ${dates.join(', ')}`);
  return key;
 }
 // A dialog inside an element with a backdrop-filter becomes positioned against
 // that element, not the viewport: the scrim once covered only the 89px action
 // bar while computed position still read "fixed". Only a measured box sees it.
 async function covers(page,id,name){
  const box=await page.locator(id).boundingBox();
  const view=page.viewportSize();
  assert(box.width>=view.width-1&&box.height>=view.height-1,
   `${name} scrim must cover the viewport, got ${box.width}x${box.height} of ${view.width}x${view.height}`);
  const panel=await page.locator(`${id} .sheet-panel`).boundingBox();
  const slack=Math.abs((panel.y+panel.height/2)-view.height/2);
  assert(slack<=view.height*0.06,`${name} panel must sit centred, off by ${Math.round(slack)}px`);
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
 // The fireworks wash is optional decoration: however many events carry the flag,
 // that many columns must render it, and any asset referenced must load.
 const fwExpected=await page.evaluate(()=>DiwaliCalendar.events.filter(e=>e.fireworks).length);
 assert.equal(await page.locator('.has-fireworks').count(),fwExpected,'fireworks columns must match flagged events');
 for(const url of await page.locator('.has-fireworks').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).getPropertyValue('--fireworks').replace(/^url\(['"]?|['"]?\)$/g,'').trim()))){
  assert((await page.request.get(new URL(url,page.url()).href)).ok(),`fireworks asset missing: ${url}`);
 }
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
 // The sheet only exists after a click, so it never appears in routine
 // screenshots. These assert its stylesheet actually applies: a whole block of
 // sheet CSS was once deleted by an unrelated edit and every behavioural test
 // above still passed while the panel rendered as a bare bulleted list.
 const styled=await page.evaluate(()=>{
  const css=(sel,prop)=>getComputedStyle(document.querySelector(sel))[prop];
  return {overlay:css('.sheet','position'),panelBg:css('.sheet-panel','backgroundColor'),
   bullets:css('#gcal-list','listStyleType'),row:css('.gcal-item','display'),
   addBg:css('.gcal-add','backgroundColor'),name:css('.gcal-item strong','display')};
 });
 assert.equal(styled.overlay,'fixed','sheet must overlay the page, not sit in flow');
 assert.equal(styled.bullets,'none','sheet list is unstyled');
 assert.equal(styled.row,'flex','sheet rows are unstyled');
 assert.equal(styled.name,'block','sheet row text would run together');
 assert(!/rgba\(0, 0, 0, 0\)/.test(styled.addBg),'Add is unstyled');
 assert(!/rgba\(0, 0, 0, 0\)/.test(styled.panelBg),'sheet panel is unstyled');
 await covers(page,'#gcal-sheet','Google');
 await page.locator('#sheet-close').click();
 assert(await page.locator('#gcal-sheet').isHidden(),'sheet closes');
 // Help is a dialog now, not an inline disclosure: expanding it in flow pushed
 // the grid and broke the one-screen fit.
 assert.equal(await page.locator('details').count(),0,'help must not be an inline disclosure');
 assert.equal(await page.locator('#help .ico-info').count(),1,'help button needs its info icon');
 await page.locator('#help').click();await page.waitForSelector('#help-sheet:not([hidden])');
 await covers(page,'#help-sheet','Help');
 assert(!/rgba\(0, 0, 0, 0\)/.test(await page.evaluate(()=>getComputedStyle(document.querySelector('#help-sheet .sheet-panel')).backgroundColor)),'help panel is unstyled');
 // Desktop cannot be attributed to a calendar, so it gets the picker and no
 // steps until the visitor chooses one.
 assert(await page.locator('#help-picker').isVisible(),'desktop needs the calendar picker');
 assert(await page.locator('#help-apple').isHidden()&&await page.locator('#help-google').isHidden(),'desktop shows no steps until a choice');
 for(const [choice,shown,hidden] of [['apple','#help-apple','#help-google'],['google','#help-google','#help-apple']]){
  await page.locator(`#help-picker button[data-help=${choice}]`).click();
  assert(await page.locator(shown).isVisible(),`${choice} steps must show when chosen`);
  assert(await page.locator(hidden).isHidden(),`only one step list at a time`);
  assert.equal(await page.locator(`${shown} li`).count(),4,`${choice} needs four numbered steps`);
  assert.equal(await page.locator(`#help-picker button[data-help=${choice}]`).getAttribute('aria-pressed'),'true');
 }
 // These links were removed; the panel is instructions only.
 assert.equal(await page.locator('#help-sheet a').count(),0,'help panel must carry no links');
 await page.keyboard.press('Escape');
 assert(await page.locator('#help-sheet').isHidden(),'help closes on Escape');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'help','focus returns to the help button');
 // Titles and addresses must each fit one line. The accent is a layer rather than
 // a column precisely so the text has the full card width; if it ever returns to
 // the flow these wrap again and the cards stop fitting one screen.
 for(const width of [320,375,402,440]){
  await page.setViewportSize({width,height:740});
  const shape=await page.evaluate(()=>{
   const lines=n=>Math.round(n.getBoundingClientRect().height/parseFloat(getComputedStyle(n).lineHeight));
   return {titles:[...document.querySelectorAll('h2')].filter(n=>lines(n)>1).map(n=>n.textContent.trim()),
           addresses:[...document.querySelectorAll('.address')].map(lines)};
  });
  assert.deepEqual(shape.titles,[],`title wrapped onto two lines at ${width}px`);
  // Street and locality are separate spans, so this is two lines at every width.
  assert(shape.addresses.every(n=>n===2),`address not two lines at ${width}px: ${shape.addresses}`);
  const layered=await page.evaluate(()=>getComputedStyle(document.querySelector('.date-rail')).position);
  assert.equal(layered,'absolute',`date accent must stay a layer at ${width}px`);
 }
 await page.setViewportSize({width:402,height:740});

 // The rail carries the whole date now, so every card must show a weekday badge
 // and the time must render as a badge rather than a bare line.
 for(const label of await page.locator('.date-labels').allTextContents()){
  assert(/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY) · [A-Z]{3}$/.test(label),`bad date badge: "${label}"`);
 }
 // A fixed time and a chosen session are both "selected", so they must render
 // identically; the two rules live apart and would otherwise drift.
 const badges=await page.evaluate(()=>{
  const g=sel=>{const c=getComputedStyle(document.querySelector(sel));
   return [c.backgroundColor,c.color,c.borderRadius,Math.round(document.querySelector(sel).getBoundingClientRect().height)].join('|');};
  return {fixed:g('.event-time'),selected:g('.session.selected'),unselected:g('.session:not(.selected)')};
 });
 assert.equal(badges.fixed,badges.selected,'fixed time must match a selected session badge');
 assert.notEqual(badges.fixed,badges.unselected,'selected and unselected must stay distinguishable');
 // Frisco is meant to read as a different place, not a variation of Dallas, so
 // its accent has to actually resolve to a different colour on every surface
 // that carries one. A typo in the token block would silently fall back to red.
 const accents=await page.evaluate(()=>{
  const read=venue=>{const card=document.querySelector(`.venue-${venue}`),s=getComputedStyle(card);
   return {time:getComputedStyle(card.querySelector('.event-time')||card.querySelector('.session.selected')).backgroundColor,
           rail:getComputedStyle(card.querySelector('.date-rail')).color,
           label:getComputedStyle(card.querySelector('.date-labels')).color,
           surface:s.backgroundImage,border:s.borderTopColor};};
  return {dallas:read('dallas'),frisco:read('frisco')};
 });
 for(const key of ['time','rail','label','surface','border']){
  assert.notEqual(accents.frisco[key],accents.dallas[key],`Frisco must differ from Dallas in ${key}`);
 }
 assert.equal(await page.locator('.venue-frisco').count(),1,'exactly one Frisco card');
 for(const title of await page.locator('h2').allTextContents()){
  assert(/·\s*(Dallas|Frisco)$/.test(title.replace(/\s+/g,' ').trim()),`title missing its city: "${title}"`);
 }
 const order=await chronological(page,'add-calendar');
 assert.deepEqual(order,['1031','1108','1110','1114'],'all-events order is Oct 31, Nov 8, 10, 14');
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
 assert.deepEqual(await chronological(page,'diwali-only'),['1110','1114'],'diwali-only order is Nov 10 then 14');
 assert.equal(await page.locator('details').count(),0,'help must not be an inline disclosure');
 await page.locator('#help').click();await page.waitForSelector('#help-sheet:not([hidden])');
 await covers(page,'#help-sheet','Help');
 await page.locator('#help-close').click();
 assert(await page.locator('#help-sheet').isHidden(),'help closes');
 await photosFill(page,'diwali-only');
 await fits(page,'diwali-only');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/private/tmp/diwali-only.png',fullPage:true});
 // The action buttons and the help steps must name the same calendar, so both
 // read the same detection. Exercise it with real user agents rather than
 // trusting that two separate branches happen to agree.
 for(const [label,ua,expect,gone] of [
  ['iPhone','Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1','apple','google'],
  ['Android','Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36','google','apple']]){
  const ctx=await browser.newContext({userAgent:ua,viewport:{width:402,height:740}});
  const phone=await ctx.newPage();const phoneErrors=[];phone.on('pageerror',e=>phoneErrors.push(e.message));
  await phone.goto(base+'add-calendar.html');await phone.waitForSelector('.event-card');
  assert.equal(await phone.locator(`.action-buttons.show-${expect}`).count(),1,`${label} shows only the ${expect} button`);
  await phone.locator('#help').click();await phone.waitForSelector('#help-sheet:not([hidden])');
  assert(await phone.locator(`#help-${expect}`).isVisible(),`${label} must get the ${expect} steps`);
  assert(await phone.locator(`#help-${gone}`).isHidden(),`${label} must not get the ${gone} steps`);
  assert(await phone.locator('#help-picker').isHidden(),`${label} knows its calendar, so no picker`);
  assert.equal(await phone.locator(`#help-${expect} li`).count(),4,`${label} needs four numbered steps`);
  const first=await phone.locator(`#help-${expect} li strong`).first().textContent();
  const button=await phone.locator('.action-buttons button:visible span').last().textContent();
  assert(button.includes(first),`${label} step 1 says "${first}" but the button says "${button}"`);
  assert.deepEqual(phoneErrors,[],`${label} JS errors`);
  await ctx.close();
 }
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: Google Calendar sheet styled and linked per event, no scroll on iPhone 17 Pro/Pro Max, no clipping on short screens, any photo aspect fills its panel, fireworks markers match the data, clickable pujan card, six selection states, exclusive Chopda sessions, one calendar per phone platform and both when unknown, one-line titles over a layered accent, both-event page, downloads, responsive widths, no JS errors.');
})().catch(error=>{console.error(error);process.exit(1)});
