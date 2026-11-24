import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const errors=[],shots=[];let page;
try{
 page=await browser.newPage({viewport:{width:1100,height:720}});page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/__portrait__.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="icon" href="data:,"></head><body></body></html>'}));
 await page.goto('http://127.0.0.1:5173/__portrait__.html');
 await page.evaluate(async()=>{
  const source=await(await fetch('/src/characters/CrowdRenderer.ts')).text(),path=source.match(/import \* as THREE from ["']([^"']+)/)[1];
  const THREE=await import(path),{CrowdRenderer}=await import('/src/characters/CrowdRenderer.ts'),{resolveFrames}=await import('/src/characters/CrowdView.ts'),{Clip}=await import('/src/sim/States.ts');
  const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:9999';document.body.append(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xd0dcd7);scene.add(new THREE.HemisphereLight(0xe9f3ff,0x8b7c66,1.65));const sun=new THREE.DirectionalLight(0xffe2bc,2.5);sun.position.set(-3,5,5);scene.add(sun);
  const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.01,20),actors=['male','female'].map(pilgrimStyle=>{const crowd=new CrowdRenderer(1,{lod0Budget:1,lod1Budget:1,lod0Distance:20,lod1Distance:30,blobShadows:false},{robeLength:pilgrimStyle==='male'?.19:.065,coverHead:pilgrimStyle==='female',pilgrimStyle});scene.add(crowd.group);return crowd;});
  const pose={f0:0,f1:0,frac:0};resolveFrames(Clip.IDLE,.1,pose);
  window.__portrait=(angle,close)=>{
   for(let i=0;i<2;i++){const actor=actors[i];actor.beginFrame();actor.submit(0,i===0?-.24:.24,0,0,angle,1.74,1,pose.f0,pose.f1,pose.frac,pose.f0,0,i===0?0:8,1);actor.endFrame();}
   camera.position.set(0,close?1.59:1.14,close?1.15:3.7);camera.lookAt(0,close?1.59:.94,0);renderer.render(scene,camera);return {draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,bytes:actors.map(a=>a.stats.vatBytes),vertices:actors.map(a=>a.stats.vertsPerLod)};
  };
 });
 for(const [label,angle,close]of [['front',0,true],['three-quarter',.65,true],['full-body',0,false]]){
  const stats=await page.evaluate(({angle,close})=>window.__portrait(angle,close),{angle,close});assert(stats.draws>0);assert.deepEqual(errors,[]);await page.screenshot({path:`qa-output/human-${label}.png`});shots.push({label,...stats});
 }
 await writeFile('qa-output/human-portraits.json',JSON.stringify({passed:true,shots,errors,scope:'The same VAT meshes, materials, animation and lighting pipeline; a QA close-up camera, not a new game mode.'},null,2));
}finally{await browser.close();}
