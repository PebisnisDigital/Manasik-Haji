import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const production=process.argv.includes('--production');
const BASE=process.env.ADVENTURE_QA_URL||(production?'http://127.0.0.1:4173':'http://127.0.0.1:5173');
const reportFile='qa-output/'+(production?'journey-production-qa.json':'journey-qa.json');
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[],t='manasik-tawaf-quest-v1',s='manasik-sai-quest-v1',h='manasik-tahallul-quest-v1',d='manasik-district-v1';let last;
await mkdir('qa-output',{recursive:true});
async function context(saves={},options={}){const c=await browser.newContext({viewport:{width:960,height:540},...options});await c.addInitScript(values=>{if(sessionStorage.getItem('journey-seed'))return;sessionStorage.setItem('journey-seed','1');localStorage.setItem('umroh-graphics-v1','low');for(const[k,v]of Object.entries(values))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));},saves);return c;}
async function page(c,url){const p=await c.newPage();last=p;p.on('pageerror',e=>errors.push(e.message));await p.goto(BASE+'/'+url);if(url.startsWith('adventure-map.html'))await p.locator('#oldJourney summary').click();return p;}
try{
 {
  const c=await context(),p=await page(c,'adventure-map.html');await p.locator('#journeyContinue').waitFor();assert.match(await p.locator('#journeyContinue').getAttribute('href'),/district.html/);assert.equal(await p.locator('.journeyStops li').count(),4);assert.equal(await p.locator('.journeyStops a').count(),2);assert.equal(await p.locator('#levels .level').count(),12);assert.equal(await p.locator('#total').textContent(),'0/12');
  const other=await c.newPage();await other.goto(BASE+'/offline.html');await other.evaluate(({t,s})=>{localStorage.setItem(t,JSON.stringify({version:1,stage:3,laps:7}));localStorage.setItem(s,JSON.stringify({version:1,stage:3,legs:7}));},{t,s});
  await p.waitForFunction(()=>document.getElementById('journeyContinue').textContent.includes('Tahallul'));assert.match(await p.locator('#quickPlay').textContent(),/01/);assert.match(await p.locator('[data-chapter=tahallul] a.levelAction').getAttribute('href'),/tahallul-adventure/);assert.equal(await p.locator('#total').textContent(),'2/12');assert.equal(await p.locator('#levels .level').count(),12);await p.screenshot({path:'qa-output/journey-map.png'});report.push('new journey, prerequisite locks and live cross-tab map/legacy counter updates without duplicate cards');await c.close();
 }
 {
  const saves={[d]:'{',[d+'.backup']:{version:1,stage:3,avatar:'female'},[t]:{version:1,stage:1,laps:4,gate:2},'manasik-district-errands-v1':'{"version":9}'};
  const c=await context(saves),p=await page(c,'adventure-map.html');await p.locator('#journeyContinue').waitFor();assert.match(await p.locator('#journeyContinue').getAttribute('href'),/tawaf-adventure/);assert.match(await p.locator('.journeyStops').textContent(),/4\/7 putaran/);assert.match(await p.locator('.journeyStops').textContent(),/tujuan 4\/5/);
  for(const[k,v]of Object.entries(saves))assert.equal(await p.evaluate(k=>localStorage.getItem(k),k),typeof v==='string'?v:JSON.stringify(v));report.push('read-only map recovers checkpoint display from backup, preserves corrupt/future records and resumes old Tawaf');await c.close();
 }
 {
  const rawSai={version:1,stage:1,legs:2,gate:1},c=await context({[d+':demo-travel:guest']:{version:1,stage:5,avatar:'female'},[t]:{version:1,stage:3,laps:7},[s]:rawSai}),p=await page(c,'sai-adventure.html?mitra=demo-travel');
  await p.locator('#start').click();await p.waitForFunction(()=>document.getElementById('leg').textContent==='2/7');await p.locator('#menu').click();const back=p.locator('#pause').getByRole('link',{name:'Kembali ke rombongan',exact:true});await back.waitFor();assert.match(await back.getAttribute('href'),/mitra=demo-travel/);await back.click();await p.locator('#startDistrict').click();await p.locator('#missionButton').click();assert.match(await p.locator('#dialogText').textContent(),/2\/7 lintasan/);
  await p.getByRole('link',{name:'Lanjutkan Sa’i',exact:true}).click();await p.locator('#start').click();await p.waitForFunction(()=>document.getElementById('leg').textContent==='2/7');assert.match(p.url(),/mitra=demo-travel/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),s),JSON.stringify(rawSai));report.push('Sai pause → district journal → resume Sai: original leg/gate and tenant preserved');await c.close();
 }
 {
  const c=await context({[t]:{version:1,stage:3,laps:7},[s]:{version:1,stage:3,legs:7},[h]:{version:1,stage:4,avatar:'female',method:'trim',cuts:3}},{viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const p=await page(c,'tawaf-adventure.html');for(const [url,id]of [['tawaf-adventure.html','endLayer'],['sai-adventure.html','end'],['tahallul-adventure.html','finish']]){await p.goto(BASE+'/'+url);const layer=p.locator('#'+id);await layer.waitFor({state:'visible'});assert.equal(await layer.getByRole('link',{name:'Kembali ke rombongan',exact:true}).count(),1);}
  await p.locator('#finish').getByRole('link',{name:'Kembali ke rombongan',exact:true}).tap();await p.locator('#startDistrict').click();await p.locator('#missionButton').tap();assert.match(await p.locator('#dialogText').textContent(),/Tahallul Umroh: Potong rambut dan kembali ke rombongan selesai/);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:'qa-output/journey-mobile-book.png'});report.push('all three completed chapter return links and mobile journal preserve legacy completion');await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(reportFile,JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify(report,null,2));
}catch(error){try{await last.screenshot({path:'qa-output/journey-failure.png'});}catch{}await writeFile(reportFile,JSON.stringify({passed:false,report,errors,error:String(error)},null,2));throw error;}finally{await browser.close();}
