import * as THREE from 'three';
import {graphicsProfile} from '../graphicsQuality.ts';
export function mobileGraphics():boolean{return matchMedia('(pointer: coarse)').matches||(navigator.hardwareConcurrency||4)<=4;}
type Surface='marble'|'stone'|'sand'|'fabric';
/** Generated, license-free repeatable material detail. No external assets. */
export function surfaceDetail(material:THREE.MeshStandardMaterial,kind:Surface,repeatX=1,repeatY=1):void{
 const size=graphicsProfile().texture,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');if(!g)return;
 let state=8047;const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const image=g.createImageData(size,size);const px=image.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size*Math.PI*2,v=y/size*Math.PI*2;const rough=rnd()-.5;
 const waves=Math.sin(u*3+Math.sin(v*2)*1.8)*Math.sin(v*3+Math.cos(u*2));const veins=Math.pow(Math.abs(Math.sin(u*2+Math.sin(v)*1.3+Math.sin(v*3)*.27)),17);
 let n=kind==='marble'?243-13*veins+rough*5:kind==='stone'?225+waves*9+rough*14:kind==='sand'?222+waves*10+rough*24:235+Math.sin(u*64)*3+Math.sin(v*64)*3+rough*5;
 const i=(y*size+x)*4;n=Math.max(0,Math.min(255,n));px[i]=px[i+1]=px[i+2]=n;px[i+3]=255;}
 g.putImageData(image,0,0);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.anisotropy=graphicsProfile().anisotropy;material.map=t;
}
export function staticShadows(renderer:THREE.WebGLRenderer,sun:THREE.DirectionalLight,extent:number):void{
 const resolution=graphicsProfile().shadows;if(!resolution){renderer.shadowMap.enabled=false;sun.castShadow=false;return;}renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 sun.castShadow=true;const c=sun.shadow.camera;c.left=c.bottom=-extent;c.right=c.top=extent;c.near=.5;c.far=150;c.updateProjectionMatrix();sun.shadow.mapSize.set(resolution,resolution);sun.shadow.normalBias=.055;sun.shadow.bias=-.00035;
}
export function disposeSurface(mat:THREE.Material):void{if(mat instanceof THREE.MeshStandardMaterial||mat instanceof THREE.MeshBasicMaterial)mat.map?.dispose();}
