import {drawNamePlate} from '../characters/NamePlate.ts';
import {joinQueue,serveQueue,type QueueTicket} from '../queueTicket.ts';
import * as THREE from 'three';
import {humanActor} from '../characters/HumanActors.ts';
import {tenantUrl} from '../tenant.ts';
import type {Point,Rect} from './districtModel.ts';

export const QUEUE_COUNT=10,QUEUE_PERIOD=7.6;
const firstMale=['Asep','Ujang','Dadan','Dedi','Jajang','Yanto','Wawan','Agus','Budi','Eko','Slamet','Dimas','Rudi','Bayu','Hendra','Rizky','Wahyu','Tatang','Sutrisno','Rohmat'];
const firstFemale=['Euis','Neneng','Nining','Yayah','Titin','Enung','Siti','Nani','Sri','Dewi','Rina','Wati','Ratna','Wulan','Sulastri','Rahayu','Ayu','Fitri','Yuni','Nia'];
const family=['Permana','Saputra','Kusuma','Hidayat','Suryana','Pratama','Rahardja','Santoso','Wijaya','Nugraha','Wibowo','Lestari'];
export function plazaName(building:number,index:number){const female=index%2===1,first=(female?firstFemale:firstMale)[(building*3+Math.floor(index/2))%20];return first+' '+family[building-1];}
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
export function guardQueuePhase(t:number,playerReady=false){return playerReady?'player':t<1.55?'check':t<3.7?'allow':'wait';}
export function queuePose(slot:number,t:number){
 const x=-1.65-slot*.76,z=13.0;
 if(slot===0){const a=smooth((t-1.55)/2.15);return {x:x+1.1*a,z:z-3.05*a,yaw:Math.PI,visible:t<3.7};}
 if(slot===QUEUE_COUNT){const a=smooth((t-3.35)/2.05);return {x:-10.35+1.86*a,z,yaw:Math.PI/2,visible:t>=3.35};}
 const a=smooth((t-2.65)/2.55);return {x:x+.76*a,z,yaw:Math.PI/2,visible:true};
}
type Place=Point&{number:number;yaw:number;height:number};
type QueueActor={root:THREE.Group;tag:THREE.Sprite};
export function createLivePlazas(scene:THREE.Scene,places:readonly Place[]){
 const materials:THREE.Material[]=[],textures:THREE.Texture[]=[],geometries:THREE.BufferGeometry[]=[],groups:THREE.Group[]=[];
 const solids:Rect[]=[];
 const material=(color:number,glow=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.72,emissive:color,emissiveIntensity:glow});materials.push(m);return m;};
 const cream=material(0xfffaf0),gold=material(0xd6b46b,.18),light=material(0xffd88d,1.9),domeIvory=material(0xe1d0aa),glass=material(0x527a83,.20);
 const cube=new THREE.BoxGeometry(1,1,1),domeGeo=new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2);geometries.push(cube,domeGeo);
 const logo=new THREE.TextureLoader().load(tenantUrl('./pwa-icon.svg'));logo.colorSpace=THREE.SRGBColorSpace;textures.push(logo);
 const logoMaterial=new THREE.MeshBasicMaterial({map:logo,transparent:true,toneMapped:false,depthWrite:false});materials.push(logoMaterial);
 const logoGeo=new THREE.PlaneGeometry(2.65,2.65);geometries.push(logoGeo);
 const signGeo=new THREE.PlaneGeometry(1,1);geometries.push(signGeo);
 const obj=new THREE.Object3D();
 function sign(parent:THREE.Group,title:string,sub:string,x:number,y:number,z:number,w:number,h:number,background='#173d32'){
  const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d')!;ctx.fillStyle=background;ctx.fillRect(0,0,768,192);ctx.strokeStyle='#d7b776';ctx.lineWidth=5;ctx.strokeRect(5,5,758,182);ctx.fillStyle='#fff1c9';ctx.textAlign='center';ctx.font='bold 62px system-ui';ctx.fillText(title,384,86,728);ctx.font='bold 31px system-ui';ctx.fillText(sub,384,143,728);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);const m=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});materials.push(m);
  const mesh=new THREE.Mesh(signGeo,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,1);parent.add(mesh);
 }
 function tag(root:THREE.Group,name:string,height:number){const c=document.createElement('canvas');c.width=384;c.height=80;const ctx=c.getContext('2d')!;drawNamePlate(ctx,name);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);const m=new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false});materials.push(m);const s=new THREE.Sprite(m);s.position.set(0,height+.30,0);s.scale.set(1.85,.385,1);root.add(s);return s;}
 function point(p:Place,x:number,z:number):Point{return {x:p.x+Math.cos(p.yaw)*x+Math.sin(p.yaw)*z,z:p.z-Math.sin(p.yaw)*x+Math.cos(p.yaw)*z};}
 const lanes:{place:Place;actors:QueueActor[];decor:THREE.Group;clock:number;ticket:QueueTicket|null}[]=[];
 for(const p of places){
  const g=new THREE.Group();g.position.set(p.x,0,p.z);g.rotation.y=p.yaw;g.name='live-plaza-'+p.number;scene.add(g);groups.push(g);
  // Static decorations are instanced by shape and material, once per plaza.
  const batches=new Map<string,{geo:THREE.BufferGeometry;mat:THREE.Material;matrices:THREE.Matrix4[]}>();
  function shape(geo:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,rx=0,ry=0,rz=0){obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(w,h,d);obj.updateMatrix();const key=geo.uuid+m.uuid;let b=batches.get(key);if(!b){b={geo,mat:m,matrices:[]};batches.set(key,b);}b.matrices.push(obj.matrix.clone());}
  const box=(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,ry=0)=>shape(cube,m,x,y,z,w,h,d,0,ry);
  // Premium illuminated facade, roof crown, pilasters, illuminated brand.
  for(const x of [-9.5,9.5]){box(cream,x,p.height/2,10.20,.48,p.height,.48);box(light,x,p.height/2,10.48,.085,p.height-.5,.055);box(gold,x,p.height+1.1,9.2,1.02,2.2,1.02);shape(domeGeo,domeIvory,x,p.height+2.2,9.2,.86,1.3,.86);box(light,x,p.height+2.3,10.05,.15,.4,.13);}
  for(const y of [8.8,p.height-1.1]){box(gold,0,y,10.22,19.6,.18,.48);box(light,0,y+.08,10.49,19.3,.065,.06);}
  for(const x of [-6.1,-2.1,2.1,6.1]){box(glass,x,p.height-4.3,10.16,2.6,3.5,.12);box(light,x,p.height-4.3,10.26,.065,3.5,.055);}
  box(domeIvory,0,p.height+.3,0,7,.52,7);shape(domeGeo,domeIvory,0,p.height+.56,0,3.8,3.1,3.8);box(gold,0,p.height+4.0,0,.15,.9,.15);
  sign(g,'HAJJI.DIGITAL','PUSAT LATIHAN MANASIK',0,p.height-1.7,10.49,11,2.75);
  const emblem=new THREE.Mesh(logoGeo,logoMaterial);emblem.position.set(7.75,p.height-2.0,10.55);g.add(emblem);
  box(cream,-3.7,.035,13.0,12.2,.07,4.4);
  for(const z of [12.35,13.75]){for(let i=0;i<6;i++)box(gold,-9.65+i*1.48,.49,z,.08,.95,.08);box(gold,-5.95,.88,z,7.6,.045,.045);}
  sign(g,'ANTREAN PESERTA','SIMULASI',-7.6,2.25,12.0,3.4,.85);
  sign(g,'MULAI ANTREAN','MASUK ANTREAN',-9.3,1.30,14.2,2.1,.58);box(light,-9.3,.09,13,.92,.035,.92);
  // Only functional queue furniture is built; shared driveable vehicles live in missionCity.
  for(const b of batches.values()){const mesh=new THREE.InstancedMesh(b.geo,b.mat,b.matrices.length);b.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();g.add(mesh);}
  const actors:QueueActor[]=[];
  for(let i=0;i<=QUEUE_COUNT;i++){const female=i%2===1,height=female?1.57+(i%3)*.045:1.67+(i%3)*.06;const root=humanActor(scene,0xf1e7d4,female,height,undefined,{palette:(p.number*3+i)%10,build:.91+(i%4)*.06,brightness:.95+(i%3)*.025,cull:true,registration:true});root.userData.noCollision=true;const label=tag(root,plazaName(p.number,i),height);actors.push({root,tag:label});}
  lanes.push({place:p,actors,decor:g,clock:(p.number*.71)%QUEUE_PERIOD,ticket:null});
 }
 let cycles=0;
 function update(hero:Point,dt:number){
  for(const lane of lanes){const {place:p,actors}=lane;const distance=Math.hypot(hero.x-p.x,hero.z-p.z);const old=Math.floor(lane.clock/QUEUE_PERIOD);if(lane.ticket?.ahead!==0)lane.clock+=Math.max(0,Math.min(dt,.08));const cycle=Math.floor(lane.clock/QUEUE_PERIOD),t=lane.clock%QUEUE_PERIOD;cycles+=cycle-old;if(lane.ticket&&cycle>old)lane.ticket=serveQueue(lane.ticket);
   if(distance>37&&!lane.ticket){if(lane.decor.userData.nearby!==false){for(const a of actors)a.root.visible=false;lane.decor.userData.nearby=false;}continue;}lane.decor.userData.nearby=true;
   // The building crown stays visible from afar. Only people and labels use distance culling.
   for(let i=0;i<=QUEUE_COUNT;i++){const a=actors[(i+cycle)%actors.length]!,q=queuePose(i,t),offset=lane.ticket&&i>=lane.ticket.ahead ? .76 : 0,pos=point(p,q.x-offset,q.z);a.root.visible=q.visible&&(distance<28||!!lane.ticket);a.root.position.set(pos.x,.07,pos.z);a.root.rotation.y=p.yaw+q.yaw;a.tag.visible=a.root.visible&&Math.hypot(hero.x-pos.x,hero.z-pos.z)<13;}
  }
 }
 update({x:0,z:0},0);
 function join(number:number){const lane=lanes.find(l=>l.place.number===number);if(!lane||lane.ticket)return false;lane.ticket=joinQueue(QUEUE_COUNT);return true;}
 function leave(number:number){const lane=lanes.find(l=>l.place.number===number);if(lane)lane.ticket=null;}
 function playerSlot(number:number){const lane=lanes.find(l=>l.place.number===number);if(!lane)return null;const rank=lane.ticket?.ahead??QUEUE_COUNT;const advance=rank>0&&lane.ticket ? .76*smooth((lane.clock%QUEUE_PERIOD-2.65)/2.55):0;return point(lane.place,-1.65-rank*.76+advance,13);}
 function queueApproach(number:number,stage:number){const lane=lanes.find(l=>l.place.number===number);if(!lane)return null;return stage===0?point(lane.place,-9.3,16.6):stage===1?point(lane.place,-9.3,13):playerSlot(number);}
 function queueNear(hero:Point){return lanes.find(l=>{const tail=point(l.place,-9.3,13);return Math.hypot(hero.x-tail.x,hero.z-tail.z)<4.2;})?.place.number??null;}
 return {solids,update,join,leave,playerSlot,queueApproach,queueNear,guardStatus:(number:number)=>{const lane=lanes.find(l=>l.place.number===number);if(!lane)return {phase:'wait',name:''};const cycle=Math.floor(lane.clock/QUEUE_PERIOD);return {phase:guardQueuePhase(lane.clock%QUEUE_PERIOD,lane.ticket?.ahead===0),name:plazaName(number,cycle%lane.actors.length)};},ahead:(number:number)=>lanes.find(l=>l.place.number===number)?.ticket?.ahead??null,stats:()=>({buildings:lanes.length,queuePerBuilding:QUEUE_COUNT,queued:lanes.length*QUEUE_COUNT,parkedCars:0,parkedMotorcycles:0,foodStalls:0,cycles}),dispose:()=>{for(const l of lanes)for(const a of l.actors)scene.remove(a.root);groups.forEach(g=>scene.remove(g));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
