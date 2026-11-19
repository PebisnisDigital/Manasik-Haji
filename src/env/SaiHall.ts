import * as THREE from 'three';
export const END=42;
export const GREEN_START=7;
export const GREEN_END=16;
export const WALK_WIDTH=7.1;

export function buildSaiHall():THREE.Group {
 const group=new THREE.Group();
 const stone=new THREE.MeshStandardMaterial({color:0xe9e1d2,roughness:.65});
 const ivory=new THREE.MeshStandardMaterial({color:0xf6f1e6,roughness:.6});
 const gold=new THREE.MeshStandardMaterial({color:0xb9a574,roughness:.44,metalness:.15});
 const dark=new THREE.MeshStandardMaterial({color:0x484f49,roughness:.65});
 const green=new THREE.MeshStandardMaterial({color:0x15944d,emissive:0x20d469,emissiveIntensity:2.2});
 const white=new THREE.MeshBasicMaterial({color:0xfff9e6});
 function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material):THREE.Mesh{
   const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);group.add(o);return o;
 }
 function sign(label:string,x:number,y:number,z:number,reverse=false):void{
   const c=document.createElement('canvas');c.width=768;c.height=192;
   const ctx=c.getContext('2d')!;ctx.fillStyle='#18533f';ctx.fillRect(0,0,c.width,c.height);
   ctx.strokeStyle='#d9c68c';ctx.lineWidth=9;ctx.strokeRect(8,8,752,176);
   ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 65px sans-serif';ctx.fillText(label,384,96);
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
   const m=new THREE.Mesh(new THREE.PlaneGeometry(5.7,1.42),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));m.position.set(x,y,z);if(reverse)m.rotation.y=Math.PI;group.add(m);
 }
 box(21,.3,104,0,-.17,0,ivory);box(21,.35,104,0,8.8,0,stone);
 for(const side of [-1,1]){
   box(.35,9,104,side*10.3,4.35,0,stone);
   box(.18,.2,104,side*9.9,.14,0,gold);
   for(let z=-48;z<=48;z+=6){
     box(.75,7.8,.75,side*8.7,3.9,z,ivory);
     box(1.1,.36,1.1,side*8.7,.18,z,gold);
     box(1.1,.55,1.1,side*8.7,7.45,z,gold);
     box(2.4,.12,4.6,side*5.4,8.5,z,white);
     if(z> -46&&z<46)box(.07,4.9,4.6,side*10.08,3.9,z+2.5,dark);
   }
   box(.2,.19,GREEN_END-GREEN_START,side*8.15,3.4,-(GREEN_START+GREEN_END)/2,green);
   box(.2,.13,GREEN_END-GREEN_START,side*8.15,6.7,-(GREEN_START+GREEN_END)/2,green);
   for(const z of [-GREEN_START,-GREEN_END])box(.18,3.1,.3,side*8.12,1.65,z,green);
 }
 // Decorative planar marble joints, lane markings and endpoint lines.
 const joint=new THREE.MeshBasicMaterial({color:0xb7b6aa});
 for(let z=-51;z<=51;z+=3)box(20,.008,.024,0,.005,z,joint);
 for(let x=-9;x<=9;x+=3)box(.024,.008,102,x,.005,0,joint);
 box(.12,.012,84,0,.014,0,gold);
 for(const z of [-END,END]){
   box(15,.018,.34,0,.023,z,green);
   const back=z>0?1:-1;
   box(21,8.6,.4,0,4.3,back*51,stone);
   box(12,.6,3,0,.3,back*48.7,stone);
   const rockMat=new THREE.MeshStandardMaterial({color:0x978674,roughness:1});
   for(let i=0;i<10;i++){
     const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.95+(i%3)*.3,0),rockMat);
     rock.scale.set(1.2,.55+(i%4)*.17,1);rock.rotation.set(i*.47,i*.91,i*.11);
     rock.position.set((i-4.5)*1.03,.75+(i%3)*.19,back*(48.3+(i%2)*.8));group.add(rock);
   }
   box(12,.1,.12,0,1.25,back*46.9,gold);
   sign(z>0?'SAFA  •  الصفا':'MARWAH  •  المروة',0,5.4,back*47,z>0);
 }
 sign('SAFA ↑   •   MARWAH ↓',0,6.8,0,true);
 sign('MARWAH ↑   •   SAFA ↓',0,6.8,0);
 group.add(new THREE.HemisphereLight(0xffffff,0xd0c5ac,2.2));
 const sun=new THREE.DirectionalLight(0xfff5df,1.9);sun.position.set(3,8,6);group.add(sun);
 return group;
}
