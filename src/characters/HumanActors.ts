import * as THREE from 'three';
import {CrowdRenderer} from './CrowdRenderer.ts';
import {DistrictLocomotion} from './Locomotion.ts';
import {graphicsTier} from '../graphicsQuality.ts';
import {PlayerRenderer} from './PlayerRenderer.ts';
import type {Wardrobe} from './playerAppearance.ts';
import {resolveFrames} from './CrowdView.ts';
import {Clip} from '../sim/States.ts';

interface Actor {chibi?:Chibi;chibiGuide?:boolean;root:THREE.Group;renderKey:string;female:boolean;height:number;palette:number;build:number;brightness:number;cull:boolean;motion:DistrictLocomotion;x:number;z:number;ready:boolean;prayerTime:number}
interface Pool {actors:Actor[];renderers:Map<string,CrowdRenderer|PlayerRenderer>}
const pools=new WeakMap<THREE.Scene,Pool>();
const registrationColors:ReadonlyArray<readonly [number,number,number]> = [[0x315e75,0xe7d7bf,0xd8ae8b],[0xb28b51,0x8a673d,0x78533c],[0x687b63,0xbcc4a0,0xefc8a6],[0x8e5460,0x78414b,0x583c2d],[0x3d465c,0xa8b9cb,0xb37f58],[0xb6a793,0xe1ceaf,0xc3936d],[0x527d76,0x25564b,0x95633f],[0x735f92,0x57416f,0xe4b995],[0xefe7d3,0xc8bb9d,0xab7956],[0x284c3f,0x4a7360,0xcd9f7b]];

/** Lobby-only preview: handmade runtime geometry; no image/model asset needed. */
const chibiSphere=new THREE.SphereGeometry(1,16,12);
const chibiDress=new THREE.CylinderGeometry(.69,1,1,16);
const chibiMats=new Map<number,THREE.MeshStandardMaterial>();
function chibiMaterial(color:number){
 let m=chibiMats.get(color);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.78});chibiMats.set(color,m);}return m;
}
type Chibi={body:THREE.Group;arms:THREE.Group[];legs:THREE.Group[];head:THREE.Group;phase:number};
function chibiPart(parent:THREE.Object3D,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,geo:THREE.BufferGeometry=chibiSphere){
 const m=new THREE.Mesh(geo,chibiMaterial(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
}
function createChibi(root:THREE.Group,female:boolean,height:number,robe:number,palette:number,guide:boolean):Chibi{
 const colors=registrationColors[palette%registrationColors.length]!;
 const cloth=guide?robe:colors[0],accent=guide?(female?0xc7ad70:0xf5edda):colors[1],skin=colors[2],dark=0x29231f;
 const body=new THREE.Group();body.scale.setScalar(height);root.add(body);
 const legs:THREE.Group[]=[],arms:THREE.Group[]=[];
 for(const sign of [-1,1]){
  const leg=new THREE.Group();leg.position.set(sign*.072,.445,0);body.add(leg);legs.push(leg);
  chibiPart(leg,0x44474a,0,-.197,0,.059,.205,.064);
  chibiPart(leg,0x42382c,0,-.410,.037,.072,.035,.105);
 }
 chibiPart(body,cloth,0,.552,0,.145,.315,.096,chibiDress);
 chibiPart(body,cloth,0,.678,0,.142,.105,.095);
 if(female){chibiPart(body,cloth,0,.414,0,.158,.69,.104,chibiDress);chibiPart(body,accent,0,.744,.023,.109,.096,.09);}
 else {chibiPart(body,accent,0,.652,.087,.072,.105,.018);}
 for(const sign of [-1,1]){
  const arm=new THREE.Group();arm.position.set(sign*.136,.705,0);body.add(arm);arms.push(arm);arm.rotation.z=sign*.09;
  chibiPart(arm,cloth,0,-.135,0,.045,.151,.047);chibiPart(arm,skin,0,-.304,.006,.041,.053,.039);
 }
 const head=new THREE.Group();head.position.set(0,.881,0);head.scale.setScalar(.48);body.add(head);
 chibiPart(body,skin,0,.793,0,.048,.055,.049);
 if(female){
  chibiPart(head,accent,0,.012,-.019,.235,.244,.184);
  chibiPart(head,accent,0,-.143,-.018,.19,.13,.126);
  chibiPart(head,skin,0,.005,.094,.179,.18,.126);
 }else{
  chibiPart(head,skin,0,0,0,.207,.209,.18);
  for(const sign of [-1,1])chibiPart(head,skin,sign*.20,-.02,0,.042,.058,.045);
  chibiPart(head,guide?0xf6eee0:dark,0,.145,-.014,.204,.10,.173);
  if(guide){chibiPart(head,0x634e3b,0,-.128,.124,.133,.061,.063);}
 }
 const front=female?.190:.148;
 for(const sign of [-1,1]){
  chibiPart(head,0xfffaf1,sign*.078,.026,front,.044,.046,.023);
  chibiPart(head,0x39271e,sign*.078,.025,front+.019,.028,.033,.014);
  chibiPart(head,0xffffff,sign*.078-.009,.041,front+.033,.010,.011,.007);
  const brow=chibiPart(head,dark,sign*.078,.105,front-.012,.047,.012,.013);brow.rotation.z=sign*-.09;
  chibiPart(head,0xd9927c,sign*.128,-.041,front-.006,.031,.015,.008);
 }
 chibiPart(head,skin,0,-.024,front+.017,.036,.033,.033);
 chibiPart(head,0x754638,0,-.079,front+.007,.046,.013,.012);
 return {body,arms,legs,head,phase:palette*.83};
}
function animateChibi(c:Chibi,dt:number,distance:number,active:boolean,guide:boolean){
 if(!active)return;
 const speed=Math.min(1,distance/Math.max(dt,.001)/1.5);c.phase+=dt*(speed>.08?8:2.2);
 const step=Math.sin(c.phase)*.42*speed;
 c.body.position.y=Math.abs(Math.sin(c.phase))*.012*speed;
 c.legs[0]!.rotation.x=step;c.legs[1]!.rotation.x=-step;
 c.arms[0]!.rotation.x=-step*.7;c.arms[1]!.rotation.x=step*.7;c.arms[1]!.rotation.z=.09;
 c.head.rotation.y=Math.sin(c.phase*.28)*.065;
 if(guide&&speed<.08){c.arms[1]!.rotation.z=.85+Math.sin(c.phase*1.8)*.32;c.arms[1]!.rotation.x=-.70;}
}

const visibleFrustum=new THREE.Frustum(),clipMatrix=new THREE.Matrix4(),actorSphere=new THREE.Sphere(new THREE.Vector3(),1.2);
/** Keep gameplay roots and collision coordinates; share the existing skinned VAT renderer. */
export function humanActor(scene:THREE.Scene,robe=0xf4f1e8,female=false,height=female?1.64:1.74,playerWardrobe?:Wardrobe,appearance?:{palette:number;build:number;brightness:number;cull?:boolean;registration?:boolean}):THREE.Group {
  let pool=pools.get(scene);if(!pool){pool={actors:[],renderers:new Map()};pools.set(scene,pool);}
  const renderKey=String(female)+(playerWardrobe?':player:'+playerWardrobe:appearance?.registration?':registration':':npc');
  const chibiEnabled=Boolean(appearance?.registration&&!playerWardrobe);
  if(!chibiEnabled&&!pool.renderers.has(renderKey)){
    const quality={lod0Budget:24,lod1Budget:64,lod0Distance:12,lod1Distance:28,blobShadows:true};
    const crowd=playerWardrobe?new PlayerRenderer(1,quality,female?'female':'male',playerWardrobe):new CrowdRenderer(256,quality,{robeLength:female?.065:appearance?.registration?.45:.19,coverHead:female,pilgrimStyle:female?'female':'male',casual:appearance?.registration??false},appearance?.registration?registrationColors:undefined);
    scene.add(crowd.group);pool.renderers.set(renderKey,crowd);
  }
  const color=new THREE.Color(robe),palette=color.r<.65?9:pool.actors.length%8;
  const root=new THREE.Group();root.name='human-actor';scene.add(root);
  const chibiGuide=chibiEnabled&&!appearance?.cull;
  const chibi=chibiEnabled?createChibi(root,female,height,robe,appearance?.palette??palette,chibiGuide):undefined;
  pool.actors.push({root,chibi,chibiGuide,renderKey,female,height,palette:appearance?.palette??palette,build:appearance?.build??1,brightness:appearance?.brightness??1,cull:appearance?.cull??false,motion:new DistrictLocomotion(pool.actors.length*.17%1),x:0,z:0,ready:false,prayerTime:pool.actors.length*.13%1});
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
    if(a.chibi){animateChibi(a.chibi,dt,distance,active,Boolean(a.chibiGuide));continue;}
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
}

/** NPC ground bodies use their actual gameplay roots, not the render meshes or camera culling. */
export function humanBodies(scene:THREE.Scene){
 return (pools.get(scene)?.actors??[]).filter(a=>a.root.parent&&a.root.visible&&!a.renderKey.includes(':player:')&&a.root.userData.noCollision!==true).map(a=>({x:a.root.position.x,z:a.root.position.z,radius:.32*a.build}));
}
