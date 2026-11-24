import {CLOCK_POSITION} from './haramLandmarks.ts';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {humanActor} from './characters/HumanActors.ts';
import {graphicsTier} from './graphicsQuality.ts';
import {createTawafPilgrims,pilgrimPosition,stepPilgrim} from './tawafAtmosphereModel.ts';

export const TAWAF_PANORAMA=[CLOCK_POSITION.x,130.2,CLOCK_POSITION.z] as const;
/** Original stylised skyline, not a surveyed replica. All ornament is geometric. */
export function mountTawafAtmosphere(scene:THREE.Scene,host:HTMLElement){
 const root=new THREE.Group();root.name='tawaf-skyline-and-details';scene.add(root);
 const tier=graphicsTier(),people=createTawafPilgrims(tier),actors=people.map(p=>{const actor=humanActor(scene,0xf4f1e8,p.female,p.height,undefined,{...p,cull:true});actor.name='tawaf-pilgrim';const at=pilgrimPosition(p);actor.position.set(at.x,0,at.z);actor.rotation.y=at.yaw;return actor;});
 host.dataset.crowdCount=String(people.length);host.dataset.crowdOrigins='Asia, Eropa, Afrika, Arab';
 const materials=[0xc8bda3,0xdccba3,0x967b44,0x244b46,0x497678].map(color=>new THREE.MeshStandardMaterial({color,roughness:.78}));
 const batches=materials.map(()=>[] as THREE.BufferGeometry[]),textures:THREE.Texture[]=[];
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m=0){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);batches[m].push(g);}
 function cone(radius:number,height:number,x:number,y:number,z:number,m=2){const g=new THREE.ConeGeometry(radius,height,8);g.translate(x,y,z);batches[m].push(g);}
 const tower=new THREE.Group();tower.position.set(CLOCK_POSITION.x,CLOCK_POSITION.y,CLOCK_POSITION.z);tower.scale.setScalar(1.4);root.add(tower);tower.name='makkah-clock-skyline';
 box(38,9,28,0,4.5,0,0);box(25,64,21,0,39,0,0);box(20,13,19,0,77,0,1);box(20,19,20,0,93,0,3);box(22,1,21,0,103,0,2);cone(10,13,0,110,0);box(1.2,15,1.2,0,123,0,2);
 for(const x of [-10,10])box(.9,80,.9,x,57,10.65,2);
 for(const side of [-1,1]){box(20,43,22,side*28,29,0);box(16,10,18,side*28,55,0,1);cone(9,12,side*28,66,0);}
 const rows=tier==='low'?10:16;for(let row=0;row<rows;row++)for(let col=-3;col<=3;col++)box(1.4,2.1,.15,col*2.7,12+row*3.7,10.6,4);
 for(const side of [-1,1])for(let row=0;row<8;row++)for(let col=-2;col<=2;col++)box(1.4,2.2,.15,side*28+col*3,12+row*4.8,11.1,4);
 for(let i=0;i<batches.length;i++){if(!batches[i].length)continue;const merged=mergeGeometries(batches[i]);for(const g of batches[i])g.dispose();if(merged)tower.add(new THREE.Mesh(merged,materials[i]));}
 const face=document.createElement('canvas');face.width=face.height=512;const ctx=face.getContext('2d')!;ctx.fillStyle='#134c40';ctx.fillRect(0,0,512,512);ctx.translate(256,256);ctx.fillStyle='#f7edc9';ctx.beginPath();ctx.arc(0,0,228,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bb984e';ctx.lineWidth=16;ctx.stroke();ctx.fillStyle='#173e35';ctx.font='bold 45px serif';ctx.textAlign='center';ctx.textBaseline='middle';for(let n=1;n<=12;n++){const a=n*Math.PI/6;ctx.fillText(String(n),Math.sin(a)*182,-Math.cos(a)*182);}ctx.strokeStyle='#214a3e';ctx.lineWidth=14;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-99,-58);ctx.lineTo(0,0);ctx.lineTo(124,-72);ctx.stroke();ctx.fillStyle='#bb984e';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();
 const map=new THREE.CanvasTexture(face);map.colorSpace=THREE.SRGBColorSpace;textures.push(map);const clockMat=new THREE.MeshBasicMaterial({map});
 for(let side=0;side<4;side++){const clock=new THREE.Mesh(new THREE.PlaneGeometry(18.6,18.6),clockMat),angle=side*Math.PI/2;clock.position.set(Math.sin(angle)*10.12,93,Math.cos(angle)*10.12);clock.rotation.y=angle;tower.add(clock);}
 /* Crescent silhouette, simplified. */
 const crescent=new THREE.Mesh(new THREE.TorusGeometry(3.8,.64,10,48,Math.PI*1.52),materials[2]);crescent.position.set(0,135,0);crescent.rotation.z=Math.PI*.72;tower.add(crescent);
 // Small repeated details stay outside the player's walking corridor.
 const fittings=new THREE.Group();root.add(fittings);const fittingBatches=[[] as THREE.BufferGeometry[],[] as THREE.BufferGeometry[]];
 for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.cos(a)*51,z=64+Math.sin(a)*51;for(const [w,h,d,y,m]of [[.15,3.3,.15,1.65,0],[.65,.75,.65,3.4,1],[.9,.16,.9,.08,0]] as const){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);fittingBatches[m].push(g);}}
 for(let i=0;i<2;i++){const g=mergeGeometries(fittingBatches[i]);for(const item of fittingBatches[i])item.dispose();if(g)fittings.add(new THREE.Mesh(g,materials[i===0?2:1]));}
 const skyCanvas=document.createElement('canvas');skyCanvas.width=2;skyCanvas.height=256;const skyCtx=skyCanvas.getContext('2d')!,gradient=skyCtx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#4688c5');gradient.addColorStop(.55,'#9bc8e3');gradient.addColorStop(1,'#e5dfcb');skyCtx.fillStyle=gradient;skyCtx.fillRect(0,0,2,256);const skyMap=new THREE.CanvasTexture(skyCanvas);skyMap.colorSpace=THREE.SRGBColorSpace;textures.push(skyMap);const skyMat=new THREE.MeshBasicMaterial({map:skyMap,side:THREE.BackSide,depthWrite:false,fog:false});const sky=new THREE.Mesh(new THREE.SphereGeometry(440,24,12),skyMat);sky.position.z=64;sky.renderOrder=-10;root.add(sky);
 const oldFog=scene.fog;scene.fog=new THREE.Fog(0xc7ddd9,230,490);
 host.dataset.clockTower='true';
 return {tick(dt:number,player:{x:number;z:number},active:boolean){for(let i=0;i<people.length;i++){stepPilgrim(people[i],dt,player,active);const at=pilgrimPosition(people[i]);actors[i].position.set(at.x,0,at.z);actors[i].rotation.y=at.yaw;}host.dataset.crowdSampleX=actors[0].position.x.toFixed(3);host.dataset.crowdSampleZ=actors[0].position.z.toFixed(3);},dispose(){for(const actor of actors)actor.removeFromParent();scene.fog=oldFog;root.traverse(p=>{if(p instanceof THREE.Mesh)p.geometry.dispose();});for(const m of materials)m.dispose();clockMat.dispose();skyMat.dispose();for(const t of textures)t.dispose();root.removeFromParent();}};
}
