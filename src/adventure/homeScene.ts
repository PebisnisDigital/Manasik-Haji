import * as THREE from 'three';
import {QUESTS,type Avatar,type Quest} from './state.ts';
export interface HomeCallbacks {onNear:(near:boolean)=>void;onStep:()=>void;onInteract:()=>void}
export interface HomeWorld {target(q:Quest):void;setActive(active:boolean):void;walkToTarget():void;cinematic(seconds:number):void;dispose():void}
type Hit={x:number;z:number;w:number;d:number};
export function mountHome(canvas:HTMLCanvasElement,joystick:HTMLElement,knob:HTMLElement,avatar:Avatar,initial:Quest,callbacks:HomeCallbacks):HomeWorld{
 const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});r.setPixelRatio(Math.min(devicePixelRatio,1.45));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;
 const s=new THREE.Scene();s.background=new THREE.Color(0xd8ddd3);s.add(new THREE.HemisphereLight(0xfff6df,0xb7a78c,2.3));const sun=new THREE.DirectionalLight(0xffe5b0,2.5);sun.position.set(3,10,-6);s.add(sun);
 const mat=(c:number)=>new THREE.MeshStandardMaterial({color:c,roughness:.82});const cream=mat(0xf0e3c7),wood=mat(0x825638),oak=mat(0xc5a276),green=mat(0x557668),dark=mat(0x30464c),gold=mat(0xc7a253),white=mat(0xf7f1df),blue=mat(0x8eb7c5),rose=mat(0x8f6560),leaf=mat(0x46764d),floor=mat(0xd5b99a);
 const obstacles:Hit[]=[];
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=s){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o;}
 function sphere(rad:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=s){const o=new THREE.Mesh(new THREE.SphereGeometry(rad,12,9),m);o.position.set(x,y,z);parent.add(o);return o;}
 function obstacle(x:number,z:number,w:number,d:number){obstacles.push({x,z,w,d});}
 function rug(x:number,z:number,w:number,d:number,m:THREE.Material){box(w,.035,d,m,x,.025,z);box(w-.18,.038,d-.18,cream,x,.027,z);box(w-.34,.04,d-.34,m,x,.029,z);}
 // Open-front dollhouse: the back and left walls provide indoor detail without blocking the camera.
 box(15,.36,11,floor,0,-.2,0);box(16,.2,12,green,0,-.48,0);
 for(let i=-7;i<=7;i++)box(.014,.012,11,oak,i,.001,0);
 for(let i=-5;i<=5;i++)box(15,.012,.014,oak,0,.002,i);
 box(15,3.3,.18,cream,0,1.65,-5.5);box(.18,3.3,11,cream,-7.5,1.65,0);
 box(15,.17,.22,wood,0,.1,-5.37);box(.22,.17,11,wood,-7.37,.1,0);
 // Window, translucent-looking sky, curtains and animated light stripe.
 box(3.6,2,.12,wood,-3.75,1.99,-5.34);box(3.3,1.73,.13,blue,-3.75,1.99,-5.24);box(.08,1.73,.16,white,-3.75,1.99,-5.15);box(3.3,.08,.16,white,-3.75,1.99,-5.15);
 const curtain=box(.4,2.1,.17,green,-5.35,1.98,-5.05);box(.48,2.1,.17,green,-2.15,1.98,-5.05);
 const beam=box(2.9,.014,3.7,new THREE.MeshBasicMaterial({color:0xffd68b,transparent:true,opacity:.28}),-3.7,.04,-2.8);beam.rotation.y=.17;
 rug(-3,0,4.5,3.4,green);rug(3.6,-2.8,2.4,2.7,rose);
 // Sofa and cushions.
 box(3.6,.46,1.28,green,-4.65,.3,-.9);box(3.6,.6,.25,green,-4.65,.77,-1.43);box(.3,.66,1.28,green,-6.3,.57,-.9);box(.3,.66,1.28,green,-3,.57,-.9);box(1,.18,.8,cream,-5.4,.63,-.95);box(.85,.18,.8,rose,-3.9,.63,-.95);obstacle(-4.65,-.9,3.6,1.28);
 // Small table and reading objects; the passage to the TV remains open.
 box(1.55,.15,.9,oak,-3.1,.52,2.65);for(const dx of [-.62,.62])for(const dz of [-.31,.31])box(.09,.46,.09,wood,-3.1+dx,.23,2.65+dz);box(.31,.065,.42,dark,-3.1,.64,2.65);obstacle(-3.1,2.65,1.55,.9);
 // Television cabinet, procedural screen artwork (not a real photograph or sacred-space reconstruction).
 box(3.45,.75,.75,wood,0,.38,-4.65);box(2.78,1.61,.17,dark,0,1.8,-4.88);box(.1,.25,.26,dark,0,.88,-4.88);obstacle(0,-4.65,3.45,.8);
 const tc=document.createElement('canvas');tc.width=640;tc.height=360;const g=tc.getContext('2d')!;
 const sky=g.createLinearGradient(0,0,0,360);sky.addColorStop(0,'#b7ced0');sky.addColorStop(.56,'#eee0b6');sky.addColorStop(1,'#c7c2b1');g.fillStyle=sky;g.fillRect(0,0,640,360);
 g.fillStyle='#e9e5d8';for(let i=0;i<7;i++){g.fillRect(i*100,170,92,83);g.fillStyle='#b6af9d';g.beginPath();g.arc(i*100+45,200,27,Math.PI,0);g.lineTo(i*100+72,240);g.lineTo(i*100+18,240);g.fill();g.fillStyle='#e9e5d8';}g.fillStyle='#202624';g.fillRect(240,101,161,137);g.fillStyle='#4d5048';g.beginPath();g.moveTo(401,101);g.lineTo(446,130);g.lineTo(446,237);g.lineTo(401,238);g.fill();g.fillStyle='#c8aa55';g.fillRect(240,127,161,10);g.fillRect(401,128,45,10);g.fillRect(369,163,18,36);
 g.fillStyle='#ffffff';g.font='600 22px sans-serif';g.textAlign='center';g.fillText('Baitullah • Ilustrasi',320,323);
 const tex=new THREE.CanvasTexture(tc);tex.colorSpace=THREE.SRGBColorSpace;box(2.59,1.43,.025,new THREE.MeshBasicMaterial({map:tex}),0,1.8,-4.775);
 // Reading corner, bookshelf, potted plants, entry door.
 box(.8,1.8,2.6,oak,-6.9,.9,3);for(let i=0;i<5;i++)box(.86,.045,2.64,wood,-6.9,.16+i*.36,3);for(let i=0;i<12;i++)box(.34,.25,.12,i%2?rose:green,-6.75,.32+Math.floor(i/4)*.36,2.35+(i%4)*.32);obstacle(-6.9,3,.8,2.6);
 function plant(x:number,z:number){box(.6,.45,.6,rose,x,.23,z);for(let i=0;i<7;i++){const p=sphere(.28,leaf,x+Math.cos(i*2.4)*.28,.6+(i%3)*.25,z+Math.sin(i*2.4)*.25);p.scale.set(.65,1.85,.65);}obstacle(x,z,.65,.65);}
 plant(6.5,-4.65);plant(-6.6,-4.7);
 box(.18,3,2.5,cream,7.35,1.5,2.7);box(.18,2.6,1.58,wood,7.22,1.3,2.7);box(.14,2.45,1.36,oak,7.1,1.23,2.7);sphere(.065,gold,7.01,1.16,2.17);
 box(1.6,.035,.85,green,5.9,.03,2.7);
 // Pendulum-like clock, Islamic geometric framed decor (no rendered sacred text).
 box(.72,.72,.08,wood,2.65,2.58,-5.27);const clock=new THREE.Mesh(new THREE.CircleGeometry(.31,28),new THREE.MeshBasicMaterial({color:0xf8f1d8}));clock.position.set(2.65,2.58,-5.215);s.add(clock);const hand=box(.028,.25,.025,dark,0,.1,0);const pivot=new THREE.Group();pivot.position.set(2.65,2.58,-5.18);s.add(pivot);pivot.add(hand);
 box(1.15,1,.1,wood,4.2,2.45,-5.29);const frame=box(.65,.65,.07,green,4.2,2.45,-5.2);frame.rotation.z=Math.PI/4;
 function person(female:boolean,color:number,height=1.7){
  const root=new THREE.Group();s.add(root);root.scale.setScalar(height/1.7);const cloth=mat(color),skin=mat(0xb98662),pants=mat(0x33464a),hair=mat(0x292823);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.34,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x372a20,transparent:true,opacity:.2,depthWrite:false}));shadow.position.y=.017;root.add(shadow);
  const body=new THREE.Group();root.add(body);const torso=box(.43,.64,.29,cloth,0,1.04,0,body);torso.scale.set(1,1,1);
  const head=sphere(.155,skin,0,1.51,.035,body);head.scale.set(.91,1.15,.92);if(female){const hood=sphere(.18,cloth,0,1.55,-.055,body);hood.scale.set(1.05,1.19,.85);box(.42,.4,.29,cloth,0,1.25,-.06,body);head.position.z=.11;const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.22,.31,.77,12),cloth);skirt.position.y=.6;body.add(skirt);}else{const cap=sphere(.155,hair,0,1.61,-.025,body);cap.scale.set(1,.47,1);}
  const legs:THREE.Group[]=[],arms:THREE.Group[]=[];
  for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.12,.76,0);body.add(leg);box(.15,.58,.16,pants,0,-.29,0,leg);box(.19,.14,.28,dark,0,-.65,.06,leg);legs.push(leg);const arm=new THREE.Group();arm.position.set(side*.29,1.27,0);body.add(arm);box(.14,.44,.14,cloth,0,-.22,0,arm);sphere(.075,skin,0,-.47,0,arm);arms.push(arm);}
  return {root,body,legs,arms};
 }
 const hero=person(avatar==='female',avatar==='female'?0x69586d:0x597b89);const family=person(true,0xa87864,1.58);family.root.position.set(-4.65,0,.47);family.root.rotation.y=.65;
 const family2=person(false,0xb0a58a,1.68);family2.root.position.set(-5.8,0,2.3);family2.root.rotation.y=.9;
 const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.63,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xd8a62f,side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.position.y=.065;s.add(ring);
 const pin=new THREE.Group();s.add(pin);const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.19),new THREE.MeshBasicMaterial({color:0xffd25c}));pin.add(gem);
 const cam=new THREE.PerspectiveCamera(45,1,.1,70);let x=0,z=3.65,yaw=Math.PI,quest=initial,near=false,active=false,auto=false,raf=0,last=performance.now(),phase=0,cutUntil=0,cutStart=0,disposed=false;
 const keys=new Set<string>();let jx=0,jz=0,pid:number|null=null;
 const bounds=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 function valid(px:number,pz:number){return px>-7&&px<7&&pz>-5&&pz<5&&!obstacles.some(o=>Math.abs(px-o.x)<o.w/2+.26&&Math.abs(pz-o.z)<o.d/2+.26);}
 const keymap:Record<string,string>={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
 function down(e:KeyboardEvent){if(!active||e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement)?.closest('input,select,button,a,textarea'))return;const key=keymap[e.code];if(key){e.preventDefault();keys.add(key);auto=false;}if(e.code==='KeyE'&&!e.repeat){e.preventDefault();callbacks.onInteract();}}
 function up(e:KeyboardEvent){keys.delete(keymap[e.code]);}
 function clear(){keys.clear();jx=jz=0;pid=null;auto=false;knob.style.transform='translate(-50%,-50%)';}
 function joy(e:PointerEvent){const q=joystick.getBoundingClientRect(),rad=q.width*.34,dx=e.clientX-q.left-q.width/2,dz=e.clientY-q.top-q.height/2,m=Math.max(rad,Math.hypot(dx,dz));jx=dx/m;jz=dz/m;knob.style.transform='translate(calc(-50% + '+jx*rad+'px),calc(-50% + '+jz*rad+'px))';}
 function jd(e:PointerEvent){if(!active||pid!==null)return;e.preventDefault();auto=false;pid=e.pointerId;joystick.setPointerCapture(pid);joy(e);}
 function jm(e:PointerEvent){if(e.pointerId===pid)joy(e);}
 function ju(e:PointerEvent){if(e.pointerId===pid)clear();}
 function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
 const ro=new ResizeObserver(resize);ro.observe(canvas);resize();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);joystick.addEventListener('pointerdown',jd);joystick.addEventListener('pointermove',jm);joystick.addEventListener('pointerup',ju);joystick.addEventListener('pointercancel',ju);joystick.addEventListener('lostpointercapture',ju);
 function syncTarget(){const t=QUESTS[quest];ring.visible=pin.visible=!!t;if(t){ring.position.set(t.x,.065,t.z);pin.position.set(t.x,1.1,t.z);}near=false;callbacks.onNear(false);}
 syncTarget();
 function frame(now:number){
  if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;if(document.hidden)return;
  const t=QUESTS[quest],cinema=now<cutUntil;
  let dx=0,dz=0;if(active&&!cinema&&t){
   if(auto){const d=Math.hypot(t.x-x,t.z-z);if(d>1.02){const ax=(t.x-x)/d,az=(t.z-z)/d;dx=ax*2.5;dz=az*2.5;if(!valid(x+dx*.34,z+dz*.34)){const options=[{x:x+az*.65,z:z-ax*.65},{x:x-az*.65,z:z+ax*.65}].filter(p=>valid(p.x,p.z));if(options.length){options.sort((a,b)=>Math.hypot(t.x-a.x,t.z-a.z)-Math.hypot(t.x-b.x,t.z-b.z));dx=(options[0].x-x)*3;dz=(options[0].z-z)*3;}}}else auto=false;}
   else {const f=(keys.has('up')?1:0)-(keys.has('down')?1:0)-jz,side=(keys.has('right')?1:0)-(keys.has('left')?1:0)+jx,n=Math.max(1,Math.hypot(f,side));dx=(-.49*f+.872*side)*2.65/n;dz=(-.872*f-.49*side)*2.65/n;}
  }
  const ox=x,oz=z;if(valid(x+dx*dt,z))x+=dx*dt;if(valid(x,z+dz*dt))z+=dz*dt;
  const moving=Math.hypot(x-ox,z-oz)>.002;if(moving){yaw=Math.atan2(x-ox,z-oz);phase+=dt*10;callbacks.onStep();}
  hero.root.position.set(x,0,z);hero.root.rotation.y=yaw;hero.body.position.y=moving?Math.abs(Math.sin(phase))*.035:0;for(let i=0;i<2;i++){const swing=moving?Math.sin(phase+i*Math.PI)*.5:0;hero.legs[i].rotation.x=swing;hero.arms[i].rotation.x=-swing*.7;}
  family.body.rotation.z=Math.sin(now*.0013)*.027;family.arms[1].rotation.x=-.22+Math.sin(now*.002)*.12;family2.body.rotation.z=Math.sin(now*.0011)*.02;
  curtain.rotation.y=Math.sin(now*.001)*.035;beam.position.x=-3.7+Math.sin(now*.0002)*.23;pivot.rotation.z=-now*.000105;gem.rotation.y=now*.0018;if(t)pin.position.y=1.1+Math.sin(now*.003)*.15;
  const isNear=!!t&&Math.hypot(t.x-x,t.z-z)<1.32&&active&&!cinema;if(isNear!==near){near=isNear;callbacks.onNear(near);}
  const scale=cam.aspect<.8?1.25:1;
  if(cinema&&t){const k=bounds((now-cutStart)/Math.max(1,cutUntil-cutStart),0,1);cam.position.set(t.x+6.7-scale*k*2.1,6.8-scale*k*.8,t.z+9.7-k*2.1);cam.lookAt(t.x,1,t.z);}
  else{cam.position.set(x+5.5*scale,7.8*scale,z+9.8*scale);cam.lookAt(x*.55,0.8,z*.55);}
  r.render(s,cam);
 }raf=requestAnimationFrame(frame);
 return {target(q){quest=q;auto=false;syncTarget();},setActive(on){active=on;if(!on)clear();},walkToTarget(){if(active&&quest<3){auto=true;keys.clear();}},cinematic(seconds){clear();cutStart=performance.now();cutUntil=cutStart+seconds*1000;},dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);joystick.removeEventListener('pointerdown',jd);joystick.removeEventListener('pointermove',jm);joystick.removeEventListener('pointerup',ju);joystick.removeEventListener('pointercancel',ju);joystick.removeEventListener('lostpointercapture',ju);const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();s.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});geos.forEach(v=>v.dispose());mats.forEach(v=>{if('map' in v)(v as THREE.MeshBasicMaterial).map?.dispose();v.dispose();});r.dispose();}};
}
