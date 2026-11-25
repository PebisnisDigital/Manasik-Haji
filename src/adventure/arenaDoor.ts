import {SOUVENIR_NUMBER} from './citySouvenir.ts';
import * as THREE from 'three';
import {districtReturnUrl,districtVisit} from './districtReturn.ts';
export const QUDUM_ENTRY=[13,25] as const;
export function cityArenaLevel(){return districtReturnUrl()?districtVisit():null;}
export function cityArenaHref(level:number,original:string){return level===2?'./index.html?play=miqat&program=hajj&campaign=hajj&chapter=miqat&arrival=1':level===3?'./sai-adventure.html?approach=complete':original;}
let exitRequest:(()=>void)|null=null;
export function requestArenaExit(){if(exitRequest){exitRequest();return true;}return false;}
export function registerArenaExit(fn:()=>void){exitRequest=fn;return ()=>{if(exitRequest===fn)exitRequest=null;};}
export function createArenaDoor(scene:THREE.Scene,x:number,z:number,yaw:number,level:number){
 const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=yaw;scene.add(group);
 const stone=new THREE.MeshStandardMaterial({color:0xd7c9a4,roughness:.65}),gold=new THREE.MeshStandardMaterial({color:0xc8a45e,metalness:.3,roughness:.5}),green=new THREE.MeshStandardMaterial({color:0x245747,emissive:0x173d32,emissiveIntensity:.25});
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 for(const x of [-1.85,1.85]){box(.42,3.4,.48,x,1.7,0,stone);box(.56,.18,.58,x,3.34,0,gold);}
 box(4.1,.43,.55,0,3.65,0,stone);box(3.8,.12,.56,0,3.41,0,gold);
 const c=document.createElement('canvas');c.width=640;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#173e32';ctx.fillRect(0,0,640,128);ctx.strokeStyle='#d8b774';ctx.lineWidth=5;ctx.strokeRect(4,4,632,120);ctx.fillStyle='#fff0ce';ctx.font='bold 42px system-ui';ctx.textAlign='center';ctx.fillText(level===SOUVENIR_NUMBER?'PINTU OLEH-OLEH':'PINTU GEDUNG '+String(level).padStart(2,'0'),320,57,610);ctx.font='26px system-ui';ctx.fillText('MASUK / KELUAR',320,99);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.9,.78),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));sign.position.set(0,3.07,.30);group.add(sign);
 const left=box(1.6,2.65,.12,-2.55,1.325,0,green),right=box(1.6,2.65,.12,2.55,1.325,0,green);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.74,.86,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x59e688,side:THREE.DoubleSide}));ring.position.y=.035;group.add(ring);ring.visible=false;
 return {target:{x,z},highlight(){ring.visible=true;},open(){left.position.x=-2.55;right.position.x=2.55;},dispose(){group.removeFromParent();group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();if(o.material instanceof THREE.Material)o.material.dispose();}});tex.dispose();}};
}
export function exitButton(go:()=>void){const b=document.createElement('button');b.type='button';b.className='arenaExitAction';b.style.cssText='position:fixed;bottom:76px;left:50%;transform:translateX(-50%);z-index:40;background:#f0d28b;color:#173d30;border:1px solid #fff1c5;border-radius:12px;padding:12px 20px;font:800 14px system-ui;box-shadow:0 4px 16px #0005;min-height:44px';b.textContent='Kembali ke pintu masuk';b.onclick=go;document.body.append(b);return b;}
