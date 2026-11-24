import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {playMinaCamp,reachCamp,campActions} from './mina-camp-play.mjs';
const base='http://127.0.0.1:4173',report=[],errors=[];
await mkdir('qa-output',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});let page;
async function context(avatar='male',mobile=false,completed=false){
 const c=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1280,height:720},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:.6});
 await c.addInitScript(({avatar,completed})=>{if(sessionStorage.getItem('minaQA'))return;sessionStorage.setItem('minaQA','1');
  const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));localStorage.setItem('umroh-graphics-v1','low');localStorage.setItem('umroh-tutorial-v1:field','done');
  set('manasik-journey-setup-v1',{version:1,program:'hajj',avatar,graphics:'low',voice:false,ambience:false,volume:0});
  set('manasik-hajj-ihram-v1',{version:1,id:'campQA',program:'hajj',avatar,name:'QA',step:completed?6:5});
  set('manasik-mina-activity-v1:campQA',{version:1,id:'campQA',phase:completed?5:4,elapsed:completed?0:6});
  set('manasik-travel-story-v1',{version:1,name:'QA',briefed:true,arrivals:['hajj:ihram']});
  set('manasik-player-appearance-v1',{version:1,hair:'trimmed',ihram:true});
 },{avatar,completed});page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));return c;
}
async function launch(){await page.goto(base+'/hajj-adventure.html?campaign=hajj&chapter=ihram');await page.locator('#start').click();await page.waitForURL(/manasik.html/);}
try{
 const c=await context();await launch();await page.locator('#fieldClock[data-camp-beat="0"]').waitFor();
 await playMinaCamp(page,{onBeat:async beat=>{
  console.log('CAMP '+beat+' '+campActions[beat]);
  if(beat===0){const life=await page.evaluate(()=>JSON.parse(localStorage.getItem('manasik-life-v1')));assert.equal(life.meals,4);assert.equal(life.bottles,4);}
  if(beat===1){
   await page.waitForFunction(()=>Number(document.getElementById('fieldClock').dataset.elapsed)>=2.2);
   await page.locator('#campaignPause').click();const frozen=await page.locator('#fieldClock').getAttribute('data-elapsed');await page.waitForTimeout(650);assert.equal(await page.locator('#fieldClock').getAttribute('data-elapsed'),frozen);
   await page.getByRole('button',{name:'Lanjut bermain',exact:true}).click();
   await page.reload();await page.locator('#fieldClock[data-camp-beat="1"]').waitFor();assert.equal(await page.locator('#fieldClock').getAttribute('data-running'),'false');await reachCamp(page,campActions[1]);
  }
  if(beat===2){await page.waitForFunction(()=>document.getElementById('coreScene').dataset.campPose==='11',null,{timeout:90000});await page.screenshot({path:'qa-output/mina-salat-desktop.png'});}
  if(beat===4)await page.screenshot({path:'qa-output/mina-escort-desktop.png'});
 }});
 await page.getByRole('button',{name:'Selesaikan Mina · lanjut Arafah',exact:true}).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('manasik-hajj-ihram-v1')).step),6);
 assert.equal(await page.locator('html').getAttribute('data-player-hair'),'trimmed');
 const original=await page.evaluate(()=>localStorage.getItem('manasik-hajj-ihram-v1'));
 await page.getByRole('button',{name:'Mainkan kegiatan Mina lagi',exact:true}).click();await page.locator('#fieldClock[data-phase="2"]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('manasik-hajj-ihram-v1')),original);
 await c.close();report.push('Desktop: full real walking/supply/wudu/5 prayer animations/escort/night/Fajr/departure; pause+reload; preserved completion and replay');
 const m=await context('female',true,true);await launch();const saved=await page.evaluate(()=>localStorage.getItem('manasik-hajj-ihram-v1'));await page.locator('#fieldClock[data-phase="2"]').waitFor();await reachCamp(page,'Temui pembimbing di Mina',true);await reachCamp(page,'Tenda ditemukan · bekal siap',true);
 await playMinaCamp(page,{touch:true,onBeat:async beat=>{
  if(beat===2){await page.waitForFunction(()=>Number(document.getElementById('fieldClock').dataset.elapsed)>1);await page.setViewportSize({width:390,height:844});await page.locator('.coreRotate').waitFor({state:'visible'});const before=await page.locator('#fieldClock').getAttribute('data-elapsed');await page.waitForTimeout(600);assert.equal(await page.locator('#fieldClock').getAttribute('data-elapsed'),before);await page.setViewportSize({width:844,height:390});await page.screenshot({path:'qa-output/mina-salat-mobile.png'});}
 }});
 assert.equal(await page.evaluate(()=>localStorage.getItem('manasik-hajj-ihram-v1')),saved);assert.equal(await page.locator('html').getAttribute('data-player-avatar'),'female');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'qa-output/mina-complete-mobile.png'});await m.close();report.push('Mobile emulation: female completed save replay, actual touch/assisted route through all activities, portrait pause, no mission reset or duplicate chapter reward');
 assert.deepEqual(errors,[]);await writeFile('qa-output/mina-gameplay-qa.json',JSON.stringify({passed:true,report,errors},null,2));console.log(JSON.stringify(report,null,2));
}catch(e){console.error(e.stack);if(page&&!page.isClosed()){console.error((await page.locator('body').innerText()).slice(-2000));await page.screenshot({path:'qa-output/mina-gameplay-failure.png'}).catch(()=>{});}process.exitCode=1;}finally{await browser.close();}
