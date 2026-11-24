import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const BASE=process.env.ADVENTURE_QA_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[];
const snapshot=page=>page.evaluate(()=>window.__adventureDebug.snapshot());
const keys={tawaf:'manasik-tawaf-quest-v1',sai:'manasik-sai-quest-v1',tahallul:'manasik-tahallul-quest-v1'};
await mkdir('qa-output',{recursive:true});
async function context(options={},saves={}){
 const ctx=await browser.newContext({viewport:{width:960,height:540},...options});
 await ctx.addInitScript(values=>{if(sessionStorage.getItem('adventure-qa-seeded'))return;sessionStorage.setItem('adventure-qa-seeded','1');localStorage.setItem('umroh-graphics-v1','low');for(const [k,v]of Object.entries(values))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));},saves);
 return ctx;
}
async function load(ctx,url,start){const page=await ctx.newPage();page.on('pageerror',e=>{report.push({error:e.message,url});});await page.goto(BASE+'/'+url);await page.waitForFunction(()=>window.__adventureDebug);if(start)await page.locator('#'+start).click();return page;}
async function hold(page,key,ms){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);}
async function drive(page,x,z,tolerance=1){
 const deadline=Date.now()+35_000;let pressed=[];
 while(Date.now()<deadline){
  const s=await snapshot(page),dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<tolerance)break;
  assert(s.playing,'drive requires active game');
  const forward=Math.sin(s.yaw)*dx+Math.cos(s.yaw)*dz,right=-Math.cos(s.yaw)*dx+Math.sin(s.yaw)*dz;
  const chosen=['ShiftLeft'];if(Math.abs(forward)>.4)chosen.push(forward>0?'KeyW':'KeyS');if(Math.abs(right)>.4)chosen.push(right>0?'KeyD':'KeyA');
  for(const key of pressed)if(!chosen.includes(key))await page.keyboard.up(key);
  for(const key of chosen)if(!pressed.includes(key))await page.keyboard.down(key);
  pressed=chosen;await page.waitForTimeout(75);
 }
 for(const key of pressed)await page.keyboard.up(key);
 const s=await snapshot(page);assert(Math.hypot(x-s.x,z-s.z)<tolerance+1,`unreachable target ${x},${z} from ${s.x},${s.z}`);
}
try{
 // Existing old checkpoint resumes; right movement matches camera, menu clears held keys.
 {
  const ctx=await context({}, {[keys.tawaf]:{version:1,stage:1,laps:2}}),page=await load(ctx,'tawaf-adventure.html','startBtn');
  let s=await snapshot(page);assert.equal(s.count,2);assert.equal(s.gate,0);const x=s.x;
  await hold(page,'KeyD',500);s=await snapshot(page);assert(s.x<x-.2,'right strafe should move screen-right');
  await page.keyboard.down('KeyW');await page.locator('#menuBtn').click();await page.locator('#resumeBtn').click();
  const before=await snapshot(page);await page.waitForTimeout(350);const after=await snapshot(page);await page.keyboard.up('KeyW');
  assert(Math.hypot(after.x-before.x,after.z-before.z)<.02,'held input leaked through pause');
  await page.mouse.move(620,310);await page.mouse.down();await page.mouse.move(690,360,{steps:5});await page.mouse.up();
  s=await snapshot(page);assert(s.pitch>.3,'vertical camera orbit missing');assert(s.drawCalls>0);
  await page.screenshot({path:'qa-output/adventure-desktop.png'});report.push({test:'desktop input, camera, old save, menu resume',passed:true});await ctx.close();
 }
 // Finish Tawaf's last sub-checkpoint through real movement, then interact and verify unlock.
 {
  const ctx=await context({}, {[keys.tawaf]:{version:1,stage:1,laps:6,gate:7}}),page=await load(ctx,'tawaf-adventure.html','startBtn');
  assert.equal((await snapshot(page)).gate,7);
  await drive(page,19*Math.cos(-Math.PI/8),19*Math.sin(-Math.PI/8),.5);await drive(page,19,1,.4);await page.waitForFunction(()=>window.__adventureDebug.snapshot().stage===2);
  await drive(page,28,-9,1.7);await page.keyboard.press('KeyE');await page.locator('#endLayer').waitFor({state:'visible'});
  const save=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),keys.tawaf);assert.equal(save.stage,3);assert.equal(save.laps,7);
  await page.goto(BASE+'/adventure-map.html');assert.match(await page.locator('[data-chapter=sai] a.levelAction').getAttribute('href'),/sai-adventure/);assert.equal(await page.locator('[data-chapter=sai].active a.levelAction').count(),1);
  report.push({test:'Tawaf final gate, guide interaction, persisted completion and Sai unlock',passed:true});await ctx.close();
 }
 // Resume a Sai gate, preserve legacy keys, complete final leg and interact with guide.
 {
  const ctx=await context({}, {[keys.tawaf]:{version:1,stage:3,laps:7},[keys.sai]:{version:1,stage:1,legs:6,gate:4},'manasik-adventure-v46':'legacy-sentinel'});
  const page=await load(ctx,'sai-adventure.html','start');let s=await snapshot(page);assert.equal(s.gate,4);assert(Math.abs(s.z-23.4)<.01);
  await drive(page,0,38,1);await page.waitForFunction(()=>window.__adventureDebug.snapshot().stage===2);
  await drive(page,6,38,1.5);await page.keyboard.press('KeyE');await page.locator('#end').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('manasik-adventure-v46')),'legacy-sentinel');
  await page.goto(BASE+'/adventure-map.html');assert.match(await page.locator('[data-chapter=tahallul] a.levelAction').getAttribute('href'),/tahallul-adventure/);
  report.push({test:'Sai sub-checkpoint, final leg, guide, Tahallul unlock and legacy save isolation',passed:true});await ctx.close();
 }
 // Complete a resumed female haircut using the live action and private doorway.
 {
  const ctx=await context({}, {[keys.sai]:{version:1,stage:3,legs:7},[keys.tahallul]:{version:1,stage:2,avatar:'female',method:'trim',cuts:2}});
  const page=await load(ctx,'tahallul-adventure.html','start');await page.keyboard.press('KeyE');await page.locator('#cutPanel').waitFor({state:'visible'});
  await page.locator('#cutButton').click();await page.waitForFunction(()=>window.__adventureDebug.snapshot().stage===3);
  // The timed cutting action can finish later under software rendering.
  // Move only after the real panel closes and input is playable, rather than a fixed Node timer.
  await page.locator('#cutPanel').waitFor({state:'hidden'});await page.waitForFunction(()=>window.__adventureDebug.snapshot().playing);
  await drive(page,9,10.5,1);await drive(page,14,10.5,1);await drive(page,18,10.5,1);await drive(page,18,7,1.7);await page.keyboard.press('KeyE');await page.locator('#finish').waitFor({state:'visible'});
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),keys.tahallul);assert.equal(saved.avatar,'female');assert.equal(saved.cuts,3);assert.equal(saved.stage,4);
  report.push({test:'resumed female Tahallul action and return to group',passed:true});await ctx.close();
 }
 // Mobile two-finger independence and orientation blocking with a held control.
 {
  const ctx=await context({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await load(ctx,'tawaf-adventure.html','startBtn');
  const cdp=await ctx.newCDPSession(page),box=await page.locator('#joy').boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},{x:600,y:225,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-25,y:cy-20,id:1},{x:630,y:250,id:2}]});await page.waitForTimeout(400);
  const multi=await snapshot(page);assert(multi.pitch>.3);assert(Math.hypot(multi.x-19,multi.z-6)>.1);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:cx-25,y:cy-20,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:650,y:275,id:2}]});await page.waitForTimeout(150);
  assert((await snapshot(page)).pitch>multi.pitch,'lifting joystick pointer must preserve camera pointer');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.keyboard.down('KeyW');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  const portrait=await snapshot(page);assert(!portrait.playing);await page.waitForTimeout(400);const stopped=await snapshot(page);assert.equal(stopped.x,portrait.x);assert.equal(stopped.z,portrait.z);
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);const resumed=await snapshot(page);await page.waitForTimeout(300);
  const stationary=await snapshot(page);assert(Math.hypot(resumed.x-stationary.x,resumed.z-stationary.z)<.02);await page.keyboard.up('KeyW');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'qa-output/adventure-mobile-landscape.png'});report.push({test:'mobile multi-touch, independent release, landscape/portrait pause, no overflow',passed:true});await ctx.close();
 }
 // Recovery uses old-format backup; no rendering or startup exception on a bad primary.
 {
  const ctx=await context({}, {[keys.tawaf]:'{broken',[keys.tawaf+'.backup']:{version:1,stage:1,laps:4,gate:3}}),page=await load(ctx,'tawaf-adventure.html','startBtn');
  assert.equal((await snapshot(page)).count,4);assert.equal((await snapshot(page)).gate,3);
  report.push({test:'corrupt primary recovers previous compatible checkpoint',passed:true});await ctx.close();
 }
 // Smoke the preserved preparation route, training entry, homepage and pre-existing simulator.
 {
  const ctx=await context(),page=await ctx.newPage();page.on('pageerror',e=>report.push({error:e.message,url:page.url()}));
  for(const url of ['index.html','adventure.html?classic=1','manasik.html','legacy.html']){
   await page.goto(BASE+'/'+url);await page.waitForTimeout(900);assert((await page.title()).length>0);assert.equal(await page.locator('body').count(),1);
  }
  report.push({test:'legacy preparation, training entry, homepage and simulator smoke',passed:true});await ctx.close();
 }
 assert(!report.some(r=>r.error),'browser emitted runtime errors');
} catch(error){report.push({failed:error.stack});process.exitCode=1;}
finally{await browser.close();await writeFile('qa-output/adventure-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
