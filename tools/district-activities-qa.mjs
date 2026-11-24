import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const BASE=process.env.ADVENTURE_QA_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[],main={version:1,stage:5,avatar:'female'},mainKey='manasik-district-v1',bonusKey='manasik-district-errands-v1';let lastPage;
const snapshot=p=>p.evaluate(()=>window.__districtDebug.snapshot());await mkdir('qa-output',{recursive:true});
async function context(options={},saves={}){const c=await browser.newContext({viewport:{width:960,height:540},...options});await c.addInitScript(values=>{if(sessionStorage.getItem('activities-seed'))return;sessionStorage.setItem('activities-seed','1');localStorage.setItem('umroh-graphics-v1','low');for(const [k,v]of Object.entries(values))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));},{[mainKey]:main,'manasik-adventure-v46':'classic-progress','manasik-tawaf-quest-v1':'tawaf-progress-sentinel',...saves});return c;}
async function load(c){const p=await c.newPage();lastPage=p;p.on('pageerror',e=>errors.push(e.message));await p.goto(BASE+'/district.html');await p.locator('#startDistrict').click();return p;}
async function walk(p,x,z,tolerance=1){const end=Date.now()+60000;
 while(Date.now()<end){const s=await snapshot(p),dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<tolerance)break;assert(s.playable&&!s.driving);
  const desired=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(desired-s.cameraYaw),Math.cos(desired-s.cameraYaw));
  // Face the actual segment before walking; 8-way diagonal steering cuts corridor corners.
  if(Math.abs(turn)>.07){await p.keyboard.up('KeyW');await p.mouse.move(450,210);await p.mouse.down();await p.mouse.move(450-Math.max(-300,Math.min(300,turn/.004)),210,{steps:3});await p.mouse.up();}
  else{await p.keyboard.down('ShiftLeft');await p.keyboard.down('KeyW');await p.waitForTimeout(70);}
 }
 await p.keyboard.up('KeyW');await p.keyboard.up('ShiftLeft');const s=await snapshot(p);assert(Math.hypot(x-s.x,z-s.z)<tolerance+.5,`unreachable ${x},${z}: ${s.x},${s.z}`);
}
async function coins(p,value){await p.waitForFunction(v=>document.getElementById('districtCoins').textContent===String(v),value);}
try{
 {
  const c=await context(),p=await load(c);await p.locator('#missionButton').click();assert.match(await p.locator('#dialogText').textContent(),/5\/5/);await p.getByRole('button',{name:'Kembali bermain',exact:true}).click();
  await walk(p,30,18);await walk(p,-14,19);await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Dampingi ke halte',exact:true}).click();assert.equal((await snapshot(p)).errands.stage,1);
  await p.locator('#missionButton').click();let n=(await snapshot(p)).hasan;await p.waitForTimeout(400);assert.deepEqual((await snapshot(p)).hasan,n);await p.getByRole('button',{name:'Kembali bermain',exact:true}).click();
  await walk(p,-2,19);await p.waitForFunction(()=>window.__districtDebug.snapshot().hasan.waiting==='distance');n=(await snapshot(p)).hasan;await p.waitForTimeout(350);assert.equal((await snapshot(p)).hasan.z,n.z);
  const gate=(await snapshot(p)).errands.escortGate;await p.reload();await p.locator('#startDistrict').click();assert.equal((await snapshot(p)).errands.escortGate,gate);assert.equal((await snapshot(p)).errands.stage,1);
  await walk(p,-14,26);await p.waitForFunction(()=>window.__districtDebug.snapshot().hasan.z>25.5);await walk(p,-14,32);await p.waitForFunction(()=>window.__districtDebug.snapshot().hasan.gate===3);await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Selesaikan pendampingan',exact:true}).click();await coins(p,130);console.log('Activities QA: escort waits, pauses, resumes checkpoint and awards once');
  await walk(p,-8,18);await walk(p,-8,-26);await walk(p,-20,-33);await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Ambil paket',exact:true}).click();assert.equal((await snapshot(p)).errands.stage,3);
  await p.reload();await p.locator('#startDistrict').click();assert.equal((await snapshot(p)).errands.stage,3);await walk(p,30,-12);await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Serahkan paket',exact:true}).click();await coins(p,170);
  await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Jelajahi lagi',exact:true}).click();await coins(p,170);
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),mainKey),JSON.stringify(main));assert.equal(await p.evaluate(()=>localStorage.getItem('manasik-tawaf-quest-v1')),'tawaf-progress-sentinel');assert.equal(await p.evaluate(()=>localStorage.getItem('manasik-adventure-v46')),'classic-progress');
  await p.locator('#missionButton').click();assert.match(await p.locator('#dialogText').textContent(),/selesai · 30 poin/);assert.match(await p.locator('#dialogText').textContent(),/selesai · 40 poin/);await p.screenshot({path:'qa-output/activities-book.png'});await p.getByRole('button',{name:'Kembali bermain',exact:true}).click();await p.reload();await p.locator('#startDistrict').click();await coins(p,170);report.push('keyboard: complete escort and delivery, distance waiting, menu freeze, intermediate checkpoint resumes, 70 bonus reward once, original saves and portals preserved');await c.close();
 }
 {
  const c=await context({viewport:{width:844,height:390},hasTouch:true,isMobile:true},{[bonusKey]:'{broken',[bonusKey+'.backup']:{version:1,stage:3,escortGate:3}}),p=await load(c);assert.equal((await snapshot(p)).errands.stage,3);assert.equal((await snapshot(p)).avatar,'female');
  await p.waitForFunction(()=>!document.getElementById('mapRoute').hasAttribute('hidden'));assert((await p.locator('#mapRoute').getAttribute('points')).length>5);await p.screenshot({path:'qa-output/activities-mobile-parcel.png'});
  await p.locator('#missionButton').tap();await p.setViewportSize({width:390,height:844});await p.waitForTimeout(250);assert(await p.locator('#districtRotate').isVisible());assert.equal((await snapshot(p)).playable,false);await p.setViewportSize({width:844,height:390});await p.getByRole('button',{name:'Kembali bermain',exact:true}).tap();
  await walk(p,30,-12);await p.locator('#interactButton').tap();await p.getByRole('button',{name:'Serahkan paket',exact:true}).tap();await coins(p,170);assert.equal((await snapshot(p)).errands.stage,4);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:'qa-output/activities-mobile-complete.png'});report.push('mobile: female parcel checkpoint from backup, walking route, mission book and portrait blocking, touch handover, 170 points, no overflow');await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile('qa-output/district-activities-qa.json',JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify(report,null,2));
}catch(error){let state;try{state=await snapshot(lastPage);await lastPage.screenshot({path:'qa-output/activities-failure.png'});}catch{}await writeFile('qa-output/district-activities-qa.json',JSON.stringify({passed:false,report,errors,state,error:String(error)},null,2));throw error;}finally{await browser.close();}
