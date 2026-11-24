import {campaignContext} from './adventure/hajjCampaign.ts';
import {readSetup} from './frontSettings.ts';
import {placeDetails} from './env/PlaceDetails.ts';
import * as THREE from 'three';
import {graphicsTier,createRenderBudget} from './graphicsQuality.ts';
import {surfaceDetail,staticShadows,disposeSurface} from './env/GraphicsDetail.ts';
import {PlayerRenderer} from './characters/PlayerRenderer.ts';
import {finishHaircut} from './characters/playerAppearance.ts';
import type {Wardrobe} from './characters/playerAppearance.ts';
import {resolveFrames} from './characters/CrowdView.ts';
import {Clip} from './sim/States.ts';
import {attachWalker,type WalkOptions,type Obstacle} from './coreWalk.ts';
import type {Avatar} from './journey.ts';
export type DemoKind='prep'|'post'|'trim';
export interface Demo{setAvatar(a:Avatar):void;setWardrobe(wardrobe:Wardrobe):void;prayer():void;water():void;trim():void;dispose():void;near():boolean;approach():void;target(action:'prayer'|'water'|'trim'|'prep'):void}
export function mountMini(host:HTMLElement,kind:DemoKind,initial:Avatar,onDone:(action:string)=>void,walk?:WalkOptions):Demo{
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Adegan 3D ilustratif');host.replaceChildren(canvas);
 const r=new THREE.WebGLRenderer({canvas,antialias:graphicsTier()!=='low',powerPreference:'low-power'});const budget=createRenderBudget(r,{maxFps:30});r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;
 const s=new THREE.Scene();s.background=new THREE.Color(0xe3e7dc);s.add(new THREE.HemisphereLight(0xffffff,0xa8b1a5,2.5));const sun=new THREE.DirectionalLight(0xfff5da,2);sun.position.set(-4,8,5);s.add(sun);if(walk)staticShadows(r,sun,8);
 s.add(placeDetails(kind));
 const camera=new THREE.PerspectiveCamera(39,1,.1,60);camera.position.set(3.5,2.2,5.7);camera.lookAt(0,1,0);
 const mat=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.8});
 const floor=mat(0xd3d5cb),stone=mat(0xf1ecdf),dark=mat(0x26483e),gold=mat(0xc3a774),white=mat(0xf9f7ee),skin=mat(0xc89972),hairmat=mat(0x272e2b);
 surfaceDetail(floor,'marble',6,6);surfaceDetail(stone,'stone',3,2);surfaceDetail(white,'fabric',2,2);
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,group:THREE.Group|THREE.Scene=s):THREE.Mesh{const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.receiveShadow=true;a.castShadow=y>.2;group.add(a);return a;}
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number):THREE.Mesh{return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);}
 box(12,.2,12,floor,0,-.12,0);const obstacles:Obstacle[]=[];box(12,4,.24,stone,0,1.8,-3.4);
 for(let x=-5;x<=5;x+=2){box(.22,3.8,.28,white,x,1.9,-3.2);box(.5,.1,.5,gold,x,3.3,-3.2);}
 const q={lod0Budget:1,lod1Budget:1,lod0Distance:50,lod1Distance:50,blobShadows:true};
 const people=new Map<Avatar,PlayerRenderer>();let avatar=initial;
 function figure(a:Avatar):PlayerRenderer{let f=people.get(a);if(!f){f=new PlayerRenderer(1,q,a,kind==='prep'?'casual':'ritual');people.set(a,f);s.add(f.group);}return f;}
 let cup:THREE.Group|undefined,cut:THREE.Group|undefined;
 if(kind==='prep'){obstacles.push({x:-1.7,z:-.45,w:1.5,d:.8});box(1.5,.08,.8,gold,-1.7,.65,-.45);box(.08,.65,.08,dark,-2.25,.32,-.72);box(.08,.65,.08,dark,-1.15,.32,-.72);for(let i=0;i<3;i++)box(.72,.08,.4,white,-1.7,.74+i*.08,-.45);}
 if(kind==='post'){
 obstacles.push({x:1.9,z:-.5,w:1.05,d:.9});  box(1,.018,1.75,dark,0,.01,0);box(.9,.018,.045,gold,0,.014,-.78);
  box(1.05,1.0,.65,dark,1.9,.5,-.5);box(.8,.1,.65,gold,1.9,1.05,-.5);box(.65,.5,.4,stone,1.9,1.37,-.55);
  cup=new THREE.Group();const g=new THREE.CylinderGeometry(.11,.09,.25,20,1,true);mesh(g,white,0,0,0,cup);mesh(new THREE.CylinderGeometry(.088,.088,.04,20),new THREE.MeshStandardMaterial({color:0x82bdd2,transparent:true,opacity:.85}),0,-.01,0,cup);cup.position.set(1.8,1.23,-.25);s.add(cup);
 }
 if(kind==='trim'){
 obstacles.push({x:0,z:0,w:.8,d:.65},{x:-1.65,z:-.4,w:1.25,d:.55});   box(1.2,.7,.5,dark,-1.65,.35,-.4);box(1.25,.08,.55,gold,-1.65,.74,-.4);
   mesh(new THREE.SphereGeometry(.32,24,16),skin,0,1.28,0);
   const hair=new THREE.Group();mesh(new THREE.SphereGeometry(.345,24,16,0,Math.PI*2,0,Math.PI*.56),hairmat,0,1.28,0,hair);cut=hair;s.add(hair);
   box(.7,.85,.5,white,0,.55,0);
   const scissors=new THREE.Group();for(const a of [-1,1]){mesh(new THREE.TorusGeometry(.1,.026,8,18),gold,a*.11,0,0,scissors);const blade=mesh(new THREE.BoxGeometry(.035,.42,.045),gold,a*.055,.24,0,scissors);blade.rotation.z=a*.22;}scissors.position.set(.55,1.32,.1);scissors.rotation.z=-1;s.add(scissors);
 }
 const goals={prep:[-1.7,.9],prayer:[0,0],water:[1.9,.9],trim:[0,1.65]} as const;const walker=walk?attachWalker(s,camera,canvas,host,{...walk,lifeKind:kind},[-4.7,4.7,-2.5,4.7],obstacles,[0,3.8],goals[kind==='prep'?'prep':kind==='post'?'prayer':'trim']):null;if(walker)camera.fov=58;
 let animation:'idle'|'prayer'|'water'|'trim'='idle',elapsedAnimation=0,raf=0,disposed=false;
 const poses=[{c:Clip.TAKBIR,d:1200},{c:Clip.QIYAM,d:2100},{c:Clip.TO_RUKU,d:850},{c:Clip.RUKU,d:1150},{c:Clip.FROM_RUKU,d:800},{c:Clip.ITIDAL,d:900},{c:Clip.TO_SUJUD,d:950},{c:Clip.SUJUD,d:1400},{c:Clip.SUJUD_TO_JALSA,d:800},{c:Clip.JALSA,d:900},{c:Clip.JALSA_TO_SUJUD,d:800},{c:Clip.SUJUD,d:1400}];
 const sequence=[...poses,{c:Clip.SUJUD_TO_STAND,d:1000},...poses,{c:Clip.SUJUD_TO_JALSA,d:800},{c:Clip.TASHAHHUD,d:1800},{c:Clip.TASLIM,d:1200}];const duration=sequence.reduce((a,b)=>a+b.d,0);
 const frameState={f0:0,f1:0,frac:0};let last=0;
 const resize=()=>{const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);budget.resize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function frame(now:number):void{
  if(disposed)return;raf=requestAnimationFrame(frame);if(document.hidden||walk?.blocked()||budget.lost()){last=now;return;}if(now-last<32)return;const delta=last?Math.min(80,now-last):0;last=now;if(animation!=='idle')elapsedAnimation+=delta;let t=elapsedAnimation;
  let clip:number=Clip.IDLE,phase=(now/3000)%1;
  if(animation==='prayer'){if(t>=duration){animation='idle';walker?.clearPose();walker?.lock(false);onDone('prayer');}else{for(const seg of sequence){if(t<seg.d){clip=seg.c;phase=Math.min(.999,t/seg.d);break;}t-=seg.d;}}}
  if(animation==='water'&&cup){const p=Math.min(1,t/1900);const hand=walker?.position;const arc=Math.sin(Math.PI*p);cup.position.set(1.8+((hand?.x??.55)-1.8)*arc,1.23+.42*arc,-.25+((hand?.z??0)+.25)*arc);cup.rotation.z=-.18*Math.sin(Math.PI*p);if(p===1){animation='idle';walker?.lock(false);onDone('water');}}
  if(animation==='trim'&&cut){const p=Math.min(1,t/1100);cut.scale.set(1-.2*p,avatar==='female'?1-.2*p:1-.94*p,1-.2*p);if(p===1){animation='idle';walker?.lock(false);finishHaircut(avatar,walk?.haircutMethod??(campaignContext()?.id==='aqabah'?'shave':readSetup()?.program==='hajj'?'trim':'shave'),walk?.haircutMilestone);onDone('trim');}}
  if(walker){if(animation==='prayer')walker.setPose(clip,phase);walker.update(now);}else if(kind!=='trim'){const f=figure(avatar);for(const k of people.values())k.group.visible=k===f;resolveFrames(clip,phase,frameState);f.beginFrame();f.submit(0,0,0,0,kind==='post'?Math.PI:0,avatar==='male'?1.74:1.62,1,frameState.f0,frameState.f1,frameState.frac,frameState.f0,0,avatar==='female'?8:0,1);f.endFrame();}
  budget.draw(now,s,camera);
 }
 raf=requestAnimationFrame(frame);
 return{setAvatar(a){avatar=a;},setWardrobe(wardrobe){walker?.setWardrobe(wardrobe);for(const person of people.values())person.setWardrobe(wardrobe);},near(){return walker?.near()??true;},approach(){walker?.approach();},target(action){const p=goals[action];walker?.setGoal(p[0],p[1]);},prayer(){if(kind==='post'&&animation==='idle'&&(!walker||walker.near())){walker?.alignGoal();walker?.face(0,-3);walker?.lock(true);animation='prayer';elapsedAnimation=0;}},water(){if(kind==='post'&&animation==='idle'&&(!walker||walker.near())){walker?.face(1.9,-.5);walker?.lock(true);animation='water';elapsedAnimation=0;}},trim(){if(kind==='trim'&&animation==='idle'&&(!walker||walker.near())){walker?.face(0,0);walker?.lock(true);animation='trim';elapsedAnimation=0;}},dispose(){disposed=true;budget.dispose();walker?.dispose();cancelAnimationFrame(raf);observer.disconnect();for(const f of people.values()){s.remove(f.group);f.dispose();}s.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mm=Array.isArray(o.material)?o.material:[o.material];for(const m of mm){disposeSurface(m);m.dispose();}}});r.dispose();}};
}
