import * as THREE from 'three';
type WorldAnchor={x:number;y:number;visible:boolean;near:boolean};
let anchor:WorldAnchor|null=null;
export const worldActionAnchor=()=>anchor;
export function clearWorldActionAnchor(){anchor=null;}
/** Publish the current actual checkpoint or object, not an arbitrary HUD location. */
export function publishWorldAction(camera:THREE.Camera,x:number,y:number,z:number,near:boolean){
 const p=new THREE.Vector3(x,y,z),view=p.clone().applyMatrix4(camera.matrixWorldInverse);p.project(camera);
 anchor={x:(p.x*.5+.5)*innerWidth,y:(.5-p.y*.5)*innerHeight,visible:view.z<0&&p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1,near};
}
/** Second stick is independent from locomotion, with pointer capture and release safety. */
export function mountArenaLookPad(available:()=>boolean,look:(dx:number,dy:number)=>void,signal:AbortSignal){
 const pad=document.createElement('div');pad.className='arenaLookPad';pad.setAttribute('role','group');pad.setAttribute('aria-label','Joystick kamera');const knob=document.createElement('span');pad.append(knob);document.body.append(pad);
 let id:number|null=null,x=0,y=0,frame=0,last=0;
 function reset(){const previous=id;id=null;x=y=0;knob.style.left=knob.style.top='50%';if(previous!==null&&pad.hasPointerCapture(previous))pad.releasePointerCapture(previous);}
 function move(e:PointerEvent){const r=pad.getBoundingClientRect();x=(e.clientX-r.left-r.width/2)/(r.width*.35);y=(e.clientY-r.top-r.height/2)/(r.height*.35);const d=Math.max(1,Math.hypot(x,y));x/=d;y/=d;knob.style.left=(50+x*35)+'%';knob.style.top=(50+y*35)+'%';}
 pad.addEventListener('pointerdown',e=>{if(id!==null||!available()||e.button!==0)return;e.preventDefault();id=e.pointerId;pad.setPointerCapture(id);move(e);},{signal});
 pad.addEventListener('pointermove',e=>{if(id===e.pointerId&&available())move(e);},{signal});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if((e as PointerEvent).pointerId===id)reset();},{signal});
 window.addEventListener('blur',reset,{signal});document.addEventListener('visibilitychange',reset,{signal});
 function tick(now:number){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;const active=available()&&document.body.classList.contains('simplePlay');pad.hidden=!active;if(!active)reset();else if(Math.hypot(x,y)>.12)look(x*dt*360,y*dt*300);frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);signal.addEventListener('abort',()=>{reset();cancelAnimationFrame(frame);pad.remove();},{once:true});
}
/** Navigation aids stay optional; they must not masquerade as nearby object interactions. */
export function isNavigationAction(label:string){return /^(jalan (ke|menuju)|dekati |menuju garis awal|ikuti (jalur|penanda)|kembali (berjalan )?ke pintu.*\d+\s*m)/i.test(label.trim());}
