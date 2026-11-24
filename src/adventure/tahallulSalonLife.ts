import * as THREE from 'three';
import {TahallulAction} from '../characters/TahallulAction.ts';
export const SALON_CLIENTS=[
 {x:-7,z:-12,avatar:'male',skin:0x8d6748},{x:-2,z:-12,avatar:'male',skin:0xe0b892},{x:3,z:-12,avatar:'male',skin:0x6f4e35},
 {x:-7,z:-7,avatar:'male',skin:0xb98d66},{x:-2,z:-7,avatar:'male',skin:0xd4ab84},{x:3,z:-7,avatar:'male',skin:0xc59d78},
 {x:14.5,z:3.2,avatar:'female',skin:0xb98d66},{x:14.5,z:6.7,avatar:'female',skin:0x8d6748},
] as const;
/** Arrive, sit, receive a haircut, stand and leave; a new customer enters during the next cycle. */
export function salonClientPhase(time:number){
 const phase=((time%25)+25)%25;
 if(phase<3)return {visible:true,seated:phase/3,cuts:0,stroke:0,busy:false,offset:2*(1-phase/3)};
 if(phase<15){const part=(phase-3)/4;return {visible:true,seated:1,cuts:Math.min(2,Math.floor(part)),stroke:part%1,busy:true,offset:0};}
 if(phase<18)return {visible:true,seated:1-(phase-15)/3,cuts:3,stroke:0,busy:false,offset:(phase-15)/3*2};
 return {visible:false,seated:0,cuts:3,stroke:0,busy:false,offset:2};
}
export function buildSalonLife(scene:THREE.Scene,trimOnly=false){
 let time=0;const clients=SALON_CLIENTS.map((p,i)=>{const action=new TahallulAction(p.avatar,trimOnly||p.avatar==='female'||i%3===1?'trim':'shave',0,{ambient:true,skin:p.skin});action.group.position.set(p.x,0,p.z);scene.add(action.group);return {action,offset:i*2.9,acc:1};});
 const stats={stations:clients.length,cutting:0,customers:0};
 function update(dt:number,playing:boolean,camera:THREE.Camera){
  if(playing)time+=dt;stats.cutting=0;stats.customers=0;
  clients.forEach((c,i)=>{const p=SALON_CLIENTS[i],phase=salonClientPhase(time+c.offset),distance=Math.hypot(camera.position.x-p.x,camera.position.z-p.z);stats.customers+=Number(phase.visible);stats.cutting+=Number(phase.busy);c.action.group.visible=distance<35;c.acc+=dt;
   if(c.acc<(distance<15?1/12:1/5))return;c.acc=0;c.action.update(phase.cuts,phase.stroke,phase.busy);c.action.poseCustomer(phase.seated,phase.offset,phase.visible);
  });
 }
 return {stats,update,dispose(){clients.forEach(c=>c.action.dispose());}};
}
