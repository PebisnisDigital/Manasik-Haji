import type {Point} from './districtModel.ts';
/** Short, continuous movement toward an assigned queue slot; no stop/start dead band. */
export function stepQueueWalk(from:Point,to:Point,dt:number,speed=2.8){
 const dx=to.x-from.x,dz=to.z-from.z,d=Math.hypot(dx,dz);
 const travel=Math.min(d,Math.max(0,dt)*speed);
 if(d<1e-7||travel===0)return {...from,travel:0,arrived:d<1e-7,yaw:null};
 return {x:from.x+dx/d*travel,z:from.z+dz/d*travel,travel,arrived:d-travel<1e-7,yaw:Math.atan2(dx,dz)};
}
