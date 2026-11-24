import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {SALON_CLIENTS} from '../adventure/tahallulSalonLife.ts';
export const SALON_SOLIDS:readonly (readonly [number,number,number,number])[]=[
 [8.4,-5.7,9.6,-4.3],[8.4,4.3,9.6,5.7],
 [5.7,1.3,6.1,8.8],[16.9,1.3,17.3,8.8],[5.7,1.3,17.3,1.7],
 [5.7,8.5,8,8.9],[10,8.5,17.3,8.9],
 ...SALON_CLIENTS.map(p=>[p.x-.7,p.z-.7,p.x+.7,p.z+.7] as const),
] as const;
export function salonWalkable(x:number,z:number){return !SALON_SOLIDS.some(([x0,z0,x1,z1])=>x>x0-.18&&x<x1+.18&&z>z0-.18&&z<z1+.18);}
export function buildTahallulSalon(){
 const group=new THREE.Group();group.name='tahallul-barber-chairs-and-private-room';
 const materials=new Map<number,THREE.MeshStandardMaterial>();
 const mat=(color:number)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.75}));return materials.get(color)!;};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);group.add(m);return m;};
 const label=(text:string,x:number,y:number,z:number,w=5)=>{const c=document.createElement('canvas');c.width=768;c.height=192;const g=c.getContext('2d')!;g.fillStyle='#224b3e';g.fillRect(0,0,768,192);g.fillStyle='#f9de9d';g.textAlign='center';g.textBaseline='middle';g.font='bold 44px system-ui';g.fillText(text,384,96,740);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));m.position.set(x,y,z);group.add(m);};
 const chair=(x:number,z:number)=>{box(x,.12,z,.75,.22,.75,0x9ca7a4);box(x,.3,z,.15,.4,.15,0xd5d9d7);box(x,.46,z,.65,.18,.65,0x30554b);box(x,.85,z-.31,.65,.8,.12,0x30554b);
  for(const side of [-.4,.4]){box(x+side,.72,z,.09,.12,.6,0xb8c7c1);box(x+side,.59,z-.1,.055,.3,.055,0xa7b3ae);}box(x,.12,z+.55,.55,.07,.22,0xb8c7c1);};
 for(const z of [-5,5]){
  chair(9,z);
  box(10.8,.7,z-1,.7,1.4,.55,0xd5bd91);box(10.8,1.45,z-1,.85,.1,.65,0xeee4d4);box(10.8,1.58,z-1,.12,.2,.12,0x3a6958);
  if(z<0){box(9,1.5,z-2.1,5.8,3,.3,0xd3c5af);box(9,1.6,z-1.92,1.3,1.8,.04,0x9eafb2);label('TAHALLUL · LAKI-LAKI',9,3.5,z-2,6);}else label('PEREMPUAN · RUANG TERTUTUP',11.5,3,8.85,9);
 }
 SALON_CLIENTS.forEach(p=>chair(p.x,p.z));
 for(const [x0,z0,x1,z1] of SALON_SOLIDS.slice(2,7))box((x0+x1)/2,1.25,(z0+z1)/2,x1-x0,2.5,z1-z0,0x6c796d);
 box(-2,3.8,-9.5,16,.25,13,0xe0d1b2);for(const x of [-9.5,5.5])for(const z of [-15,-3.5])box(x,1.85,z,.22,3.7,.22,0xc3aa76);
 label('TEMPAT TAHALLUL · PELAYANAN JEMAAH',-2,3.45,-3.4,13);
 for(const z of [-12,-8]){box(-13,.43,z,1.1,.18,2.8,0x9f8965);box(-13.45,.9,z,.15,.9,2.8,0xc3aa76);}
 box(9,2.6,8.7,2.1,.25,.5,0xc3aa76);label('MASUK',9,2.6,8.99,1.7);
 // Share a few static material batches for the chairs, canopy and privacy walls.
 group.updateMatrixWorld(true);const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();const old:THREE.Mesh[]=[];
 group.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material)!.push(g);old.push(o);}});
 old.forEach(o=>{group.remove(o);o.geometry.dispose();});for(const [material,parts] of batches){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(geometry)group.add(new THREE.Mesh(geometry,material));}
 return group;
}
