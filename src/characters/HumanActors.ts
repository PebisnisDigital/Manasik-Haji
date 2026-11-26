import * as THREE from 'three';
import {CrowdRenderer} from './CrowdRenderer.ts';
import {DistrictLocomotion} from './Locomotion.ts';
import {graphicsTier} from '../graphicsQuality.ts';
import {PlayerRenderer} from './PlayerRenderer.ts';
import type {Wardrobe} from './playerAppearance.ts';
import {resolveFrames} from './CrowdView.ts';
import {Clip} from '../sim/States.ts';
import {HUMAN_RADIUS,type GroundPoint} from '../sim/GroundCollision.ts';

interface Actor {root:THREE.Group;renderKey:string;female:boolean;height:number;palette:number;build:number;brightness:number;cull:boolean;motion:DistrictLocomotion;x:number;z:number;ready:boolean;prayerTime:number}
interface Pool {actors:Actor[];renderers:Map<string,CrowdRenderer|PlayerRenderer>}
const pools=new WeakMap<THREE.Scene,Pool>();
type Collider=GroundPoint&{radius:number};
const groundBodies=new WeakMap<THREE.Scene,{root:THREE.Object3D;body:Collider}[]>();
const groundRadii=new WeakMap<THREE.Object3D,number>();
const registrationColors:ReadonlyArray<readonly [number,number,number]> = [[0x315e75,0xe7d7bf,0xd8ae8b],[0xb28b51,0x8a673d,0x78533c],[0x687b63,0xbcc4a0,0xefc8a6],[0x8e5460,0x78414b,0x583c2d],[0x3d465c,0xa8b9cb,0xb37f58],[0xb6a793,0xe1ceaf,0xc3936d],[0x527d76,0x25564b,0x95633f],[0x735f92,0x57416f,0xe4b995],[0xefe7d3,0xc8bb9d,0xab7956],[0x284c3f,0x4a7360,0xcd9f7b],[0xd72830,0xb51420,0xcd9f7b],[0xf18422,0x3a4d61,0xb37f58]];
const visibleFrustum=new THREE.Frustum(),clipMatrix=new THREE.Matrix4(),actorSphere=new THREE.Sphere(new THREE.Vector3(),1.2);
/** Keep gameplay roots and collision coordinates; share the existing skinned VAT renderer. */
export function humanActor(scene:THREE.Scene,robe=0xf4f1e8,female=false,height=female?1.64:1.74,playerWardrobe?:Wardrobe,appearance?:{palette:number;build:number;brightness:number;cull?:boolean;registration?:boolean}):THREE.Group {
  let pool=pools.get(scene);if(!pool){pool={actors:[],renderers:new Map()};pools.set(scene,pool);}
  const renderKey=String(female)+(playerWardrobe?':player:'+playerWardrobe:appearance?.registration?':registration':':npc');
  if(!pool.renderers.has(renderKey)){
    const quality={lod0Budget:24,lod1Budget:64,lod0Distance:12,lod1Distance:28,blobShadows:true};
    const crowd=playerWardrobe?new PlayerRenderer(1,quality,female?'female':'male',playerWardrobe):new CrowdRenderer(256,quality,{robeLength:female?.065:appearance?.registration?.45:.19,coverHead:female,pilgrimStyle:female?'female':'male',casual:appearance?.registration??false},appearance?.registration?registrationColors:undefined);
    scene.add(crowd.group);pool.renderers.set(renderKey,crowd);
  }
  const color=new THREE.Color(robe),palette=color.r<.65?9:pool.actors.length%8;
  const root=new THREE.Group();root.name='human-actor';scene.add(root);
  pool.actors.push({root,renderKey,female,height,palette:appearance?.palette??palette,build:appearance?.build??1,brightness:appearance?.brightness??1,cull:appearance?.cull??false,motion:new DistrictLocomotion(pool.actors.length*.17%1),x:0,z:0,ready:false,prayerTime:pool.actors.length*.13%1});
  if(!playerWardrobe)registerGroundBody(scene,root,HUMAN_RADIUS*buildRadius(height,appearance?.build??1));
  return root;
}
export function humanPlayer(scene:THREE.Scene,avatar:'male'|'female',wardrobe:Wardrobe='ritual'){return humanActor(scene,0xf4f1e8,avatar==='female',avatar==='female'?1.64:1.74,wardrobe);}

export function updateHumanActors(scene:THREE.Scene,dt:number,active:boolean,camera:THREE.Camera):void {
  const pool=pools.get(scene);if(!pool)return;
  for(const crowd of pool.renderers.values())crowd.beginFrame();
  camera.updateMatrixWorld();visibleFrustum.setFromProjectionMatrix(clipMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const low=graphicsTier()==='low';
  for(const a of pool.actors){
    if(!a.root.parent||!a.root.visible)continue;
    const p=a.root.position,distance=a.ready?Math.hypot(p.x-a.x,p.z-a.z):0;
    const pose=a.motion.update(Math.min(distance,.6),dt,active);a.ready=true;a.x=p.x;a.z=p.z;
    if(a.root.userData.praying){if(active)a.prayerTime=(a.prayerTime+dt*.15)%1;resolveFrames(Clip.DUA,a.prayerTime,pose);pose.frameB=pose.f0;pose.blend=0;}
    const camp=a.root.userData.campPose;if(camp){resolveFrames(camp.clip,camp.phase,pose);pose.frameB=pose.f0;pose.blend=0;}
    if(a.cull){actorSphere.center.set(p.x,p.y+.85,p.z);if(!visibleFrustum.intersectsSphere(actorSphere))continue;}
    const d=Math.hypot(p.x-camera.position.x,p.z-camera.position.z),lod=d<(low?9:14)?0:d<32?1:2;
    pool.renderers.get(a.renderKey)!.submit(lod,p.x,p.y,p.z,a.root.rotation.y,a.height,a.build,pose.f0,pose.f1,pose.frac,pose.frameB,pose.blend,a.palette,a.brightness);
  }
  for(const crowd of pool.renderers.values())crowd.endFrame();
}

export function disposeHumanActors(scene:THREE.Scene):void {
  const pool=pools.get(scene);if(!pool)return;
  for(const crowd of pool.renderers.values()){scene.remove(crowd.group);crowd.dispose();}
  pools.delete(scene);
  groundBodies.delete(scene);
}

function buildRadius(height:number,build:number){return build*Math.min(1,height/1.6);}

/** Hand-built NPCs and animated crowd roots share the same ground collision. */
export function registerGroundBody(scene:THREE.Scene,root:THREE.Object3D,radius=HUMAN_RADIUS,position=root.position){
 let list=groundBodies.get(scene);
 if(!list){list=[];groundBodies.set(scene,list);}
 groundRadii.set(root,radius);
 list.push({root,body:{get x(){return position.x;},get z(){return position.z;},radius}});
}

export function groundBodyRadius(actor:THREE.Object3D){return groundRadii.get(actor)??HUMAN_RADIUS;}

export function humanBodies(scene:THREE.Scene,except?:THREE.Object3D):Collider[]{
 return (groundBodies.get(scene)??[]).filter(({root})=>root!==except&&root.parent&&root.visible&&root.userData.noCollision!==true).map(({body})=>body);
}
