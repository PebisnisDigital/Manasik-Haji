import * as THREE from 'three';
import {humanActor} from './characters/HumanActors.ts';

type LaneNPC={root:THREE.Group;label:THREE.Sprite;canvas:HTMLCanvasElement;nameIndex:number;target:THREE.Vector3};
type Lane={side:number;female:boolean;queue:LaneNPC[];spare:LaneNPC|null;outgoing:LaneNPC|null;exitStep:number;service:number;pen:THREE.Group;clock:number;nextName:number;names:readonly string[]};
const namesMale=['Ahmad','Rizky','Hasan','Bilal','Yusuf','Umar','Ismail','Ibrahim','Faisal','Omar','Farid','Musa','Salman','Zaid','Abdullah','Hamza'];
const namesFemale=['Aisyah','Fatimah','Nur','Maryam','Khadijah','Zahra','Siti','Amina','Hana','Safiya','Leila','Zainab','Rania','Nadia','Halima','Sumayyah'];
const material=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.72});
const green=material(0x194c3c),gold=material(0xc6a260),wood=material(0x815f40),cream=material(0xe7dac0),paper=material(0xfff8e9),ink=material(0x243c48);
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function sphere(parent:THREE.Object3D,r:number,x:number,y:number,z:number,m:THREE.Material){
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function sign(parent:THREE.Object3D,heading:string,sub:string,x:number,y:number,z:number,w:number,h:number){
 const c=document.createElement('canvas');c.width=768;c.height=220;const g=c.getContext('2d')!;
 g.fillStyle='#194b3c';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#d8ba78';g.lineWidth=8;g.strokeRect(9,9,750,202);g.textAlign='center';g.fillStyle='#f9e1a7';g.font='bold 57px sans-serif';g.fillText(heading,384,92,715);g.font='32px sans-serif';g.fillStyle='#eef3e6';g.fillText(sub,384,163,715);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;box(parent,w,h,.045,x,y,z,new THREE.MeshBasicMaterial({map:tex}));
}
function post(scene:THREE.Scene,x:number,z:number){
 const foot=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.08,12),green);foot.position.set(x,.04,z);scene.add(foot);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.74,12),gold);pole.position.set(x,.43,z);scene.add(pole);sphere(scene,.052,x,.83,z,gold);
}
function rope(scene:THREE.Scene,x:number,a:number,b:number){
 const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,.74,a),new THREE.Vector3(x,.51,(a+b)/2),new THREE.Vector3(x,.74,b));
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.018,5,false),green);scene.add(mesh);
}
function label(root:THREE.Group,height:number):{label:THREE.Sprite;canvas:HTMLCanvasElement}{
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false}));sprite.position.y=height+.24;sprite.scale.set(.92,.23,1);root.add(sprite);return {label:sprite,canvas};
}
function rename(npc:LaneNPC,lane:Lane){
 const name=lane.names[lane.nextName++%lane.names.length];npc.nameIndex=lane.nextName;
 const c=npc.canvas,g=c.getContext('2d')!;g.clearRect(0,0,c.width,c.height);g.fillStyle='#163b30ed';g.fillRect(0,4,256,56);g.strokeStyle='#d5bb79';g.lineWidth=2;g.strokeRect(2,6,252,52);g.font='bold 30px sans-serif';g.textAlign='center';g.fillStyle='#fff4db';g.fillText(name+' · NPC',128,44,242);npc.label.material.map!.needsUpdate=true; npc.root.userData.registrationName=name;
}
function makeAdmin(scene:THREE.Scene,x:number,female:boolean){
 const admin=new THREE.Group();admin.position.set(x,0,-4.06);scene.add(admin);
 const uniform=material(female?0x427b69:0x305e55),skin=material(female?0xc99d7b:0x9c7153);
 // A seated clerk behind the counter. Forearm and pencil move over the ledger.
 box(admin,.48,.6,.32,0,1.04,0,uniform);sphere(admin,.137,0,1.49,.015,skin);
 if(female){sphere(admin,.154,0,1.49,-.05,uniform);sphere(admin,.128,0,1.49,.078,skin);box(admin,.34,.23,.18,0,1.28,.02,uniform);}
 else{sphere(admin,.141,0,1.55,-.02,green);box(admin,.26,.065,.23,0,1.58,.016,cream);}
 box(admin,.13,.12,.40,-.15,1.09,.18,uniform);sphere(admin,.064,-.15,1.09,.38,skin);
 const pen=new THREE.Group();pen.position.set(.15,1.10,.22);admin.add(pen);box(pen,.12,.11,.34,0,0,.10,uniform);sphere(pen,.064,0,0,.28,skin);const pencil=box(pen,.025,.025,.20,0,.018,.36,gold);pencil.rotation.x=-.36;
 return pen;
}
const slot=(lane:Lane,i:number)=>new THREE.Vector3(lane.side*(4.15+(i%2?.075:0)),0,-2.77+i*.77);
const entrance=(side:number)=>new THREE.Vector3(side*5.65,0,5.85);
function createLane(scene:THREE.Scene,side:number,female:boolean):Lane{
 const x=side*4.15;
 // Open-front booth, service counter, ledger, register monitor and queue rails.
 box(scene,1.72,.99,.58,x,.5,-3.53,green);box(scene,1.84,.085,.75,x,1.035,-3.53,wood);
 box(scene,1.48,.12,.08,x,.24,-3.21,gold);
 box(scene,.09,2.65,.09,x-.84,1.33,-3.95,green);box(scene,.09,2.65,.09,x+.84,1.33,-3.95,green);
 box(scene,1.92,.11,1.35,x,2.69,-3.56,green);box(scene,1.98,.07,1.43,x,2.75,-3.56,gold);
 sign(scene,female?'LOKET PEREMPUAN':'LOKET LAKI-LAKI','PENDAFTARAN · SIMULASI NPC',x,2.43,-2.96,2.03,.58);
 box(scene,.30,.018,.23,x+.15,1.089,-3.52,paper);for(let i=0;i<4;i++)box(scene,.22,.003,.008,x+.15,1.10,-3.59+i*.038,ink);
 const screen=box(scene,.32,.22,.045,x-.42,1.26,-3.68,ink);screen.rotation.x=-.12;box(scene,.07,.12,.06,x-.42,1.13,-3.68,green);
 const pen=makeAdmin(scene,x,female);
 sign(scene,'GERBANG','KEBERANGKATAN',side*6,2.77,-5.68,2.05,.53);
 const railX=side*4.83;for(let i=0;i<5;i++){const z=-2.30+i*1.55;post(scene,railX,z);if(i)rope(scene,railX,z-1.55,z);}
 const lane:Lane={side,female,queue:[],spare:null,outgoing:null,exitStep:0,service:side<0?1.3:4.1,pen,clock:0,nextName:0,names:female?namesFemale:namesMale};
 for(let i=0;i<11;i++){
  const height=(female?1.57:1.66)+(i%4)*.055;
  const root=humanActor(scene,0xffffff,female,height,undefined,{palette:i%10,build:.87+(i%5)*.067,brightness:.94+(i%3)*.045,registration:true,cull:true});
  const tag=label(root,height),npc:LaneNPC={root,...tag,nameIndex:0,target:slot(lane,Math.min(i,9))};
  rename(npc,lane);root.position.copy(npc.target);root.rotation.y=Math.PI;root.userData.registrationNPC=true;
  if(i===10){root.visible=false;lane.spare=npc;}else lane.queue.push(npc);
 }
 return lane;
}
function advance(npc:LaneNPC,dt:number,speed:number){
 const p=npc.root.position,dx=npc.target.x-p.x,dz=npc.target.z-p.z,d=Math.hypot(dx,dz);
 if(d<.015){p.copy(npc.target);return true;}
 const distance=Math.min(d,speed*dt);p.x+=dx/d*distance;p.z+=dz/d*distance;
 const yaw=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(yaw-npc.root.rotation.y),Math.cos(yaw-npc.root.rotation.y));npc.root.rotation.y+=delta*(1-Math.exp(-dt*9));return distance===d;
}
export function createRegistrationHall(scene:THREE.Scene){
 const lanes=[createLane(scene,-1,false),createLane(scene,1,true)];
 let completed=0;
 function update(dt:number){
  for(const lane of lanes){
   lane.clock+=dt;lane.pen.rotation.y=Math.sin(lane.clock*7)*.16;lane.pen.position.x=.15+Math.sin(lane.clock*5)*.025;lane.pen.position.z=.22+Math.cos(lane.clock*5)*.015;
   for(const npc of lane.queue)advance(npc,dt,1.12);
   if(lane.outgoing){
    const npc=lane.outgoing;if(advance(npc,dt,1.55)){
     if(lane.exitStep===0){lane.exitStep=1;npc.target.set(lane.side*5.9,0,-4.55);}
     else if(lane.exitStep===1){lane.exitStep=2;npc.target.set(lane.side*6,0,-7.20);}
     else{npc.root.visible=false;lane.spare=npc;lane.outgoing=null;completed++;}
    }
   }
   lane.service-=dt;
   if(lane.service<=0&&lane.spare&&!lane.outgoing&&lane.queue[0]!.root.position.distanceTo(slot(lane,0))<.08){
    const first=lane.queue.shift()!;lane.outgoing=first;lane.exitStep=0;first.target.set(lane.side*5.65,0,-2.77);
    const incoming=lane.spare;lane.spare=null;rename(incoming,lane);incoming.root.position.copy(entrance(lane.side));incoming.root.rotation.y=Math.PI;incoming.root.visible=true;lane.queue.push(incoming);
    lane.queue.forEach((npc,i)=>npc.target.copy(slot(lane,i)));
    lane.service=7.5;
   }
  }
 }
 return {update,stats:()=>({male:lanes[0]!.queue.length,female:lanes[1]!.queue.length,completed})};
}
