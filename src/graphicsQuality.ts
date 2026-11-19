import type * as THREE from 'three';
import './graphicsQuality.css';
import {PROFILES,parseGraphics,initialTier,renderDpr,startAdapt,adaptWindow,type GraphicsMode,type GraphicsTier} from './graphicsModel.ts';
const KEY='umroh-graphics-v1';let mode:GraphicsMode='auto';
try{mode=parseGraphics(localStorage.getItem(KEY));}catch{}
const hardware=()=>({touch:typeof matchMedia!=='undefined'&&matchMedia('(pointer:coarse)').matches,cores:typeof navigator==='undefined'?4:navigator.hardwareConcurrency||4,memory:typeof navigator==='undefined'?undefined:(navigator as Navigator&{deviceMemory?:number}).deviceMemory});
export const graphicsTier=():GraphicsTier=>initialTier(mode,hardware());
export const graphicsProfile=()=>PROFILES[graphicsTier()];
const listeners=new Set<()=>void>();
const names:Record<GraphicsMode,string>={auto:'Otomatis',low:'Rendah',medium:'Sedang',high:'Tinggi'};
function setMode(next:GraphicsMode,save=true){mode=next;if(save)try{localStorage.setItem(KEY,mode);}catch{}for(const f of listeners)f();}
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key===KEY)setMode(parseGraphics(e.newValue),false);});
export function mountGraphics(host:HTMLElement){
 const wrap=document.createElement('label');wrap.className='graphicsControl';wrap.innerHTML='<span>Grafis</span>';const select=document.createElement('select');select.setAttribute('aria-label','Kualitas grafis');for(const m of ['auto','low','medium','high'] as const){const opt=document.createElement('option');opt.value=m;opt.textContent=names[m];select.append(opt);}wrap.append(select);const note=document.createElement('small');note.className='graphicsNote';note.textContent='Resolusi langsung berubah. Detail arena berlaku saat masuk arena berikutnya.';wrap.append(note);host.append(wrap);
 const update=()=>{select.value=mode;select.title=mode==='auto'?'Otomatis · awal '+names[graphicsTier()]:'Grafis '+names[mode];};select.onchange=()=>setMode(parseGraphics(select.value));listeners.add(update);update();return wrap;
}
/** Rendering budget only. Movement/ritual clock is maintained independently by the scene. */
export function createRenderBudget(renderer:THREE.WebGLRenderer,options:{enabled?:boolean;maxFps?:number;legacyDpr?:number}={}){
 const enabled=options.enabled!==false;let width=1,height=1,applied=0,prev=0,rendered=0,elapsed=0,frames=0,lastMode=mode,adapt=startAdapt(),lost=false;const abort=new AbortController();
 const profile=()=>enabled?graphicsProfile():{...PROFILES.medium,dpr:options.legacyDpr??1.35,pixels:Infinity,fps:60};
 function ratio(){const p=profile(),dpr=renderDpr(p,width,height,devicePixelRatio,enabled&&mode==='auto'?adapt.scale:1);if(Math.abs(dpr-applied)>.009){renderer.setPixelRatio(dpr);applied=dpr;}}
 function resize(w:number,h:number){width=Math.max(1,w);height=Math.max(1,h);ratio();renderer.setSize(width,height,false);}
 function resetClock(){prev=0;elapsed=0;frames=0;rendered=0;}
 let warning:HTMLElement|null=null;
 const contextLost=(event:Event)=>{event.preventDefault();lost=true;window.dispatchEvent(new Event('blur'));if(warning)return;warning=document.createElement('section');warning.className='graphicsRecovery';warning.setAttribute('role','alert');const title=document.createElement('h2'),body=document.createElement('p'),button=document.createElement('button');title.textContent='Grafis terhenti';body.textContent='Perangkat kehabisan sumber daya grafis atau konteks WebGL terputus. Coba mode Rendah. Latihan kembali ke checkpoint terakhir yang tersimpan.';button.type='button';button.textContent='Muat ulang dengan grafis rendah';button.onclick=()=>{setMode('low');location.reload();};warning.append(title,body,button);document.body.append(warning);};
 renderer.domElement.addEventListener('webglcontextlost',contextLost,{signal:abort.signal});document.addEventListener('visibilitychange',resetClock,{signal:abort.signal});
 function draw(now:number,scene:THREE.Scene,camera:THREE.Camera,paused=false){
  if(lost||document.hidden){resetClock();return;}
  if(lastMode!==mode){lastMode=mode;adapt=startAdapt();resetClock();ratio();}
  const p=profile(),target=Math.min(p.fps,options.maxFps??60);
  if(enabled&&mode==='auto'&&!paused&&prev>0){const ms=now-prev;if(ms>0&&ms<250){elapsed+=ms;frames++;if(elapsed>=2800&&frames>=12){const next=adaptWindow(adapt,elapsed/frames,target);if(next.scale!==adapt.scale){adapt=next;ratio();}else adapt=next;elapsed=0;frames=0;}}else{elapsed=0;frames=0;}}
  if(paused){elapsed=0;frames=0;}prev=now;
  const interval=1000/target;if(rendered>0&&now-rendered<interval-2)return;rendered=now;renderer.render(scene,camera);
 }
 return {resize,draw,lost:()=>lost,dispose(){abort.abort();warning?.remove();}};
}
