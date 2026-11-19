import * as THREE from 'three';
import {patrolClear,updatePatrols,type Patrol,type Position} from './sim/TrainingCrowd.ts';
import {surfaceDetail,staticShadows,disposeSurface,mobileGraphics} from './env/GraphicsDetail.ts';
import {attachWalker,type Obstacle,type WalkOptions} from './coreWalk.ts';
export type Site='arafah'|'muzdalifah'|'mina'|'jamarat';
export interface SiteView{focus(i:number):void;throwStone(i:number,onFinish:()=>void):void;dispose():void;near():boolean;approach():void}
export function createSite(host:HTMLElement,site:Site,walk?:WalkOptions):SiteView{
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Rekonstruksi ilustratif '+site+'; geser untuk memutar kamera');host.replaceChildren(canvas);
 const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});r.setPixelRatio(Math.min(devicePixelRatio,1.3));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=nightExposure();function nightExposure(){return site==='muzdalifah'?1.1:.98;}
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
 function sign(label:string,x:number,y:number,z:number):void{const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d')!;a.fillStyle='#24533f';a.fillRect(0,0,512,128);a.fillStyle='#fff';a.font='bold 42px sans-serif';a.textAlign='center';a.textBaseline='middle';a.fillText(label,256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),x,y,z);}
 let updatePeople:(dt:number,player?:Position)=>void=()=>{};
 function people(n:number):void{
  const candidates:Patrol[]=[];const limit=mobileGraphics()?n:Math.round(n*1.45);
  const reserved:Position[]=site==='jamarat'?[-8,0,8].map(x=>({x,z:4.5})):[{x:0,z:site==='muzdalifah'?3.5:-3},{x:0,z:12}];
  for(let i=0;i<limit*8&&candidates.length<limit;i++){
    const x=site==='jamarat'?(Math.sin(i*2.31)*.5+.5)*26-13:(Math.sin(i*2.31)*.5+.5)*42-21,z=site==='jamarat'?6.6+(Math.cos(i*4.19)*.5+.5)*2.5:(Math.cos(i*4.19)*.5+.5)*24-9;
    if(walk&&Math.abs(x)<2.5||!patrolClear(x,z,obstacles,reserved)||candidates.some(p=>Math.hypot(p.x-x,p.z-z)<1.1))continue;
    candidates.push({x,z,homeX:x,homeZ:z,h:1.56+(i%8)*.027,yaw:i*2.39,phase:i*.13%1,moving:false,rest:site==='muzdalifah'?i%4!==0:i%5===0});
  }
  const count=candidates.length;if(!count)return;const skinMat=mat(0xbc9979),robeMat=mat(0xf4f0e4),legMat=mat(0xe5e0d5);surfaceDetail(robeMat,'fabric');
  const specs=[{g:new THREE.CylinderGeometry(.19,.25,.84,10),m:robeMat,x:0,y:.39,z:0,sx:1,sy:1,sz:.82,limb:0},{g:new THREE.CapsuleGeometry(.19,.19,4,10),m:robeMat,x:0,y:.68,z:0,sx:1.05,sy:1,sz:.79,limb:0},{g:new THREE.SphereGeometry(.14,12,8),m:skinMat,x:0,y:.9,z:0,sx:1,sy:1.08,sz:.93,limb:0},{g:new THREE.CapsuleGeometry(.055,.32,3,8),m:robeMat,x:-.23,y:.65,z:0,sx:1,sy:1,sz:1,limb:-1},{g:new THREE.CapsuleGeometry(.055,.32,3,8),m:robeMat,x:.23,y:.65,z:0,sx:1,sy:1,sz:1,limb:1},{g:new THREE.CapsuleGeometry(.065,.26,3,8),m:legMat,x:-.105,y:.17,z:0,sx:1,sy:1,sz:1,limb:2},{g:new THREE.CapsuleGeometry(.065,.26,3,8),m:legMat,x:.105,y:.17,z:0,sx:1,sy:1,sz:1,limb:-2}];
  const groups=specs.map(spec=>{const group=new THREE.InstancedMesh(spec.g,spec.m,count);group.receiveShadow=true;group.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.frustumCulled=false;s.add(group);return group;});
  const shadows=new THREE.InstancedMesh(new THREE.CircleGeometry(.36,16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x514b40,transparent:true,opacity:.13,depthWrite:false}),count);shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);shadows.frustumCulled=false;s.add(shadows);
  const pos=new THREE.Object3D(),axis=new THREE.Vector3(0,1,0),rotation=new THREE.Quaternion(),swing=new THREE.Quaternion(),xAxis=new THREE.Vector3(1,0,0);
  let seconds=0,acc=0;const paint=()=>{for(let i=0;i<count;i++){const p=candidates[i],scale=p.h/1.65,cy=Math.cos(p.yaw),sy=Math.sin(p.yaw);
    for(let k=0;k<specs.length;k++){const q=specs[k],step=p.moving?Math.sin(p.phase*Math.PI*2)*.33*Math.sign(q.limb):0;pos.position.set(p.x+cy*q.x*scale,p.h*q.y,p.z-sy*q.x*scale);rotation.setFromAxisAngle(axis,p.yaw);swing.setFromAxisAngle(xAxis,step);pos.quaternion.copy(rotation).multiply(swing);pos.scale.set(q.sx*scale,q.sy*scale,q.sz*scale);pos.updateMatrix();groups[k].setMatrixAt(i,pos.matrix);}
    pos.position.set(p.x,.012,p.z);pos.rotation.set(0,0,0);pos.scale.set(1,1,.7);pos.updateMatrix();shadows.setMatrixAt(i,pos.matrix);
  }for(const m of groups)m.instanceMatrix.needsUpdate=true;shadows.instanceMatrix.needsUpdate=true;};paint();
  updatePeople=(dt,player)=>{if(!walk)return;acc+=dt;if(acc<.055)return;const elapsed=Math.min(.1,acc);acc=0;seconds+=elapsed;updatePatrols(candidates,seconds,elapsed,player,obstacles,reserved);paint();};
 }
 const targets=[-8,0,8];
 if(site==='arafah'){for(let i=0;i<24;i++){const m=mesh(new THREE.DodecahedronGeometry(2.1+(i%5)*.95,0),rock,(i%8-3.5)*3.2,1.5+Math.sin(i)*.7,-18-Math.floor(i/8)*3);m.scale.set(1.3,1.3,1.3);m.rotation.set(i*.31,i*.37,i*.1);}for(let i=0;i<8;i++)tent(walk?[-9,-4.7,4.7,9][i%4]:(i%4-1.5)*5,5+Math.floor(i/4)*6);sign('ARAFAH • WUKUF',0,3.5,-7);people(42);}
 if(site==='muzdalifah'){for(let i=0;i<20;i++){const x=(Math.sin(i*2.2)*.5+.5)*30-15,z=(Math.cos(i*3.1)*.5+.5)*27-13;box(1.4,.045,2.1,i%2?green:dark,x,.02,z);}for(let i=0;i<32;i++)mesh(new THREE.DodecahedronGeometry(.09+(i%3)*.025,0),rock,(i%8-3.5)*.35,.09,2+Math.floor(i/8)*.31);for(let i=0;i<5;i++){box(.13,5,.13,base,i*7-14,2.5,-9);box(.55,.2,.55,new THREE.MeshBasicMaterial({color:0xffeac1}),i*7-14,5,-9);if(i%2===0){const lamp=new THREE.PointLight(0xffd8a2,18,14,2);lamp.position.set(i*7-14,4.7,-9);s.add(lamp);}}sign('MUZDALIFAH • MABIT',0,3.5,-7);people(28);}
 if(site==='mina'){for(let i=0;i<48;i++){const x=(i%8-3.5)*5.2,z=Math.floor(i/8)*5.1-19;if(Math.abs(x)<3)continue;tent(x,z);}box(4,.025,49,base,0,.015,-4);sign('MINA • AREA TENDA',0,3.6,-8);people(35);}
 if(site==='jamarat'){
  box(32,.2,27,base,0,-.02,0);box(32,.25,1,white,0,5.1,-10);
  for(let i=0;i<3;i++){const x=targets[i];obstacles.push({x,z:0,w:5.8,d:5.8});mesh(new THREE.CylinderGeometry(2.9,2.9,.22,40),base,x,.11,0);mesh(new THREE.TorusGeometry(2.6,.17,8,44).rotateX(Math.PI/2),white,x,.23,0);box(3.5,4.2,.8,white,x,2.1,0);sign(['ULA','WUSTHA','AQABAH'][i],x,4.9,.5);}
  for(let i=0;i<7;i++){box(.25,5,.25,white,i*5-15,2.5,-10);box(.29,.85,.29,white,i*5-15,.42,10);}people(20);
 }
 const cam=new THREE.PerspectiveCamera(47,1,.1,180);let orbit=.2,elev=.43,dist=site==='jamarat'?22:34,focusX=0;const center=new THREE.Vector3(0,1.5,0);
 const walker=walk?attachWalker(s,cam,canvas,host,walk,site==='jamarat'?[-14,14,3.45,10]:[-18,18,-10,13],obstacles,site==='jamarat'?[0,9]:[0,12],site==='jamarat'?[8,4.5]:site==='muzdalifah'?[0,3.5]:[0,-3]):null;if(walker)cam.fov=58;
 const stone=mesh(new THREE.DodecahedronGeometry(.11,0),rock,0,0,0);stone.visible=false;
 let shot:{i:number;elapsed:number;finish:()=>void;origin:THREE.Vector3}|null=null;let raf=0,disposed=false,drag:number|null=null,px=0,py=0,lastTime=0;
 canvas.addEventListener('pointerdown',e=>{if(walker||drag!==null)return;drag=e.pointerId;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(walker||drag!==e.pointerId)return;orbit-=(e.clientX-px)*.009;elev=THREE.MathUtils.clamp(elev+(e.clientY-py)*.006,.15,1.1);px=e.clientX;py=e.clientY;});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if((e as PointerEvent).pointerId===drag)drag=null;});
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function frame(now:number){if(disposed)return;raf=requestAnimationFrame(frame);const delta=lastTime?Math.min(80,now-lastTime):0;lastTime=now;if(document.hidden||walk?.blocked())return;if(walker){walker.update(now);updatePeople(delta/1000,walker.position);}else{center.x+=(focusX-center.x)*.12;cam.position.set(center.x+Math.sin(orbit)*Math.cos(elev)*dist,1.5+Math.sin(elev)*dist,Math.cos(orbit)*Math.cos(elev)*dist);cam.lookAt(center);}
 if(shot){shot.elapsed+=delta;const t=Math.min(1,shot.elapsed/720);stone.position.set(THREE.MathUtils.lerp(shot.origin.x,targets[shot.i],t),THREE.MathUtils.lerp(shot.origin.y,.29,t)+Math.sin(t*Math.PI)*2.6,THREE.MathUtils.lerp(shot.origin.z,.8,t));if(t>=1){const cb=shot.finish;shot=null;stone.visible=false;walker?.lock(false);cb();}}
 r.render(s,cam);}
 raf=requestAnimationFrame(frame);
 return {near(){return walker?.near()??true;},approach(){walker?.approach();},focus(i){if(site==='jamarat'){focusX=targets[i];orbit=.05;dist=13;walker?.setGoal(targets[i],4.5);}},throwStone(i,onFinish){if(shot||site!=='jamarat'||walker&&!walker.near())return;const p=walker?.position;walker?.face(targets[i],0);walker?.lock(true);stone.visible=true;shot={i,elapsed:0,finish:onFinish,origin:p?new THREE.Vector3(p.x+.22,1.42,p.z-.2):new THREE.Vector3(targets[i],.9,7)};},dispose(){disposed=true;walker?.dispose();cancelAnimationFrame(raf);observer.disconnect();const geos=new Set<THREE.BufferGeometry>();const mats=new Set<THREE.Material>();s.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});for(const g of geos)g.dispose();for(const m of mats){disposeSurface(m);m.dispose();}r.dispose();}};
}
