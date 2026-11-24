import {cityArenaLevel} from './adventure/arenaDoor.ts';
import {aqabahActivities} from './env/AqabahActivities.ts';
import {MUZDALIFAH_STONES} from './adventure/muzdalifahModel.ts';
import {humanActor,updateHumanActors,disposeHumanActors} from './characters/HumanActors.ts';
import {placeDetails} from './env/PlaceDetails.ts';
import * as THREE from 'three';
import {graphicsTier,graphicsProfile,createRenderBudget} from './graphicsQuality.ts';
import {patrolClear,updatePatrols,type Patrol,type Position} from './sim/TrainingCrowd.ts';
import {surfaceDetail,staticShadows,disposeSurface} from './env/GraphicsDetail.ts';
import {attachWalker,type Obstacle,type WalkOptions} from './coreWalk.ts';
import {Clip} from './sim/States.ts';
export type Site='arafah'|'muzdalifah'|'mina'|'jamarat';
export interface SiteView{focus(i:number):void;throwStone(i:number,onFinish:()=>void):void;dispose():void;near():boolean;approach():void;setGoal(x:number,z:number):void;setTime(progress:number):void;setPrayer(on:boolean):void;setMinaCamp(beat:number):void;setArafahActivity(beat:number):void;setAqabahActivity(beat:number,cuts:number,progress:number,active?:boolean):void;setMuzdalifahActivity(beat:number,stones:number,pickup:number,dawn:number):void;campCare(action:'refill'|'rest'|'hydrate'):boolean;setCampPose(pose:{clip:number;phase:number}|null):void}
export function createSite(host:HTMLElement,site:Site,walk?:WalkOptions,options:{aqabah?:boolean;exitWalk?:boolean}={}):SiteView{
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Rekonstruksi ilustratif '+site+'; geser untuk memutar kamera');host.replaceChildren(canvas);
 const profile=graphicsProfile(),tier=graphicsTier();const r=new THREE.WebGLRenderer({canvas,antialias:tier!=='low',powerPreference:'low-power'});const budget=createRenderBudget(r,{maxFps:60});r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=nightExposure();function nightExposure(){return site==='muzdalifah'?1.1:.98;}
 const night=site==='muzdalifah';const s=new THREE.Scene();s.background=new THREE.Color(night?0x18283b:0xc9d9da);s.fog=new THREE.Fog(night?0x18283b:0xc9d9da,42,130);
 s.add(new THREE.HemisphereLight(night?0xb9d5ff:0xfff5df,0xb3a68b,night?1.5:2.3));
 const sun=new THREE.DirectionalLight(night?0xa1c7ff:0xffe7bd,night?1.1:2.1);sun.position.set(-18,34,19);s.add(sun);if(walk)staticShadows(r,sun,29);
 const mat=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.9});
 const sand=mat(site==='jamarat'?0xd7d9d1:0xc8ab80),white=mat(0xf7f3e5),base=mat(0xa2a49c),rock=mat(0xa89272),green=mat(0x356f56),dark=mat(0x425747);
 surfaceDetail(sand,site==='jamarat'?'stone':'sand',28,28);surfaceDetail(white,'fabric',2,2);surfaceDetail(rock,'stone',2,2);surfaceDetail(base,'stone',3,3);
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number):THREE.Mesh{const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.receiveShadow=true;a.castShadow=y>.2;s.add(a);return a;}
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number):THREE.Mesh{return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);}
 box(115,.3,115,sand,0,-.17,0);
 const obstacles:Obstacle[]=[];
 function tent(x:number,z:number,size=1):void{obstacles.push({x,z,w:3.7*size,d:3.7*size});box(3.7*size,1.35*size,3.7*size,white,x,.68*size,z);const roof=mesh(new THREE.ConeGeometry(2.66*size,1.7*size,4),white,x,2.17*size,z);roof.rotation.y=Math.PI/4;for(const side of [-1,1]){box(3.83*size,.075,.055,base,x,1.37*size,z+side*1.89*size);box(.055,.075,3.83*size,base,x+side*1.89*size,1.37*size,z);}box(.66*size,1.2*size,.05,dark,x,.6*size,z+1.86*size);}
 function sign(label:string,x:number,y:number,z:number,width=5):void{const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d')!;a.fillStyle='#24533f';a.fillRect(0,0,512,128);a.fillStyle='#fff';a.font='bold 42px sans-serif';a.textAlign='center';a.textBaseline='middle';a.fillText(label,256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const signMesh=mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,transparent:true,depthWrite:false}),x,y,z);signMesh.userData.locationSign=true;}
 let updatePeople:(dt:number,player?:Position)=>void=()=>{};
 function people(n:number):void{
  const candidates:Patrol[]=[];const limit=Math.max(6,Math.round(n*profile.fieldDensity));
  const reserved:Position[]=site==='jamarat'?[-8,0,8].map(x=>({x,z:4.5})):[{x:0,z:site==='muzdalifah'?3.5:-3},{x:0,z:12}];
  for(let i=0;i<limit*8&&candidates.length<limit;i++){
    const x=site==='jamarat'?(Math.sin(i*2.31)*.5+.5)*26-13:(Math.sin(i*2.31)*.5+.5)*42-21,z=site==='jamarat'?6.6+(Math.cos(i*4.19)*.5+.5)*2.5:(Math.cos(i*4.19)*.5+.5)*24-9;
    if(walk&&Math.abs(x)<2.5||!patrolClear(x,z,obstacles,reserved)||candidates.some(p=>Math.hypot(p.x-x,p.z-z)<1.1))continue;
    candidates.push({x,z,homeX:x,homeZ:z,h:1.56+(i%8)*.027,yaw:i*2.39,phase:i*.13%1,moving:false,rest:site==='muzdalifah'?i%4!==0:i%5===0});
  }
  const roots=candidates.map((p,i)=>humanActor(s,0xf4f0e4,i%5===0,p.h));
  function paint(){for(let i=0;i<roots.length;i++){const p=candidates[i];roots[i].position.set(p.x,0,p.z);roots[i].rotation.y=p.yaw;}}paint();
  let seconds=0,acc=0;
  updatePeople=(dt,player)=>{if(!walk)return;acc+=dt;if(acc<(tier==='low'?.095:.055))return;const elapsed=Math.min(.1,acc);acc=0;seconds+=elapsed;updatePatrols(candidates,seconds,elapsed,player,obstacles,reserved);paint();};
 }
 const targets=[-8,0,8];let praying=false,prayerClock=0;
 if(site==='arafah'){for(let i=0;i<24;i++){const m=mesh(new THREE.DodecahedronGeometry(2.1+(i%5)*.95,0),rock,(i%8-3.5)*3.2,1.5+Math.sin(i)*.7,-29-Math.floor(i/8)*3);m.scale.set(1,1,1);m.rotation.set(i*.31,i*.37,i*.1);}for(let i=0;i<8;i++)tent(walk?[-9,-4.7,4.7,9][i%4]:(i%4-1.5)*5,5+Math.floor(i/4)*6);sign('ARAFAH • WUKUF',-10,3.5,-7);people(42);}
 if(site==='muzdalifah'){for(let i=0;i<20;i++){const x=(Math.sin(i*2.2)*.5+.5)*30-15,z=(Math.cos(i*3.1)*.5+.5)*27-13;box(1.4,.045,2.1,i%2?green:dark,x,.02,z);}for(let i=0;i<32;i++)mesh(new THREE.DodecahedronGeometry(.09+(i%3)*.025,0),rock,(i%8-3.5)*.35,.09,2+Math.floor(i/8)*.31);for(let i=0;i<5;i++){box(.13,5,.13,base,i*7-14,2.5,-9);box(.55,.2,.55,new THREE.MeshBasicMaterial({color:0xffeac1}),i*7-14,5,-9);if(i%2===0&&tier!=='low'){const lamp=new THREE.PointLight(0xffd8a2,18,14,2);lamp.position.set(i*7-14,4.7,-9);s.add(lamp);}}sign('MUZDALIFAH • MABIT',0,3.5,-7);people(28);}
 if(site==='mina'){for(let i=0;i<48;i++){const x=(i%8-3.5)*5.2,z=Math.floor(i/8)*5.1-19;if(Math.abs(x)<3)continue;tent(x,z);}box(4,.025,49,base,0,.015,-4);sign('MINA • AREA TENDA',0,3.6,-8);people(35);}
 if(site==='jamarat'){
  box(32,.2,27,base,0,-.02,0);box(32,.25,1,white,0,5.1,-10);
  for(let i=0;i<3;i++){const x=targets[i];obstacles.push({x,z:0,w:5.8,d:5.8});mesh(new THREE.CylinderGeometry(2.9,2.9,.22,40),base,x,.11,0);mesh(new THREE.TorusGeometry(2.6,.17,8,44).rotateX(Math.PI/2),white,x,.23,0);box(3.5,4.2,.8,white,x,2.1,0);sign(['ULA','WUSTHA','AQABAH'][i],x,4.9,.5);}
  for(let i=0;i<7;i++){box(.25,5,.25,white,i*5-15,2.5,-10);box(.29,.85,.29,white,i*5-15,.42,10);}people(20);
 }
 s.add(placeDetails(site));
 if(site==='arafah'){sign('BATAS AREA WUKUF',-16,2,-6);sign('ROMBONGAN · AREA ARAFAH',7.5,2.7,-3.8);const monument=mesh(new THREE.CylinderGeometry(.24,.31,3.2,8),white,0,8.5,-31);monument.name='Jabal Rahmah landmark';}
 if(site==='mina')sign('TENDA ROMBONGAN',-7.8,2.5,-1.65);
 let syncCampPose=true;let campPose:{clip:number;phase:number}|null=null,escortReady=false,escortActive=false;let escortGoal:[number,number]=[-4.3,-1];
 const campRows:THREE.Group[]=[],campItems:THREE.Object3D[]=[],pickupMeshes:THREE.Mesh[]=[],pickupRings:THREE.Mesh[]=[];
 let lostPilgrim:THREE.Group|null=null;
 if(site==='mina'){
  // Keep all activity points in the measured wide aisles, away from tent collision.
  sign('BEKAL & AIR',6.6,2.2,3.8,2.8);box(1.5,.8,.7,green,4.8,.4,3.8);
  for(let i=0;i<4;i++)campItems.push(mesh(new THREE.CylinderGeometry(.09,.09,.34,8),white,4.35+i*.24,1,3.8));
  campItems.push(box(.45,.18,.35,rock,4.55,.9,3.5));
  sign('TEMPAT WUDU',-6.9,2.2,9.7,2.8);box(1.6,.7,.6,base,-5.6,.35,9.7);
  for(let i=0;i<3;i++)box(.07,.2,.2,dark,-6+i*.4,.8,9.7);
  sign('AREA SALAT',4.1,2.3,-1.8,2.6);sign('TITIK KUMPUL',2.9,2.2,11.6,2.6);
  for(let i=0;i<6;i++){
   const x=(i%3-1)*.8,z=-.8-Math.floor(i/3)*1.5;
   box(.68,.015,1.25,green,x,.025,z);
   const actor=humanActor(s,0xf4f0e4,walk?.avatar==='female',walk?.avatar==='female'?1.62:1.74);actor.position.set(x,0,z);actor.rotation.y=Math.PI;actor.visible=false;campRows.push(actor);
  }
  lostPilgrim=humanActor(s,0xe7ddca,false,1.7);lostPilgrim.position.set(4.4,0,-1);lostPilgrim.visible=false;
 }
 if(site==='arafah'){
  sign('POS AIR',6.2,2.1,-1,2.5);box(1.2,.8,.6,green,5.2,.4,-1);
  for(let i=0;i<4;i++)box(.14,.32,.14,white,4.85+i*.22,.96,-1);
  sign('BATAS ARAFAH',-6.3,2,-6,2.5);sign('AREA SALAT & DOA',3.2,2.3,-2,2.7);sign('KUMPUL MUZDALIFAH',3.8,2.3,11.2,3);
  box(2.8,.08,2.5,white,-2,2.6,1);for(const x of [-3.3,-.7])for(const z of [-.1,2.1])box(.06,2.5,.06,base,x,1.25,z);
  box(2,.02,1.5,green,-2,.025,1);sign('TEMPAT TEDUH',-4.1,2.3,.6,2.4);
  for(let i=0;i<6;i++){const x=(i%3-1)*.8,z=-1.5-Math.floor(i/3)*1.4;box(.68,.015,1.2,green,x,.025,z);const actor=humanActor(s,0xf4f0e4,walk?.avatar==='female',walk?.avatar==='female'?1.62:1.74);actor.position.set(x,0,z);actor.rotation.y=Math.PI;actor.visible=false;campRows.push(actor);}
  lostPilgrim=humanActor(s,0xe7ddca,false,1.7);lostPilgrim.position.set(4.4,0,-4);lostPilgrim.visible=false;
  const guide=humanActor(s,0x285846,walk?.avatar==='female',walk?.avatar==='female'?1.62:1.74);guide.position.set(1.6,0,-3);guide.rotation.y=Math.PI;
 }
 if(site==='muzdalifah'){
  sign('SALAT MAGRIB · ISYA',3.7,2.3,-1.8,3);sign('POS AIR',6.3,2.1,5.5,2.5);box(1.2,.7,.6,green,5.3,.35,5.5);
  for(let i=0;i<4;i++)box(.14,.3,.14,white,4.9+i*.22,.85,5.5);
  sign('ALAS ROMBONGAN',-5.7,2.1,6.8,2.7);box(2,.02,2,green,-3.4,.025,6.8);sign('KUMPUL AQABAH',3.5,2.1,11,2.8);
  sign('KENALI KERIKIL',4.3,2.1,3,2.6);box(.9,.6,.65,base,2.9,.3,3);mesh(new THREE.DodecahedronGeometry(.3,0),rock,2.9,.9,3);
  const pebbleMat=new THREE.MeshStandardMaterial({color:0xc8b895,roughness:1,emissive:0x544528,emissiveIntensity:.6});
  for(const [x,z]of MUZDALIFAH_STONES){pickupMeshes.push(mesh(new THREE.DodecahedronGeometry(.12,0),pebbleMat,x,.12,z));pickupRings.push(mesh(new THREE.TorusGeometry(.42,.025,6,18).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2cf76}),x,.025,z));}
  mesh(new THREE.SphereGeometry(1.2,12,8),new THREE.MeshBasicMaterial({color:0xe8eddf}),-22,28,-45);
  const starGeo=new THREE.SphereGeometry(.055,4,3),starMat=new THREE.MeshBasicMaterial({color:0xc7dbef});for(let i=0;i<18;i++)mesh(starGeo,starMat,Math.sin(i*2.13)*45,20+(i%7)*2.7,-35-Math.cos(i*4.21)*12);
  for(let i=0;i<6;i++){const x=(i%3-1)*.8,z=-1.5-Math.floor(i/3)*1.4;box(.68,.015,1.2,green,x,.025,z);const actor=humanActor(s,0xf4f0e4,walk?.avatar==='female',walk?.avatar==='female'?1.62:1.74);actor.position.set(x,0,z);actor.rotation.y=Math.PI;actor.visible=false;campRows.push(actor);}
  lostPilgrim=humanActor(s,0xe7ddca,false,1.7);lostPilgrim.position.set(-6,0,-4);lostPilgrim.visible=false;
  const guide=humanActor(s,0x285846,walk?.avatar==='female',walk?.avatar==='female'?1.62:1.74);guide.position.set(1.6,0,3.5);guide.rotation.y=Math.PI;
 }
 const aqabah=site==='jamarat'&&options.aqabah?aqabahActivities(s,walk?.avatar??'male'):null;
 const cam=new THREE.PerspectiveCamera(47,1,.1,180);let orbit=.2,elev=.43,dist=site==='jamarat'?22:34,focusX=0;const center=new THREE.Vector3(0,1.5,0);
 const level=cityArenaLevel(),entry:readonly [number,number]=site==='jamarat'?(level===8?[3,12]:level===9?[-8,11]:[0,9]):[0,12];
 const walker=walk?attachWalker(s,cam,canvas,host,{...walk,lifeKind:site,arenaEntry:entry},site==='jamarat'?[-14,14,3.45,options.aqabah?22:10]:[-18,18,-10,13],obstacles,options.exitWalk&&site==='mina'?[0,8]:entry,site==='jamarat'?[8,4.5]:site==='muzdalifah'?[0,3.5]:[0,-3]):null;if(walker)cam.fov=58;
 const locationSigns:{mesh:THREE.Mesh;position:THREE.Vector3}[]=[];s.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.locationSign)locationSigns.push({mesh:o,position:o.getWorldPosition(new THREE.Vector3())});});
 const stone=mesh(new THREE.DodecahedronGeometry(.11,0),rock,0,0,0);stone.visible=false;
 let shot:{i:number;elapsed:number;finish:()=>void;origin:THREE.Vector3}|null=null;let raf=0,disposed=false,drag:number|null=null,px=0,py=0,lastTime=0;
 canvas.addEventListener('pointerdown',e=>{if(walker||drag!==null)return;drag=e.pointerId;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(walker||drag!==e.pointerId)return;orbit-=(e.clientX-px)*.009;elev=THREE.MathUtils.clamp(elev+(e.clientY-py)*.006,.15,1.1);px=e.clientX;py=e.clientY;});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if((e as PointerEvent).pointerId===drag)drag=null;});
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);budget.resize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function frame(now:number){if(disposed)return;raf=requestAnimationFrame(frame);const delta=lastTime?Math.min(80,now-lastTime):0;lastTime=now;if(document.hidden||walk?.blocked()||budget.lost())return;if(walker){if(praying){prayerClock+=delta/5000;walker.setPose(Clip.DUA,prayerClock%1);}walker.update(now);if(!praying)updatePeople(delta/1000,walker.position);}else{center.x+=(focusX-center.x)*.12;cam.position.set(center.x+Math.sin(orbit)*Math.cos(elev)*dist,1.5+Math.sin(elev)*dist,Math.cos(orbit)*Math.cos(elev)*dist);cam.lookAt(center);}
 if(campPose){walker?.setPose(campPose.clip,campPose.phase);if(syncCampPose)for(const actor of campRows)actor.userData.campPose=campPose;}
 if(escortActive&&lostPilgrim&&walker){const p=walker.position,d=Math.hypot(p.x-lostPilgrim.position.x,p.z-lostPilgrim.position.z);if(d>1){const move=Math.min(d-1,delta/1000*2.7);lostPilgrim.rotation.y=Math.atan2(p.x-lostPilgrim.position.x,p.z-lostPilgrim.position.z);lostPilgrim.position.x+=(p.x-lostPilgrim.position.x)/d*move;lostPilgrim.position.z+=(p.z-lostPilgrim.position.z)/d*move;}const ready=walker.near()&&Math.hypot(lostPilgrim.position.x-escortGoal[0],lostPilgrim.position.z-escortGoal[1])<2.4;if(ready!==escortReady){escortReady=ready;walk?.onNear?.();}}
 if(shot){shot.elapsed+=delta;const t=Math.min(1,shot.elapsed/720);stone.position.set(THREE.MathUtils.lerp(shot.origin.x,targets[shot.i],t),THREE.MathUtils.lerp(shot.origin.y,.29,t)+Math.sin(t*Math.PI)*2.6,THREE.MathUtils.lerp(shot.origin.z,.8,t));if(t>=1){const cb=shot.finish;shot=null;stone.visible=false;walker?.lock(false);cb();}}
 for(const label of locationSigns){const opacity=THREE.MathUtils.smoothstep(cam.position.distanceTo(label.position),4.5,7);(label.mesh.material as THREE.MeshBasicMaterial).opacity=opacity;label.mesh.visible=opacity>0;}
 aqabah?.update(delta/1000);updateHumanActors(s,delta/1000,true,cam);budget.draw(now,s,cam);}
 raf=requestAnimationFrame(frame);
 return {setAqabahActivity(beat,cuts,progress,active=false){aqabah?.set(beat,cuts,progress,active);walker?.setVisible(!active);if(active){walker?.alignGoal();walker?.face(-8,10);}host.dataset.aqabahBeat=String(beat);host.dataset.haircutCuts=String(cuts);host.dataset.haircutProgress=progress.toFixed(3);},campCare(action){return !!walker?.near()&&!!walker.campCare(action);},setMinaCamp(beat){syncCampPose=true;escortReady=false;escortActive=beat===4;escortGoal=[-4.3,-1];for(const actor of campRows)actor.visible=beat>=2;for(const item of campItems)item.visible=beat===0;if(lostPilgrim){lostPilgrim.visible=beat===3||beat===4;if(beat===3)lostPilgrim.position.set(4.4,0,-1);if(beat===4&&Math.abs(lostPilgrim.position.x)<.01)lostPilgrim.position.set(4.4,0,-1);}host.dataset.minaBeat=String(beat);},setArafahActivity(beat){if(site!=='arafah')return;syncCampPose=true;escortReady=false;escortActive=beat===9;escortGoal=[-2,1];for(const actor of campRows)actor.visible=beat>=4;if(lostPilgrim){lostPilgrim.visible=beat===8||beat===9;if(beat===8)lostPilgrim.position.set(4.4,0,-4);}host.dataset.arafahBeat=String(beat);},setMuzdalifahActivity(beat,stones,pickup,dawn){if(site!=='muzdalifah')return;const wasEscort=escortActive;escortActive=beat===6;escortGoal=[-3.4,6.8];if(escortActive!==wasEscort)escortReady=false;syncCampPose=[2,3,10,11].includes(beat);for(const actor of campRows){actor.visible=beat>=2;if(!syncCampPose)actor.userData.campPose={clip:Clip.TASHAHHUD,phase:.5};}
  if(lostPilgrim){if(beat===5){lostPilgrim.position.set(-6,0,-4);delete lostPilgrim.userData.campPose;}if(beat>=7){if(!lostPilgrim.visible)lostPilgrim.position.set(-3.4,0,6.8);lostPilgrim.userData.campPose={clip:Clip.TASHAHHUD,phase:.5};}lostPilgrim.visible=beat>=5;}
  for(let i=0;i<pickupMeshes.length;i++){pickupMeshes[i].visible=i>=stones&&!(beat===8&&i===stones&&pickup>0);pickupRings[i].visible=beat===8&&i===stones&&pickup===0;}
  stone.visible=beat===8&&stones<7&&pickup>0&&pickup<1;if(stone.visible&&walker){const a=MUZDALIFAH_STONES[stones],p=walker.position;stone.position.set(THREE.MathUtils.lerp(a[0],p.x+.2,pickup),.12+.65*pickup+.25*Math.sin(pickup*Math.PI),THREE.MathUtils.lerp(a[1],p.z+.15,pickup));}
  const t=THREE.MathUtils.clamp(dawn,0,1),color=new THREE.Color().lerpColors(new THREE.Color(0x18283b),new THREE.Color(0x8cabb9),t);s.background=color;s.fog!.color.copy(color);sun.color.setHex(t>.2?0xd3dced:0xa1c7ff);sun.intensity=1.1+t*.4;host.dataset.dawn=t.toFixed(3);host.dataset.muzdalifahStones=String(stones);},setCampPose(pose){campPose=pose;walker?.lock(!!pose);walker?.setGoalVisible(!pose);if(pose){walker?.alignGoal();walker?.face(0,-10);walker?.setPose(pose.clip,pose.phase);}else{walker?.clearPose();for(const actor of campRows)delete actor.userData.campPose;}host.dataset.campPose=pose?String(pose.clip):'';},setGoal(x,z){walker?.setGoal(x,z);},setTime(progress){const t=THREE.MathUtils.clamp(progress,0,1),color=new THREE.Color().lerpColors(new THREE.Color(0xc9d9da),new THREE.Color(site==='mina'?0x172d47:0xde946b),t);s.background=color;s.fog!.color.copy(color);sun.color.setHex(t>.66?0xffba7e:0xffe7bd);sun.position.y=34*(1-t)+2;sun.intensity=2.1-t*1.3;r.toneMappingExposure=1-t*.17;host.dataset.dayProgress=t.toFixed(3);},setPrayer(on){praying=on;walker?.lock(on);walker?.setGoalVisible(!on);if(!on)walker?.clearPose();s.traverse(o=>{if(o.name==='human-actor')o.userData.praying=on;});host.dataset.praying=String(on);},near(){return (walker?.near()??true)&&(!escortActive||escortReady);},approach(){walker?.approach();},focus(i){if(site==='jamarat'){focusX=targets[i];orbit=.05;dist=13;walker?.setGoal(targets[i],4.5);}},throwStone(i,onFinish){if(shot||site!=='jamarat'||walker&&!walker.near())return;const p=walker?.position;walker?.face(targets[i],0);walker?.lock(true);stone.visible=true;shot={i,elapsed:0,finish:onFinish,origin:p?new THREE.Vector3(p.x+.22,1.42,p.z-.2):new THREE.Vector3(targets[i],.9,7)};},dispose(){disposed=true;aqabah?.dispose();disposeHumanActors(s);budget.dispose();walker?.dispose();cancelAnimationFrame(raf);observer.disconnect();const geos=new Set<THREE.BufferGeometry>();const mats=new Set<THREE.Material>();s.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});for(const g of geos)g.dispose();for(const m of mats){disposeSurface(m);m.dispose();}r.dispose();}};
}
