import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const production=process.argv.includes('--production'),BASE=process.env.ADVENTURE_QA_URL||`http://127.0.0.1:${production?4173:5173}`;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const key='manasik-life-v1',fresh=()=>({version:1,health:80,stamina:32,food:35,water:30,clean:35,meals:2,bottles:2,trials:{}}),report=[],errors=[];let page;await mkdir('qa-output',{recursive:true});
const snapshot=p=>p.evaluate(()=>window.__districtDebug?.snapshot());
const dialog=p=>p.getByRole('dialog',{name:'Tas dan kondisi karakter'});
const open=async p=>{await p.getByRole('button',{name:'Buka tas dan kondisi karakter'}).click();await dialog(p).waitFor();};
const action=(p,id)=>dialog(p).locator(`[data-action="${id}"]`);
const read=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),key);
async function ctx(options={},values={}){const c=await browser.newContext({viewport:{width:1100,height:650},deviceScaleFactor:.65,...options});await c.addInitScript(values=>{if(sessionStorage.getItem('life-seeded'))return;sessionStorage.setItem('life-seeded','1');localStorage.setItem('umroh-graphics-v1','low');for(const [k,v]of Object.entries(values))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));},values);return c;}
async function load(c,url='/district.html',start='#startDistrict'){page=await c.newPage();page.on('pageerror',e=>errors.push(e.stack));await page.goto(BASE+url);if(start)await page.locator(start).click();await page.getByRole('button',{name:'Buka tas dan kondisi karakter'}).waitFor();return page;}
async function finish(p,id){await action(p,id).click();await p.waitForFunction(()=>document.querySelector('.lifeDialog > progress').hidden,null,{timeout:15000});}
async function walk(p,x,z,tolerance=1){await p.waitForFunction(()=>window.__districtDebug.snapshot().playable);let pressed=[];const end=Date.now()+55000;while(Date.now()<end){const s=await snapshot(p),dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<tolerance)break;assert(s.playable&&!s.driving);const f=Math.sin(s.cameraYaw)*dx+Math.cos(s.cameraYaw)*dz,r=-Math.cos(s.cameraYaw)*dx+Math.sin(s.cameraYaw)*dz,next=['ShiftLeft'];if(Math.abs(f)>.25)next.push(f>0?'KeyW':'KeyS');if(Math.abs(r)>.25)next.push(r>0?'KeyD':'KeyA');for(const k of pressed)if(!next.includes(k))await p.keyboard.up(k);for(const k of next)if(!pressed.includes(k))await p.keyboard.down(k);pressed=next;await p.waitForTimeout(80);}for(const k of pressed)await p.keyboard.up(k);const s=await snapshot(p);assert(Math.hypot(x-s.x,z-s.z)<tolerance+.5,`walk ${x},${z} failed at ${s.x},${s.z}`);}
function pass(test){report.push({test,passed:true});console.log('PASS',test);}
try{
 {
  const sentinel=JSON.stringify({version:1,stage:1,laps:2,gate:3}),c=await ctx({}, {[key]:fresh(),'manasik-tawaf-quest-v1':sentinel}),p=await load(c);
  await p.screenshot({path:'qa-output/life-district.png'});await p.setViewportSize({width:900,height:650});const layout=await p.evaluate(()=>{const h=document.querySelector('.lifeHud').getBoundingClientRect(),m=document.querySelector('.missionCard').getBoundingClientRect();return h.right<=m.left||h.left>=m.right||h.bottom<=m.top||h.top>=m.bottom;});assert(layout,'condition HUD overlaps mission at tablet size');await p.setViewportSize({width:1100,height:650});await open(p);
  assert(await action(p,'rest').isDisabled());assert(await action(p,'wash').isDisabled());assert(await action(p,'recover').isDisabled());
  const before=production?await read(p):(await snapshot(p)).life.save;
  await action(p,'eat').click();await p.keyboard.press('Escape');await dialog(p).waitFor({state:'hidden'});await p.waitForTimeout(1200);await open(p);
  if(!production)assert.equal((await snapshot(p)).life.save.meals,before.meals);
  await finish(p,'eat');const eaten=await read(p);assert.equal(eaten.meals,1);assert(eaten.food>75);assert((await dialog(p).innerText()).includes('Bekal 1 porsi'));
  const paused=await read(p);await p.keyboard.down('KeyW');await p.waitForTimeout(500);assert.deepEqual(await read(p),paused);await p.keyboard.press('Escape');await p.keyboard.up('KeyW');
  if(!production){const s=await snapshot(p);await p.waitForTimeout(400);const t=await snapshot(p);assert(Math.hypot(s.x-t.x,s.z-t.z)<.02);}
  await p.reload();await p.locator('#startDistrict').click();await open(p);assert.equal((await read(p)).meals,1);assert.equal(await p.evaluate(()=>localStorage.getItem('manasik-tawaf-quest-v1')),sentinel);
  pass('timed food consumption, cancel without item loss, inventory pause, reload and old save isolation');await c.close();
 }
 if(!production){
  const c=await ctx({}, {[key]:fresh()}),p=await load(c);
  // Actual keyboard exploration triggers the challenge; no debug mutation or teleport.
  await walk(p,-18,18);await walk(p,-7,18);await walk(p,-18,18);await walk(p,-18,14);let s=await snapshot(p);assert(s.life.save.trials.district.active);assert(!s.life.save.trials.district.done);
  await open(p);assert(!(await action(p,'recover').isDisabled()));await finish(p,'recover');assert((await read(p)).trials.district.done);assert(await action(p,'recover').isDisabled());await p.keyboard.press('Escape');
  await walk(p,-7,18);await open(p);assert(!(await action(p,'rest').isDisabled()));await finish(p,'refill');assert.deepEqual([(await read(p)).meals,(await read(p)).bottles],[4,4]);const tired=(await read(p)).stamina;await finish(p,'rest');assert((await read(p)).stamina>=Math.min(100,tired+54));await finish(p,'wash');assert.equal((await read(p)).clean,100);
  await p.screenshot({path:'qa-output/life-station.png'});pass('real walking activates lost supplies, bag recovery once, actual station refill/rest/bathing');await c.close();
 }
 {
  const future=JSON.stringify({version:9,opaque:'preserve'}),c=await ctx({}, {[key]:future}),p=await load(c);await open(p);assert(await action(p,'eat').isDisabled());assert((await dialog(p).innerText()).includes('versi lebih baru'));await p.keyboard.press('Escape');await p.waitForTimeout(600);assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),future);pass('future life save remains untouched');await c.close();
 }
 {
  const c=await ctx({}, {[key]:'{',[key+'.backup']:fresh()}),p=await load(c);await open(p);assert((await dialog(p).innerText()).includes('cadangan'));await finish(p,'drink');assert.equal((await read(p)).bottles,1);
  await p.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='manasik-life-v1')throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v);};});const before=await read(p);await finish(p,'eat');assert.deepEqual(await read(p),before);assert((await dialog(p).innerText()).includes('belum tersimpan'));pass('backup recovery and no consumption on failed save');await c.close();
 }
 {
  const c=await ctx({}, {[key]:fresh()}),p=await load(c);await open(p);await action(p,'eat').click();
  const other=await c.newPage();await other.goto(BASE+'/offline.html');await other.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.meals=1;s.food=80;localStorage.setItem(k,JSON.stringify(s));},key);await p.waitForTimeout(1400);const s=await read(p);assert.equal(s.meals,1);assert.equal(s.food,80);assert((await dialog(p).innerText()).includes('tab lain'));pass('other-tab update cancels pending action and prevents duplicate consumption');await c.close();
 }
 {
  const c=await ctx({viewport:{width:844,height:390},hasTouch:true,isMobile:true},{[key]:fresh()}),p=await load(c);await open(p);assert((await dialog(p).locator('button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height))).every(h=>h>=44));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:'qa-output/life-mobile.png'});
  await dialog(p).evaluate(e=>{e.scrollTop=e.scrollHeight;});const closeBox=await p.getByRole('button',{name:'Tutup tas',exact:true}).boundingBox();assert(closeBox.y>=0&&closeBox.y+closeBox.height<=390);await p.getByRole('button',{name:'Tutup tas',exact:true}).tap();await dialog(p).waitFor({state:'hidden'});await open(p);
  await action(p,'eat').click();await p.setViewportSize({width:390,height:844});await dialog(p).waitFor({state:'hidden'});await p.waitForTimeout(1200);await p.setViewportSize({width:844,height:390});await open(p);assert.equal(production?(await read(p))?.meals??2:(await snapshot(p)).life.save.meals,2);pass('landscape touch layout, 44px buttons and rotation cancels pending food');await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`qa-output/life${production?'-production':''}.json`,JSON.stringify({passed:true,production,report,errors,limitations:['SwiftShader functional checks; physical-phone FPS not measured.','Production suite does not expose development position diagnostics.']},null,2));
}catch(error){await page?.screenshot({path:'qa-output/life-failure.png'}).catch(()=>{});await writeFile('qa-output/life-failure.json',JSON.stringify({report,errors,error:String(error),url:page?.url(),state:await snapshot(page).catch(()=>null)},null,2));throw error;}finally{await browser.close();}
