import * as THREE from 'three';
import {createGrandOffice} from '../registrationHall.ts';
import {createLandingShop} from '../buburMarket.ts';
import {createAlfamartStore,alfamartSolids} from '../alfamartStore.ts';
import {GATE_OFFICE,GATE_VIDEOTRON} from '../gateVideotronModel.ts';
import type {Rect,Point} from './districtModel.ts';

// The original landing plaza remains unchanged. These are independent district instances.
export const DISTRICT_HQ={x:8,z:-34,w:29.6,d:7.2,height:23,scale:1.25} as const;
export const DISTRICT_SHOPS=[
 {name:'KOKOSALAMA',x:-80,z:113,sourceX:-26,sourceZ:-6.4,w:8.7,d:7.1,height:4.3},
 {name:'INDOMARET',x:-69,z:113,sourceX:-16.5,sourceZ:-6.4,w:8.7,d:7.1,height:4.3},
 {name:'Alfamart',x:-58,z:113,sourceX:16.5,sourceZ:-6.9,w:8.9,d:7.9,height:3.8},
] as const;
export const DISTRICT_LANDMARKS=[DISTRICT_HQ,...DISTRICT_SHOPS];
const hqOffset=DISTRICT_HQ.z-GATE_OFFICE.z*DISTRICT_HQ.scale;
export const DISTRICT_VIDEO_PLACEMENT={
 x:DISTRICT_HQ.x+GATE_VIDEOTRON.x*DISTRICT_HQ.scale,y:GATE_VIDEOTRON.y*DISTRICT_HQ.scale,
 z:hqOffset+GATE_VIDEOTRON.z*DISTRICT_HQ.scale,width:GATE_VIDEOTRON.width*DISTRICT_HQ.scale,
 height:GATE_VIDEOTRON.height*DISTRICT_HQ.scale,nearby:60,
};
type Shop=typeof DISTRICT_SHOPS[number];
function worldRect(shop:Shop,x:number,z:number,w:number,d:number):Rect{return {x:shop.x-(x-shop.sourceX),z:shop.z-(z-shop.sourceZ),w,d};}
function smallShopSolids(shop:Shop){
 const x=shop.sourceX;
 return [worldRect(shop,x,-9.6,8.5,.2),...[-1,1].flatMap(side=>[
 worldRect(shop,x+side*4.15,-6.4,.22,6.4),worldRect(shop,x+side*2.55,-3.1,3.1,.17),
 worldRect(shop,x+side*1.01,-3.02,.09,.17),worldRect(shop,x+side*2.55,-4.35,2.6,.72)])];
}
export function landmarkSolids():Rect[]{return [DISTRICT_HQ,...DISTRICT_SHOPS.flatMap(shop=>shop.name==='Alfamart'?alfamartSolids.map(b=>worldRect(shop,(b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2,b.max.x-b.min.x,b.max.z-b.min.z)):smallShopSolids(shop))];}
export function landmarkCameraBoxes(){return landmarkSolids().map(b=>new THREE.Box3(new THREE.Vector3(b.x-b.w/2,0,b.z-b.d/2),new THREE.Vector3(b.x+b.w/2,b===DISTRICT_HQ?DISTRICT_HQ.height:4.1,b.z+b.d/2)));}
export function createDistrictLandmarks(scene:THREE.Scene){
 const root=new THREE.Group();root.name='district-landing-landmarks';scene.add(root);
 const office=new THREE.Group();office.name='district-hajji-headquarters';office.position.set(DISTRICT_HQ.x,0,hqOffset);office.scale.setScalar(DISTRICT_HQ.scale);root.add(office);
 createGrandOffice(office);
 const cream=new THREE.MeshStandardMaterial({color:0xf2e9d9,roughness:.75}),gold=new THREE.MeshStandardMaterial({color:0xd6b46b,roughness:.5}),dark=new THREE.MeshStandardMaterial({color:0x34443d,roughness:.55});
 function block(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 // Replicate the lower arcade without adding another registration queue to the paid district.
 block(office,18,3.7,4.5,0,1.85,GATE_OFFICE.z,cream);
 block(office,18,.2,.74,0,3.75,-6.3,cream);block(office,18,.13,.7,0,3.49,-6.24,gold);
 for(const x of [-7.5,-4.5,-1.5,1.5,4.5,7.5]){block(office,.43,3.3,.5,x,1.65,-5.85,cream);block(office,.65,.22,.68,x,3.13,-5.85,gold);block(office,.68,.20,.69,x,.11,-5.85,cream);}
 for(const x of [-6,-3,0,3,6]){const arch=new THREE.Mesh(new THREE.TorusGeometry(1.24,.15,10,32,Math.PI),cream);arch.position.set(x,1.95,-6.02);office.add(arch);block(office,2.53,1.9,.08,x,.97,-6.10,dark);const inner=new THREE.Mesh(new THREE.CircleGeometry(1.22,32,0,Math.PI),dark);inner.position.set(x,1.95,-6.09);office.add(inner);}
 let alfamart:ReturnType<typeof createAlfamartStore>|null=null;
 let alfamartPlacement:THREE.Group|null=null;
 for(const shop of DISTRICT_SHOPS){
  const group=new THREE.Group();group.name='district-'+shop.name.toLowerCase();group.rotation.y=Math.PI;group.position.set(shop.x+shop.sourceX,0,shop.z+shop.sourceZ);root.add(group);
  if(shop.name==='Alfamart'){alfamart=createAlfamartStore(group,()=>{});alfamartPlacement=group;}
  else createLandingShop(group,shop.name);
 }
 const local=new THREE.Vector3();
 function update(hero:Point,dt:number){if(alfamart&&alfamartPlacement){local.set(hero.x,0,hero.z);alfamartPlacement.worldToLocal(local);alfamart.update(dt,local,[]);}}
 return {solids:landmarkSolids(),update,root};
}
