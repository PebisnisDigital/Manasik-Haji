import {playAqabah} from './aqabah-play.mjs';
import {playMuzdalifah} from './muzdalifah-play.mjs';
import {playArafah} from './arafah-play.mjs';
import {playMinaCamp} from './mina-camp-play.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const production=process.argv.includes('--production'),BASE=process.env.ADVENTURE_QA_URL||`http://127.0.0.1:${production?4173:5173}`;
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[],suffix=':demo-travel:guest',out='qa-output/campaign'+(production?'-production':'')+'-qa.json';let page;
await mkdir('qa-output',{recursive:true});
const key=id=>'manasik-hajj-'+id+'-v1'+suffix;
const cp=id=>'manasik-hajj-'+id+'-checkpoint-v1'+suffix;
const url=id=>BASE+'/hajj-adventure.html?campaign=hajj&chapter='+id+'&mitra=demo-travel';
async function saved(id){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key(id));}
async function launch(id){await page.goto(url(id));await page.locator('#start').waitFor();await page.locator('#start').click();await page.waitForURL(u=>u.searchParams.has('core'));}
async function click(name){await page.getByRole('button',{name,exact:true}).click({timeout:60000});}
async function reach(name){const target=page.getByRole('button',{name,exact:true}),walk=page.getByRole('button',{name:'Jalan ke lokasi',exact:true});if(await walk.isVisible())await walk.click();await target.waitFor({state:'visible',timeout:60000});await target.click();}
async function finished(id,end){assert.deepEqual(errors,[]);await page.waitForFunction(({key,end})=>JSON.parse(localStorage.getItem(key)??'null')?.step===end,{key:key(id),end});await page.getByRole('button',{name:'Peta 12 level',exact:true}).waitFor();assert.equal(await page.locator('#certificate').isVisible(),false);assert.match(page.url(),/mitra=demo-travel/);}
async function throwRound(id,total){for(let n=0;n<total;n++){
 const approach=page.getByRole('button',{name:/^Dekati (Ula|Wustha|Aqabah)$/});if(await approach.isVisible())await approach.click();
 await page.getByRole('button',{name:'Lontar kerikil',exact:true}).click({timeout:60000});
 await page.waitForFunction(({k,n})=>JSON.parse(localStorage.getItem(k)??'null')?.count===n,{k:cp(id),n:n+1},{timeout:10000});
}await click('Lanjut');}
try{
 const ctx=await browser.newContext({viewport:{width:960,height:540},deviceScaleFactor:.5});page=await ctx.newPage();page.on('pageerror',e=>{if(!errors.includes(e.stack))errors.push(e.stack);});
 await ctx.addInitScript(()=>{
  if(sessionStorage.getItem('campaign-seeded'))return;sessionStorage.setItem('campaign-seeded','1');localStorage.setItem('umroh-graphics-v1','low');
  for(const kind of ['field','tawaf','sai'])localStorage.setItem('umroh-tutorial-v1:'+kind,'done');
  // Legacy chapters have their own real-route QA; fixtures here unlock the nine new segments.
  localStorage.setItem('manasik-tawaf-quest-v1',JSON.stringify({version:1,stage:3,laps:7}));localStorage.setItem('manasik-sai-quest-v1',JSON.stringify({version:1,stage:3,legs:7}));localStorage.setItem('manasik-tahallul-quest-v1',JSON.stringify({version:1,stage:4,avatar:'female',method:'trim',cuts:3}));
  localStorage.setItem('umroh-digital-preview-hajj',JSON.stringify({version:1,id:'legacy-run',program:'hajj',avatar:'male',name:'Lama',step:7}));localStorage.setItem('umroh-digital-checkpoint-hajj','original-checkpoint');
 });
 await page.goto(url('miqat'));await page.locator('#avatar').selectOption('female');await page.locator('#start').click();await page.waitForURL(u=>u.searchParams.has('core'));
 await reach('Mulai panduan');for(let i=0;i<20;i++){if(await page.getByRole('button',{name:'Selesaikan bab',exact:true}).isVisible())break;await click('Lanjut');}await click('Selesaikan bab');await finished('miqat',1);
 assert.equal((await saved('miqat')).avatar,'female');report.push('Miqat: real third-person approach, all briefing cards, saved boundary and reward');console.log(report.at(-1));
 await launch('arrival');assert.equal((await saved('arrival')).avatar,'female');
 await reach('Temui pembimbing');assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).count,cp('arrival')),1);await page.reload();await reach('Amati Ka’bah');await page.screenshot({path:'qa-output/campaign-arrival-play'+(production?'-production':'')+'.png'});await reach('Tandai titik awal');await click('Selesaikan bab');await finished('arrival',1);await page.screenshot({path:'qa-output/campaign-arrival'+(production?'-production':'')+'.png'});
 report.push('Arrival: three physical landmarks, checkpoint reload and female avatar inheritance');console.log(report.at(-1));
 await launch('ihram');await reach('Siap ihram haji · menuju bus');await reach('Temui pembimbing di Mina');await reach('Tenda ditemukan · bekal siap');await playMinaCamp(page);await click('Selesaikan Mina · lanjut Arafah');await finished('ihram',6);report.push('Ihram Haji: preparation and actual walk to Mina camp');console.log(report.at(-1));
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,name:'QA',briefed:true,arrivals:['hajj:arafah']})),'manasik-travel-story-v1'+suffix);await launch('arafah');await playArafah(page);await click('Selesaikan Arafah · lanjut Muzdalifah');await finished('arafah',7);report.push('Arafah: all activities from a valid terminal-arrival fixture, salat, assistance, prayer and sunset completion');console.log(report.at(-1));
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,name:'QA',briefed:true,arrivals:['hajj:arafah','hajj:muzdalifah']})),'manasik-travel-story-v1'+suffix);await launch('muzdalifah');await playMuzdalifah(page);await click('Selesaikan Muzdalifah · lanjut Aqabah');await finished('muzdalifah',8);report.push('Muzdalifah: arrival prayers, camp assistance, seven physical pickups, rest/Subuh/dhikr and morning completion');console.log(report.at(-1));
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,name:'QA',briefed:true,arrivals:['hajj:arafah','hajj:muzdalifah','hajj:aqabah']})),'manasik-travel-story-v1'+suffix);await launch('aqabah');await playAqabah(page);await click('Selesaikan Level 9 · lanjut Ifadah');await finished('aqabah',10);report.push('Aqabah: all 12 activities, seven animated throws, assisted tahallul and dam guidance');console.log(report.at(-1));
 // Resume real ritual arenas from their shipped full-lap / full-leg checkpoint format.
 await page.goto(url('ifadah'));await page.locator('#start').click();await page.waitForURL(u=>u.pathname.endsWith('player.html'));
 const ifadah=await saved('ifadah');await page.evaluate(({k,id,step})=>localStorage.setItem(k,JSON.stringify({id,step,count:6})),{k:cp('ifadah'),id:ifadah.id,step:10});await page.reload();await page.locator('#loading').waitFor({state:'hidden'});assert.match(await page.locator('#count').textContent(),/6.*7/);await page.locator('#auto').click();await page.locator('#nextSai').waitFor({state:'visible',timeout:300000});await page.locator('#nextSai').click();await page.waitForURL(u=>u.pathname.endsWith('sai.html'));
 assert.equal((await saved('ifadah')).step,11);await page.evaluate(({k,id})=>localStorage.setItem(k,JSON.stringify({id,step:11,count:6})),{k:cp('ifadah'),id:ifadah.id});await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await page.locator('#auto').click();await page.locator('#next').waitFor({state:'visible',timeout:150000});await page.locator('#next').click();await finished('ifadah',12);
 report.push('Ifadah and Sai Haji: resume 6/7, complete final real lap/leg, retain scoped context through both page transitions');console.log(report.at(-1));
 await launch('mina');await reach('Mulai jumrah');await throwRound('mina',21);await throwRound('mina',21);await reach('Pilih nafar');await click('Nafar awal');await finished('mina',17);report.push('Tasyrik: real Mina walk, all 42 throws on days 11/12, nafar awal to chapter boundary');console.log(report.at(-1));
 await launch('wada');await page.waitForURL(u=>u.pathname.endsWith('player.html'));const wada=await saved('wada');await page.evaluate(({k,id})=>localStorage.setItem(k,JSON.stringify({id,step:17,count:6})),{k:cp('wada'),id:wada.id});await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await page.locator('#auto').click();await page.locator('#nextSai').waitFor({state:'visible',timeout:300000});await page.locator('#nextSai').click();await finished('wada',18);assert.equal(await page.locator('#title').textContent(),'Petualangan haji selesai!');
 await click('Peta 12 level');await page.waitForFunction(()=>document.getElementById('total').textContent==='12/12');assert.equal(await page.locator('.level.done').count(),12);assert.match(await page.locator('#statusText').textContent(),/710/);await page.reload();assert.equal(await page.locator('#total').textContent(),'12/12');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('umroh-digital-preview-hajj')).id),'legacy-run');assert.equal(await page.evaluate(()=>localStorage.getItem('umroh-digital-checkpoint-hajj')),'original-checkpoint');
 await page.waitForTimeout(400);await page.screenshot({path:'qa-output/campaign-map-complete'+(production?'-production':'')+'.png',fullPage:true});report.push('Wada: final real lap, 12/12 ending with stable 710 coins, old run untouched, no partial-run certificate');console.log(report.at(-1));await ctx.close();
 // Mobile alternate branch starts at an existing valid decision checkpoint.
 const mobile=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:.5,hasTouch:true,isMobile:true});page=await mobile.newPage();page.on('pageerror',e=>{if(!errors.includes(e.stack))errors.push(e.stack);});await page.goto(BASE+'/offline.html');
 await page.evaluate(({key})=>{localStorage.setItem('umroh-graphics-v1','low');localStorage.setItem('umroh-tutorial-v1:field','done');localStorage.setItem(key,JSON.stringify({version:1,id:'late-nafar',program:'hajj',avatar:'female',name:'Petualang',step:15}));},{key:key('mina')});
 await launch('mina');await reach('Pilih nafar');await click('Nafar tsani');assert.equal((await saved('mina')).step,16);assert.equal(await page.locator('#eyebrow').textContent(),'13 ZULHIJAH');
 // Portrait blocks interaction without consuming a throw or mutating the checkpoint.
 await page.setViewportSize({width:390,height:844});await page.locator('.coreRotate').waitFor({state:'visible'});assert.equal((await saved('mina')).step,16);await page.setViewportSize({width:844,height:390});await page.locator('.coreRotate').waitFor({state:'hidden'});
 await page.screenshot({path:'qa-output/campaign-mobile-play'+(production?'-production':'')+'.png'});await throwRound('mina',21);await finished('mina',17);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'qa-output/campaign-mobile-nafar'+(production?'-production':'')+'.png'});await mobile.close();report.push('Mobile landscape: nafar tsani, 21 day-13 throws, portrait gate, touch layout and checkpoint integrity');console.log(report.at(-1));
 assert.deepEqual(errors,[]);await writeFile(out,JSON.stringify({passed:true,production,report,limitations:['SwiftShader functional checks, not a physical-phone performance measurement.','Legacy chapters 03–05 use completion fixtures here; their route regression is a separate QA suite.','Ifadah/Sai/Wada resume at 6/7 and finish one real lap/leg, not a fresh 7/7 endurance run.']},null,2));
}catch(error){try{await page.screenshot({path:'qa-output/campaign-failure.png'});}catch{}await writeFile(out,JSON.stringify({passed:false,report,errors,url:page?.url(),error:String(error)},null,2));throw error;}finally{await browser.close();}
