import * as THREE from 'three';
import {GIFTS,type GiftId} from './souvenirModel.ts';
import type {Obstacle} from './coreWalk.ts';
export function buildSouvenirWorld(scene:THREE.Scene){
 const root=new THREE.Group();scene.add(root);root.name='ruang-oleh-oleh';const pickable:THREE.Mesh[]=[],obstacles:Obstacle[]=[],discs:THREE.Group[]=[];
 const mat=(color:number,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:metalness?.35:.8,metalness});
 const marble=mat(0xe8dfcc),green=mat(0x181818),gold=mat(0xd6b46b,.65),dark=mat(0xc8bfae),cream=mat(0xfff2d8),wood=mat(0x302820),silver=mat(0xc8e1dc,.7),wall=mat(0x202020),foliage=mat(0x4d6c46);
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.receiveShadow=true;root.add(mesh);return mesh;}
 function label(text:string,x:number,y:number,z:number,w=3.8,id?:GiftId){const c=document.createElement('canvas');c.width=1024;c.height=240;const g=c.getContext('2d')!;g.fillStyle='#164638';g.fillRect(0,0,1024,240);g.strokeStyle='#cfaf65';g.lineWidth=8;g.strokeRect(5,5,1014,230);g.fillStyle='#fff0c5';g.font='bold 53px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,120,940);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w*240/1024),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));mesh.position.set(x,y,z);if(id){mesh.userData.gift=id;pickable.push(mesh);}root.add(mesh);return mesh;}
 box(23,.3,23,0,-.17,0,marble);box(23,6,.4,0,3,-9.6,wall);box(.4,6,23,-11.3,3,0,wall);box(.4,6,23,11.3,3,0,wall);box(22,.12,.12,0,5.65,-9.32,gold);for(const side of [-1,1])box(.12,.12,22,side*11.04,5.65,0,gold);
 box(6,.02,17,0,.002,.7,green);for(const x of [-2.8,2.8])box(.04,.025,17,x,.02,.7,gold);
 for(let x=-10;x<=10;x+=2)box(.018,.015,21,x,0,1,dark);for(let z=-8;z<=10;z+=2)box(22,.015,.018,0,.001,z,dark);
 for(const x of [-10.5,10.5])for(const z of [-8,0,9]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.34,.45,5.5,12),marble);c.position.set(x,2.75,z);root.add(c);box(.95,.25,.95,x,5.4,z,gold);box(.9,.2,.9,x,.1,z,gold);}
 for(const x of [-7,-3,3,7]){box(1.6,2.4,.15,x,3,-9.3,green);const diamond=box(1.05,1.05,.1,x,3,-9.15,gold);diamond.rotation.z=Math.PI/4;}
 label('OLEH-OLEH HAJI DIGITAL',0,4.9,-9.25,7.8);label('12 LEVEL · SATU PERJALANAN',0,3.9,-9.24,6.2);
 const dais=box(2.4,.16,2,0,.07,1,wood);dais.name='guide-platform';
 for(const p of GIFTS){if(p.id==='guide')continue;const x=p.x,z=p.z-1.2;box(3.3,.18,1.7,x,1,z,wood);for(const dx of [-1.35,1.35])box(.16,1,.16,x+dx,.5,z,wood);obstacles.push({x,z,w:3.3,d:1.7});label(p.title,p.x,2.9,p.z-.9,3.7,p.id);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.56,.65,28).rotateX(-Math.PI/2),gold);ring.position.set(p.x,.025,p.z);root.add(ring);
  if(p.id==='certificate'){box(2.2,1.4,.16,x,1.92,z,gold);box(2,1.2,.18,x,1.92,z+.02,cream);label('HAJI DIGITAL',x,1.95,z+.12,1.8,p.id);}
  if(p.id==='coupon'){box(1.9,.08,1,x,1.17,z,cream);label('KUPON · 30%',x,1.9,z,2.1,p.id);}
  if(p.id==='wallet'){box(1.5,.65,.7,x,1.43,z,green);box(.12,.38,.08,x,1.47,z+.38,gold);label('DOMPET',x,2,z+.4,1.9,p.id);}
  if(p.id==='motion'||p.id==='stickman'){
   const bagColor=p.id==='motion'?green:mat(0x5b6482);box(1.5,1.15,.65,x-.48,1.65,z,bagColor);const handle=new THREE.Mesh(new THREE.TorusGeometry(.33,.07,7,24),gold);handle.position.set(x-.48,2.28,z);root.add(handle);
   const cd=new THREE.Group();cd.position.set(x+.72,1.75,z+.18);const disc=new THREE.Mesh(new THREE.RingGeometry(.11,.57,40),silver);cd.add(disc);const rim=new THREE.Mesh(new THREE.RingGeometry(.49,.54,40),gold);rim.position.z=.01;cd.add(rim);root.add(cd);discs.push(cd);box(.8,.07,.8,x+.7,1.13,z,cream);
   label(p.id==='motion'?'MOTION':'STICKMAN',x-.48,1.7,z+.34,1.35,p.id);
  }
 }
 // Decorative plants stay outside the walking route.
 for(const x of [-9.8,9.8])for(const z of [-5,7]){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.43,.28,.7,14),gold);pot.position.set(x,.35,z);root.add(pot);for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.46,8,6),foliage);leaf.scale.set(1,.55,.6);leaf.position.set(x+Math.sin(i*2)*.35,1+i*.12,z+Math.cos(i*2)*.3);root.add(leaf);}}
 return {pickable,obstacles,update(now:number){discs.forEach((d,i)=>{d.rotation.y=Math.sin(now*.0004+i)*.15;});},dispose(){const materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();root.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){materials.add(m);const map=(m as THREE.MeshBasicMaterial).map;if(map)textures.add(map);}}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}};
}
