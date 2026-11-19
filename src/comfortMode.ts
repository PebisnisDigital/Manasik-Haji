import './comfortMode.css';
import {parsePlayMode,movementFactor,cameraFactor,saiPace,type PlayMode} from './comfortModel.ts';
const KEY='umroh-comfort-v1';let current:PlayMode='standard';let expanded=false;
try{current=parsePlayMode(localStorage.getItem(KEY));}catch{}
const listeners=new Set<()=>void>();
export const comfortable=()=>current==='comfort';
export const walkFactor=(auto=false)=>movementFactor(current,auto);
export const lookFactor=()=>cameraFactor(current);
export const comfortablePace=(normal:number,brisk:number,eligible:boolean)=>saiPace(current,normal,brisk,eligible);
function paint(){document.documentElement.classList.toggle('comfortMode',comfortable());document.documentElement.classList.toggle('comfortMore',expanded&&comfortable());for(const update of listeners)update();}
function setMode(value:PlayMode,save=true){current=value;expanded=false;if(save)try{localStorage.setItem(KEY,current);}catch{}paint();window.dispatchEvent(new CustomEvent('umroh-comfort-change',{detail:current}));}
if(typeof window!=='undefined'){paint();window.addEventListener('storage',e=>{if(e.key===KEY)setMode(parsePlayMode(e.newValue),false);});}
export function mountComfort(host:HTMLElement,options:{more?:boolean;intro?:boolean}={}){
 const wrap=document.createElement('div');wrap.className='comfortControls'+(options.intro?' comfortIntro':'');const toggle=document.createElement('button');toggle.type='button';toggle.className='comfortToggle';wrap.append(toggle);const more=document.createElement('button');more.type='button';more.className='comfortExtra';more.textContent='Lainnya';if(options.more)wrap.append(more);
 let note:HTMLElement|null=null;if(options.intro){note=document.createElement('p');note.className='comfortNote';note.textContent='Teks besar, langkah lebih pelan. Cocok untuk pemula.';wrap.append(note);}
 host.append(wrap);
 function update(){toggle.textContent=comfortable()?'Nyaman: aktif':'Mode Nyaman';toggle.setAttribute('aria-pressed',String(comfortable()));toggle.setAttribute('aria-label',comfortable()?'Mode Nyaman aktif, tekan untuk mode Standar':'Aktifkan Mode Nyaman');more.hidden=!comfortable();more.textContent=expanded?'Ringkas':'Lainnya';more.setAttribute('aria-expanded',String(expanded));}
 toggle.onclick=()=>setMode(comfortable()?'standard':'comfort');
 more.onclick=()=>{expanded=!expanded;paint();};
 listeners.add(update);update();return wrap;
}
