import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {surfaceDetail,disposeSurface} from './GraphicsDetail.ts';
import {graphicsTier} from '../graphicsQuality.ts';
/** Ground-floor rock remnants in a modern gallery; compressed game scale, not a survey. */
export function saiRockLayout(side:-1|1,count=26){return Array.from({length:count},(_,i)=>{const lane=i%3,x=(Math.floor(i/3)-(Math.ceil(count/3)-1)/2)*1.38;return {x,y:.35+Math.exp(-x*x/28)*(.65+lane*.28),z:side*(46.2+lane*1.28),sx:.9+(i*7%9)/12,sy:.65+(i*11%10)/10,sz:.8+(i*13%8)/12,turn:i*1.39,color:i%3};});}
export function buildSaiLandmarks(){
 const root=new THREE.Group();root.name='safa-marwah-rock-remnants';
 const mats=[0x8f8a7d,0xb0a18b,0x756e62,0xe5ddcc,0xc5ad77,0x345956].map(color=>new THREE.MeshStandardMaterial({color,roughness:.86}));for(let i=0;i<3;i++)surfaceDetail(mats[i],'stone',3,2);
 const light=new THREE.MeshBasicMaterial({color:0xeafff4}),green=new THREE.MeshBasicMaterial({color:0x48d88c});mats.push(light as unknown as THREE.MeshStandardMaterial,green as unknown as THREE.MeshStandardMaterial);
 const batch=mats.map(()=>[] as THREE.BufferGeometry[]),textures:THREE.Texture[]=[],signMats:THREE.Material[]=[];
 const add=(geometry:THREE.BufferGeometry,material:number,x:number,y:number,z:number)=>{geometry.translate(x,y,z);batch[material].push(geometry);};
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:number){add(new THREE.BoxGeometry(w,h,d),m,x,y,z);}
 for(const side of [-1,1] as const){
  box(27,12,.6,0,6,side*51.5,3);box(18,.34,7.4,0,.12,side*47.3,3);box(17,.12,6,0,.36,side*47.3,2);
  for(const p of saiRockLayout(side,graphicsTier()==='low'?26:38)){
   const g=new THREE.IcosahedronGeometry(1,1),v=g.getAttribute('position');for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),z=v.getZ(i),n=1+.11*Math.sin(x*9+y*5+z*7+p.turn);v.setXYZ(i,x*n,y*n,z*n);}g.scale(p.sx,p.sy,p.sz);g.rotateY(p.turn);g.computeVertexNormals();add(g,p.color,p.x,p.y+.65,p.z);
  }
  // A clear viewing boundary, away from the traversed endpoint at z=+/-39.
  box(17,.16,.16,0,.12,side*43.3,4);box(17,.12,.12,0,1.15,side*43.3,4);for(let i=-8;i<=8;i+=2)box(.08,1.15,.08,i,.58,side*43.3,4);
  for(const x of [-9.7,9.7]){box(1.2,11.5,1.2,x,5.75,side*47.5,3);box(1.6,.5,1.6,x,10.9,side*47.5,4);}
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#1c5545';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#d9bf7d';ctx.lineWidth=10;ctx.strokeRect(6,6,1012,244);ctx.fillStyle='#fff4da';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 74px sans-serif';ctx.fillText(side<0?'SAFA  ·  الصفا':'MARWAH  ·  المروة',512,90);ctx.font='34px sans-serif';ctx.fillText(side<0?'TITIK AWAL SA’I':'TUJUAN LINTASAN PERTAMA',512,184);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;textures.push(map);const m=new THREE.MeshBasicMaterial({map}),sign=new THREE.Mesh(new THREE.PlaneGeometry(12.5,3.12),m);sign.position.set(0,7.3,side*46.7);if(side>0)sign.rotation.y=Math.PI;root.add(sign);signMats.push(m);
 }
 for(const side of [-1,1])for(let z=-36;z<=36;z+=12){
  box(.22,5.4,8.5,side*12.05,3.2,z,3);box(.12,3.4,6,side*11.89,3.5,z,5);for(const dy of [-1.7,0,1.7])box(.13,.09,6.2,side*11.8,3.5+dy,z,4);for(const dz of [-3,0,3])box(.14,3.5,.09,side*11.8,3.5,z+dz,4);
  for(let n=0;n<4;n++)box(3.2,.07,.12,side*7.5,12.68,z+n*1.4-2.1,6);
 }
 for(let z=-40;z<=40;z+=8){const arch=new THREE.TorusGeometry(10.3,.13,6,32,Math.PI);add(arch,4,0,3.4,z);box(10,.08,3.8,0,13.05,z+4,6);}
 for(const side of [-1,1]){box(.12,.18,20,side*11.65,7.2,0,7);for(const z of [-26,26]){box(.7,1.1,1.5,side*11.4,.55,z,3);box(.78,.08,1.55,side*11.4,1.16,z,5);}}
 for(let i=0;i<batch.length;i++){if(!batch[i].length)continue;const g=mergeGeometries(batch[i]);for(const item of batch[i])item.dispose();if(g){const mesh=new THREE.Mesh(g,mats[i]);mesh.receiveShadow=true;root.add(mesh);}}
 root.userData.rockCountPerEndpoint=graphicsTier()==='low'?26:38;
 return {group:root,dispose(){root.traverse(p=>{if(p instanceof THREE.Mesh)p.geometry.dispose();});for(const mat of [...mats,...signMats]){disposeSurface(mat);mat.dispose();}for(const map of textures)map.dispose();root.removeFromParent();}};
}
