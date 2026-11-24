import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const production=process.argv.includes('--production'),BASE=process.env.ADVENTURE_QA_URL||`http://127.0.0.1:${production?4173:5173}`;
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[],yaw=new WeakMap();let lastPage;await mkdir('qa-output',{recursive:true});
async function load(stage,side=0,gate=side>=2?3:0,options={},mitra=''){
  const ctx=await browser.newContext({viewport:{width:960,height:540},...options});
  await ctx.addInitScript(({stage,side,gate,mitra})=>{
    if(sessionStorage.getItem('dialogue-seeded'))return;sessionStorage.setItem('dialogue-seeded','1');localStorage.setItem('umroh-graphics-v1','low');
    const suffix=mitra?':'+mitra+':guest':'';
    localStorage.setItem('manasik-district-v1'+suffix,JSON.stringify({version:1,stage,avatar:'female'}));
    localStorage.setItem('manasik-district-errands-v1'+suffix,JSON.stringify({version:1,stage:side,escortGate:gate}));
    localStorage.setItem('manasik-adventure-v46','classic-sentinel');localStorage.setItem('manasik-tawaf-quest-v1',JSON.stringify({version:1,stage:3,laps:7}));localStorage.setItem('manasik-sai-quest-v1',JSON.stringify({version:1,stage:1,legs:2,gate:1}));
  },{stage,side,gate,mitra});
  const p=await ctx.newPage();lastPage=p;p.on('pageerror',e=>errors.push(e.message));await p.goto(BASE+'/district.html'+(mitra?'?mitra='+mitra:''));await p.locator('#startDistrict').click();yaw.set(p,1.3);return {ctx,p};
}
const position=p=>p.locator('#mapPlayer').getAttribute('transform').then(t=>{const m=t.match(/translate\(([-\d.e+]+)\s+([-\d.e+]+)\)/);return {x:Number(m[1])-70,z:Number(m[2])-57};});
const saved=p=>p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('manasik-')).sort().map(k=>[k,localStorage.getItem(k)])));
async function walk(p,x,z){const end=Date.now()+45000;
  while(Date.now()<end){const s=await position(p),dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<.8)break;
    const desired=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(desired-yaw.get(p)),Math.cos(desired-yaw.get(p)));
    if(Math.abs(turn)>.08){await p.keyboard.up('KeyW');const dx=-Math.max(-250,Math.min(250,turn/.004));await p.mouse.move(450,240);await p.mouse.down();await p.mouse.move(450+dx,240,{steps:3});await p.mouse.up();yaw.set(p,yaw.get(p)-dx*.004);}
    else{await p.keyboard.down('ShiftLeft');await p.keyboard.down('KeyW');await p.waitForTimeout(90);}
  }
  await p.keyboard.up('KeyW');await p.keyboard.up('ShiftLeft');const s=await position(p);assert(Math.hypot(x-s.x,z-s.z)<1.3,'walk failed '+JSON.stringify(s));
}
const choose=(p,id)=>p.locator(`#dialogActions [data-choice="${id}"]`).click();
async function root(p,speaker){assert.equal(await p.locator('#districtDialog').getAttribute('data-speaker'),speaker);assert.equal(await p.locator('#districtDialog').getAttribute('data-node'),'root');}
async function question(p,id,pattern){await choose(p,id);assert.match(await p.locator('#dialogText').textContent(),pattern);assert.equal(await p.locator('#districtDialog').getAttribute('data-node'),id);assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('data-choice')),'back');await choose(p,'back');}
try{
  {
    const {ctx,p}=await load(0);await walk(p,-12,17);await p.keyboard.down('KeyW');await p.keyboard.press('KeyE');await root(p,'farid');
    const before=await saved(p),pos=await position(p);await question(p,'story',/penginapan.*koper/s);await question(p,'help',/Terima misi/);await question(p,'help',/Terima misi/);
    assert.deepEqual(await saved(p),before);assert.deepEqual(await position(p),pos);assert.equal(await p.locator('#districtCoins').textContent(),'0');
    // Native dialogs may focus browser chrome (reported as body) between tab cycles.
    // Background game controls must never enter the modal's keyboard order.
    for(let i=0;i<8;i++){await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.activeElement===document.body||document.getElementById('districtDialog').contains(document.activeElement)));}
    await p.keyboard.up('KeyW');await p.keyboard.press('Escape');await p.locator('#districtDialog').waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>document.activeElement.id),'districtWorld');await p.waitForTimeout(300);assert.deepEqual(await position(p),pos);
    await p.keyboard.press('KeyE');await choose(p,'briefing');await p.waitForFunction(()=>document.getElementById('districtCoins').textContent==='20');
    await p.keyboard.press('KeyE');await root(p,'farid');assert.equal(await p.locator('[data-choice="briefing"]').count(),0);const accepted=await saved(p);await question(p,'help',/Koper berada/);assert.deepEqual(await saved(p),accepted);
    await p.screenshot({path:`qa-output/dialogue-${production?'production':'desktop'}-farid.png`});await choose(p,'leave');
    if(production)assert.equal(await p.evaluate(()=>typeof window.__districtDebug),'undefined');report.push('Farid: story/help/back, repeated questions read-only, modal keyboard focus, held-key cleanup/Escape, one mission reward, updated luggage directions');await ctx.close();
  }
  {
    const {ctx,p}=await load(5,1,3);await p.keyboard.press('KeyE');await root(p,'hasan');const before=await saved(p);await question(p,'help',/Selesaikan pendampingan/);assert.deepEqual(await saved(p),before);assert.equal(await p.locator('#districtCoins').textContent(),'100');
    await choose(p,'finishEscort');await p.waitForFunction(()=>document.getElementById('districtCoins').textContent==='130');await p.keyboard.press('KeyE');await root(p,'hasan');assert.match(await p.locator('#dialogText').textContent(),/beristirahat/);assert.equal(await p.locator('[data-choice="finishEscort"]').count(),0);await question(p,'help',/Pak Rizal/);
    await choose(p,'leave');assert.equal(await p.evaluate(()=>localStorage.getItem('manasik-adventure-v46')),'classic-sentinel');report.push('Hasan: checkpoint arrival still needs handover, questions do not award, single 30-point completion, acknowledgement and next market directions');await ctx.close();
  }
  {
    const {ctx,p}=await load(5,3);await p.keyboard.press('KeyE');await root(p,'rizal');assert.match(await p.locator('#dialogText').textContent(),/masih kamu bawa/);assert.equal(await p.locator('[data-choice="takeParcel"]').count(),0);const before=await saved(p);await question(p,'help',/Serahkan paket/);await question(p,'story',/perlengkapan/);assert.deepEqual(await saved(p),before);report.push('Rizal: carried-parcel response, delivery directions, story and no duplicate parcel action');await ctx.close();
  }
  {
    const {ctx,p}=await load(5,4,3,{viewport:{width:844,height:390},hasTouch:true,isMobile:true},'demo-travel');await walk(p,30,-12);await p.locator('#interactButton').tap();await root(p,'salma');assert.match(await p.locator('#dialogText').textContent(),/Paket sudah saya terima/);
    assert.match(await p.locator('#dialogActions a').first().textContent(),/kampanye 12 bab/);assert.match(await p.locator('#dialogActions a').first().getAttribute('href'),/adventure-map.*mitra=demo-travel/);assert.equal(await p.getByRole('link',{name:'Masuk level Sa’i',exact:true}).count(),1);assert.equal(await p.getByRole('link',{name:'Masuk level Tahallul',exact:true}).count(),0);assert.match(await p.getByRole('link',{name:'Masuk level Sa’i',exact:true}).getAttribute('href'),/mitra=demo-travel/);
    const before=await saved(p);await p.locator('[data-choice="help"]').tap();assert.match(await p.locator('#dialogText').textContent(),/Sa’i/);await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);assert(await p.locator('#districtRotate').isVisible());await p.setViewportSize({width:844,height:390});await p.locator('[data-choice="back"]').tap();
    await p.screenshot({path:`qa-output/dialogue-${production?'production-':''}mobile-salma.png`});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const sizes=await p.locator('#dialogActions button,#dialogActions a').evaluateAll(items=>items.map(i=>i.getBoundingClientRect().height));assert(sizes.every(h=>h>=44));assert.deepEqual(await saved(p),before);
    await p.locator('[data-choice="leave"]').tap();assert.equal(await p.locator('#districtCoins').textContent(),'170');report.push('Mobile Salma: both completed helps acknowledged, old chapter locks/tenant links, touch branch/back/close, portrait recovery, 44px actions, no overflow and unchanged 170 points');await ctx.close();
  }
  assert.deepEqual(errors,[]);await writeFile(`qa-output/district-dialogue-${production?'production-':''}qa.json`,JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify(report,null,2));
}catch(error){let state;try{state=await lastPage.locator('#districtDialog').textContent();await lastPage.screenshot({path:'qa-output/dialogue-failure.png'});}catch{}await writeFile(`qa-output/district-dialogue-${production?'production-':''}qa.json`,JSON.stringify({passed:false,report,errors,state,error:String(error)},null,2));throw error;}finally{await browser.close();}
