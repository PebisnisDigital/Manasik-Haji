import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const production=process.argv.includes('--production'),BASE=process.env.ADVENTURE_QA_URL||`http://127.0.0.1:${production?4173:5173}`;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[];let page;await mkdir('qa-output',{recursive:true});
const cases=[['miqat',0,'manasik'],['arrival',0,'manasik'],['tawaf',null,'tawaf-adventure'],['sai',null,'sai-adventure'],['tahallul',null,'tahallul-adventure'],['ihram',5,'manasik'],['arafah',6,'manasik'],['muzdalifah',7,'manasik'],['aqabah',8,'manasik'],['ifadah',10,'player'],['mina',12,'manasik'],['wada',17,'player'],['ifadah',11,'sai'],['aqabah',9,'manasik']];
const saves=()=>page.evaluate(()=>JSON.stringify(Object.keys(localStorage).filter(k=>/manasik-|umroh-digital-(preview|checkpoint)/.test(k)).sort().map(k=>[k,localStorage.getItem(k)])));
try{
 const ctx=await browser.newContext({viewport:{width:1100,height:650},deviceScaleFactor:.65});page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.stack));
 await ctx.addInitScript(()=>{localStorage.setItem('umroh-graphics-v1','low');for(const k of ['field','tawaf','sai'])localStorage.setItem('umroh-tutorial-v1:'+k,'done');});
 await page.goto(BASE+'/offline.html');
 for(const [chapter,step,entry]of cases){
  const core=step!==null;
  await page.evaluate(({chapter,step})=>{
   localStorage.setItem('manasik-tawaf-quest-v1',JSON.stringify({version:1,stage:1,laps:2,gate:2}));localStorage.setItem('manasik-sai-quest-v1',JSON.stringify({version:1,stage:1,legs:2,gate:2}));localStorage.setItem('manasik-tahallul-quest-v1',JSON.stringify({version:1,stage:0,avatar:'female',method:'trim',cuts:0}));
   if(step!==null)localStorage.setItem('manasik-hajj-'+chapter+'-v1',JSON.stringify({version:1,id:'place-qa',program:'hajj',avatar:'female',name:'Petualang',step}));
  },{chapter,step});
  await page.goto(BASE+'/'+entry+'.html'+(core?'?program=hajj&core=place-qa&campaign=hajj&chapter='+chapter:'?demo=1'));
  if(core){if(entry==='player'||entry==='sai')await page.locator('#loading').waitFor({state:'hidden',timeout:60000});else await page.locator('#coreScene canvas').waitFor();}
  else await page.locator(chapter==='tawaf'?'#startBtn':'#start').click();
  await page.waitForTimeout(650);const before=await saves();
  await page.getByRole('button',{name:'Radio rombongan',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Percakapan rombongan'});await dialog.waitFor();
  for(const choice of ['Tujuan kita sekarang?','Cerita rombongan','Tips perjalanan']){await dialog.getByRole('button',{name:choice,exact:true}).click();assert((await dialog.locator('.companionLine').innerText()).length>15);}
  const freeze=core?await page.locator('.walkInfo span').textContent().catch(()=>null):await page.evaluate(()=>window.__adventureDebug?.snapshot());
  await page.keyboard.down('KeyW');await page.waitForTimeout(350);
  if(core&&freeze)assert.equal(await page.locator('.walkInfo span').textContent(),freeze);
  if(!core&&!production){const after=await page.evaluate(()=>window.__adventureDebug.snapshot());assert.equal(after.x,freeze.x);assert.equal(after.z,freeze.z);assert.equal(after.playing,false);}
  assert.equal(await saves(),before,'radio must not mutate quest saves');
  if(['miqat','arafah','muzdalifah','mina'].includes(chapter))await page.screenshot({path:`qa-output/place-${chapter}${production?'-production':''}.png`});
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.keyboard.up('KeyW');
  if(['miqat','arafah','muzdalifah','mina','arrival','ifadah'].includes(chapter))await page.screenshot({path:`qa-output/place-${chapter}-${step}-arena${production?'-production':''}.png`});
  const resumed=!core&&!production?await page.evaluate(()=>window.__adventureDebug.snapshot()):null;await page.waitForTimeout(250);
  if(resumed){const after=await page.evaluate(()=>window.__adventureDebug.snapshot());assert(Math.hypot(after.x-resumed.x,after.z-resumed.z)<.02);}
  await page.getByRole('button',{name:'Buka tas dan kondisi karakter'}).click();
  const bag=page.getByRole('dialog',{name:'Tas dan kondisi karakter'});await bag.waitFor();
  assert.equal(await bag.locator('.lifeStats progress').count(),5);
  const expeditionBefore=await saves();await page.keyboard.down('KeyW');await page.waitForTimeout(350);assert.equal(await saves(),expeditionBefore,'bag must pause movement/quest and needs');
  if(chapter==='ifadah'&&entry==='player')await page.screenshot({path:`qa-output/life-core-player${production?'-production':''}.png`});
  await page.keyboard.press('Escape');await bag.waitFor({state:'hidden'});await page.keyboard.up('KeyW');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  report.push({chapter,step,entry,passed:true});console.log('PASS',chapter,step,entry);
 }
 await ctx.close();const mobile=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:.75,hasTouch:true,isMobile:true});page=await mobile.newPage();page.on('pageerror',e=>errors.push(e.stack));await mobile.addInitScript(()=>localStorage.setItem('umroh-graphics-v1','low'));
 await page.goto(BASE+'/sai-adventure.html?demo=1');await page.locator('#start').click();
 await page.getByRole('button',{name:'Radio rombongan',exact:true}).click();await page.getByRole('dialog',{name:'Percakapan rombongan'}).waitFor();await page.getByRole('button',{name:'Cerita rombongan',exact:true}).click();
 const controls=await page.locator('.companionDialog button').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().height));assert(controls.every(h=>h>=44));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`qa-output/place-radio-mobile${production?'-production':''}.png`});
 await page.setViewportSize({width:390,height:844});await page.getByRole('dialog',{name:'Percakapan rombongan'}).waitFor({state:'hidden'});await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'Radio rombongan',exact:true}).click();await page.getByRole('button',{name:'Tutup radio',exact:true}).click();await mobile.close();
 assert.deepEqual(errors,[]);report.push({test:'mobile dialog choices, 44px controls, scroll bounds and close',passed:true});
 await writeFile(`qa-output/place-presentation${production?'-production':''}.json`,JSON.stringify({passed:true,production,report,errors,limitations:['Functional SwiftShader checks do not measure real-phone frame rate.','Chapter starts use existing save-format fixtures; real checkpoint completion uses adventure/campaign suites.']},null,2));
}catch(error){if(page)await page.screenshot({path:'qa-output/place-failure.png'}).catch(()=>{});await writeFile('qa-output/place-failure.json',JSON.stringify({report,errors,url:page?.url(),error:String(error)},null,2));throw error;}finally{await browser.close();}
