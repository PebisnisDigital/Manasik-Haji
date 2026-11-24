import {simpleMenuOpen} from '../simpleInput.ts';
import {lifeOpen} from './lifeWorld.ts';
import {companionOpen} from './companionView.ts';
export function stickVector(x:number,y:number,dead=.14):{x:number;y:number} {
  const magnitude=Math.hypot(x,y);
  if(magnitude<=dead)return {x:0,y:0};
  const scale=(Math.min(1,magnitude)-dead)/(1-dead)/magnitude;
  return {x:x*scale,y:y*scale};
}
/** Camera forward is +Z at yaw zero. Screen right is therefore -X. */
export function cameraMove(forward:number,right:number,yaw:number):{x:number;z:number} {
  const length=Math.max(1,Math.hypot(forward,right));
  return {x:(Math.sin(yaw)*forward-Math.cos(yaw)*right)/length,z:(Math.cos(yaw)*forward+Math.sin(yaw)*right)/length};
}
interface Options {
  canvas:HTMLCanvasElement;keys:Set<string>;joy:{x:number;y:number};active:()=>boolean;
  look:(dx:number,dy:number)=>void;interact:()=>void;pause:()=>void;
  extraKeys?:readonly string[];
}
export function attachAdventureControls(o:Options) {
  const stick=document.getElementById('joy')!,knob=document.getElementById('knob')!;
  const overlays=Array.from(document.querySelectorAll<HTMLElement>('.layer,.overlay'));
  const portrait=matchMedia('(orientation:portrait) and (pointer:coarse)');
  const abort=new AbortController(),signal=abort.signal;
  let stickId:number|null=null,lookId:number|null=null,lastX=0,lastY=0;
  const playable=()=>!simpleMenuOpen()&&o.active()&&!lifeOpen()&&!companionOpen()&&!document.hidden&&!portrait.matches&&!overlays.some(el=>!el.hidden);
  function resetStick(){o.joy.x=o.joy.y=0;knob.style.left=knob.style.top='50%';}
  function release(el:HTMLElement,id:number|null){if(id!==null&&el.hasPointerCapture(id))el.releasePointerCapture(id);}
  function clear(){o.keys.clear();const a=stickId,b=lookId;stickId=lookId=null;resetStick();release(stick,a);release(o.canvas,b);}
  function update(e:PointerEvent){
    if(e.pointerId!==stickId||!playable())return;
    const rect=stick.getBoundingClientRect(),radius=rect.width*.35;
    const v=stickVector((e.clientX-rect.left-rect.width/2)/radius,(e.clientY-rect.top-rect.height/2)/radius);
    o.joy.x=v.x;o.joy.y=v.y;knob.style.left=(50+v.x*35)+'%';knob.style.top=(50+v.y*35)+'%';
  }
  stick.addEventListener('pointerdown',e=>{if(stickId!==null||!playable())return;e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(stickId);update(e);},{signal});
  stick.addEventListener('pointermove',update,{signal});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,e=>{if((e as PointerEvent).pointerId===stickId){stickId=null;resetStick();}},{signal});
  o.canvas.addEventListener('pointerdown',e=>{if(lookId!==null||!playable()||e.button!==0)return;e.preventDefault();lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;o.canvas.setPointerCapture(lookId);},{signal});
  o.canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookId||!playable())return;o.look(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;},{signal});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])o.canvas.addEventListener(name,e=>{if((e as PointerEvent).pointerId===lookId)lookId=null;},{signal});
  const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight',...(o.extraKeys??[])]);
  window.addEventListener('keydown',e=>{
    if(!playable()||e.ctrlKey||e.altKey||e.metaKey||(e.target as HTMLElement)?.closest('input,select,textarea,[contenteditable=true]'))return;
    if(movement.has(e.code)){e.preventDefault();o.keys.add(e.code);}
    if(!e.repeat&&e.code==='KeyE'){e.preventDefault();o.interact();}
    if(!e.repeat&&e.code==='Escape'){clear();o.pause();}
  },{signal});
  window.addEventListener('keyup',e=>o.keys.delete(e.code),{signal});
  window.addEventListener('blur',clear,{signal});window.addEventListener('pagehide',clear,{signal});
  document.addEventListener('visibilitychange',()=>{clear();if(document.hidden&&'speechSynthesis'in window)speechSynthesis.cancel();},{signal});
  portrait.addEventListener('change',clear,{signal});
  // Opening a menu or a new task must not carry a held movement key into resume.
  const observer=new MutationObserver(()=>{if(!playable())clear();});
  overlays.forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['hidden']}));
  return {playable,clear,dispose(){clear();observer.disconnect();abort.abort();}};
}
