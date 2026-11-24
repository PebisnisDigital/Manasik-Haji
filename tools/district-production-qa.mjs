import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const BASE=process.env.ADVENTURE_QA_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const errors=[],report=[];await mkdir('qa-output',{recursive:true});
try{
 const ctx=await browser.newContext({viewport:{width:960,height:540}});await ctx.addInitScript(()=>{localStorage.setItem('umroh-graphics-v1','low');localStorage.setItem('manasik-adventure-v46','old-progress-sentinel');});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(BASE+'/district.html?mitra=demo-travel');
 await page.locator('#startDistrict').click();await page.keyboard.down('KeyW');
 await page.waitForFunction(()=>{const b=document.getElementById('interactButton');return !b.hidden&&b.textContent.includes('Pak Farid');});await page.keyboard.up('KeyW');await page.keyboard.press('KeyE');await page.getByRole('button',{name:'Terima misi',exact:true}).click();
 await page.waitForFunction(()=>document.getElementById('missionTitle').textContent==='Ambil koper perjalanan');assert.equal(await page.evaluate(()=>typeof window.__districtDebug),'undefined');
 assert.equal(await page.evaluate(()=>localStorage.getItem('manasik-adventure-v46')),'old-progress-sentinel');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('manasik-district-v1:demo-travel:guest')));assert.equal(saved.stage,1);
 await page.locator('#pauseButton').click();assert.match(await page.getByRole('link',{name:'Peta level',exact:true}).getAttribute('href'),/mitra=demo-travel/);
 await page.reload();await page.locator('#startDistrict').click();await page.waitForFunction(()=>document.getElementById('missionTitle').textContent==='Ambil koper perjalanan');report.push('built district: real mission interaction, tenant save/reload and links, no development diagnostics');
 await page.evaluate(()=>{localStorage.setItem('manasik-district-v1',JSON.stringify({version:1,stage:5,avatar:'female'}));localStorage.setItem('manasik-district-errands-v1',JSON.stringify({version:1,stage:0,escortGate:0}));});
 await page.goto(BASE+'/district.html');await page.locator('#startDistrict').click();await page.waitForFunction(()=>!document.getElementById('mapRoute').hasAttribute('hidden'));assert((await page.locator('#mapRoute').getAttribute('points')).trim().split(/\s+/).length>=3);
 await page.evaluate(()=>localStorage.setItem('manasik-district-errands-v1',JSON.stringify({version:1,stage:3,escortGate:3})));
 await page.goto(BASE+'/district.html');await page.locator('#startDistrict').click();await page.waitForFunction(()=>document.getElementById('missionTitle').textContent==='Antar paket ke Bu Salma');await page.waitForFunction(()=>document.getElementById('districtCoins').textContent==='130');
 assert.equal(await page.locator('#mapRoute').getAttribute('hidden'),null);await page.locator('#missionButton').click();assert.match(await page.locator('#dialogText').textContent(),/selesai · 30 poin/);await page.getByRole('button',{name:'Kembali bermain',exact:true}).click();assert.equal(await page.evaluate(()=>typeof window.__districtDebug),'undefined');report.push('built optional activities: female parcel checkpoint, 130 points, walking route and mission book');
 // Seed existing valid completion checkpoints so the original chapter locks allow this smoke check.
 await page.evaluate(()=>{localStorage.setItem('manasik-tawaf-quest-v1',JSON.stringify({version:1,stage:3,laps:7}));localStorage.setItem('manasik-sai-quest-v1',JSON.stringify({version:1,stage:3,legs:7}));});
 for(const [path,id]of [['tawaf-adventure.html','startBtn'],['sai-adventure.html','start'],['tahallul-adventure.html','start']]){
  await page.goto(BASE+'/'+path);if(await page.locator('#'+id).isVisible())await page.locator('#'+id).click();assert.equal(await page.locator('canvas').count()>0,true);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>typeof window.__adventureDebug),'undefined');
 }
 report.push('all three built chapter pages start with valid existing unlock saves, development diagnostics absent');await page.goto(BASE+'/adventure-map.html');assert.equal(await page.getByRole('link',{name:/Kawasan & perjalanan bus/}).count(),1);
 assert.deepEqual(errors,[]);await page.goto(BASE+'/district.html');await page.locator('#startDistrict').click();await page.screenshot({path:'qa-output/district-production.png'});await writeFile('qa-output/district-production-qa.json',JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify(report,null,2));await ctx.close();
}finally{await browser.close();}
