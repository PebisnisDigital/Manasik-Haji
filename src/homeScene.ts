import * as THREE from 'three';
import {Environment} from './env/Environment.ts';
export function startHomeScene():void{
 const canvas=document.querySelector<HTMLCanvasElement>('#heroScene')!;
 const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
 r.setPixelRatio(Math.min(devicePixelRatio,1));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xd1c7b1,210,900);const env=new Environment(r,scene,'low');scene.add(env.group);
 const c=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,1000);
 const resize=()=>{r.setSize(innerWidth,innerHeight,false);c.aspect=innerWidth/innerHeight;c.updateProjectionMatrix();};resize();window.addEventListener('resize',resize);
 let id=0;const t=performance.now();let last=0;
 function frame(now:number):void{id=requestAnimationFrame(frame);if(document.hidden||now-last<45)return;last=now;const a=.7+Math.sin((now-t)/22000)*.28;const mobile=innerWidth<650;c.position.set(Math.sin(a)*44,19,Math.cos(a)*44);c.lookAt(mobile?0:-10,mobile?5:4,mobile?0:5);r.render(scene,c);}
 id=requestAnimationFrame(frame);window.addEventListener('pagehide',()=>{cancelAnimationFrame(id);window.removeEventListener('resize',resize);env.dispose();r.dispose();},{once:true});
}
