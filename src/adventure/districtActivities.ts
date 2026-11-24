import {canStand,insideBus,STATIONS,type Point,type Vehicle} from './districtModel.ts';

export const ESCORT_PATH:readonly Point[]=[{x:-14,z:19},{x:-14,z:22},{x:-14,z:28},{x:-14,z:32}];
export const ERRAND_STATIONS={hasan:ESCORT_PATH[0],shelter:ESCORT_PATH[3],rizal:{x:-20,z:-33},delivery:STATIONS.arrival} as const;
export interface ErrandSave {version:1;stage:0|1|2|3|4;escortGate:0|1|2|3}
export const NEW_ERRANDS:ErrandSave={version:1,stage:0,escortGate:0};
export function decodeErrands(raw:string|null):ErrandSave|null{
  try{const s=JSON.parse(raw??'null');if(s?.version!==1||!Number.isInteger(s.stage)||s.stage<0||s.stage>4||!Number.isInteger(s.escortGate)||s.escortGate<0||s.escortGate>3||s.stage===0&&s.escortGate!==0||s.stage>=2&&s.escortGate!==3)return null;
    return {version:1,stage:s.stage,escortGate:s.escortGate};}catch{return null;}
}
export function storeErrands(storage:Pick<Storage,'getItem'|'setItem'>,key:string,value:ErrandSave):boolean{
  try{const raw=storage.getItem(key);try{if(JSON.parse(raw??'null')?.version>1)return false;}catch{}
    if(decodeErrands(raw))try{storage.setItem(key+'.backup',raw!);}catch{}
    storage.setItem(key,JSON.stringify(value));return true;
  }catch{return false;}
}
export function advanceErrand(s:ErrandSave,event:'acceptEscort'|'finishEscort'|'takeParcel'|'deliverParcel'):ErrandSave{
  if(s.stage===0&&event==='acceptEscort')return {...s,stage:1};
  if(s.stage===1&&s.escortGate===3&&event==='finishEscort')return {...s,stage:2};
  if(s.stage===2&&event==='takeParcel')return {...s,stage:3};
  if(s.stage===3&&event==='deliverParcel')return {...s,stage:4};
  return s;
}
export const errandReward=(s:ErrandSave)=>(s.stage>=2?30:0)+(s.stage===4?40:0);
export function errandSpawn(s:ErrandSave):Point|null{
  const p=s.stage===1?ESCORT_PATH[s.escortGate]:s.stage===3?ERRAND_STATIONS.rizal:null;
  return p?{x:p.x+2,z:p.z}:null;
}
export interface Companion extends Point {gate:0|1|2|3;yaw:number;waiting:'distance'|'bus'|'vehicle'|null}
export function companionSpawn(s:ErrandSave):Companion{return {...ESCORT_PATH[s.escortGate],gate:s.escortGate,yaw:0,waiting:null};}
/** Authored sidewalk/crossing path; proximity and vehicle guards are separate from animation. */
export function stepCompanion(n:Companion,player:Point,dt:number,driving:boolean,bus:Vehicle):Companion{
  const out={...n};if(n.gate===3)return {...out,waiting:null};
  if(driving)return {...out,waiting:'vehicle'};
  const gap=Math.hypot(n.x-player.x,n.z-player.z),limit=n.waiting==='distance'?6:7;
  if(gap>limit)return {...out,waiting:'distance'};
  const target=ESCORT_PATH[n.gate+1],distance=Math.hypot(target.x-n.x,target.z-n.z),step=Math.min(distance,Math.max(0,Math.min(.1,dt))*1.3);
  if(distance<.08)return {...out,...target,gate:(n.gate+1) as Companion['gate'],waiting:null};
  out.yaw=Math.atan2(target.x-n.x,target.z-n.z);out.x+=Math.sin(out.yaw)*step;out.z+=Math.cos(out.yaw)*step;
  if(!canStand(out.x,out.z)||insideBus(out,bus,1))return {...n,waiting:'bus'};
  out.waiting=null;return out;
}

// A rounded, authored driving route. It guides; it never drives or grants mission completion.
export const TERMINAL_ROUTE:readonly Point[]=[STATIONS.bus,{x:24,z:24},
  ...Array.from({length:6},(_,i)=>{const a=(i+1)*Math.PI/12;return {x:24+14*Math.sin(a),z:10+14*Math.cos(a)};}),STATIONS.terminal];
export function routeCue(bus:Vehicle):{text:string;remaining:number;offRoute:boolean}{
  let nearest=Infinity,segment=0,t=0;
  for(let i=0;i<TERMINAL_ROUTE.length-1;i++){
    const a=TERMINAL_ROUTE[i],b=TERMINAL_ROUTE[i+1],dx=b.x-a.x,dz=b.z-a.z,u=Math.max(0,Math.min(1,((bus.x-a.x)*dx+(bus.z-a.z)*dz)/(dx*dx+dz*dz))),d=Math.hypot(bus.x-a.x-dx*u,bus.z-a.z-dz*u);
    if(d<nearest){nearest=d;segment=i;t=u;}
  }
  const a=TERMINAL_ROUTE[segment],b=TERMINAL_ROUTE[segment+1];let remaining=Math.hypot(b.x-a.x,b.z-a.z)*(1-t);
  for(let i=segment+1;i<TERMINAL_ROUTE.length-1;i++)remaining+=Math.hypot(TERMINAL_ROUTE[i+1].x-TERMINAL_ROUTE[i].x,TERMINAL_ROUTE[i+1].z-TERMINAL_ROUTE[i].z);
  let ahead=8,point={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
  for(let i=segment+1;i<TERMINAL_ROUTE.length;i++){const end=TERMINAL_ROUTE[i],d=Math.hypot(end.x-point.x,end.z-point.z);if(d>ahead){point={x:point.x+(end.x-point.x)*ahead/d,z:point.z+(end.z-point.z)*ahead/d};break;}ahead-=d;point=end;}
  const delta=Math.atan2(Math.sin(Math.atan2(point.x-bus.x,point.z-bus.z)-bus.yaw),Math.cos(Math.atan2(point.x-bus.x,point.z-bus.z)-bus.yaw));
  const text=nearest>9?'Kembali ke garis rute':remaining<9?'Parkir di petak emas · tahan rem':delta>.25?'Belok kiri perlahan':delta<-.25?'Belok kanan perlahan':'Terus menuju terminal';
  return {text,remaining:Math.round(remaining+nearest),offRoute:nearest>9};
}

const WALK_ANCHORS:readonly Point[]=[{x:-35,z:-26},{x:-8,z:-26},{x:30,z:-26},{x:-35,z:18},{x:-8,z:18},{x:30,z:18},ERRAND_STATIONS.shelter,ERRAND_STATIONS.rizal,ERRAND_STATIONS.delivery,ERRAND_STATIONS.hasan];
export function walkSegmentClear(a:Point,b:Point):boolean{
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.3));
  for(let i=0;i<=steps;i++){const t=i/steps;if(!canStand(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;
}
const WALK_EDGES=WALK_ANCHORS.map((a,i)=>WALK_ANCHORS.map((b,j)=>i!==j&&walkSegmentClear(a,b)?Math.hypot(a.x-b.x,a.z-b.z):Infinity));
/** Small visibility graph, with exact endpoints; recompute when the player moves, never per NPC/frame. */
export function walkingRoute(from:Point,target:Point):Point[]{
  if(!canStand(from.x,from.z)||!canStand(target.x,target.z))return [];
  if(walkSegmentClear(from,target))return [{...from},{...target}];
  const nodes=[...WALK_ANCHORS,from,target],start=nodes.length-2,end=nodes.length-1,dist=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),seen=new Set<number>();dist[start]=0;
  while(seen.size<nodes.length){let u=-1;for(let i=0;i<nodes.length;i++)if(!seen.has(i)&&(u<0||dist[i]<dist[u]))u=i;
    if(u<0||!Number.isFinite(dist[u]))break;if(u===end)break;seen.add(u);
    for(let v=0;v<nodes.length;v++){if(v===u||seen.has(v))continue;const cost=u<WALK_ANCHORS.length&&v<WALK_ANCHORS.length?WALK_EDGES[u][v]:walkSegmentClear(nodes[u],nodes[v])?Math.hypot(nodes[u].x-nodes[v].x,nodes[u].z-nodes[v].z):Infinity;
      if(dist[u]+cost<dist[v]){dist[v]=dist[u]+cost;previous[v]=u;}}
  }
  if(!Number.isFinite(dist[end]))return [];
  const path:Point[]=[];for(let u=end;u>=0;u=previous[u]){path.unshift({...nodes[u]});if(u===start)break;}return path;
}
