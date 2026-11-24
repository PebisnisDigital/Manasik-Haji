import {busFits,canStand,insideBus,decodeDistrict,type DistrictSave,type Vehicle,type Point} from './districtModel.ts';
/** About 160 m through the existing quarter. All corners match the bus turning radius. */
export const TRANSFER_ROUTE:readonly Point[]=[{x:-4,z:24},{x:-24,z:24},
 ...Array.from({length:6},(_,i)=>{const a=(i+1)*Math.PI/12;return {x:-24-14*Math.sin(a),z:10+14*Math.cos(a)};}),{x:-38,z:-10},
 ...Array.from({length:6},(_,i)=>{const a=(i+1)*Math.PI/12;return {x:-24-14*Math.cos(a),z:-10-14*Math.sin(a)};}),{x:24,z:-24},
 ...Array.from({length:6},(_,i)=>{const a=(i+1)*Math.PI/12;return {x:24+14*Math.sin(a),z:-10-14*Math.cos(a)};}),{x:38,z:-12}];
export interface TransferSave extends DistrictSave{gate:number}
export function decodeTransfer(raw:string|null):TransferSave|null{const base=decodeDistrict(raw);try{const v=JSON.parse(raw??'null');return base&&base.stage>=2&&Number.isInteger(v.gate)&&v.gate>=1&&v.gate<=TRANSFER_ROUTE.length&&(base.stage<4||v.gate===TRANSFER_ROUTE.length)?{...base,gate:v.gate}:null;}catch{return null;}}
export function transferBus(save:TransferSave):Vehicle{
 if(save.stage>=4)return {x:38,z:-12,yaw:Math.PI,speed:0,steer:0};
 const p=TRANSFER_ROUTE[save.gate-1],next=TRANSFER_ROUTE[Math.min(save.gate,TRANSFER_ROUTE.length-1)];return {...p,yaw:Math.atan2(next.x-p.x,next.z-p.z),speed:0,steer:0};
}
export function nextTransferGate(bus:Vehicle,gate:number){return Math.abs(bus.speed)>.05&&gate<TRANSFER_ROUTE.length&&Math.hypot(bus.x-TRANSFER_ROUTE[gate].x,bus.z-TRANSFER_ROUTE[gate].z)<6?gate+1:gate;}
export function transferCue(bus:Vehicle,gate:number){
 const target=TRANSFER_ROUTE[Math.min(gate,TRANSFER_ROUTE.length-1)],angle=Math.atan2(Math.sin(Math.atan2(target.x-bus.x,target.z-bus.z)-bus.yaw),Math.cos(Math.atan2(target.x-bus.x,target.z-bus.z)-bus.yaw));
 let remaining=Math.hypot(bus.x-target.x,bus.z-target.z);for(let i=gate;i<TRANSFER_ROUTE.length-1;i++)remaining+=Math.hypot(TRANSFER_ROUTE[i+1].x-TRANSFER_ROUTE[i].x,TRANSFER_ROUTE[i+1].z-TRANSFER_ROUTE[i].z);
 return {text:gate>=TRANSFER_ROUTE.length-2?'Parkir di terminal · tahan Rem':angle>.3?'Belok kiri perlahan':angle<-.3?'Belok kanan perlahan':'Ikuti jalan bersama rombongan',remaining:Math.round(remaining),target};
}
export function validTransferRoute(){return TRANSFER_ROUTE.slice(0,-1).every((p,i)=>{const next=TRANSFER_ROUTE[i+1];return busFits({...p,yaw:Math.atan2(next.x-p.x,next.z-p.z),speed:0,steer:0});});}
/** Choose the clear exit nearest the guide, so the vehicle cannot trap the walking route. */
export function transferExit(bus:Vehicle,target:Point={x:30,z:-12}):Point|null{
 if(Math.abs(bus.speed)>.5)return null;
 const choices=[[2.7,1.8],[-2.7,1.8],[0,-6],[0,6]].map(([side,forward])=>({x:bus.x+Math.cos(bus.yaw)*side+Math.sin(bus.yaw)*forward,z:bus.z-Math.sin(bus.yaw)*side+Math.cos(bus.yaw)*forward})).filter(p=>canStand(p.x,p.z)&&!insideBus(p,bus,.45));
 return choices.sort((a,b)=>Math.hypot(a.x-target.x,a.z-target.z)-Math.hypot(b.x-target.x,b.z-target.z))[0]??null;
}
