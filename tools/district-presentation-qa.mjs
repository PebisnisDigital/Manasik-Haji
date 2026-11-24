import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const BASE=process.env.ADVENTURE_QA_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[];let lastPage;
await mkdir('qa-output',{recursive:true});
const snapshot=p=>p.evaluate(()=>window.__districtDebug.snapshot());
const samples=(p,n=14)=>p.evaluate(async n=>{const frames=[];for(let i=0;i<n;i++){await new Promise(requestAnimationFrame);frames.push(window.__districtDebug.snapshot());}return frames;},n);
async function load(stage,avatar='male',options={}){
  const ctx=await browser.newContext({viewport:{width:960,height:540},...options});
  await ctx.addInitScript(({stage,avatar})=>{localStorage.setItem('umroh-graphics-v1','low');localStorage.setItem('manasik-district-v1',JSON.stringify({version:1,stage,avatar}));localStorage.setItem('manasik-adventure-v46','old-save-sentinel');},{stage,avatar});
  const p=await ctx.newPage();lastPage=p;p.on('pageerror',e=>errors.push(e.message));
  await p.goto(BASE+'/district.html');await p.waitForFunction(()=>window.__districtDebug);await p.locator('#startDistrict').click();await samples(p,3);return {ctx,p};
}
const roll=s=>s.presentation.wheels[0].roll;
const rollDelta=(a,b)=>Math.atan2(Math.sin(roll(b)-roll(a)),Math.cos(roll(b)-roll(a)));
try{
  {
    const {ctx,p}=await load(0,'female');
    await p.keyboard.down('KeyW');const walking=await samples(p,12);await p.keyboard.up('KeyW');const idle=await samples(p,12);
    assert(walking.some(s=>s.presentation.locomotion.moving&&s.presentation.locomotion.blend>0&&s.presentation.locomotion.blend<1),'walk crossfade missing');
    assert(idle.some(s=>!s.presentation.locomotion.moving&&s.presentation.locomotion.blend>0&&s.presentation.locomotion.blend<1),'idle crossfade missing');
    assert.equal(idle.at(-1).presentation.locomotion.blend,0);
    await p.keyboard.down('KeyW');await samples(p,2);await p.locator('#pauseButton').click();const paused=await snapshot(p);await p.waitForTimeout(350);const frozen=await snapshot(p);
    assert.deepEqual(frozen.presentation.locomotion,paused.presentation.locomotion);assert.equal(frozen.x,paused.x);assert.equal(frozen.z,paused.z);
    await p.keyboard.up('KeyW');await p.getByRole('button',{name:'Lanjutkan',exact:true}).click();await samples(p,12);
    assert.equal((await snapshot(p)).presentation.locomotion.moving,false);
    await p.screenshot({path:'qa-output/district-presentation-walk.png'});
    report.push({test:'female VAT walk/idle crossfades, exact pose freeze in menu, clean keyboard resume',passed:true});await ctx.close();
  }
  {
    const {ctx,p}=await load(3);const before=await snapshot(p);await p.keyboard.press('KeyE');const boarding=await samples(p,24);
    assert(boarding.some(s=>s.presentation.framing.distance>6.8&&s.presentation.framing.distance<13.5),'boarding framing snapped');
    assert(boarding.some(s=>Math.abs(s.presentation.focus.x-before.x)>.01&&Math.abs(s.presentation.focus.x-s.bus.x)>.01),'boarding focus snapped');
    await p.waitForFunction(()=>window.__districtDebug.snapshot().presentation.framing.distance===13.5);
    await p.keyboard.down('KeyW');await p.waitForFunction(()=>window.__districtDebug.snapshot().bus.speed>1);const straight=await snapshot(p);assert(roll(straight)>0);
    await p.keyboard.down('KeyD');await samples(p,5);await p.keyboard.up('KeyD');const turning=await snapshot(p);
    assert(turning.bus.steer>.05);for(const wheel of turning.presentation.wheels){assert(Math.abs(wheel.steer-(wheel.front?-turning.bus.steer:0))<1e-6);assert.equal(wheel.roll,roll(turning));}
    await p.locator('#pauseButton').click();const paused=await snapshot(p);await p.waitForTimeout(300);const frozen=await snapshot(p);assert.deepEqual(frozen.bus,paused.bus);assert.equal(roll(frozen),roll(paused));
    await p.keyboard.up('KeyW');await p.getByRole('button',{name:'Lanjutkan',exact:true}).click();await p.keyboard.down('Space');await p.waitForFunction(()=>window.__districtDebug.snapshot().bus.speed===0);await p.keyboard.up('Space');
    const stopped=await snapshot(p);await samples(p,6);assert.equal(roll(await snapshot(p)),roll(stopped));
    await p.keyboard.down('KeyS');await p.waitForFunction(()=>window.__districtDebug.snapshot().bus.speed<-.5);const reverseStart=await snapshot(p);await samples(p,4);const reverseEnd=await snapshot(p);assert(rollDelta(reverseStart,reverseEnd)<0);
    await p.keyboard.up('KeyS');await p.keyboard.down('Space');await p.waitForFunction(()=>window.__districtDebug.snapshot().bus.speed===0);await p.keyboard.up('Space');
    await p.screenshot({path:'qa-output/district-presentation-bus.png'});
    await p.keyboard.press('KeyE');const exiting=await samples(p,24);assert(exiting.some(s=>s.presentation.framing.distance>6.8&&s.presentation.framing.distance<13.5));
    await p.waitForFunction(()=>window.__districtDebug.snapshot().presentation.framing.distance===6.8);const onFoot=await snapshot(p);assert.equal(onFoot.driving,false);assert.equal(onFoot.presentation.locomotion.moving,false);assert.equal(onFoot.presentation.locomotion.blend,0);
    await p.locator('#pauseButton').click();await p.getByRole('button',{name:'Kembali ke checkpoint',exact:true}).click();await samples(p,2);const reset=await snapshot(p);assert.equal(reset.bus.x,-4);assert.equal(reset.bus.z,24);assert.equal(roll(reset),0);assert.equal(reset.presentation.focus.x,reset.x);assert.equal(reset.presentation.focus.z,reset.z);
    assert.equal(await p.evaluate(()=>localStorage.getItem('manasik-adventure-v46')),'old-save-sentinel');
    report.push({test:'boarding/disembarking focus and framing blends, actual-travel rolling/reverse, front steering, parked/menu freeze, checkpoint cut, old save isolation',passed:true,calls:onFoot.calls});await ctx.close();
  }
  {
    const {ctx,p}=await load(3,'male',{reducedMotion:'reduce'});await p.keyboard.press('KeyE');const boarded=await samples(p,2);assert.equal(boarded.at(-1).presentation.framing.distance,13.5);
    await p.keyboard.down('KeyW');await p.waitForFunction(()=>window.__districtDebug.snapshot().bus.speed>1);assert.equal((await snapshot(p)).presentation.fov,61);await p.keyboard.up('KeyW');
    report.push({test:'system reduced-motion preference skips mode blend and speed FOV',passed:true});await ctx.close();
  }
  assert.deepEqual(errors,[]);await writeFile('qa-output/district-presentation-qa.json',JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify(report,null,2));
}catch(error){let state;try{state=await snapshot(lastPage);await lastPage.screenshot({path:'qa-output/district-presentation-failure.png'});}catch{}await writeFile('qa-output/district-presentation-qa.json',JSON.stringify({passed:false,report,errors,state,error:String(error)},null,2));throw error;}finally{await browser.close();}
