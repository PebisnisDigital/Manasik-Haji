import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.argv[2]??'after';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:.65,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
  localStorage.setItem('umroh-graphics-v1','low');localStorage.setItem('manasik-journey-setup-v1',JSON.stringify({version:1,program:'hajj',avatar:'male',graphics:'low',voice:false,ambience:false,volume:0}));
  for(const id of ['miqat','arrival'])localStorage.setItem('manasik-hajj-'+id+'-v1',JSON.stringify({version:1,id:'profile-'+id,program:'hajj',avatar:'male',name:'QA',step:1}));
  localStorage.setItem('manasik-continuous-tawaf-male-v1',JSON.stringify({version:1,active:true,poi:0,started:false}));
  window.__glDraws=0;for(const type of [WebGLRenderingContext,WebGL2RenderingContext])for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=type.prototype[name];if(original)type.prototype[name]=function(...args){window.__glDraws++;return original.apply(this,args);};}
 });
 const page=await context.newPage();await page.goto('http://127.0.0.1:4173/index.html?play=miqat&program=hajj&campaign=hajj&chapter=miqat&tawaf=1');await page.locator('.miqatRoom[data-ready=true]').waitFor();await page.waitForTimeout(2500);
 const samples=[];for(let run=0;run<3;run++)samples.push(await page.evaluate(()=>new Promise(resolve=>{const values=[],start=performance.now(),draws=window.__glDraws;let last=start;function frame(now){values.push(now-last);last=now;if(now-start<3000){requestAnimationFrame(frame);return;}values.sort((a,b)=>a-b);resolve({averageMs:(now-start)/values.length,p95Ms:values[Math.floor(values.length*.95)],rafFrames:values.length,glDrawsPerRaf:(window.__glDraws-draws)/values.length});}requestAnimationFrame(frame);})));
 await mkdir('qa-output',{recursive:true});await page.screenshot({path:'qa-output/tawaf-atmosphere-'+label+'.png'});const result={label,hardware:'Headless Chrome / SwiftShader on this Windows host; software rendering, not phone FPS',viewport:'844 × 390, DPR 0.65, low',samples};await writeFile('qa-output/tawaf-atmosphere-profile-'+label+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
