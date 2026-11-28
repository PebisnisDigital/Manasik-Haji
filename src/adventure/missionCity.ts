import {drawNamePlate} from '../characters/NamePlate.ts';
import {createSouvenirCelebration} from './souvenirCelebration.ts';
import {SOUVENIR_BUILDING,SOUVENIR_NUMBER} from './citySouvenir.ts';
import {slidingDoorOffset} from './cityMissionEntry.ts';
import {createLivePlazas} from './cityLivePlazas.ts';
import {humanActor,updateHumanActors,disposeHumanActors,humanBodies} from '../characters/HumanActors.ts';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {type Point,type Rect,type Vehicle} from './districtModel.ts';
import {NUSUK_LEVELS} from './nusukModel.ts';
import {UMRAH_LEVELS} from '../frontModel.ts';
export type CityKind='motor'|'mobil'|'bus';
import {CITY_BOUNDS,CITY_ROADS} from './cityNavigation.ts';
export {CITY_BOUNDS} from './cityNavigation.ts';
import {CITY_LAYOUT as layout} from './cityLayout.ts';
const guardNames=['Asep','Dedi','Jajang','Bambang','Eko','Sutrisno','Wawan','Dadang','Agus','Yanto','Rudi','Slamet'] as const;
export const CITY_BUILDINGS=layout.map(([x,z,yaw],i)=>({x,z,yaw,w:20,d:20,height:18+(i%3)*3,number:i+1,guardName:'Pak '+guardNames[i],door:{x:x+Math.sin(yaw)*10.9,z:z+Math.cos(yaw)*10.9}}));
const profiles={motor:{label:'Motor',w:.48,d:1.05,wheelbase:1.35,max:14,acc:5},mobil:{label:'Mobil',w:1.0,d:2.25,wheelbase:2.7,max:16,acc:4.2},bus:{label:'Bus',w:1.45,d:4.8,wheelbase:5.1,max:11,acc:3.5}};
export type CityVehicle=Vehicle&{kind:CityKind};
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const initial=():CityVehicle[]=>[{kind:'motor',x:-12,z:12,yaw:Math.PI/2,speed:0,steer:0},{kind:'mobil',x:-24,z:14,yaw:Math.PI/2,speed:0,steer:0},{kind:'bus',x:-22,z:0,yaw:Math.PI/2,speed:0,steer:0}];
const footprint=(v:CityVehicle):Rect=>{const p=profiles[v.kind],c=Math.abs(Math.cos(v.yaw)),s=Math.abs(Math.sin(v.yaw));return {x:v.x,z:v.z,w:2*(c*p.w+s*p.d),d:2*(s*p.w+c*p.d)};};
function inside(p:Point,r:Rect,pad=0){return Math.abs(p.x-r.x)<r.w/2+pad&&Math.abs(p.z-r.z)<r.d/2+pad;}
export function cityCanStand(p:Point,solids:readonly Rect[],radius=.4){const b=CITY_BOUNDS;return p.x>b.minX+radius&&p.x<b.maxX-radius&&p.z>b.minZ+radius&&p.z<b.maxZ-radius&&!solids.some(r=>inside(p,r,radius));}
export function cityDrive(v:CityVehicle,forward:number,right:number,brake:boolean,dt:number,solids:readonly Rect[]){
 const p=profiles[v.kind];let out={...v},left=Math.min(.08,Math.max(0,dt));
 while(left>1e-6){const t=Math.min(left,1/90);left-=t;const gas=THREE.MathUtils.clamp(forward,-1,1),steer=THREE.MathUtils.clamp(right,-1,1);
  out.speed+=gas*p.acc*t;out.speed=Math.sign(out.speed)*Math.max(0,Math.abs(out.speed)-(brake?13:Math.abs(gas)<.01?1.5:.25)*t);
  out.speed=THREE.MathUtils.clamp(out.speed,-3,p.max);out.steer+=(steer*.48-out.steer)*(1-Math.exp(-6*t));
  const yaw=out.yaw-out.speed/p.wheelbase*Math.tan(out.steer)*t,next={...out,yaw,x:out.x+Math.sin(yaw)*out.speed*t,z:out.z+Math.cos(yaw)*out.speed*t};
  const box=footprint(next);if(box.x-box.w/2<CITY_BOUNDS.minX||box.x+box.w/2>CITY_BOUNDS.maxX||box.z-box.d/2<CITY_BOUNDS.minZ||box.z+box.d/2>CITY_BOUNDS.maxZ||solids.some(r=>Math.abs(r.x-box.x)<(r.w+box.w)/2+.12&&Math.abs(r.z-box.z)<(r.d+box.d)/2+.12))out.speed=0;else out=next;
 }
 return out;
}
export function createMissionCity(scene:THREE.Scene,program:'hajj'|'umrah',boardSolid:Rect){
 const missions=CITY_BUILDINGS.slice(0,program==='hajj'?12:5),places=program==='hajj'?[...missions,SOUVENIR_BUILDING]:missions;
 const solids:Rect[]=[boardSolid,...places];
 const plazas=createLivePlazas(scene,missions);solids.push(...plazas.solids);const celebration=program==='hajj'?createSouvenirCelebration(scene):null;
 const vehicles=initial();let selected:CityVehicle|null=null;
 const mat=(color:number,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
 const sand=mat(0xc5b597),road=mat(0x444c4d),pave=mat(0xcfc7b2),white=mat(0xfffaf0),gold=mat(0xd6b46b,.36),green=mat(0xe6d2a4,.55),glass=mat(0x41464d,.25),dark=mat(0x564634),rubber=mat(0x252526);
 function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.MeshStandardMaterial){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 box(scene,CITY_BOUNDS.maxX-CITY_BOUNDS.minX+4,.1,CITY_BOUNDS.maxZ-CITY_BOUNDS.minZ+4,0,-.12,0,sand);
 function street(x:number,z:number,w:number,d:number){
  box(scene,w+2,.1,d+2,x,-.015,z,pave);box(scene,w,.1,d,x,.045,z,road);
  const long=w>d;for(let k=-(long?w:d)/2+4;k<(long?w:d)/2-2;k+=8)box(scene,long?3:.14,.015,long?.14:3,x+(long?k:0),.103,z+(long?0:k),white);
 }
 for(const r of CITY_ROADS)street(r.x,r.z,r.w,r.d);
 const doors:{left:THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>;right:THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>;open:number}[]=[];
 const signs:THREE.CanvasTexture[]=[];
 const guards:{root:THREE.Group;yaw:number;number:number;status:THREE.Sprite;ctx:CanvasRenderingContext2D;tex:THREE.CanvasTexture;last:string}[]=[];
 const names=program==='hajj'?NUSUK_LEVELS.map(l=>l.title):UMRAH_LEVELS.map(l=>l.title);
 for(const p of places){
  const g=new THREE.Group();g.position.set(p.x,0,p.z);g.rotation.y=p.yaw;scene.add(g);
  const gift=p.number===SOUVENIR_NUMBER;
  const wall=mat(gift?0xf5efdf:[0xf5f1e8,0xeee6d6,0xf8f4eb][(p.number-1)%3]!,.72);
  // Recessed doorway: the facade has an actual opening, not a painted door on a solid block.
  box(g,20,p.height,17.2,0,p.height/2,-1.4,wall);
  for(const x of [-5.95,5.95])box(g,8.1,p.height,2.8,x,p.height/2,8.6,wall);
  box(g,3.8,p.height-3.2,2.8,0,(p.height+3.2)/2,8.6,wall);
  box(g,3.8,.12,2.8,0,.06,8.6,pave);box(g,3.8,3.15,.08,0,1.62,7.24,dark);
  box(g,20.65,.38,20.65,0,p.height+.18,0,gold);
  box(g,20.25,.18,20.25,0,p.height-.6,0,white);
  // Flush gold belt courses unify the facade without adding any walkable obstruction.
  for(let y=7.1;y<p.height-3;y+=5.4){box(g,19.8,.10,.12,0,y,10.09,gold);box(g,19.8,.10,.12,0,y,-10.09,gold);for(const side of [-1,1])box(g,.12,.10,19.8,side*10.09,y,0,gold);}
  box(g,5,.18,4,0,.09,12,pave);
  for(let i=0;i<3;i++)box(g,5,.16,1.1,0,.12+i*.13,11.7-i*.65,pave);
  for(const x of [-8,-4,4,8])for(let y=2.4;y<p.height-1;y+=2.7){box(g,2.3,1.65,.10,x,y,10.08,glass);box(g,2.5,.10,.32,x,y-.86,10.2,white);}
  for(const x of [-8.8,8.8])box(g,.55,p.height,.7,x,p.height/2,10.1,white);
  for(const x of [-2.4,2.4])box(g,.55,4,.65,x,2,10.35,gold);
  box(g,5.8,.22,2.4,0,4.13,10.8,green);
  const doorMat=mat(0x82633a,.48),left=box(g,1.8,3.0,.15,-.90,1.58,10.12,doorMat),right=box(g,1.8,3.0,.15,.90,1.58,10.12,doorMat);doors.push({left,right,open:0});
  const c=document.createElement('canvas');c.width=1024;c.height=256;const t=c.getContext('2d')!;
  t.fillStyle=gift?'#0e4739':'#193d31';t.fillRect(0,0,1024,256);t.strokeStyle='#d8b972';t.lineWidth=7;t.strokeRect(9,9,1006,238);t.fillStyle='#f2d18b';t.font=gift?'bold 80px system-ui':'bold 62px system-ui';t.textAlign='center';t.fillText(gift?'GEDUNG OLEH-OLEH':'GEDUNG '+String(p.number).padStart(2,'0'),512,88);t.fillStyle='#fff4d9';t.font='bold 46px system-ui';t.fillText(gift?'12 BINTANG · HADIAH PERJALANAN':names[p.number-1]??'Level '+p.number,512,172,945);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;signs.push(tex);const sign=new THREE.Mesh(new THREE.PlaneGeometry(15,3.75),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));sign.position.set(0,5.4,10.25);g.add(sign);
  if(gift){
   for(const x of [-9.6,9.6]){box(g,.5,p.height+.15,.85,x,p.height/2,10.3,gold);}
   box(g,20.5,.24,.6,0,p.height-1.2,10.1,gold);
   // Distinct golden gift sculpture above the entrance, outside walking space.
   box(g,4,3.1,3.1,0,p.height+1.9,0,green);box(g,4.35,.38,3.45,0,p.height+3.65,0,gold);box(g,.55,3.5,3.16,0,p.height+1.9,0,gold);box(g,4.06,.48,.12,0,p.height+1.9,1.61,gold);
   for(const side of [-1,1]){const ribbon=new THREE.Mesh(new THREE.TorusGeometry(.83,.19,8,24),gold);ribbon.position.set(side*.85,p.height+4.35,0);ribbon.rotation.z=side*.55;g.add(ribbon);}
   for(const side of [-1,1]){box(g,4,.14,5,side*5,.07,12,pave);for(let j=0;j<3;j++)box(g,.44,.85,.44,side*(3.2+j*1.25),.43,14,green);}
  }
  // Uniformed gate attendant, standing to the side of the entrance.
  const guard=humanActor(scene,0x34475b,false,1.79,undefined,{palette:4,build:1.12,brightness:1,cull:true,registration:true});
  guard.position.set(p.x+Math.cos(p.yaw)*2.95+Math.sin(p.yaw)*11.8,.1,p.z-Math.sin(p.yaw)*2.95+Math.cos(p.yaw)*11.8);
  guard.rotation.y=p.yaw;const bubbleCanvas=document.createElement('canvas');bubbleCanvas.width=512;bubbleCanvas.height=128;const bubbleCtx=bubbleCanvas.getContext('2d')!;const bubbleTex=new THREE.CanvasTexture(bubbleCanvas);bubbleTex.colorSpace=THREE.SRGBColorSpace;signs.push(bubbleTex);const bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:bubbleTex,transparent:true,depthWrite:false}));bubble.position.set(0,2.75,0);bubble.scale.set(2.65,.66,1);bubble.visible=false;guard.add(bubble);guards.push({root:guard,yaw:p.yaw,number:p.number,status:bubble,ctx:bubbleCtx,tex:bubbleTex,last:''});
  const tagCanvas=document.createElement('canvas');tagCanvas.width=512;tagCanvas.height=116;const tg=tagCanvas.getContext('2d')!;
  drawNamePlate(tg,p.guardName,'PETUGAS KEAMANAN');
  const tagTexture=new THREE.CanvasTexture(tagCanvas);tagTexture.colorSpace=THREE.SRGBColorSpace;signs.push(tagTexture);
  const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTexture,transparent:true,depthWrite:false}));tag.position.set(0,2.11,0);tag.scale.set(2.05,.465,1);guard.add(tag);
  const badge=box(guard,.13,.09,.025,-.15,1.36,.18,gold);badge.rotation.y=0;
  // A low security podium identifies the checkpoint without obstructing the door.
  box(g,.70,1.05,.55,4.3,.525,11.8,green);box(g,.82,.07,.65,4.3,1.08,11.8,gold);box(g,.38,.025,.26,4.3,1.13,11.8,white);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(1.65,16,8,0,Math.PI*2,0,Math.PI/2),green);cap.position.set(0,p.height+.38,0);g.add(cap);
  for(const x of [-9.2,9.2]){box(g,.26,2.7,.26,x,p.height+1.2,9.1,gold);}
  // Batch each facade independently for frustum culling; never merge sliding doors or signs.
  const batches=new Map<THREE.Material,THREE.Mesh[]>();for(const child of g.children){if(!(child instanceof THREE.Mesh)||child===left||child===right||!(child.material instanceof THREE.MeshStandardMaterial))continue;const list=batches.get(child.material)??[];list.push(child);batches.set(child.material,list);}
  for(const [material,parts] of batches){if(parts.length<2)continue;const copies=parts.map(part=>{part.updateMatrix();return part.geometry.clone().applyMatrix4(part.matrix);});const geometry=mergeGeometries(copies,false);copies.forEach(c=>c.dispose());if(!geometry)continue;const merged=new THREE.Mesh(geometry,material);merged.receiveShadow=true;g.add(merged);for(const part of parts){part.removeFromParent();part.geometry.dispose();}}
 }
 function wheel(g:THREE.Group,x:number,y:number,z:number,r:number,width:number){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,width,16),rubber);m.rotation.z=Math.PI/2;m.position.set(x,y,z);g.add(m);return m;}
 const motor=new THREE.Group(),car=new THREE.Group();scene.add(motor,car);const red=mat(0xa33e36,.38),silver=mat(0xd6d7d1,.33);
 const carWheels:THREE.Mesh[]=[],motorWheels:THREE.Mesh[]=[];
 box(car,1.85,.52,4.25,0,.65,0,silver);box(car,1.68,.68,2.65,0,1.18,-.24,glass);box(car,1.74,.10,2.70,0,1.55,-.24,silver);
 for(const side of [-1,1]){for(const z of [-1.4,1.4])carWheels.push(wheel(car,side*.91,.36,z,.36,.22));for(const z of [-1.4,0,1])box(car,.08,.62,.09,side*.86,1.18,z,silver);box(car,.38,.17,.06,side*.61,.8,2.16,white);box(car,.38,.18,.06,side*.61,.8,-2.16,red);}
 box(motor,.4,.22,1.45,0,.48,0,red);box(motor,.45,.36,.72,0,.73,-.32,red);box(motor,.39,.11,.8,0,.97,-.36,dark);box(motor,.40,.61,.26,0,.75,.57,red);box(motor,.48,.14,.30,0,1.1,.57,red);box(motor,.74,.07,.09,0,1.18,.46,dark);box(motor,.26,.10,.04,0,1.12,.74,white);
 motorWheels.push(wheel(motor,0,.31,.79,.31,.14),wheel(motor,0,.31,-.79,.31,.16));
 // A visible seated rider for the scooter; character remains visible on foot.
 const rider=new THREE.Group();motor.add(rider);box(rider,.45,.55,.25,0,1.27,-.3,green);const head=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),mat(0xe4d6be));head.position.set(0,1.69,-.25);rider.add(head);for(const x of [-.19,.19]){const arm=box(rider,.10,.46,.10,x,1.28,.12,green);arm.rotation.x=-1.1;const leg=box(rider,.13,.43,.14,x,.80,.13,dark);leg.rotation.x=-.5;}rider.visible=false;
 const marker=new THREE.Mesh(new THREE.RingGeometry(1.15,1.6,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x53df76,side:THREE.DoubleSide,transparent:true,opacity:.9}));scene.add(marker);marker.position.y=.13;
 // Index immutable structural collision once; vehicles remain dynamic.
 const cell=12,index=new Map<string,Rect[]>();
 for(const s of solids)for(let x=Math.floor((s.x-s.w/2-.5)/cell);x<=Math.floor((s.x+s.w/2+.5)/cell);x++)for(let z=Math.floor((s.z-s.d/2-.5)/cell);z<=Math.floor((s.z+s.d/2+.5)/cell);z++){const k=x+':'+z;const bucket=index.get(k)??[];bucket.push(s);index.set(k,bucket);}
 const walkSolids=(p:Point)=>index.get(Math.floor(p.x/cell)+':'+Math.floor(p.z/cell))??[];
 let souvenirUnlocked=false;
 const celebrationSolids=()=>souvenirUnlocked?(celebration?.solids??[]):[];
 const otherSolids=(kind?:CityKind)=>[...solids,...celebrationSolids(),...vehicles.filter(v=>v.kind!==kind).map(footprint)];
 const get=(kind:CityKind)=>vehicles.find(v=>v.kind===kind)!;
 const near=(p:Point)=>vehicles.filter(v=>distance(p,v)<profiles[v.kind].d+2.4).sort((a,b)=>distance(a,p)-distance(b,p))[0]??null;
 function take(kind:CityKind){selected=get(kind);return {...selected};}
 function update(v:CityVehicle){Object.assign(get(v.kind),v);selected=get(v.kind);}
 function leave(v:CityVehicle){if(Math.abs(v.speed)>.5)return null;const profile=profiles[v.kind];for(const side of [-1,1]){const p={x:v.x+Math.cos(v.yaw)*side*(profile.w+1.1),z:v.z-Math.sin(v.yaw)*side*(profile.w+1.1)};if(cityCanStand(p,otherSolids())){selected=null;return p;}}return null;}
 function render(active:CityVehicle|null,wheel:number,available:number[],target:number){
  souvenirUnlocked=available.includes(SOUVENIR_NUMBER);
  for(const [kind,g,ws] of [['motor',motor,motorWheels],['mobil',car,carWheels]] as const){const v=get(kind);g.position.set(v.x,0,v.z);g.rotation.y=v.yaw;for(const w of ws)w.rotation.x=active?.kind===kind?wheel:0;}
  rider.visible=selected?.kind==='motor';
  for(let i=0;i<doors.length;i++){const d=doors[i]!,color=available.includes(i+1)?0xb9934c:0x35413e;if(d.left.material.color.getHex()!==color)d.left.material.color.setHex(color);}
  const p=places.find(p=>p.number===target);marker.visible=!!p;if(p){marker.position.x=p.door.x;marker.position.z=p.door.z;}
 }
 function openDoor(number:number,amount:number){const d=doors[number-1];if(!d)return;d.open=amount;const offset=slidingDoorOffset(amount);d.left.position.x=-offset;d.right.position.x=offset;}
 function entrance(p:Point){return places.find(b=>distance(p,b.door)<3.5||guards.some(g=>g.number===b.number&&distance(p,{x:g.root.position.x,z:g.root.position.z})<2.4))??null;}
 function updateGuards(hero:Point,dt:number,camera:THREE.Camera,active:boolean,talking:number|null=null){celebration?.update(hero,dt,active,souvenirUnlocked);for(const g of guards){const p=g.root.position;const gap=distance(hero,p);g.root.visible=gap<29||g.number===talking;if(!g.root.visible)continue;const nearby=gap<8;const desired=nearby?Math.atan2(hero.x-p.x,hero.z-p.z):g.yaw;if(active)g.root.rotation.y+=Math.atan2(Math.sin(desired-g.root.rotation.y),Math.cos(desired-g.root.rotation.y))*(1-Math.exp(-dt*5));g.root.children.forEach(c=>{if(c instanceof THREE.Sprite)c.visible=distance(hero,p)<19;});const q=plazas.guardStatus(g.number);const line=g.number===SOUVENIR_NUMBER?'Periksa 12 bintang':q.phase==='check'?'Periksa progres…':q.phase==='allow'?'Silakan masuk, '+q.name.split(' ')[0]:q.phase==='player'?'Giliran Anda':'Peserta berikutnya';g.status.visible=g.number!==talking&&distance(hero,p)<15&&(g.number===SOUVENIR_NUMBER||q.phase!=='wait');if(g.status.visible&&g.last!==line){g.last=line;drawNamePlate(g.ctx,line);g.tex.needsUpdate=true;}}updateHumanActors(scene,dt,active,camera);}
 function reset(){const fresh=initial();for(const v of fresh)Object.assign(get(v.kind),v);selected=null;}
 return {places,solids,celebrateSouvenir:()=>celebration?.celebrate(),plazaStats:plazas.stats,joinQueue:plazas.join,leaveQueue:plazas.leave,queueAhead:plazas.ahead,queueSlot:plazas.playerSlot,queueApproach:plazas.queueApproach,queueNear:plazas.queueNear,guardPoint:(number:number)=>guards.find(g=>g.number===number)?.root.position.clone()??null,near,take,update,leave,render,openDoor,entrance,advanceQueues:plazas.update,updateGuards,reset,bus:()=>get('bus'),walk:(p:Point)=>cityCanStand(p,walkSolids(p))&&!celebrationSolids().some(s=>inside(p,s,.4))&&!vehicles.some(v=>inside(p,footprint(v),.4)),drive:(v:CityVehicle,f:number,r:number,b:boolean,dt:number)=>cityDrive(v,f,r,b,dt,[...otherSolids(v.kind),...humanBodies(scene).map(p=>({x:p.x,z:p.z,w:p.radius*2,d:p.radius*2}))]),label:(kind:CityKind)=>profiles[kind].label,dispose:()=>{celebration?.dispose();plazas.dispose();disposeHumanActors(scene);signs.forEach(t=>t.dispose());}};
}
