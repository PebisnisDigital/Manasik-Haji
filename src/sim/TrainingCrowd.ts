import {bodyClear} from './GroundCollision.ts';
/** Bounded, deterministic lane-following crowd AI. Simulation only; not real crowd safety modelling. */
export interface Position{x:number;z:number}
export interface PathPoint extends Position{yaw:number}
type Route='tawaf'|'sai';
export interface LaneAgent{lane:number;s:number;pace:number;speed:number;height:number;phase:number;palette:number}
export const wrapDistance=(s:number,L:number)=>((s%L)+L)%L;
export const laneRadius=(kind:Route,lane:number)=>kind==='tawaf'?35.8+lane*2.35:2+lane*1.4;
export const routeLength=(kind:Route,lane:number,end=42)=>kind==='tawaf'?2*Math.PI*laneRadius(kind,lane):4*end+2*Math.PI*laneRadius(kind,lane);
export function pathPoint(kind:Route,lane:number,s:number,end=42):PathPoint{
 const r=laneRadius(kind,lane),q=wrapDistance(s,routeLength(kind,lane,end));
 if(kind==='tawaf'){const a=-q/r;return{x:Math.cos(a)*r,z:Math.sin(a)*r,yaw:Math.atan2(Math.sin(a),-Math.cos(a))};}
 const straight=2*end,turn=Math.PI*r;
 if(q<straight)return{x:r,z:end-q,yaw:Math.PI};
 if(q<straight+turn){const a=(q-straight)/r;return{x:r*Math.cos(a),z:-end-r*Math.sin(a),yaw:Math.atan2(-Math.sin(a),-Math.cos(a))};}
 if(q<2*straight+turn)return{x:-r,z:-end+q-straight-turn,yaw:0};
 const a=(q-2*straight-turn)/r;return{x:-r*Math.cos(a),z:end+r*Math.sin(a),yaw:Math.atan2(Math.sin(a),Math.cos(a))};
}
export function createLaneAgents(kind:Route,count:number,end=42):LaneAgent[]{
 const lanes=kind==='tawaf'?9:3;
 return Array.from({length:count},(_,i)=>{const lane=i%lanes,slot=Math.floor(i/lanes),n=Math.ceil((count-lane)/lanes),L=routeLength(kind,lane,end);return {lane,s:wrapDistance((slot+.19*(lane%3))*L/n,L),pace:.9+(i%5)*.12,speed:0,height:1.59+(i%7)*.035,phase:(i*.13)%1,palette:i%7};});
}
export function updateLanes(kind:Route,agents:LaneAgent[],dt:number,player:Position,end=42):void{
 if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);
 // Each lane uses the previous frame's headway; a stopped leader cannot be overtaken.
 const lanes=new Map<number,LaneAgent[]>();for(const a of agents){const group=lanes.get(a.lane)??[];group.push(a);lanes.set(a.lane,group);}
 const targetSpeed=new Map<LaneAgent,number>();
 for(const [lane,group] of lanes){const L=routeLength(kind,lane,end);group.sort((a,b)=>a.s-b.s);
  for(let i=0;i<group.length;i++){const a=group[i],next=group[(i+1)%group.length];const gap=group.length===1?L:wrapDistance(next.s-a.s,L);
   const p=pathPoint(kind,lane,a.s,end),dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz),forward=dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw),side=Math.abs(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw));
   const playerFactor=d<.72?0:forward>0&&forward<2.3&&side<.85?Math.max(0,Math.min(1,(forward-.82)/1.35)):1;
   targetSpeed.set(a,Math.min(a.pace*playerFactor,Math.max(0,(gap-.92)*.85),Math.max(0,(gap-.92)/dt)));
  }
 }
 const bodies=agents.map(a=>pathPoint(kind,a.lane,a.s,end));
 for(let i=0;i<agents.length;i++){const a=agents[i],desired=targetSpeed.get(a)??0;
  // Brake for a blocked lane, including crossing traffic and the player.
  a.speed=Math.min(desired,a.speed+dt*1.8);const L=routeLength(kind,a.lane,end),next=wrapDistance(a.s+a.speed*dt,L),p=pathPoint(kind,a.lane,next,end);
  if(bodyClear(bodies[i],p,[player,...bodies.filter((_,j)=>i!==j)])){a.s=next;bodies[i]=p;}else a.speed=0;
  a.phase=wrapDistance(a.phase+a.speed*dt/1.42,1);
 }
}
export type Patrol={x:number;z:number;homeX:number;homeZ:number;yaw:number;h:number;phase:number;moving:boolean;rest:boolean};
export type Rect={x:number;z:number;w:number;d:number};
export function patrolClear(x:number,z:number,obs:readonly Rect[],reserved:readonly Position[]):boolean{
 return Number.isFinite(x)&&Number.isFinite(z)&&!obs.some(o=>Math.abs(x-o.x)<o.w/2+.48&&Math.abs(z-o.z)<o.d/2+.48)&&!reserved.some(p=>Math.hypot(x-p.x,z-p.z)<1.8);
}
export function updatePatrols(agents:Patrol[],seconds:number,dt:number,player:Position|undefined,obstacles:readonly Rect[],reserved:readonly Position[]):void{
 dt=Math.min(.1,Math.max(0,dt));if(!dt)return;
 for(let i=0;i<agents.length;i++){const a=agents[i];a.moving=false;if(a.rest)continue;
  const angle=seconds*.23+i*2.399963,tx=a.homeX+Math.cos(angle)*1.6,tz=a.homeZ+Math.sin(angle)*1.4;
  let dx=tx-a.x,dz=tz-a.z;const d=Math.hypot(dx,dz);if(d<.04)continue;dx/=d;dz/=d;
  if(player&&Math.hypot(a.x-player.x,a.z-player.z)<2.1){const px=a.x-player.x,pz=a.z-player.z,l=Math.hypot(px,pz);if(l>.001){dx+=px/l*1.5;dz+=pz/l*1.5;}else continue;}
  const mag=Math.max(1,Math.hypot(dx,dz)),nx=a.x+dx/mag*.74*dt,nz=a.z+dz/mag*.74*dt;
  if(!patrolClear(nx,nz,obstacles,reserved)||agents.some((b,j)=>i!==j&&Math.hypot(nx-b.x,nz-b.z)<.76)||player&&Math.hypot(nx-player.x,nz-player.z)<.88&&Math.hypot(nx-player.x,nz-player.z)<=Math.hypot(a.x-player.x,a.z-player.z))continue;
  a.yaw=Math.atan2(nx-a.x,nz-a.z);a.phase=wrapDistance(a.phase+Math.hypot(nx-a.x,nz-a.z)/1.1,1);a.x=nx;a.z=nz;a.moving=true;
 }
}
