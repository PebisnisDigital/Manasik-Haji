import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registrationStore} from '../server/registration-store.mjs';
import {createRegistrationServer} from '../server/registration-server.mjs';
const BASE='http://127.0.0.1:4173',dbPath=path.resolve('qa-output/magic-qa.sqlite');await mkdir('qa-output',{recursive:true});assert(dbPath.startsWith(path.resolve('qa-output')+path.sep));
const api=createRegistrationServer({dbPath,allowedOrigins:[BASE]});await new Promise((resolve,reject)=>{api.once('error',reject);api.listen(4181,'127.0.0.1',resolve);});
const store=registrationStore(dbPath),browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[];let page;
async function context(seed={},options={}){const c=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:.65,...options});await c.route('**/api/registration**',async route=>{const response=await route.fetch({url:route.request().url().replace(':4173',':4181')});await route.fulfill({response});});await c.addInitScript(seed=>{if(sessionStorage.getItem('magic-seed'))return;sessionStorage.setItem('magic-seed','1');localStorage.setItem('umroh-graphics-v1','low');localStorage.setItem('umroh-tutorial-v1:lobby','done');for(const[k,v]of Object.entries(seed))localStorage.setItem(k,JSON.stringify(v));},seed);page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));return c;}
function ticket(avatar,program='hajj'){const r=store.create({name:'QA Magic '+avatar,phone:'081234567890',avatar,program,consent:true});store.claim(r.secret,'Synthetic QA only, no payment');store.approve(r.registration.id);return {id:r.registration.id,...store.issue(r.secret)};}
async function board(fresh=true){
 await page.waitForFunction(()=>document.documentElement.dataset.districtBoardReady==='true');
 assert.match(page.url(),/district\.html\?board=/);assert.equal(new URL(page.url()).hash,'');
 assert.equal(await page.locator('.boardReadDialog[open]').count(),0);
 assert.equal(await page.locator('#districtWorld').isVisible(),true);
 await page.locator('#missionButton').click();
 await page.locator('.boardReadDialog[open]').waitFor();
 assert.equal(await page.locator('.boardLevel').count(),12);
 assert.equal(await page.locator('.boardLevel[data-level="1"]').isEnabled(),true);
 if(fresh){assert.equal(await page.locator('.boardLevel:disabled').count(),11);assert.equal(await page.locator('.boardBonus').isDisabled(),true);}
}
async function travelToLevelOne(){
 await page.locator('.boardLevel[data-level="1"]').click();
 await page.locator('.boardReadDialog[open]').waitFor({state:'hidden'});
 assert.match(page.url(),/district\.html/);
 await page.keyboard.down('Shift');
 try{
  await page.keyboard.down('a');
  try{await page.waitForFunction(()=>{const t=document.getElementById('mapPlayer').getAttribute('transform');const m=t.match(/translate\(([-.\d]+)/);return m&&Number(m[1])<54;},{},{timeout:25000});}finally{await page.keyboard.up('a');}
  await page.keyboard.down('s');
  try{await page.getByRole('button',{name:'AKSI · Ikut antrean',exact:true}).waitFor({timeout:50000});}finally{await page.keyboard.up('s');}
  await page.getByRole('button',{name:'AKSI · Ikut antrean',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.playerQueue!=='idle');await page.getByRole('button',{name:'AKSI · Keluar antrean',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.playerQueue==='idle');await page.getByRole('button',{name:'AKSI · Ikut antrean',exact:true}).click();await page.locator('[data-choice="guardCheck"]').waitFor({timeout:180000});
  assert.match(page.url(),/district\.html/);await page.locator('[data-choice="guardCheck"]').click();await page.locator('[data-choice="guardEnter"]').click();await page.waitForURL(/play=miqat/,{timeout:30000});
 }finally{await page.keyboard.up('Shift');}
}
async function enter(token,guide,fresh=true){await page.goto(BASE+'/index.html?access=1#token='+token);await board(fresh);await travelToLevelOne();await page.locator('.miqatRoom[data-ready=true]').waitFor();assert.match(await page.locator('.miqatGuideTag').textContent(),new RegExp(guide));assert.equal(await page.locator('#vehicleInfo').count(),0);}

try{
 for(const avatar of ['male','female']){
  const t=ticket(avatar),guide=avatar==='male'?'Pak Husen':'Bu Salma',c=await context();await enter(t.token,guide);await page.screenshot({path:'qa-output/magic-miqat-'+avatar+'.png'});assert.equal(await page.locator('.miqatRoom').getAttribute('data-stage'),'0');report.push(avatar+': approved link → district board → Level 1 → Miqat with '+guide+'; no bus before preparation');await c.close();
  const other=await context();await enter(t.token,guide);report.push(avatar+': the same private link is reusable in a second browser session without registering or paying again');await other.close();
 }
 const old={version:1,id:'magic-old-ifadah',name:'Pemain lama',avatar:'male',program:'hajj',step:10},partial={version:1,stage:1,legs:4,gate:2},checkpoint={id:old.id,step:10,count:1},t=ticket('male'),c=await context({'manasik-hajj-ifadah-v1':old,'manasik-hajj-ifadah-checkpoint-v1':checkpoint,'manasik-sai-quest-v1':partial,'manasik-player-appearance-v1':{version:1,hair:'shaved',ihram:false}});await enter(t.token,'Pak Husen',false);assert.match(page.url(),/play=miqat/);for(const[k,v]of Object.entries({'manasik-hajj-ifadah-v1':old,'manasik-hajj-ifadah-checkpoint-v1':checkpoint,'manasik-sai-quest-v1':partial}))assert.equal(await page.evaluate(k=>localStorage.getItem(k),k),JSON.stringify(v));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('manasik-player-appearance-v1')).hair),'shaved');report.push('existing Ifadah 1/7, partial Sa’i and shaved appearance preserved; Miqat entry preserves all later mission saves');await c.close();
 const denied=await context();await page.goto(BASE+'/district.html?board=magic');await page.getByText('AKSES BELUM AKTIF',{exact:true}).waitFor();assert.equal(await page.locator('.boardLevel').count(),0);await denied.close();
 const invalid=await context();await page.goto(BASE+'/index.html?access=1#token=invalid');await page.getByRole('button',{name:'Coba lagi',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');assert.equal(await page.locator('#districtWorld').count(),0);await invalid.close();const revoked=ticket('male');store.revoke(revoked.id);const r=await context();await page.goto(BASE+'/index.html?access=1#token='+revoked.token);await page.getByRole('button',{name:'Coba lagi',exact:true}).waitFor();assert.match(await page.locator('.magicAccessCard').textContent(),/dicabut/);report.push('invalid/revoked links stay at an explanatory error; token removed from URL');await r.close();
 const retryTicket=ticket('female'),retry=await context();await page.route('**/api/registration/redeem',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Layanan akses sedang offline.'})}));await page.goto(BASE+'/index.html?access=1#token='+retryTicket.token);await page.getByRole('button',{name:'Coba lagi',exact:true}).waitFor();await page.unroute('**/api/registration/redeem');await page.getByRole('button',{name:'Coba lagi',exact:true}).click();await board();await travelToLevelOne();await page.locator('.miqatRoom[data-ready=true]').waitFor();assert.match(await page.locator('.miqatGuideTag').textContent(),/Bu Salma/);report.push('network failure can retry the original link without exposing it in the URL');await retry.close();
 const originalTrip={version:1,stage:4,avatar:'female',gate:23},demo=await context({'manasik-transfer-hajj:miqat-v1':originalTrip},{viewport:{width:844,height:390},hasTouch:true,isMobile:true});const count=store.list().length;await page.goto(BASE+'/index.html');await page.waitForFunction(()=>document.documentElement.dataset.guideReady==='true');await page.locator('#female').click();await page.locator('.guideMeet').click();await page.locator('.salmaWelcome[open]').waitFor({timeout:180000});await page.getByRole('button',{name:'Coba akses setelah pembayaran · DEMO',exact:true}).click();await page.locator('#openMagicLink').click();await board();assert((await page.locator('.boardLevel[data-level="1"]').boundingBox()).height>=44);await page.screenshot({path:'qa-output/magic-demo-mobile.png'});await travelToLevelOne();await page.locator('.miqatRoom[data-ready=true]').waitFor();assert.match(await page.locator('.miqatGuideTag').textContent(),/Bu Salma/);assert.equal(await page.evaluate(()=>localStorage.getItem('manasik-transfer-hajj:miqat-v1')),JSON.stringify(originalTrip));assert.equal(store.list().length,count);report.push('landscape demo → magic link → district board → Level 1 → Bu Salma at Miqat; existing bus checkpoint and order/payment records unchanged');await demo.close();
 assert.deepEqual(errors,[]);await writeFile('qa-output/magic-access-qa.json',JSON.stringify({passed:true,report,errors},null,2));console.log(JSON.stringify(report,null,2));
}catch(error){console.error(error.message);if(page&&!page.isClosed())await page.screenshot({path:'qa-output/magic-access-failure.png'}).catch(()=>{});process.exitCode=1;}finally{await browser.close();store.close();await new Promise(resolve=>api.close(resolve));}
