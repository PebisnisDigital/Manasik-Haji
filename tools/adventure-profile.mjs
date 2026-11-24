import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.argv[2]||'after';
const unbatched=process.argv.includes('--unbatched');
await mkdir('qa-output',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.ADVENTURE_QA_EXECUTABLE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const results=[];
for(const [name,url,start] of [['tawaf','tawaf-adventure.html','startBtn'],['sai','sai-adventure.html?demo=1','start'],['tahallul','tahallul-adventure.html?demo=1','start']]){
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('umroh-graphics-v1','medium');window.__draws=0;window.__samples=[];
  for(const type of [WebGLRenderingContext,WebGL2RenderingContext])for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
   const original=type.prototype[name];if(!original)continue;
   type.prototype[name]=function(...args){window.__draws++;return original.apply(this,args);};
  }
  let last=0;function frame(now){if(last)window.__samples.push(now-last);last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
 });
 await page.goto('http://127.0.0.1:5173/'+url+(unbatched?(url.includes('?')?'&':'?')+'unbatched=1':''));
 await page.locator('#'+start).click();await page.waitForTimeout(1800);
 await page.evaluate(()=>{window.__draws=0;window.__samples=[];});
 await page.waitForTimeout(2200);
 const stats=await page.evaluate(()=>{const v=window.__samples.toSorted((a,b)=>a-b);return {drawCallsPerRenderedFrame:window.__adventureDebug?.snapshot().drawCalls,drawsPerAnimationFrame:window.__draws/v.length,animationFrameMeanMs:v.reduce((a,b)=>a+b,0)/v.length,p95Ms:v[Math.floor(v.length*.95)],frames:v.length};});
 await page.screenshot({path:`qa-output/${label}-${name}.png`});results.push({name,...stats,errors});await page.close();
}
await browser.close();await writeFile(`qa-output/${label}-profile.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
