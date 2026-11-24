export interface Point {x:number;z:number}
export interface Rect extends Point {w:number;d:number}
export const DISTRICT_BOUNDS = {minX:-68,maxX:68,minZ:-57,maxZ:57};
export const BUILDINGS:readonly (Rect&{name:string;height:number;color:number})[]=[
  {name:'PENGINAPAN NUSANTARA',x:-22,z:0,w:20,d:18,height:16,color:0xd3c3aa},
  {name:'PUSAT MANASIK',x:16,z:-5,w:18,d:15,height:9,color:0xb9c5bb},
  {name:'TERMINAL LATIHAN',x:56,z:-9,w:17,d:29,height:10,color:0xc8c7ba},
  {name:'KEDAI PERJALANAN',x:-20,z:-44,w:27,d:12,height:7,color:0xbfa88c},
  {name:'GALERI KOTA',x:18,z:44,w:28,d:12,height:11,color:0xc5b2a0},
];
export const STATIONS = {
  briefing:{x:-12,z:17},luggage:{x:-5,z:15},bus:{x:-4,z:24},terminal:{x:38,z:-12},arrival:{x:30,z:-12},
} as const;
export const DISTRICT_STEPS=[
  {title:'Temui ketua rombongan',detail:'Jelajahi pelataran penginapan. Temukan Pak Farid untuk menerima misi perjalanan.',target:STATIONS.briefing},
  {title:'Ambil koper perjalanan',detail:'Periksa koper di dekat pelataran, lalu bawa ke bus rombongan.',target:STATIONS.luggage},
  {title:'Naik bus rombongan',detail:'Dekati pintu bus. Tekan E atau Interaksi untuk masuk ke kursi pengemudi simulasi.',target:STATIONS.bus},
  {title:'Antar bus ke terminal',detail:'Ikuti jalan ke sisi timur kawasan. Parkir di kotak emas dekat terminal, lalu berhenti.',target:STATIONS.terminal},
  {title:'Temui pembimbing di terminal',detail:'Turun saat bus berhenti, lalu temui Bu Salma untuk melanjutkan ke level manasik.',target:STATIONS.arrival},
  {title:'Kawasan selesai dijelajahi',detail:'Lanjutkan level manasik atau jelajahi kawasan dengan berjalan kaki dan bus.',target:STATIONS.arrival},
] as const;
export type DistrictStage=0|1|2|3|4|5;
export interface DistrictSave {version:1;stage:DistrictStage;avatar:'male'|'female'}
export function storeDistrict(storage:Pick<Storage,'getItem'|'setItem'>,key:string,save:DistrictSave):boolean {
  try{
    const raw=storage.getItem(key);let future=false;
    try{future=JSON.parse(raw??'null')?.version>1;}catch{/* Corrupt primary may recover. */}
    if(future)return false;
    if(decodeDistrict(raw))try{storage.setItem(key+'.backup',raw!);}catch{/* Primary still gets a chance. */}
    storage.setItem(key,JSON.stringify(save));return true;
  }catch{return false;}
}
export type DistrictEvent='briefing'|'luggage'|'board'|'arrive'|'arrivalBriefing';
const ORDER:DistrictEvent[]=['briefing','luggage','board','arrive','arrivalBriefing'];
export function decodeDistrict(raw:string|null):DistrictSave|null {
  try{const s=JSON.parse(raw??'null');return s?.version===1&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=5&&['male','female'].includes(s.avatar)?{version:1,stage:s.stage,avatar:s.avatar}:null;}catch{return null;}
}
export function advanceDistrict(save:DistrictSave,event:DistrictEvent):DistrictSave {
  return ORDER[save.stage]===event?{...save,stage:(save.stage+1) as DistrictStage}:save;
}
export function districtSpawn(save:DistrictSave):Point {
  return save.stage>=4?{x:31,z:-6}:save.stage===3?{x:-.7,z:27.5}:{x:-20,z:15};
}
export const districtReward=(save:DistrictSave)=>save.stage*20;
export const DISTRICT_SOLIDS:readonly Rect[]=[...BUILDINGS,
  ...[[-4,-9],[0,6],[27,6],[-49,15],[-48,-13],[48,30]].map(([x,z])=>({x,z,w:2.7,d:2.7})),
  ...[[-5,3],[5,8],[27,-1],[-12,-17]].map(([x,z])=>({x,z,w:3,d:.8})),
];
export function canStand(x:number,z:number,obstacles:readonly Rect[]=DISTRICT_SOLIDS,radius=.4):boolean {
  const b=DISTRICT_BOUNDS;
  return x>b.minX+radius&&x<b.maxX-radius&&z>b.minZ+radius&&z<b.maxZ-radius&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);
}
export function insideBus(point:Point,bus:Point&{yaw:number},padding=.4):boolean {
  const dx=point.x-bus.x,dz=point.z-bus.z;
  const side=Math.cos(bus.yaw)*dx-Math.sin(bus.yaw)*dz,forward=Math.sin(bus.yaw)*dx+Math.cos(bus.yaw)*dz;
  return Math.abs(side)<1.35+padding&&Math.abs(forward)<4.65+padding;
}
export interface Vehicle extends Point {yaw:number;speed:number;steer:number}
export function busSpawn(save:DistrictSave):Vehicle {return save.stage>=4?{...STATIONS.terminal,yaw:Math.PI,speed:0,steer:0}:{...STATIONS.bus,yaw:Math.PI/2,speed:0,steer:0};}
export function busFits(bus:Vehicle,obstacles:readonly Rect[]=DISTRICT_SOLIDS):boolean {
  const c=Math.cos(bus.yaw),s=Math.sin(bus.yaw),ac=Math.abs(c),as=Math.abs(s),w=1.45,d=4.8;
  for(const side of [-w,w])for(const forward of [-d,d]){
    const x=bus.x+Math.cos(bus.yaw)*side+Math.sin(bus.yaw)*forward,z=bus.z-Math.sin(bus.yaw)*side+Math.cos(bus.yaw)*forward;
    if(!canStand(x,z,[],.15))return false;
  }
  // Separating-axis test: catches a thin object between the bus's corners too.
  for(const o of obstacles){
    const dx=o.x-bus.x,dz=o.z-bus.z,ow=o.w/2+.15,od=o.d/2+.15;
    if(Math.abs(dx)>=ow+ac*w+as*d||Math.abs(dz)>=od+as*w+ac*d)continue;
    if(Math.abs(c*dx-s*dz)>=w+ac*ow+as*od||Math.abs(s*dx+c*dz)>=d+as*ow+ac*od)continue;
    return false;
  }
  return true;
}
/** Bounded kinematic bicycle; fixed substeps prevent skipping thin obstacles after a slow frame. */
export function stepBus(bus:Vehicle,throttle:number,steering:number,brake:boolean,seconds:number,obstacles:readonly Rect[]=DISTRICT_SOLIDS):Vehicle {
  let out={...bus};let remaining=Math.max(0,Math.min(.1,seconds));
  while(remaining>1e-7){
    const dt=Math.min(1/120,remaining);remaining-=dt;
    const t=Math.max(-1,Math.min(1,throttle)),s=Math.max(-1,Math.min(1,steering));
    const opposing=out.speed*t<-.05;
    out.speed+=t*(opposing?9:3.5)*dt;
    const drag=brake?12:Math.abs(t)<.01?1.4:.25;
    out.speed=Math.sign(out.speed)*Math.max(0,Math.abs(out.speed)-drag*dt);
    out.speed=Math.max(-3,Math.min(11,out.speed));
    out.steer+=(s*.48-out.steer)*(1-Math.exp(-6*dt));
    const yaw=out.yaw-out.speed/5.1*Math.tan(out.steer)*dt;
    const proposed={...out,yaw,x:out.x+Math.sin(yaw)*out.speed*dt,z:out.z+Math.cos(yaw)*out.speed*dt};
    if(busFits(proposed,obstacles))out=proposed;else out.speed=0;
  }
  return out;
}
export function exitPoint(bus:Vehicle,obstacles:readonly Rect[]=DISTRICT_SOLIDS):Point|null {
  if(Math.abs(bus.speed)>.5)return null;
  for(const [side,forward]of [[2.5,1.8],[-2.5,1.8],[0,-6]]){
    const p={x:bus.x+Math.cos(bus.yaw)*side+Math.sin(bus.yaw)*forward,z:bus.z-Math.sin(bus.yaw)*side+Math.cos(bus.yaw)*forward};
    if(canStand(p.x,p.z,obstacles)&&!insideBus(p,bus,.35))return p;
  }
  return null;
}
export function atTerminal(bus:Vehicle):boolean {return Math.hypot(bus.x-STATIONS.terminal.x,bus.z-STATIONS.terminal.z)<5&&Math.abs(bus.speed)<.35;}
