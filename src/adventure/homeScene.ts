import * as THREE from 'three';
import {missions,type Avatar,type Quest,type PlayableLevel} from './state.ts';
export interface HomeCallbacks {onNear:(near:boolean)=>void;onStep:()=>void;onInteract:()=>void;onNav:(angle:number,distance:number)=>void}
export interface HomeWorld {target(q:Quest):void;setActive(active:boolean):void;walkToTarget():void;cinematic(seconds:number):void;dispose():void}
type Hit={x:number;z:number;w:number;d:number};
export function mountHome(canvas:HTMLCanvasElement,joystick:HTMLElement,knob:HTMLElement,avatar:Avatar,initial:Quest,level:PlayableLevel,callbacks:HomeCallbacks):HomeWorld{
 const QUESTS=missions(level);
 canvas.style.touchAction='none';const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio,1.45));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
 const s=new THREE.Scene();s.background=new THREE.Color(0xcac7b7);s.add(new THREE.HemisphereLight(0xfff6e2,0xa6a5a0,1.7));const sun=new THREE.DirectionalLight(0xffe5b9,2.4);sun.position.set(-4,5.7,-3.5);sun.target.position.set(1,0,2);s.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.camera.near=.2;sun.shadow.camera.far=23;sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;const fill=new THREE.PointLight(0xffefd5,12,12,2);fill.position.set(1,2.8,.2);s.add(fill);
 const mat=(c:number)=>new THREE.MeshStandardMaterial({color:c,roughness:.82});const cream=mat(0xf0e3c7),wood=mat(0x825638),oak=mat(0xc5a276),green=mat(0x557668),dark=mat(0x30464c),gold=mat(0xc7a253),white=mat(0xf7f1df),blue=mat(0x8eb7c5),rose=mat(0x8f6560),leaf=mat(0x46764d),floor=mat(0xd5b99a);
 const obstacles:Hit[]=[];const blockers:THREE.Box3[]=[];
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=s){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function sphere(rad:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=s){const o=new THREE.Mesh(new THREE.SphereGeometry(rad,12,9),m);o.position.set(x,y,z);parent.add(o);return o;}
 function obstacle(x:number,z:number,w:number,d:number,h=1.05){obstacles.push({x,z,w,d});blockers.push(new THREE.Box3(new THREE.Vector3(x-w/2-.13,.02,z-d/2-.13),new THREE.Vector3(x+w/2+.13,h+.13,z+d/2+.13)));}
 function rug(x:number,z:number,w:number,d:number,m:THREE.Material){box(w,.035,d,m,x,.025,z);box(w-.18,.038,d-.18,cream,x,.027,z);box(w-.34,.04,d-.34,m,x,.029,z);}
 // Fully enclosed interior, with a doorway to a separate prayer alcove.
 const woodTex=document.createElement('canvas');woodTex.width=512;woodTex.height=512;const wg=woodTex.getContext('2d')!;
 for(let j=0;j<8;j++){const hue=30+j%3*2;wg.fillStyle='hsl('+hue+',27%,'+(61+j%4*3)+'%)';wg.fillRect(0,j*64,512,64);wg.fillStyle='#7f5c4238';wg.fillRect(0,j*64,512,2);for(let k=0;k<28;k++){const y=j*64+Math.random()*64;wg.strokeStyle='rgba(90,59,38,0.08)';wg.beginPath();wg.moveTo(0,y);wg.bezierCurveTo(180,y+Math.random()*12,330,y-Math.random()*7,512,y);wg.stroke();}wg.fillStyle='#654f3c66';wg.fillRect((j%2)*256, j*64,2,64);}
 const boards=new THREE.CanvasTexture(woodTex);boards.colorSpace=THREE.SRGBColorSpace;boards.wrapS=boards.wrapT=THREE.RepeatWrapping;boards.repeat.set(5,4);boards.anisotropy=Math.min(4,r.capabilities.getMaxAnisotropy());
 floor.map=boards;floor.color.setHex(0xffffff);
 const ground=box(15,.36,11,floor,0,-.2,0);ground.castShadow=false;
 const ceiling=box(15,.14,11,mat(0xf3eee1),0,3.37,0);ceiling.castShadow=false;
 function wall(x:number,z:number,w:number,d:number,h=3.3){const o=box(w,h,d,cream,x,h/2,z);o.castShadow=false;obstacle(x,z,w,d,h);box(w+.025,.12,d+.025,wood,x,.06,z).castShadow=false;}
 wall(0,-5.5,15,.18);wall(-7.5,0,.18,11);wall(0,5.5,15,.18);wall(7.5,-1.75,.18,7.5);wall(7.5,4.48,.18,2.04);box(.18,.68,1.5,cream,7.5,2.96,2.75).castShadow=false;box(2.4,.28,2.4,oak,8.55,-.16,2.75).castShadow=false;box(.18,3.3,2.4,cream,9.6,1.65,2.75).castShadow=false;blockers.push(new THREE.Box3(new THREE.Vector3(7.17,0,1.95),new THREE.Vector3(7.65,3.3,3.55)));
 // Interior divider: a generous opening near z=0 keeps every mission reachable.
 wall(2.45,-3.45,.14,4.1);wall(2.45,3.9,.14,3.2);
 const lintel=box(.16,.65,3.5,cream,2.45,2.98,.55);lintel.castShadow=false;
 const jambMat=mat(0xa17a52);box(.23,2.65,.13,jambMat,2.45,1.325,-1.33);box(.23,2.65,.13,jambMat,2.45,1.325,2.23);box(.23,.13,3.68,jambMat,2.45,2.65,.45);
 // Ceiling fixtures: warm pools of light without expensive dynamic point shadows.
 for(const x of [-3.3,4.8]){box(.72,.08,.72,mat(0xe6d5b4),x,3.16,0).castShadow=false;box(.54,.045,.54,new THREE.MeshBasicMaterial({color:0xffefc6}),x,3.09,0).castShadow=false;const lamp=new THREE.PointLight(0xffe5bb,8,7,2);lamp.position.set(x,2.95,0);s.add(lamp);}
 // Window, translucent-looking sky, curtains and animated light stripe.
 box(3.6,2,.12,wood,-3.75,1.99,-5.34);box(3.3,1.73,.13,blue,-3.75,1.99,-5.24);box(.08,1.73,.16,white,-3.75,1.99,-5.15);box(3.3,.08,.16,white,-3.75,1.99,-5.15);
 const curtain=box(.4,2.1,.17,green,-5.35,1.98,-5.05);box(.48,2.1,.17,green,-2.15,1.98,-5.05);
 const beam=box(2.9,.014,3.7,new THREE.MeshBasicMaterial({color:0xffd68b,transparent:true,opacity:.28}),-3.7,.04,-2.8);beam.rotation.y=.17;
 rug(-3,0,4.5,3.4,green);rug(3.6,-2.8,2.4,2.7,rose);if(level===2){rug(3.5,-2.65,1.05,1.8,green);box(.78,.043,.16,gold,3.5,.035,-3.25);}
 // Sofa and cushions.
 box(3.6,.46,1.28,green,-4.65,.3,-.9);box(3.6,.6,.25,green,-4.65,.77,-1.43);box(.3,.66,1.28,green,-6.3,.57,-.9);box(.3,.66,1.28,green,-3,.57,-.9);box(1,.18,.8,cream,-5.4,.63,-.95);box(.85,.18,.8,rose,-3.9,.63,-.95);obstacle(-4.65,-.9,3.6,1.28);
 // Small table and reading objects; the passage to the TV remains open.
 box(1.55,.15,.9,oak,-3.1,.52,2.65);for(const dx of [-.62,.62])for(const dz of [-.31,.31])box(.09,.46,.09,wood,-3.1+dx,.23,2.65+dz);box(.31,.065,.42,dark,-3.1,.64,2.65);obstacle(-3.1,2.65,1.55,.9);
 // Television cabinet, procedural screen artwork (not a real photograph or sacred-space reconstruction).
 box(3.45,.75,.75,wood,0,.38,-4.65);box(2.78,1.61,.17,dark,0,1.8,-4.88);box(.1,.25,.26,dark,0,.88,-4.88);obstacle(0,-4.65,3.45,.8,2.65);
 const tc=document.createElement('canvas');tc.width=640;tc.height=360;const g=tc.getContext('2d')!;
 const sky=g.createLinearGradient(0,0,0,360);sky.addColorStop(0,'#b7ced0');sky.addColorStop(.56,'#eee0b6');sky.addColorStop(1,'#c7c2b1');g.fillStyle=sky;g.fillRect(0,0,640,360);
 g.fillStyle='#e9e5d8';for(let i=0;i<7;i++){g.fillRect(i*100,170,92,83);g.fillStyle='#b6af9d';g.beginPath();g.arc(i*100+45,200,27,Math.PI,0);g.lineTo(i*100+72,240);g.lineTo(i*100+18,240);g.fill();g.fillStyle='#e9e5d8';}g.fillStyle='#202624';g.fillRect(240,101,161,137);g.fillStyle='#4d5048';g.beginPath();g.moveTo(401,101);g.lineTo(446,130);g.lineTo(446,237);g.lineTo(401,238);g.fill();g.fillStyle='#c8aa55';g.fillRect(240,127,161,10);g.fillRect(401,128,45,10);g.fillRect(369,163,18,36);
 g.fillStyle='#ffffff';g.font='600 22px sans-serif';g.textAlign='center';g.fillText('Baitullah • Ilustrasi',320,323);
 const tex=new THREE.CanvasTexture(tc);tex.colorSpace=THREE.SRGBColorSpace;box(2.59,1.43,.025,new THREE.MeshBasicMaterial({map:tex}),0,1.8,-4.775);
 // Reading corner, bookshelf, potted plants, entry door.
 box(.8,1.8,2.6,oak,-6.9,.9,3);for(let i=0;i<5;i++)box(.86,.045,2.64,wood,-6.9,.16+i*.36,3);for(let i=0;i<12;i++)box(.34,.25,.12,i%2?rose:green,-6.75,.32+Math.floor(i/4)*.36,2.35+(i%4)*.32);obstacle(-6.9,3,.8,2.6,1.8);
 function plant(x:number,z:number){box(.6,.45,.6,rose,x,.23,z);for(let i=0;i<7;i++){const p=sphere(.28,leaf,x+Math.cos(i*2.4)*.28,.6+(i%3)*.25,z+Math.sin(i*2.4)*.25);p.scale.set(.65,1.85,.65);}obstacle(x,z,.65,.65,1.4);}
 plant(6.5,-4.65);plant(-6.6,-4.7);
 box(.18,2.7,.14,wood,7.27,1.35,1.97);box(.18,2.7,.14,wood,7.27,1.35,3.43);box(.18,.14,1.6,wood,7.27,2.64,2.7);const door=new THREE.Group();door.position.set(7.1,0,3.37);s.add(door);box(.115,2.42,1.34,oak,0,1.21,-.67,door);box(.05,1.65,1.03,wood,-.065,1.27,-.67,door);box(.035,1.5,.88,oak,-.1,1.27,-.67,door);sphere(.05,gold,-.12,1.08,-1.12,door);
 box(1.6,.035,.85,green,5.9,.03,2.7);
 // Pendulum-like clock, Islamic geometric framed decor (no rendered sacred text).
 box(.72,.72,.08,wood,2.65,2.58,-5.27);const clock=new THREE.Mesh(new THREE.CircleGeometry(.31,28),new THREE.MeshBasicMaterial({color:0xf8f1d8}));clock.position.set(2.65,2.58,-5.215);s.add(clock);const hand=box(.028,.25,.025,dark,0,.1,0);const pivot=new THREE.Group();pivot.position.set(2.65,2.58,-5.18);s.add(pivot);pivot.add(hand);
 box(1.15,1,.1,wood,4.2,2.45,-5.29);const wallArt=box(.65,.65,.07,green,4.2,2.45,-5.2);wallArt.rotation.z=Math.PI/4;
 function capsule(radius:number,length:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D){const o=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,10),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function person(female:boolean,color:number,height=1.7){
  const root=new THREE.Group();s.add(root);root.scale.setScalar(height/1.7);const cloth=mat(color),skin=mat(0xb98662),pants=mat(0x33464a),hair=mat(0x292823);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.34,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x372a20,transparent:true,opacity:.2,depthWrite:false}));shadow.position.y=.017;root.add(shadow);
  const body=new THREE.Group();root.add(body);const torso=capsule(.205,.29,cloth,0,1.02,0,body);torso.scale.set(1.1,1,.74);const hips=capsule(.19,.1,pants,0,.77,0,body);hips.scale.set(1.1,.75,.78);capsule(.072,.08,skin,0,1.34,0,body);
  const head=sphere(.155,skin,0,1.51,.035,body);head.scale.set(.91,1.15,.92);head.castShadow=true;if(female){const hood=sphere(.18,cloth,0,1.55,-.055,body);hood.scale.set(1.05,1.19,.85);box(.42,.4,.29,cloth,0,1.25,-.06,body);head.position.z=.11;const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.22,.31,.77,12),cloth);skirt.position.y=.6;body.add(skirt);}else{const cap=sphere(.155,hair,0,1.61,-.025,body);cap.scale.set(1,.47,1);cap.castShadow=true;}
  const legs:THREE.Group[]=[],arms:THREE.Group[]=[];
  for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.12,.76,0);body.add(leg);capsule(.082,.44,pants,0,-.29,0,leg);const shoe=capsule(.09,.11,dark,0,-.65,.055,leg);shoe.rotation.x=Math.PI*.5;shoe.scale.set(1,.95,.65);legs.push(leg);const arm=new THREE.Group();arm.position.set(side*.29,1.27,0);body.add(arm);capsule(.076,.32,cloth,0,-.22,0,arm);sphere(.066,skin,0,-.46,0,arm);arms.push(arm);}
  return {root,body,legs,arms};
 }
 const hero=person(avatar==='female',avatar==='female'?0x69586d:0x597b89);const family=person(true,0xa87864,1.58);family.root.position.set(-4.65,0,.47);family.root.rotation.y=.65;
 const family2=person(false,0xb0a58a,1.68);family2.root.position.set(-5.8,0,2.3);family2.root.rotation.y=.9;obstacle(-4.65,.47,.45,.36,1.58);obstacle(-5.8,2.3,.45,.36,1.68);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.63,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xd8a62f,side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.position.y=.065;s.add(ring);
 const pin=new THREE.Group();s.add(pin);const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.19),new THREE.MeshBasicMaterial({color:0xffd25c}));pin.add(gem);
 const cam=new THREE.PerspectiveCamera(60,1,.045,45);let x=0,z=1.85,yaw=Math.PI,cameraYaw=Math.PI,pitch=.16,quest=initial,near=false,active=false,auto=false,raf=0,last=performance.now(),phase=0,cutUntil=0,disposed=false,doorOpen=level===1&&initial===3;let cameraDistance=3.1,manualUntil=0,lastMotion=0,lookId:number|null=null,lookX=0,lookY=0;const pivotCam=new THREE.Vector3(),desiredCam=new THREE.Vector3(),direction=new THREE.Vector3(),hit=new THREE.Vector3(),ray=new THREE.Ray(),lookAt=new THREE.Vector3();const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
 const keys=new Set<string>();let waypoints:{x:number;z:number}[]=[];let jx=0,jz=0,pid:number|null=null;
 const bounds=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 function valid(px:number,pz:number){return px>-7&&px<7&&pz>-5&&pz<5&&!obstacles.some(o=>Math.abs(px-o.x)<o.w/2+.26&&Math.abs(pz-o.z)<o.d/2+.26);}
 // Navigate on a bounded half-metre grid. A nearby reachable point is sufficient for interaction.
 function plan(tx:number,tz:number){
  const step=.5,cols=27,rows=19,point=(i:number)=>({x:(i%cols-13)*step,z:(Math.floor(i/cols)-9)*step});
  let start=-1,best=Infinity;for(let i=0;i<cols*rows;i++){const p=point(i),d=Math.hypot(p.x-x,p.z-z);if(valid(p.x,p.z)&&d<best){best=d;start=i;}}
  if(start<0)return [];const prev=new Int32Array(cols*rows).fill(-2),queue=[start];prev[start]=-1;let goal=-1;
  for(let k=0;k<queue.length;k++){const i=queue[k],p=point(i);if(Math.hypot(p.x-tx,p.z-tz)<.9){goal=i;break;}const c=i%cols,row=Math.floor(i/cols);for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=row+dr;if(nc<0||nc>=cols||nr<0||nr>=rows)continue;const j=nr*cols+nc,n=point(j);if(prev[j]!==-2||!valid(n.x,n.z)||!valid((p.x+n.x)/2,(p.z+n.z)/2))continue;prev[j]=i;queue.push(j);}}
  const route:{x:number;z:number}[]=[];if(goal>=0)for(let i=goal;i>=0;i=prev[i])route.push(point(i));return route.reverse();
 }
 const keymap:Record<string,string>={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
 function down(e:KeyboardEvent){if(!active||e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement)?.closest('input,select,textarea'))return;const key=keymap[e.code];if(key){e.preventDefault();keys.add(key);auto=false;}if(e.code==='KeyE'&&!e.repeat){e.preventDefault();callbacks.onInteract();}}
 function up(e:KeyboardEvent){keys.delete(keymap[e.code]);}
 function clear(){keys.clear();jx=jz=0;pid=null;lookId=null;auto=false;knob.style.transform='translate(-50%,-50%)';}
 function joy(e:PointerEvent){const q=joystick.getBoundingClientRect(),rad=q.width*.34,dx=e.clientX-q.left-q.width/2,dz=e.clientY-q.top-q.height/2,m=Math.max(rad,Math.hypot(dx,dz));jx=dx/m;jz=dz/m;knob.style.transform='translate(calc(-50% + '+jx*rad+'px),calc(-50% + '+jz*rad+'px))';}
 function jd(e:PointerEvent){if(!active||pid!==null)return;e.preventDefault();auto=false;pid=e.pointerId;joystick.setPointerCapture(pid);joy(e);}
 function jm(e:PointerEvent){if(e.pointerId===pid)joy(e);}
 function ju(e:PointerEvent){if(e.pointerId===pid)clear();}
 function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);r.setSize(w,h,false);cam.aspect=w/h;cam.fov=cam.aspect<.85?70:60;cam.updateProjectionMatrix();}
 function lookDown(e:PointerEvent){if(!active||lookId!==null||e.button!==0)return;e.preventDefault();lookId=e.pointerId;lookX=e.clientX;lookY=e.clientY;canvas.setPointerCapture(e.pointerId);manualUntil=performance.now()+5000;}
 function lookMove(e:PointerEvent){if(e.pointerId!==lookId)return;cameraYaw-=(e.clientX-lookX)*.006;pitch=bounds(pitch+(e.clientY-lookY)*.004,-.10,.48);lookX=e.clientX;lookY=e.clientY;manualUntil=performance.now()+5000;}
 function lookUp(e:PointerEvent){if(e.pointerId===lookId)lookId=null;}
 canvas.addEventListener('pointerdown',lookDown);canvas.addEventListener('pointermove',lookMove);canvas.addEventListener('pointerup',lookUp);canvas.addEventListener('pointercancel',lookUp);canvas.addEventListener('lostpointercapture',lookUp);
 const ro=new ResizeObserver(resize);ro.observe(canvas);resize();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);joystick.addEventListener('pointerdown',jd);joystick.addEventListener('pointermove',jm);joystick.addEventListener('pointerup',ju);joystick.addEventListener('pointercancel',ju);joystick.addEventListener('lostpointercapture',ju);
 function syncTarget(){const t=QUESTS[quest];ring.visible=pin.visible=!!t;if(t){ring.position.set(t.x,.065,t.z);pin.position.set(t.x,1.1,t.z);}near=false;callbacks.onNear(false);}
 syncTarget();
 function frame(now:number){
  if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;if(document.hidden)return;
  const t=QUESTS[quest],cinema=now<cutUntil;
  let dx=0,dz=0;if(active&&!cinema&&t){
   if(auto){if(Math.hypot(t.x-x,t.z-z)<1.02){auto=false;waypoints=[];}else{while(waypoints.length&&Math.hypot(waypoints[0].x-x,waypoints[0].z-z)<.1)waypoints.shift();const p=waypoints[0];if(p){const d=Math.hypot(p.x-x,p.z-z);const speed=Math.min(2.5,d/Math.max(dt,.001));dx=(p.x-x)/Math.max(d,.001)*speed;dz=(p.z-z)/Math.max(d,.001)*speed;}else auto=false;}}

   else {const f=(keys.has('up')?1:0)-(keys.has('down')?1:0)-jz,side=(keys.has('right')?1:0)-(keys.has('left')?1:0)+jx,n=Math.max(1,Math.hypot(f,side));dx=(Math.sin(cameraYaw)*f-Math.cos(cameraYaw)*side)*2.65/n;dz=(Math.cos(cameraYaw)*f+Math.sin(cameraYaw)*side)*2.65/n;}
  }
  const ox=x,oz=z;if(valid(x+dx*dt,z))x+=dx*dt;if(valid(x,z+dz*dt))z+=dz*dt;
  const moving=Math.hypot(x-ox,z-oz)>.002;if(moving){lastMotion=now;const heading=Math.atan2(x-ox,z-oz);yaw+=angleDelta(yaw,heading)*Math.min(1,dt*13);if(auto&&now> manualUntil&&lookId===null)cameraYaw+=angleDelta(cameraYaw,heading)*Math.min(1,dt*4);phase+=dt*9;callbacks.onStep();}else if(active&&lastMotion>0&&now-lastMotion>500&&now>manualUntil&&lookId===null){cameraYaw+=angleDelta(cameraYaw,yaw)*Math.min(1,dt*2.2);}
  hero.root.position.set(x,0,z);hero.root.rotation.y=yaw;hero.body.position.y=moving?Math.abs(Math.sin(phase))*.035:0;for(let i=0;i<2;i++){const swing=moving?Math.sin(phase+i*Math.PI)*.5:0;hero.legs[i].rotation.x=swing;hero.arms[i].rotation.x=-swing*.7;}
  family.body.rotation.z=Math.sin(now*.0013)*.027;family.arms[1].rotation.x=-.22+Math.sin(now*.002)*.12;family2.body.rotation.z=Math.sin(now*.0011)*.02;
  curtain.rotation.y=Math.sin(now*.001)*.035;beam.position.x=-3.7+Math.sin(now*.0002)*.23;pivot.rotation.z=-now*.000105;gem.rotation.y=now*.0018;if(t)pin.position.y=1.1+Math.sin(now*.003)*.15;
  const isNear=!!t&&Math.hypot(t.x-x,t.z-z)<1.32&&active&&!cinema;if(isNear!==near){near=isNear;callbacks.onNear(near);}
  // Shoulder camera: use an indoor collision ray to shorten the boom before walls/furniture.
  door.rotation.y=THREE.MathUtils.lerp(door.rotation.y,doorOpen?1.12:0,Math.min(1,dt*3));
  const forwardX=Math.sin(cameraYaw),forwardZ=Math.cos(cameraYaw),rightX=-Math.cos(cameraYaw),rightZ=Math.sin(cameraYaw);
  pivotCam.set(x,1.38,z);
  const radius=cam.aspect<.85?2.95:3.15,shoulder=cam.aspect<.85?.26:.36;
  desiredCam.set(x-forwardX*radius*Math.cos(pitch)+rightX*shoulder,1.38+radius*Math.sin(pitch)+.22,z-forwardZ*radius*Math.cos(pitch)+rightZ*shoulder);
  desiredCam.y=bounds(desiredCam.y,.95,3.03);
  direction.copy(desiredCam).sub(pivotCam);const full=direction.length();direction.normalize();ray.set(pivotCam,direction);
  let allowed=full;for(const b of blockers){if(b.containsPoint(pivotCam)){allowed=Math.min(allowed,.45);continue;}const result=ray.intersectBox(b,hit);if(result){const dist=hit.distanceTo(pivotCam);if(dist<allowed)allowed=Math.max(.22,dist-.16);}}
  cameraDistance=allowed<cameraDistance?allowed:THREE.MathUtils.lerp(cameraDistance,allowed,Math.min(1,dt*5));
  cam.position.copy(pivotCam).addScaledVector(direction,cameraDistance);
  hero.root.visible=cameraDistance>.72;
  lookAt.set(x+forwardX*3.7+rightX*shoulder,1.45+Math.sin(pitch)*-.9,z+forwardZ*3.7+rightZ*shoulder);cam.lookAt(lookAt);
  if(t){const bearing=Math.atan2(t.x-x,t.z-z);callbacks.onNav(angleDelta(cameraYaw,bearing),Math.hypot(t.x-x,t.z-z));}
  r.render(s,cam);
 }raf=requestAnimationFrame(frame);
 return {target(q){if(level===1&&q===3)doorOpen=true;quest=q;auto=false;syncTarget();},setActive(on){active=on;if(!on)clear();},walkToTarget(){const t=QUESTS[quest];if(active&&t){waypoints=plan(t.x,t.z);auto=waypoints.length>0;keys.clear();}},cinematic(seconds){clear();cutUntil=performance.now()+seconds*1000;},dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);joystick.removeEventListener('pointerdown',jd);joystick.removeEventListener('pointermove',jm);joystick.removeEventListener('pointerup',ju);joystick.removeEventListener('pointercancel',ju);joystick.removeEventListener('lostpointercapture',ju);canvas.removeEventListener('pointerdown',lookDown);canvas.removeEventListener('pointermove',lookMove);canvas.removeEventListener('pointerup',lookUp);canvas.removeEventListener('pointercancel',lookUp);canvas.removeEventListener('lostpointercapture',lookUp);const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();s.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});geos.forEach(v=>v.dispose());mats.forEach(v=>{if('map' in v)(v as THREE.MeshBasicMaterial).map?.dispose();v.dispose();});r.dispose();}};
}
