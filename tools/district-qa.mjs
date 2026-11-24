import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const BASE=process.env.ADVENTURE_QA_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[];let lastPage;await mkdir('qa-output',{recursive:true});
const snapshot=p=>p.evaluate(()=>window.__districtDebug.snapshot());
async function context(options={},saves={}){const ctx=await browser.newContext({viewport:{width:960,height:540},...options});await ctx.addInitScript(values=>{if(sessionStorage.getItem('district-qa-seed'))return;sessionStorage.setItem('district-qa-seed','1');localStorage.setItem('umroh-graphics-v1','low');for(const [k,v]of Object.entries(values))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));},saves);return ctx;}
async function load(ctx){const p=await ctx.newPage();lastPage=p;p.on('pageerror',e=>errors.push(e.message));await p.goto(BASE+'/district.html');await p.waitForFunction(()=>window.__districtDebug);await p.locator('#startDistrict').click();return p;}
async function walk(p,x,z,tolerance=1.4){let pressed=[];const end=Date.now()+45000;
 while(Date.now()<end){const s=await snapshot(p),dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<tolerance)break;assert(s.playable&&!s.driving);const f=Math.sin(s.cameraYaw)*dx+Math.cos(s.cameraYaw)*dz,r=-Math.cos(s.cameraYaw)*dx+Math.sin(s.cameraYaw)*dz;const next=['ShiftLeft'];if(Math.abs(f)>.3)next.push(f>0?'KeyW':'KeyS');if(Math.abs(r)>.3)next.push(r>0?'KeyD':'KeyA');for(const k of pressed)if(!next.includes(k))await p.keyboard.up(k);for(const k of next)if(!pressed.includes(k))await p.keyboard.down(k);pressed=next;await p.waitForTimeout(75);}
 for(const k of pressed)await p.keyboard.up(k);const s=await snapshot(p);assert(Math.hypot(x-s.x,z-s.z)<tolerance+1,`walk failed ${x},${z}: ${s.x},${s.z}`);
}
async function drive(p,x,z,final=false){let pressed=[];const end=Date.now()+100000;
 while(Date.now()<end){const s=await snapshot(p),b=s.bus,d=Math.hypot(x-b.x,z-b.z);if(d<(final?2.5:3)&&(!final||Math.abs(b.speed)<.3))break;
  const desired=Math.atan2(x-b.x,z-b.z),delta=Math.atan2(Math.sin(desired-b.yaw),Math.cos(desired-b.yaw));const target=Math.min(Math.abs(delta)>.2?3.2:6,final?Math.min(5,Math.max(.5,d*.8)):6);const next=[];
  if(final&&d<2.5||b.speed>target+.25)next.push('Space');else if(b.speed<target)next.push('KeyW');
  if(Math.abs(delta)>.055)next.push(delta<0?'KeyD':'KeyA');
  for(const k of pressed)if(!next.includes(k))await p.keyboard.up(k);for(const k of next)if(!pressed.includes(k))await p.keyboard.down(k);pressed=next;await p.waitForTimeout(75);
 }
 for(const k of pressed)await p.keyboard.up(k);const b=(await snapshot(p)).bus;assert(Math.hypot(x-b.x,z-b.z)<(final?3:4),`drive failed ${x},${z}: ${JSON.stringify(b)}`);
}
try{
 if(process.env.DISTRICT_QA_ONLY!=='vehicle'){
  const sentinels={'manasik-adventure-v46':'legacy-sentinel','manasik-tawaf-quest-v1':{version:1,stage:3,laps:7},'manasik-sai-quest-v1':{version:1,stage:1,legs:2}};
  const ctx=await context({},sentinels),p=await load(ctx);
  await p.keyboard.down('KeyW');await p.locator('#pauseButton').click();await p.getByRole('button',{name:'Lanjutkan',exact:true}).click();const before=await snapshot(p);await p.waitForTimeout(350);const after=await snapshot(p);await p.keyboard.up('KeyW');assert(Math.hypot(after.x-before.x,after.z-before.z)<.02);
  await walk(p,-12,17);await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Terima misi',exact:true}).click();assert.equal((await snapshot(p)).stage,1);
  await walk(p,-5,15,1);await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Bawa koper',exact:true}).click();assert.equal((await snapshot(p)).stage,2);
  await walk(p,-4,21.5,.6);await p.keyboard.press('KeyE');assert.equal((await snapshot(p)).driving,true);assert.equal((await snapshot(p)).stage,3);
  await p.locator('#routeCue').waitFor({state:'visible'});assert((await p.locator('#mapRoute').getAttribute('points')).length>15);
  console.log('District QA: dialogue, luggage, boarding and pause passed');
  await drive(p,22,24);await drive(p,32,20);await drive(p,38,6);await drive(p,38,-12,true);
  await p.waitForFunction(()=>window.__districtDebug.snapshot().stage===4);assert((await snapshot(p)).bus.speed<.5);
  await p.locator('#routeCue').waitFor({state:'hidden'});
  await p.screenshot({path:'qa-output/district-bus.png'});await p.keyboard.press('KeyE');assert.equal((await snapshot(p)).driving,false);
  await walk(p,30,-12,1.5);await p.keyboard.press('KeyE');await p.getByRole('button',{name:'Selesaikan misi kawasan',exact:true}).click();assert.equal((await snapshot(p)).stage,5);await p.waitForFunction(()=>document.getElementById('districtCoins').textContent==='100');
  assert.equal(await p.getByRole('link',{name:'Masuk level Sa’i',exact:true}).count(),1);assert.equal(await p.getByRole('link',{name:'Masuk level Tahallul',exact:true}).count(),0);
  assert.equal(await p.evaluate(()=>localStorage.getItem('manasik-adventure-v46')),'legacy-sentinel');assert.equal(await p.evaluate(()=>localStorage.getItem('manasik-sai-quest-v1')),JSON.stringify(sentinels['manasik-sai-quest-v1']));
  await p.getByRole('button',{name:'Jelajahi lagi'}).click();await p.screenshot({path:'qa-output/district-desktop.png'});await p.reload();await p.locator('#startDistrict').click();assert.equal((await snapshot(p)).stage,5);report.push({test:'five missions through real keyboard movement, bus steering/braking/parking/exit, 100 reward, reload, old save isolation and locked portal',passed:true});await ctx.close();console.log('District QA: full bus journey and preserved old saves passed');
 }
 if(process.env.DISTRICT_QA_ONLY!=='vehicle'){
  const ctx=await context({viewport:{width:844,height:390},hasTouch:true,isMobile:true},{'manasik-district-v1':'{','manasik-district-v1.backup':{version:1,stage:2,avatar:'female'}}),p=await load(ctx);assert.equal((await snapshot(p)).stage,2);assert.equal((await snapshot(p)).avatar,'female');
  const cdp=await ctx.newCDPSession(p),box=await p.locator('#joy').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x,y:y-24}]});const before=await snapshot(p);await p.waitForTimeout(400);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x,y:y-24},{id:2,x:520,y:210}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x,y:y-24},{id:2,x:600,y:230}]});
  const release=await snapshot(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{id:2,x:600,y:230}]});await p.waitForTimeout(400);const after=await snapshot(p);assert(Math.hypot(after.x-release.x,after.z-release.z)>.2);assert(Math.abs(after.cameraYaw-before.cameraYaw)>.15);
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);const frozen=await snapshot(p);await p.waitForTimeout(400);const frozen2=await snapshot(p);assert.equal(frozen.playable,false);assert(Math.hypot(frozen2.x-frozen.x,frozen2.z-frozen.z)<.01);assert(await p.locator('#districtRotate').isVisible());
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.setViewportSize({width:844,height:390});await p.waitForTimeout(250);assert.equal((await snapshot(p)).playable,true);
  const stopped=await snapshot(p);await p.waitForTimeout(250);assert(Math.hypot((await snapshot(p)).x-stopped.x,(await snapshot(p)).z-stopped.z)<.01);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.screenshot({path:'qa-output/district-mobile.png'});report.push({test:'female avatar, backup recovery, independent mobile move/look pointers, portrait freeze, clean resume, no overflow',passed:true});await ctx.close();console.log('District QA: mobile landscape controls and recovery passed');
 }
 {
  const ctx=await context({viewport:{width:844,height:390},hasTouch:true,isMobile:true},{'manasik-district-v1':{version:1,stage:3,avatar:'male'}}),p=await load(ctx);
  await p.locator('#interactButton').tap();await p.waitForFunction(()=>window.__districtDebug.snapshot().driving);
  await p.locator('#brakeButton').waitFor({state:'visible'});
  const cdp=await ctx.newCDPSession(p),stick=await p.locator('#joy').boundingBox(),brake=await p.locator('#brakeButton').boundingBox();
  const a={id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2-27},b={id:2,x:brake.x+brake.width/2,y:brake.y+brake.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});await p.waitForFunction(()=>window.__districtDebug.snapshot().bus.speed>.7);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await p.waitForFunction(()=>Math.abs(window.__districtDebug.snapshot().bus.speed)<.05);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[b]});await p.waitForFunction(()=>window.__districtDebug.snapshot().bus.speed>.7);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await p.waitForFunction(()=>Math.abs(window.__districtDebug.snapshot().bus.speed)<.05);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.locator('#interactButton').tap();await p.waitForFunction(()=>!window.__districtDebug.snapshot().driving);
  report.push({test:'mobile vehicle boarding, joystick throttle, separate held brake, independent brake release, stop and touch disembark',passed:true});await ctx.close();
 }
 assert.deepEqual(errors,[]);await writeFile('qa-output/'+(process.env.DISTRICT_QA_ONLY==='vehicle'?'district-mobile-vehicle-qa.json':'district-qa.json'),JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify(report,null,2));
}catch(error){let state;try{state=await snapshot(lastPage);await lastPage.screenshot({path:'qa-output/district-failure.png'});}catch{}await writeFile('qa-output/district-qa.json',JSON.stringify({passed:false,report,errors,state,error:String(error)},null,2));throw error;}finally{await browser.close();}
