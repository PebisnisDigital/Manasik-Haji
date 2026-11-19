import * as THREE from 'three';
import type {Npc} from './lessons.ts';
import {practicePosition,type PracticeMode} from './practice.ts';
import {packingItems} from './packing.ts';
import {brandName,brandAccent} from '../tenant.ts';
import {missions,type Avatar,type Quest,type PlayableLevel} from './state.ts';
export interface HomeCallbacks {onNear:(near:boolean)=>void;onStep:()=>void;onCollect:()=>void;onTask:()=>void;onNpc:(npc:Npc|null)=>void;onBubble:(x:number,y:number,visible:boolean)=>void;onNav:(angle:number,distance:number)=>void}
export interface HomeWorld {target(q:Quest):void;setActive(active:boolean):void;walkToTarget():void;cinematic(seconds:number):void;talk(speaker:string,npc?:Npc):void;unlockCoin():void;packItem(index:number):void;practice(mode:PracticeMode,p:number):void;loadLuggage():void;airportAction(q:Quest,index:number):void;flightAction(q:Quest,index:number):void;dispose():void}
type Hit={x:number;z:number;w:number;d:number};
export function mountHome(canvas:HTMLCanvasElement,joystick:HTMLElement,knob:HTMLElement,avatar:Avatar,initial:Quest,level:PlayableLevel,callbacks:HomeCallbacks):HomeWorld{
 const QUESTS=missions(level);
 canvas.style.touchAction='none';const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio,1.45));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
 const s=new THREE.Scene();s.background=new THREE.Color(0xcac7b7);s.add(new THREE.HemisphereLight(0xfff6e2,0xa6a5a0,1.7));const sun=new THREE.DirectionalLight(0xffe5b9,2.4);sun.position.set(-4,5.7,-3.5);sun.target.position.set(1,0,2);s.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.camera.near=.2;sun.shadow.camera.far=23;sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;const fill=new THREE.PointLight(0xffefd5,12,12,2);fill.position.set(1,2.8,.2);s.add(fill);
 const mat=(c:number)=>new THREE.MeshStandardMaterial({color:c,roughness:.82});const cream=mat(0xe8e0ca),wood=mat(0x825638),oak=mat(0xc5a276),green=mat(0x778c62),dark=mat(0x30464c),gold=mat(0xc7a253),white=mat(0xf7f1df),blue=mat(0x8eb7c5),rose=mat(0xa97767),leaf=mat(0x46764d),floor=mat(0xd5b99a);
 const obstacles:Hit[]=[];const blockers:THREE.Box3[]=[];
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=s){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function sphere(rad:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=s){const o=new THREE.Mesh(new THREE.SphereGeometry(rad,12,9),m);o.position.set(x,y,z);parent.add(o);return o;}
 function obstacle(x:number,z:number,w:number,d:number,h=1.05){obstacles.push({x,z,w,d});blockers.push(new THREE.Box3(new THREE.Vector3(x-w/2-.13,.02,z-d/2-.13),new THREE.Vector3(x+w/2+.13,h+.13,z+d/2+.13)));}
 function rug(x:number,z:number,w:number,d:number,m:THREE.Material){box(w,.035,d,m,x,.025,z);box(w-.18,.038,d-.18,cream,x,.027,z);box(w-.34,.04,d-.34,m,x,.029,z);}
 // Fully enclosed interior, with a doorway to a separate prayer alcove.
 // Ceramic floor: 40–45 cm ivory tiles, soft mottling and grey grout.
 function surface(w:number,h:number,paint:(g:CanvasRenderingContext2D)=>void){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d')!);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,r.capabilities.getMaxAnisotropy());return t;}
 const tiles=surface(256,256,g=>{g.fillStyle='#aaa69a';g.fillRect(0,0,256,256);const gradient=g.createLinearGradient(4,0,250,256);gradient.addColorStop(0,'#f1eee6');gradient.addColorStop(.5,'#d9d7ce');gradient.addColorStop(1,'#e8e5db');g.fillStyle=gradient;g.fillRect(3,3,250,250);for(let i=0;i<34;i++){g.strokeStyle='rgba(160,151,136,.055)';g.beginPath();g.moveTo(5,Math.random()*245);g.bezierCurveTo(80,Math.random()*245,170,Math.random()*245,250,Math.random()*245);g.stroke();}g.strokeStyle='#faf8ed';g.strokeRect(4,4,248,248);});
 tiles.wrapS=tiles.wrapT=THREE.RepeatWrapping;tiles.repeat.set(34,25);floor.map=tiles;floor.color.setHex(0xffffff);floor.roughness=.44;
 const batik=surface(256,256,g=>{g.fillStyle='#70503b';g.fillRect(0,0,256,256);for(let y=-32;y<288;y+=64)for(let x=-32;x<288;x+=64){g.save();g.translate(x,y);g.rotate(Math.PI/4);g.strokeStyle='#d2b17c';g.lineWidth=2.5;g.strokeRect(-18,-18,36,36);g.strokeRect(-12,-12,24,24);g.fillStyle='#dfc89c';g.beginPath();g.arc(0,0,5,0,Math.PI*2);g.fill();g.restore();}for(let y=8;y<256;y+=16)for(let x=8;x<256;x+=16){g.fillStyle='#c6a17466';g.fillRect(x,y,2,2);}});batik.wrapS=batik.wrapT=THREE.RepeatWrapping;batik.repeat.set(2,2);
 const clothPattern=new THREE.MeshStandardMaterial({map:batik,roughness:.92});
 const ground=box(15,.36,11,floor,0,-.2,0);ground.castShadow=false;
 const ceiling=box(15,.14,11,mat(0xf3eee1),0,3.37,0);ceiling.castShadow=false;
 function wall(x:number,z:number,w:number,d:number,h=3.3){const o=box(w,h,d,cream,x,h/2,z);o.castShadow=false;obstacle(x,z,w,d,h);box(w+.025,.12,d+.025,wood,x,.06,z).castShadow=false;}
 const boundaryStart=s.children.length;
 wall(0,-5.5,15,.18);wall(-7.5,0,.18,11);wall(0,5.5,15,.18);wall(7.5,-1.75,.18,7.5);wall(7.5,4.48,.18,2.04);box(.18,.68,1.5,cream,7.5,2.96,2.75).castShadow=false;box(2.4,.28,2.4,oak,8.55,-.16,2.75).castShadow=false;box(.18,3.3,2.4,cream,9.6,1.65,2.75).castShadow=false;blockers.push(new THREE.Box3(new THREE.Vector3(7.17,0,1.95),new THREE.Vector3(7.65,3.3,3.55)));
 const houseStart=s.children.length,houseObstacles=obstacles.length,houseBlockers=blockers.length;
 // Interior divider: a generous opening near z=0 keeps every mission reachable.
 wall(2.45,-3.45,.14,4.1);wall(2.45,3.9,.14,3.2);
 const lintel=box(.16,.65,3.5,cream,2.45,2.98,.55);lintel.castShadow=false;
 const jambMat=mat(0xa17a52);box(.23,2.65,.13,jambMat,2.45,1.325,-1.33);box(.23,2.65,.13,jambMat,2.45,1.325,2.23);box(.23,.13,3.68,jambMat,2.45,2.65,.45);
 // Ceiling fixtures: warm pools of light without expensive dynamic point shadows.
 for(const x of [-3.3,4.8]){box(.72,.08,.72,mat(0xe6d5b4),x,3.16,0).castShadow=false;box(.54,.045,.54,new THREE.MeshBasicMaterial({color:0xffefc6}),x,3.09,0).castShadow=false;const lamp=new THREE.PointLight(0xffe5bb,8,7,2);lamp.position.set(x,2.95,0);s.add(lamp);}
 // Jendela kusen kayu dengan pemandangan gang & genteng merah.
 const street=surface(768,432,g=>{const sky=g.createLinearGradient(0,0,0,432);sky.addColorStop(0,'#9ed0e6');sky.addColorStop(1,'#e7e2c3');g.fillStyle=sky;g.fillRect(0,0,768,432);g.fillStyle='#9ea7a0';g.fillRect(0,320,768,112);for(let i=0;i<4;i++){const x=i*220-80,y=180+(i%2)*18;g.fillStyle=i%2?'#dbd0a9':'#c8d0b6';g.fillRect(x,y,200,150);g.fillStyle='#884833';g.beginPath();g.moveTo(x-12,y);g.lineTo(x+91,y-75);g.lineTo(x+212,y);g.closePath();g.fill();g.strokeStyle='#b97853';for(let j=0;j<8;j++){g.beginPath();g.moveTo(x-4+j*12,y-j*9);g.lineTo(x+200-j*13,y-j*9);g.stroke();}g.fillStyle='#55766b';g.fillRect(x+28,y+37,53,66);g.fillStyle='#80664d';g.fillRect(x+119,y+49,41,101);}for(let i=0;i<34;i++){g.fillStyle=['#64864c','#729859','#426f4e'][i%3];g.beginPath();g.arc(654+Math.sin(i*2.4)*89,110+Math.cos(i*1.7)*76,21+i%4*5,0,Math.PI*2);g.fill();}g.fillStyle='#78604c';g.fillRect(650,133,11,203);g.strokeStyle='#5d655e';g.lineWidth=3;g.beginPath();g.moveTo(0,90);g.quadraticCurveTo(380,130,768,65);g.stroke();});
 box(3.65,2,.12,wood,-3.75,1.99,-5.34);box(3.31,1.73,.13,new THREE.MeshBasicMaterial({map:street}),-3.75,1.99,-5.24);
 for(const dx of [-1.08,0,1.08])box(.075,1.73,.16,wood,-3.75+dx,1.99,-5.15);box(3.3,.075,.16,wood,-3.75,1.99,-5.15);
 const curtain=new THREE.Group();curtain.position.set(-5.32,1.99,-5.03);s.add(curtain);
 const curtainMat=mat(0xa4b28a);for(let i=0;i<7;i++){box(.08,2.03,.15,curtainMat,i*.062,0,Math.sin(i*1.6)*.055,curtain);box(.08,2.03,.15,curtainMat,3.14-i*.062,0,Math.sin(i*1.6)*.055,curtain);}
 box(3.88,.055,.065,wood,-3.75,3.06,-4.98);
 const beam=box(2.9,.014,3.7,new THREE.MeshBasicMaterial({color:0xffd68b,transparent:true,opacity:.17}),-3.7,.04,-2.8);beam.rotation.y=.17;beam.castShadow=false;
 // Tikar anyaman and patterned prayer mat.
 const weave=surface(128,128,g=>{g.fillStyle='#a99c71';g.fillRect(0,0,128,128);for(let i=0;i<128;i+=4){g.fillStyle=i%8?'#c9bd90':'#8d8159';g.fillRect(0,i,128,2);g.fillStyle='#dfcfa14d';g.fillRect(i,0,1,128);}});weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(9,7);const woven=new THREE.MeshStandardMaterial({map:weave,roughness:1});
 const tikar=box(4.5,.018,3.4,woven,-3,.005,0);tikar.castShadow=false;
 rug(3.6,-2.8,2.4,2.7,rose);if(level===2){const prayer=surface(256,400,g=>{g.fillStyle='#3e674c';g.fillRect(0,0,256,400);g.strokeStyle='#e2cd8d';g.lineWidth=6;g.strokeRect(13,15,230,370);g.lineWidth=3;g.strokeRect(25,28,206,344);g.beginPath();g.moveTo(48,318);g.lineTo(48,131);g.quadraticCurveTo(128,27,208,131);g.lineTo(208,318);g.closePath();g.stroke();for(let i=0;i<12;i++){g.fillStyle='#d8c58d';g.fillRect(12+i*20,4,3,11);g.fillRect(12+i*20,386,3,11);}});const pm=new THREE.MeshStandardMaterial({map:prayer,roughness:1});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.8).rotateX(-Math.PI/2),pm);mesh.position.set(3.5,.055,-2.65);s.add(mesh);}
 // Sofa and cushions.
 box(3.6,.46,1.28,green,-4.65,.3,-.9);box(3.6,.6,.25,green,-4.65,.77,-1.43);box(.3,.66,1.28,green,-6.3,.57,-.9);box(.3,.66,1.28,green,-3,.57,-.9);box(1,.18,.8,clothPattern,-5.4,.63,-.95);box(.85,.18,.8,rose,-3.9,.63,-.95);obstacle(-4.65,-.9,3.6,1.28);
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
 // Familiar everyday Indonesian household props, assembled as native 3D geometry.
 const plastic=mat(0xe4e6d9),black=mat(0x303632),red=mat(0xb83235),silver=mat(0x9faaa8);
 function cylinder(rt:number,rb:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=s){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,20),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 // Water dispenser, blue refill gallon and red/blue taps.
 box(.49,.83,.48,plastic,6.72,.43,-2.75);box(.4,.21,.07,black,6.72,.63,-2.49);box(.09,.075,.16,red,6.61,.65,-2.45);box(.09,.075,.16,blue,6.83,.65,-2.45);box(.35,.07,.18,silver,6.72,.45,-2.42);
 const jugMat=new THREE.MeshStandardMaterial({color:0x4a9fd0,roughness:.29,metalness:.05});cylinder(.15,.15,.09,blue,6.72,.9,-2.75);cylinder(.23,.23,.43,jugMat,6.72,1.16,-2.75);sphere(.23,jugMat,6.72,1.36,-2.75).scale.y=.46;for(let k=0;k<3;k++)cylinder(.234,.234,.025,blue,6.72,1.01+k*.13,-2.75);obstacle(6.72,-2.75,.52,.55,1.5);
 // Shoe rack beside entrance; colourful flip-flops, no collision in the doorway.
 box(.38,.12,1.48,wood,6.85,.1,4.45);box(.38,.08,1.48,wood,6.85,.46,4.45);box(.38,.08,1.48,wood,6.85,.8,4.45);for(const z of [3.76,5.12])box(.38,.8,.08,wood,6.85,.46,z);obstacle(6.85,4.45,.38,1.48,.84);
 for(let i=0;i<6;i++){const col=[red,dark,blue][Math.floor(i/2)];const z=3.99+i*.18;box(.28,.035,.11,col,6.84,.52,z);const strap=box(.13,.065,.028,black,6.78,.57,z);strap.rotation.y=.3;}
 // Standing electric fan with protective wire ring and spinning blades.
 const fx=-6.8,fz=-2.9;cylinder(.29,.32,.07,plastic,fx,.035,fz);cylinder(.027,.027,1.08,silver,fx,.56,fz);const fan=new THREE.Group();fan.position.set(fx,1.22,fz);fan.rotation.y=.92;s.add(fan);const guard=new THREE.Mesh(new THREE.TorusGeometry(.29,.018,6,36),silver);fan.add(guard);const guard2=new THREE.Mesh(new THREE.TorusGeometry(.22,.009,5,32),silver);guard2.position.z=.075;fan.add(guard2);for(let i=0;i<12;i++){const wire=box(.012,.55,.012,silver,0,0,.075,fan);wire.rotation.z=i*Math.PI/12;}const blades=new THREE.Group();fan.add(blades);for(let i=0;i<3;i++){const b=box(.115,.235,.025,blue,Math.sin(i*Math.PI*2/3)*.13,Math.cos(i*Math.PI*2/3)*.13,.005,blades);b.rotation.z=-i*Math.PI*2/3+.25;}sphere(.065,plastic,0,0,.085,fan);obstacle(fx,fz,.65,.65,1.55);
 // Calendar with Indonesian weekday names and fictional date, no brand.
 const calendar=surface(512,640,g=>{g.fillStyle='#faf6e9';g.fillRect(0,0,512,640);g.fillStyle='#ad282d';g.fillRect(0,0,512,105);g.textAlign='center';g.fillStyle='#fff';g.font='bold 36px sans-serif';g.fillText('KALENDER',256,45);g.font='24px sans-serif';g.fillText('NOVEMBER 2026',256,82);g.fillStyle='#413e39';g.font='22px sans-serif';['Min','Sen','Sel','Rab','Kam','Jum','Sab'].forEach((day,i)=>g.fillText(day,44+i*70,150));for(let i=0;i<30;i++){g.fillStyle=i%7===0?'#b22d31':'#383b37';g.font='bold 27px sans-serif';g.fillText(String(i+1),44+i%7*70,203+Math.floor(i/7)*66);}g.fillStyle='#596d51';g.font='22px sans-serif';g.fillText('Satu hari, satu kebaikan.',256,579);});
 box(.53,.66,.035,new THREE.MeshBasicMaterial({map:calendar}),1.43,2.38,-5.37);
 // Family photo frames and a modest red-white Indonesian motif.
 const familyArt=surface(320,220,g=>{g.fillStyle='#c9d3b7';g.fillRect(0,0,320,220);g.fillStyle='#a2ab85';g.fillRect(0,160,320,60);for(let i=0;i<4;i++){const x=55+i*69,y=i===2?103:70;g.fillStyle=['#677555','#b0836c','#9caa91','#59796e'][i];g.beginPath();g.ellipse(x,y+60,30,58,0,0,Math.PI*2);g.fill();g.fillStyle='#bb8b64';g.beginPath();g.arc(x,y,16,0,Math.PI*2);g.fill();}g.strokeStyle='#fff5dd';g.strokeRect(8,8,304,204);});
 box(.83,.61,.05,wood,-.0,2.93,-5.36);box(.75,.53,.03,new THREE.MeshBasicMaterial({map:familyArt}),0,2.93,-5.32);
 box(.35,.18,.025,red,1.8,2.93,-5.36);box(.35,.18,.025,white,1.8,2.75,-5.36);
 // Tissue box, cup of tea, TV remote and folded mukena.
 box(.28,.14,.17,plastic,-3.37,.66,2.66);box(.04,.12,.12,white,-3.37,.77,2.66);cylinder(.075,.052,.12,white,-2.69,.66,2.66);cylinder(.062,.062,.007,mat(0x8d512e),-2.69,.724,2.66);
 box(.19,.035,.055,black,-.79,.79,-4.35);for(let j=0;j<5;j++)box(.02,.008,.025,plastic,-.86+j*.027,.812,-4.35);
 if(level===2){box(.47,.13,.34,white,5.8,.095,-3.65);box(.47,.025,.34,clothPattern,5.8,.17,-3.65);}
 // Office variant shares only the architecture and movement engine, not the home furnishings.
 let drawOfficeBrand:()=>void=()=>{};
 if(level>=3&&level<=5){
  const documents=level===4,clinic=level===5;
  for(const obj of s.children.slice(houseStart))obj.visible=false;obstacles.splice(houseObstacles);blockers.splice(houseBlockers);
  const officeAccent=mat(0x28634f),counter=mat(0xefebe0),metal=mat(0x7c8e8d),glass=new THREE.MeshStandardMaterial({color:0x9dbfc9,roughness:.24,metalness:.05}),monitor=mat(0x24312e);
  const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=256;const og=signCanvas.getContext('2d')!;const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;let prev='';
  drawOfficeBrand=()=>{const name=brandName()==='MANASIK 3D'?'MANASIK TRAVEL • DEMO':brandName();const accent=clinic?'#217c79':documents?'#305777':brandAccent(),key=name+accent;if(key===prev)return;prev=key;officeAccent.color.set(accent);og.fillStyle=accent;og.fillRect(0,0,1024,256);og.fillStyle='#fff4da';og.textAlign='center';og.font='bold 62px sans-serif';og.fillText(clinic?'KLINIK PERSIAPAN IBADAH':documents?'PUSAT PERSIAPAN DOKUMEN':name.slice(0,60),512,104,960);og.font='30px sans-serif';og.fillText(clinic?'PEMERIKSAAN • VAKSINASI • BEKAL SEHAT':documents?'PASPOR • VISA • ARSIP':'KANTOR LAYANAN HAJI & UMRAH',512,163,960);og.font='21px sans-serif';og.fillText(clinic?'SIMULASI EDUKASI • BUKAN LAYANAN MEDIS':documents?'SIMULASI • BUKAN KANTOR PEMERINTAH':'SIMULASI EDUKASI • BUKAN BUKTI IZIN',512,213,960);signTex.needsUpdate=true;};
  drawOfficeBrand();box(7.5,1.85,.04,new THREE.MeshBasicMaterial({map:signTex}),0,2.36,-5.35).castShadow=false;
  function sign(text:string,sub:string,x:number,y:number,z:number,w=2.1){const t=surface(512,180,g=>{g.fillStyle=clinic?'#236966':documents?'#254966':'#153d31';g.fillRect(0,0,512,180);g.fillStyle='#f4dc9b';g.font='bold 34px sans-serif';g.textAlign='center';g.fillText(text,256,72,490);g.fillStyle='#fff';g.font='22px sans-serif';g.fillText(sub,256,123,490);});box(w,w*.35,.04,new THREE.MeshBasicMaterial({map:t}),x,y,z).castShadow=false;}
  function service(x:number,z:number,label:string,subtitle:string){box(2.5,.9,.82,wood,x,.45,z);box(2.66,.09,1,counter,x,.94,z);box(2.18,.65,.045,officeAccent,x,.47,z+.43);sign(label,subtitle,x,.55,z+.47,1.85);box(.48,.35,.09,monitor,x-.72,1.19,z-.04);box(.25,.04,.18,metal,x-.72,1.01,z);box(.34,.025,.23,white,x+.63,1.01,z+.17);obstacle(x,z,2.66,1,1.45);}
  if(clinic){
   service(-4,-3,'01 • PEMERIKSAAN','Kesiapan kesehatan');service(3.5,-3,'02 • VAKSINASI','Panduan persyaratan');service(4.5,1.05,'03 • FARMASI','Obat dan kebugaran');
   const teal=mat(0x3f9695),steel=mat(0x9daea9),linen=mat(0xf6f8e9);
   // Examination bed, pillow, modest privacy screen alongside the doctor's area.
   box(.82,.12,1.84,steel,-6.2,.66,-.4);box(.82,.16,1.76,teal,-6.2,.81,-.4);box(.7,.13,.4,linen,-6.2,.98,-1.02);for(const z of [-1.12,.32])for(const x of [-6.5,-5.9])box(.055,.65,.055,steel,x,.34,z);obstacle(-6.2,-.4,.88,1.9,1.05);
   box(.05,1.7,1.3,linen,-6.98,1.2,-.45);box(.065,1.98,.065,steel,-7,1,-1.13);box(.065,1.98,.065,steel,-7,1,.23);
   // Blood pressure training monitor; no invented patient value or diagnosis.
   const display=surface(384,220,g=>{g.fillStyle='#bfddd1';g.fillRect(0,0,384,220);g.textAlign='center';g.fillStyle='#315b54';g.font='bold 28px sans-serif';g.fillText('TENSIMETER DEMO',192,42);g.font='bold 58px monospace';g.fillText('-- / --',192,121);g.font='24px sans-serif';g.fillText('mmHg • SIMULASI',192,183);});
   box(.48,.23,.32,linen,-3.38,1.10,-2.85);box(.39,.16,.018,new THREE.MeshBasicMaterial({map:display}),-3.38,1.15,-2.675);box(.26,.10,.20,dark,-4.1,1.04,-2.68);
   // Model medical refrigerator and vaccine information board, no brand/dose claims.
   box(.78,1.72,.66,linen,6.35,.86,-3.95);box(.67,1.22,.035,glass,6.35,1.06,-3.58);box(.055,.32,.055,steel,6.68,.92,-3.55);obstacle(6.35,-3.95,.8,.7,1.8);
   for(let j=0;j<3;j++){box(.17,.22,.22,white,3.85+j*.21,1.1,-2.82);box(.17,.06,.225,teal,3.85+j*.21,1.17,-2.82);}
   // Pharmacy shelves, unbranded demonstration cartons, small exercise area.
   box(.58,1.65,1.55,linen,6.72,.825,1.0);for(let j=0;j<3;j++){box(.63,.06,1.58,steel,6.72,.38+j*.45,1.0);for(let k=0;k<4;k++)box(.24,.22,.18,k%2?white:blue,6.5,.52+j*.45,.45+k*.32);}obstacle(6.72,1,.63,1.58,1.7);
   box(1.5,.035,.95,teal,.0,.045,-4.05).castShadow=false;box(.14,.62,.14,steel,.0,.33,-4.45);box(.62,.08,.18,steel,0,.68,-4.45);obstacle(0,-4.45,.66,.3,.7);
  }else if(documents){
   service(-4,-3,'01 • PASPOR','Pemeriksaan identitas');service(3.5,-3,'02 • VISA','Periksa izin ibadah');service(4.5,1.05,'03 • ARSIP','Kelengkapan berkas');
   // Large, unambiguously fictional training specimens on the visitor side of each service counter.
   function specimen(title:string,lines:string[],x:number,z:number,color:string){const t=surface(512,320,g=>{g.fillStyle='#f4efe1';g.fillRect(0,0,512,320);g.fillStyle=color;g.fillRect(0,0,512,78);g.fillStyle='#fff';g.font='bold 28px sans-serif';g.textAlign='center';g.fillText(title,256,47,480);g.fillStyle='#35474e';g.textAlign='left';g.font='23px sans-serif';lines.forEach((line,i)=>g.fillText(line,27,114+i*42,460));g.save();g.translate(256,177);g.rotate(-.28);g.fillStyle='#8e303099';g.font='bold 43px sans-serif';g.textAlign='center';g.fillText('CONTOH',0,0);g.restore();g.fillStyle='#852f30';g.textAlign='center';g.font='bold 18px sans-serif';g.fillText('TIDAK BERLAKU • SIMULASI GAME',256,299);});const doc=new THREE.Mesh(new THREE.PlaneGeometry(.75,.47).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));doc.position.set(x,1.00,z);s.add(doc);}
   specimen('PASPOR DEMO',['Nama: JEMAAH CONTOH','Identitas: FIKTIF','Masa berlaku: CONTOH'],-3.65,-2.75,'#265f55');
   specimen('VISA DEMO',['Jenis izin: CONTOH','Nomor: TIDAK BERLAKU','Rute: SESUAI IBADAH'],3.85,-2.75,'#305777');
   specimen('MAP BERKAS',['Paspor dan visa','Tiket dan identitas','Kontak darurat'],4.85,1.3,'#876334');
   // Archive cabinetry and a mock document photography station (no live camera).
   for(const cx of [-6.62,6.65]){box(.75,1.85,1.45,metal,cx,.925,-1.85);for(let j=0;j<4;j++){box(.78,.035,1.45,wood,cx,.3+j*.43,-1.85);box(.095,.035,.15,black,cx+(cx<0?.4:-.4),.5+j*.43,-1.85);}obstacle(cx,-1.85,.8,1.5,1.9);}
   box(1.65,2.15,.12,blue,-.3,1.12,-5.2);box(.62,.38,.24,black,-.3,1.45,-4.7);box(.045,.9,.045,metal,-.3,.55,-4.7);obstacle(-.3,-4.7,.7,.5,1.7);
  }else{service(-4,-3,'01 • INFORMASI','Cek legalitas');service(3.5,-3,'02 • KONSULTASI','Rencana perjalanan');service(4.5,1.05,'03 • PENDAFTARAN','Data contoh saja');}
  // Rear opening and glass partitions, seating and brochure rack.
  box(.12,2.45,2.1,glass,-7.35,1.24,2.3);box(2.6,.13,1.1,officeAccent,-4,.075,2.9);for(const cx of [-5.2,-4,-2.8]){box(.92,.12,.75,officeAccent,cx,.48,3.75);box(.92,.57,.12,officeAccent,cx,.78,4.1);for(const dx of [-.34,.34])for(const dz of [-.25,.25])box(.052,.4,.052,metal,cx+dx,.21,3.75+dz);obstacle(cx,3.75,.94,.8,.99);}
  for(const x of [-2.2,2.25]){box(.65,.05,.48,oak,x,.9,-4.3);for(let j=0;j<4;j++)box(.4,.018,.3,j%2?white:blue,x,.94+j*.024,-4.3+j*.025);box(.09,1,.09,wood,x,.5,-4.3);obstacle(x,-4.3,.66,.5,1);}
  for(const px of [-6.5,6.6]){box(.6,.45,.6,cream,px,.23,-4.55);for(let j=0;j<6;j++){const p=sphere(.23,leaf,px+Math.sin(j*2.4)*.22,.6+(j%3)*.24,-4.55+Math.cos(j*2.4)*.22);p.scale.set(.65,1.7,.65);}obstacle(px,-4.55,.65,.65,1.4);}
  for(const px of [-4,0,4]){box(1.8,.06,.35,white,px,3.15,0).castShadow=false;box(1.6,.025,.23,new THREE.MeshBasicMaterial({color:0xffffe8}),px,3.10,0).castShadow=false;const light=new THREE.PointLight(0xfff5dc,12,8,2);light.position.set(px,2.95,0);s.add(light);}
  const poster=surface(512,640,g=>{g.fillStyle='#f2ede0';g.fillRect(0,0,512,640);g.fillStyle='#245846';g.fillRect(0,0,512,140);g.fillStyle='#fff';g.font='bold 35px sans-serif';g.textAlign='center';g.fillText(clinic?'BEKAL JEMAAH SEHAT':documents?'SIAPKAN DOKUMEN':'CEK SEBELUM DAFTAR',256,82,485);g.fillStyle='#29453a';g.textAlign='left';g.font='29px sans-serif';(clinic?['01  Konsultasi kesehatan','02  Cek vaksinasi','03  Latihan bertahap','04  Obat sesuai resep']:documents?['01  Identitas & paspor','02  Visa / izin','03  Salinan aman','04  Kontak darurat']:['01  Legalitas resmi','02  Rincian layanan','03  Bukti pendaftaran','04  Kontak pembimbing']).forEach((t,i)=>g.fillText(t,38,215+i*83));g.fillStyle='#99783f';g.font='19px sans-serif';g.fillText('Materi simulasi calon jamaah',38,600);});const p=box(.05,1.8,1.45,new THREE.MeshBasicMaterial({map:poster}),-7.35,1.95,-.8);p.castShadow=false;
 }
 // Packing uses a separate furnished preparation room with three actual luggage stations.
 type PackedProp={mesh:THREE.Object3D;from:THREE.Vector3;to:THREE.Vector3;start:number;inside:boolean};
 const packingProps:PackedProp[][]=[];
 if(level===6){
  for(const obj of s.children.slice(houseStart))obj.visible=false;obstacles.splice(houseObstacles);blockers.splice(houseBlockers);
  const textile=mat(0x837f9b),shell=mat(0x354d53),lining=mat(0xbbb7a9),metal=mat(0x9ba6a4);
  const titleTex=surface(1024,230,g=>{g.fillStyle='#46594e';g.fillRect(0,0,1024,230);g.fillStyle='#ffedbd';g.textAlign='center';g.font='bold 60px sans-serif';g.fillText('RUANG PERSIAPAN KOPER',512,105,980);g.font='29px sans-serif';g.fillText('PAKAIAN • KEBUTUHAN PRIBADI • TAS KABIN',512,167,980);});
  box(7.8,1.7,.04,new THREE.MeshBasicMaterial({map:titleTex}),0,2.35,-5.36).castShadow=false;
  function station(q:number,x:number,z:number,label:string){
   box(2.66,.11,1.12,oak,x,.78,z);for(const dx of [-1.15,1.15])for(const dz of [-.43,.43])box(.095,.72,.095,wood,x+dx,.36,z+dz);obstacle(x,z,2.66,1.12,1.5);
   const t=surface(512,150,g=>{g.fillStyle='#394b42';g.fillRect(0,0,512,150);g.textAlign='center';g.fillStyle='#ffedc2';g.font='bold 39px sans-serif';g.fillText(label,256,89,490);});
   box(2.25,.52,.05,new THREE.MeshBasicMaterial({map:t}),x,.43,z+.55).castShadow=false;
   // Open suitcase base and upright lid, with handles and straps.
   const bx=x+.62;box(1.12,.22,.87,shell,bx,.945,z);box(1.02,.027,.76,lining,bx,1.075,z);
   for(const dx of [-.55,.55])box(.045,.16,.86,shell,bx+dx,1.085,z);
   for(const dz of [-.42,.42])box(1.12,.16,.045,shell,bx,1.085,z+dz);
   box(1.12,.82,.09,shell,bx,1.46,z-.44);box(.98,.70,.025,lining,bx,1.46,z-.385);
   for(const dx of [-.34,.34])box(.055,.67,.028,textile,bx+dx,1.46,z-.365);
   box(.26,.06,.075,metal,bx,.95,z+.49);
   const items=packingItems(q,avatar);const props:PackedProp[]=[];
   items.forEach((it,i)=>{
    const group=new THREE.Group(),m=mat(it.color);s.add(group);
    if(q===0){for(let j=0;j<3;j++)box(.3,.052,.30,m,0,j*.052,0,group);}
    else if(q===1&&i===0){box(.18,.30,.19,m,0,.12,0,group);box(.09,.065,.10,white,0,.294,0,group);}
    else if(q===1&&i===1){for(const dx of [-.08,.08]){box(.12,.05,.28,m,dx,.02,0,group);const strap=box(.11,.08,.035,dark,dx,.085,.02,group);strap.rotation.y=.2;}}
    else if(q===2&&i===1){box(.26,.16,.22,m,0,.065,0,group);box(.25,.03,.12,green,0,.15,.025,group);}
    else{box(.28,.08,.29,m,0,.035,0,group);box(.23,.022,.22,white,0,.085,.02,group);}
    const from=new THREE.Vector3(x-.82,.88,z-.32+i*.32),to=new THREE.Vector3(bx-.29+i*.285,1.09,z+.02);group.position.copy(from);props.push({mesh:group,from,to,start:0,inside:false});
   });packingProps.push(props);
  }
  station(0,-4,-3,'01 • PAKAIAN');station(1,3.5,-3,'02 • BARANG PRIBADI');station(2,4.5,1.05,'03 • TAS KABIN');
  // Bedroom wardrobe, folded linen and home furnishings distinguish this room from service offices.
  box(.78,2.25,2.2,wood,-6.9,1.125,-2);for(const z of [-2.56,-1.44]){box(.05,2.10,1.04,oak,-6.48,1.125,z);box(.055,.3,.07,metal,-6.43,1.1,z+.25);}obstacle(-6.9,-2,.83,2.2,2.3);
  box(2.45,.4,1.05,wood,-4.5,.25,3.8);box(2.45,.19,1.05,textile,-4.5,.54,3.8);obstacle(-4.5,3.8,2.45,1.05,.8);
  const matHome=box(3.3,.025,2.65,green,-.2,.025,.0);matHome.castShadow=false;
  box(.7,.5,.7,cream,6.6,.25,-4.65);for(let i=0;i<5;i++){const p=sphere(.22,leaf,6.6+Math.cos(i*2.4)*.22,.65+(i%3)*.25,-4.65+Math.sin(i*2.4)*.22);p.scale.set(.65,1.7,.65);}obstacle(6.6,-4.65,.75,.75,1.35);
  for(const px of [-4,0,4]){box(1.15,.07,.45,white,px,3.16,0).castShadow=false;const light=new THREE.PointLight(0xffefd9,10,8,2);light.position.set(px,2.95,0);s.add(light);}
 }
 let tawafDot:THREE.Mesh|null=null,saiDot:THREE.Mesh|null=null;
 if(level===7){
  for(const obj of s.children.slice(houseStart))obj.visible=false;obstacles.splice(houseObstacles);blockers.splice(houseBlockers);
  const sage=mat(0x466c59),linen=mat(0xefece0),steel=mat(0x9aa59c),blackCloth=mat(0x252722),stone=mat(0xc6b9a1);
  function panel(title:string,sub:string,x:number,y:number,z:number,w:number){const tex=surface(1024,300,g=>{g.fillStyle='#214b3b';g.fillRect(0,0,1024,300);g.fillStyle='#f7e4ae';g.font='bold 62px sans-serif';g.textAlign='center';g.fillText(title,512,117,980);g.fillStyle='#fff';g.font='36px sans-serif';g.fillText(sub,512,205,980);});box(w,w*.293,.04,new THREE.MeshBasicMaterial({map:tex}),x,y,z).castShadow=false;}
  panel('KELAS MANASIK HAJI & UMROH','Belajar sebelum berangkat • Miniatur edukasi',0,2.45,-5.34,7.8);
  function table(x:number,z:number,w:number,d:number){box(w,.12,d,oak,x,.82,z);for(const dx of [-w/2+.12,w/2-.12])for(const dz of [-d/2+.12,d/2-.12])box(.085,.76,.085,steel,x+dx,.38,z+dz);obstacle(x,z,w,d,1.7);}
  table(-4,-3,2.5,1);panel('01 • URUTAN IBADAH','Panduan pembimbing',-4,.5,-2.48,2.25);
  box(.68,.04,.46,linen,-4.5,.91,-2.9);box(.37,.03,.26,sage,-3.65,.92,-2.85);
  table(3.5,-3,2.5,1);panel('02 • IHRAM','Ketentuan dan larangan',3.5,.5,-2.48,2.25);
  for(let j=0;j<3;j++)box(.58,.055,.36,linen,3.0,.91+j*.055,-2.9);
  for(let j=0;j<3;j++)box(.49,.065,.35,sage,4.03,.91+j*.065,-2.9);
  // Both miniature practice paths fit the same demonstration table; not a scale replica.
  table(3.5,.68,5.4,2.10);panel('03 • MINIATUR LATIHAN','Tawaf dan sa’i • bukan ibadah nyata',3.5,.5,1.76,4.9);
  const cx=2.06,cz=.65,baseY=.895;
  box(2.26,.035,1.95,linen,cx,baseY,cz);box(.60,.68,.60,blackCloth,cx,baseY+.36,cz);
  box(.615,.07,.615,gold,cx,baseY+.53,cz);box(.14,.24,.014,gold,cx+.16,baseY+.23,cz+.308);
  const track=new THREE.Mesh(new THREE.RingGeometry(.75,.79,72).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x40876a,side:THREE.DoubleSide}));track.position.set(cx,baseY+.026,cz);s.add(track);
  // A starting marker denotes the schematic alignment, not a depiction of the stone.
  box(.07,.025,.38,gold,cx+.55,baseY+.04,cz+.55).rotation.y=Math.PI/4;
  box(.74,.04,1.85,linen,4.7,baseY,.65);box(.12,.05,1.6,sage,4.7,baseY+.034,.65);box(.5,.10,.32,stone,4.7,baseY+.08,-.14);box(.5,.10,.32,stone,4.7,baseY+.08,1.44);
  tawafDot=sphere(.075,new THREE.MeshBasicMaterial({color:0xe2b849}),cx+.77/Math.sqrt(2),baseY+.13,cz+.77/Math.sqrt(2));saiDot=sphere(.075,new THREE.MeshBasicMaterial({color:0xe2b849}),4.7,baseY+.15,-.14);
  // Simple rows of class chairs, prayer-room-style wall and teaching board.
  for(const x of [-5.6,-4.4,-3.2])for(const z of [2.8,4.05]){box(.83,.1,.75,sage,x,.49,z);box(.83,.55,.12,sage,x,.78,z+.33);for(const dx of [-.3,.3])for(const dz of [-.25,.25])box(.05,.42,.05,steel,x+dx,.22,z+dz);obstacle(x,z,.86,.8,1);}
  const board=surface(720,440,g=>{g.fillStyle='#f4f1de';g.fillRect(0,0,720,440);g.fillStyle='#265644';g.font='bold 36px sans-serif';g.textAlign='center';g.fillText('BEKAL MANASIK',360,65);g.textAlign='left';g.font='27px sans-serif';['01  Kenali urutan ibadah','02  Pahami miqat dan ihram','03  Latih hitungan tawaf dan sa’i','04  Ingat titik kumpul & kontak pembimbing'].forEach((v,i)=>g.fillText(v,30,140+i*73,660));});
  box(.045,1.52,2.5,new THREE.MeshBasicMaterial({map:board}),-7.34,1.95,-1.3).castShadow=false;
  for(const px of [-4,0,4]){box(1.4,.07,.42,white,px,3.16,0).castShadow=false;const light=new THREE.PointLight(0xfff2e2,10,8,2);light.position.set(px,2.95,0);s.add(light);}
 }
 let busBag:THREE.Group|null=null,busHatch:THREE.Mesh|null=null,busLoadAt=0;
 const bagStart=new THREE.Vector3(4.5,.28,-1.88),bagEnd=new THREE.Vector3(4.5,.60,-2.55);
 if(level===8){
  // Outdoor courtyard: preserve movement bounds but remove enclosed-house walls and furnishings.
  for(const obj of s.children.slice(boundaryStart))obj.visible=false;ceiling.visible=false;obstacles.length=0;blockers.length=0;
  s.background=new THREE.Color(0xc9e3ee);s.fog=new THREE.Fog(0xc9e3ee,22,42);
  floor.map=null;floor.color.setHex(0xa9a9a0);floor.roughness=.85;floor.needsUpdate=true;
  const asphalt=mat(0x6d7573),roof=mat(0x9f513a),plaster=mat(0xe5dfc5),trim=mat(0x4d6959),tire=mat(0x252a2b),busBody=mat(0xe8e9df),glassBus=mat(0x395d6c),metal=mat(0x9aa4a2);
  box(14.8,.025,3.9,asphalt,0,.015,-3.45).castShadow=false;
  for(let j=0;j<6;j++)box(.8,.018,.08,white,-6+j*2.2,.032,-.05).castShadow=false;
  // Indonesian porch, overhang, window, terrace and low fence at the gathering point.
  box(4.15,2.95,.18,plaster,-5.37,1.475,-5.3);box(4.35,.15,1.0,roof,-5.38,3.04,-4.82);
  for(let j=0;j<18;j++)box(.23,.08,1.12,roof,-7.36+j*.23,3.13,-4.78);
  box(.14,2.75,.14,trim,-7.05,1.375,-4.3);box(.14,2.75,.14,trim,-3.65,1.375,-4.3);
  box(.85,2.15,.12,wood,-5.8,1.075,-5.15);box(1.25,1.12,.09,wood,-4.45,1.78,-5.16);box(1.10,.96,.10,blue,-4.45,1.78,-5.08);
  for(const dx of [-.36,0,.36])box(.045,1,.11,wood,-4.45+dx,1.78,-5.015);
  box(3.9,.10,1.15,oak,-5.38,.05,-4.72);obstacle(-5.37,-5.30,4.15,.18,2.95);
  // Low neighborhood wall and plants, outside the playable travel corridor.
  for(const px of [-7.25,7.25]){box(.14,.72,10.5,plaster,px,.36,0);for(let j=0;j<5;j++)box(.22,1.0,.22,trim,px,.5,-4.6+j*2.25);}
  for(const p of [[-6.5,4.3],[6.55,4.3]]){box(.65,.46,.65,rose,p[0],.23,p[1]);for(let j=0;j<7;j++){const q=sphere(.25,leaf,p[0]+Math.sin(j*2.3)*.25,.65+(j%3)*.21,p[1]+Math.cos(j*2.3)*.25);q.scale.set(.7,1.8,.7);}obstacle(p[0],p[1],.7,.7,1.35);}
  // Final check table and visibly separate small hand luggage.
  box(1.85,.12,.83,oak,-4,.78,-.05);for(const dx of [-.77,.77])for(const dz of [-.29,.29])box(.09,.72,.09,wood,-4+dx,.36,-.05+dz);obstacle(-4,-.05,1.85,.83,1.25);
  box(.51,.35,.32,trim,-4.45,1.015,-.03);box(.29,.065,.25,blue,-3.85,.88,-.02);box(.27,.05,.22,white,-3.48,.89,.04);
  // Coach: side windows, wheels, front windshield, entry door and a separate luggage bay.
  const bx=3.35,bz=-3.30;
  box(6.0,.32,2.0,dark,bx,.45,bz);box(6.0,1.92,2.0,busBody,bx,1.55,bz);box(5.95,.15,2.02,trim,bx,2.58,bz);
  box(5.92,.20,2.03,trim,bx,1.09,bz);
  for(let j=0;j<5;j++){const xx=.95+j*.98;box(.87,.77,.045,glassBus,xx,1.95,bz+1.023);box(.87,.77,.045,glassBus,xx,1.95,bz-1.023);}
  box(.05,.86,1.72,glassBus,6.38,1.94,bz);box(.06,.48,1.60,dark,6.38,.72,bz);for(const zz of [bz-.67,bz+.67])box(.075,.21,.26,white,6.42,.88,zz);
  box(.8,1.34,.048,glassBus,5.82,1.18,bz+1.035);box(.035,1.34,.065,metal,5.82,1.18,bz+1.06);
  for(const xx of [.95,5.5])for(const zz of [bz-1.04,bz+1.04]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.20,24),tire);wheel.rotation.x=Math.PI/2;wheel.position.set(xx,.40,zz);s.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.212,20),metal);hub.rotation.x=Math.PI/2;hub.position.copy(wheel.position);s.add(hub);}
  const logo=surface(1024,160,g=>{g.fillStyle='#355e50';g.fillRect(0,0,1024,160);g.fillStyle='#fbe7ac';g.textAlign='center';g.font='bold 63px sans-serif';g.fillText('BUS 01 • ROMBONGAN IBADAH',512,95,980);g.font='25px sans-serif';g.fillText('SIMULASI MANASIK',512,137);});box(3.85,.58,.04,new THREE.MeshBasicMaterial({map:logo}),3.1,1.34,bz+1.05).castShadow=false;
  box(1.27,.54,.055,dark,4.5,.73,bz+1.05);busHatch=box(1.27,.54,.06,trim,4.5,.73,bz+1.11);
  box(.28,.06,.07,metal,4.5,.74,bz+1.16);
  busBag=new THREE.Group();s.add(busBag);box(.48,.49,.29,rose,0,.20,0,busBag);box(.18,.06,.05,dark,0,.48,0,busBag);for(const dx of [-.16,.16])sphere(.045,dark,dx,-.055,0,busBag);busBag.position.copy(bagStart);if(initial===3){busBag.position.copy(bagEnd);busBag.visible=false;}
  obstacle(bx,bz,6.05,2.10,2.66);
  const board=surface(640,300,g=>{g.fillStyle='#f1ecd9';g.fillRect(0,0,640,300);g.fillStyle='#365748';g.textAlign='center';g.font='bold 43px sans-serif';g.fillText('TITIK KUMPUL',320,72);g.font='30px sans-serif';g.fillText('BUS 01 • ROMBONGAN DEMO',320,145);g.font='24px sans-serif';g.fillText('Tetap bersama pembimbing',320,235);});box(2.4,1.13,.06,new THREE.MeshBasicMaterial({map:board}),.0,1.62,-5.1).castShadow=false;box(.09,1.5,.09,metal,0,.75,-5.14);
 }
 const airportProps:THREE.Group[]=[];const airportStarts:THREE.Vector3[]=[];const airportEnds:THREE.Vector3[]=[];const airportTimes=[0,0];let airportGateDoor:THREE.Mesh|null=null,gateOpen=false;
 if(level===9){
  // Dedicated airport terminal with a large apron-facing window wall, long concourse and three service zones.
  for(const obj of s.children.slice(boundaryStart))obj.visible=false;ceiling.visible=false;obstacles.length=0;blockers.length=0;
  floor.color.setHex(0xe9eeed);floor.roughness=.28;floor.needsUpdate=true;s.background=new THREE.Color(0xc6dce6);
  const steel=mat(0x909fa5),panel=mat(0xe7edf0),navy=mat(0x263d56),blueGlass=mat(0x7aa2b5),asphalt=mat(0x8d969a),seat=mat(0x546f82);
  const windowMat=new THREE.MeshStandardMaterial({color:0xa8d2e8,transparent:true,opacity:.23,roughness:.22,depthWrite:false});
  box(15,.18,11,panel,0,4.95,0).castShadow=false;
  box(15,.45,.18,panel,0,.225,-5.45);box(15,.34,.18,navy,0,4.70,-5.45);
  for(let j=0;j<8;j++){const x=-7.35+j*2.1;box(.13,4.45,.16,steel,x,2.45,-5.45);if(j<7)box(1.97,4.19,.035,windowMat,x+1.05,2.50,-5.44).castShadow=false;}
  box(.18,4.8,11,panel,-7.5,2.4,0).castShadow=false;box(.18,4.8,11,panel,7.5,2.4,0).castShadow=false;box(15,4.8,.18,panel,0,2.4,5.5).castShadow=false;
  // View of a stylized parked airliner beyond the glass; purely fictional airport.
  box(30,.20,22,asphalt,0,-.22,-15).castShadow=false;
  const plane=new THREE.Group();plane.position.set(.5,.25,-12.0);s.add(plane);
  const fuselage=sphere(1,panel,0,1.6,0,plane);fuselage.scale.set(5.5,.80,.82);const tail=box(.8,2.0,.18,navy,-4.15,2.55,0,plane);tail.rotation.z=-.25;
  const wing=box(1.9,.16,6.5,panel,-.25,1.35,0,plane);wing.rotation.y=.22;
  const cockpit=sphere(.3,blueGlass,4.7,1.91,.34,plane);cockpit.scale.set(1.5,.65,.6);
  for(let j=0;j<11;j++)box(.18,.23,.05,navy,-3.4+j*.6,1.80,.78,plane);
  for(const z of [-2.1,2.1]){const engine=new THREE.Mesh(new THREE.CylinderGeometry(.34,.38,1.05,20),steel);engine.rotation.z=Math.PI/2;engine.position.set(.55,1.0,z);plane.add(engine);}
  function board(title:string,sub:string,x:number,y:number,z:number,w:number){const tex=surface(768,210,g=>{g.fillStyle='#233b56';g.fillRect(0,0,768,210);g.fillStyle='#ffe3a0';g.font='bold 47px sans-serif';g.textAlign='center';g.fillText(title,384,83,730);g.fillStyle='#f5f7fa';g.font='28px sans-serif';g.fillText(sub,384,151,730);});box(w,w*.273,.045,new THREE.MeshBasicMaterial({map:tex}),x,y,z).castShadow=false;}
  board('TERMINAL INTERNASIONAL','SIMULASI • BUKAN BANDARA NYATA',0,3.82,-4.95,9.0);
  function desk(x:number,z:number,w:number){box(w,.88,.85,navy,x,.44,z);box(w+.10,.09,.95,panel,x,.925,z);box(.48,.35,.09,navy,x-.47,1.16,z);box(.25,.04,.18,steel,x-.47,1.0,z);obstacle(x,z,w+.1,.95,1.4);}
  desk(-4.5,-3,2.2);board('01 • CHECK-IN','Dokumen & bagasi',-4.5,2.83,-3.46,2.8);
  // Conveyor belt carries the demo suitcase behind the check-in counter.
  box(.95,.55,2.15,steel,-6.1,.275,-3.3);box(.87,.065,2.12,dark,-6.1,.58,-3.3);for(let j=0;j<13;j++)box(.83,.022,.045,steel,-6.1,.62,-4.28+j*.16);obstacle(-6.1,-3.3,.95,2.15,1.25);
  board('02 • SECURITY','Keamanan & imigrasi',0,2.83,-3.46,3.0);
  // Illustrative walkthrough detector and scanner; no bypass or screening details.
  for(const x of [-.57,.57])box(.18,2.23,.25,steel,x,1.12,-3.8);
  box(1.32,.22,.25,steel,0,2.25,-3.8);
  box(1.05,1.18,1.4,panel,1.35,.61,-3.36);box(.8,.52,.045,navy,1.35,.76,-2.635);box(.92,.08,.86,dark,1.35,.60,-2.25);obstacle(1.35,-3.10,1.10,2.0,1.3);
  // Model passport inspection booth.
  box(1.30,.91,.72,navy,-1.65,.455,-4.1);box(1.32,.10,.78,panel,-1.65,.96,-4.1);box(.10,.82,.68,windowMat,-2.22,1.40,-4.1);board('IMIGRASI','Pemeriksaan paspor',-1.65,2.12,-4.55,1.65);obstacle(-1.65,-4.1,1.3,.78,1.65);
  desk(4.5,-3,1.8);board('03 • GATE A01','Boarding rombongan demo',4.5,2.83,-3.46,2.9);
  const gateFrameX=6.25;for(const x of [gateFrameX-.52,gateFrameX+.52])box(.11,2.15,.22,steel,x,1.075,-4.5);box(1.16,.15,.22,navy,gateFrameX,2.12,-4.5);airportGateDoor=box(.91,1.95,.09,blueGlass,gateFrameX,1.02,-4.5);obstacle(gateFrameX,-4.5,1.15,.25,2.2);
  for(const [index,x,z] of [[0,-6.1,-2.48],[1,1.35,-2.14]]){const bag=new THREE.Group();s.add(bag);box(index===0?.53:.38,index===0?.42:.28,.31,index===0?rose:blueGlass,0,.21,0,bag);box(.17,.065,.065,dark,0,.43,0,bag);bag.position.set(x,index===0?.64:.68,z);airportProps.push(bag);airportStarts.push(bag.position.clone());airportEnds.push(new THREE.Vector3(x,index===0?.64:.68,index===0?-4.17:-3.14));}
  if(initial>=1)airportProps[0].visible=false;
  if(initial>=2)airportProps[1].position.copy(airportStarts[1]);
  for(const x of [-5.8,-4.8,-3.8,3.8,4.8,5.8]){box(.87,.10,.67,seat,x,.48,3.9);box(.87,.53,.10,seat,x,.8,4.22);for(const dx of [-.30,.30])box(.06,.44,.05,steel,x+dx,.22,3.9);obstacle(x,3.9,.9,.75,1);}
  for(const x of [-4.5,0,4.5]){box(2.6,.045,1.35,mat(0xc4d5de),x,.026,-1.3).castShadow=false;box(1.9,.09,.35,new THREE.MeshBasicMaterial({color:0xf4fbff}),x,4.75,0).castShadow=false;const light=new THREE.PointLight(0xe9f8ff,16,12,2);light.position.set(x,4.45,0);s.add(light);}
  for(const x of [-2.1,2.1]){const post=box(.10,.76,.10,steel,x,.39,1.5);post.castShadow=true;box(.32,.07,.32,steel,x,.045,1.5);obstacle(x,1.5,.32,.32,.8);}
  board('A01 • DEMO','JEDDAH / MADINAH • sesuai rute',4.3,1.85,5.29,3.8);
 }
 const cloudGroups:THREE.Group[]=[];let beltLamp:THREE.Mesh|null=null,waterCup:THREE.Mesh|null=null,exerciseAt=0;let exerciseLeg:THREE.Group|null=null;
 if(level===10){
  for(const obj of s.children.slice(boundaryStart))obj.visible=false;ceiling.visible=false;obstacles.length=0;blockers.length=0;
  s.background=new THREE.Color(0x83b9db);floor.map=null;floor.color.setHex(0x687d8e);floor.roughness=.95;floor.needsUpdate=true;
  const cabin=mat(0xeaece8),seatBlue=mat(0x375a74),seatBack=mat(0x28465d),metal=mat(0xa2b1b9),bin=mat(0xd8e0df),windowBlue=mat(0xaad0e1);
  box(7.6,.08,11,mat(0x526c7e),0,.025,0).castShadow=false;
  box(7.6,.14,11,cabin,0,3.85,0).castShadow=false;
  box(7.6,3.7,.16,cabin,0,1.85,-5.45);box(7.6,3.7,.16,cabin,0,1.85,5.45);
  for(const side of [-1,1]){
   box(.14,1.02,11,cabin,side*3.8,.51,0);box(.21,1.18,11,cabin,side*3.8,3.25,0);
   for(let j=0;j<6;j++){const z=-4.5+j*1.8;box(.17,1.68,.76,cabin,side*3.8,1.84,z+.74);const pane=box(.045,1.10,1.02,new THREE.MeshStandardMaterial({color:0xcbe8f4,transparent:true,opacity:.22,depthWrite:false,roughness:.15}),side*3.8,1.80,z);pane.castShadow=false;box(.14,.12,1.12,bin,side*3.72,1.19,z);box(.14,.12,1.12,bin,side*3.72,2.41,z);}
   // Side walls are visual plus collision, with the central aisle unobstructed.
   obstacle(side*3.75,0,.18,11,3.75);
   box(1.12,.48,10.7,bin,side*2.95,3.22,0);for(let j=0;j<6;j++){box(.05,.4,.98,metal,side*2.37,3.20,-4.45+j*1.78);box(.04,.05,.32,dark,side*2.33,3.13,-4.45+j*1.78);}
   for(const z of [-3.95,-2.1,-.25,1.6,3.45]){
    for(const ax of [1.75,2.75]){const x=side*ax;box(.78,.14,.74,seatBlue,x,.47,z);box(.77,.95,.19,seatBack,x,1.00,z+.38);box(.59,.28,.09,white,x,1.40,z+.27);box(.08,.12,.67,metal,x-.42,.76,z);box(.08,.12,.67,metal,x+.42,.76,z);box(.58,.12,.12,metal,x,.14,z);obstacle(x,z+.05,.87,.92,1.58);}
   }
   for(let j=0;j<8;j++){const cloud=new THREE.Group();s.add(cloud);cloud.position.set(side*(5.3+(j%2)*1.5),.9+(j%3)*.65,-12+j*3.3);for(let k=0;k<4;k++){const p=sphere(.6,new THREE.MeshBasicMaterial({color:0xf5f9fc}),Math.sin(k*1.7)*.8,Math.cos(k*1.3)*.23,k*.54,cloud);p.scale.set(1.7,.5,1.6);}cloudGroups.push(cloud);}
  }
  function sign(t:string,sub:string,x:number,z:number){const tex=surface(512,180,g=>{g.fillStyle='#28475e';g.fillRect(0,0,512,180);g.fillStyle='#f9e2a9';g.font='bold 38px sans-serif';g.textAlign='center';g.fillText(t,256,70,495);g.fillStyle='#fff';g.font='25px sans-serif';g.fillText(sub,256,130,495);});box(2.28,.80,.04,new THREE.MeshBasicMaterial({map:tex}),x,2.69,z).castShadow=false;}
  sign('MANASIK AIR','KABIN SIMULASI',0,-5.32);
  sign('03 • MIQAT','Panduan pembimbing',0,-4.62);
  sign('02 • SEHAT','Tetap aman di kabin',0,-1.08);
  sign('01 • KESELAMATAN','Sabuk dan doa',0,1.42);
  beltLamp=box(.28,.13,.05,new THREE.MeshBasicMaterial({color:0xe4ac46}),.62,2.19,1.40);if(initial>0)(beltLamp.material as THREE.MeshBasicMaterial).color.setHex(0x4da477);
  // Drink bottle and a miniature seated-leg training model on a tray.
  box(.66,.075,.35,bin,-1.7,.88,.56);waterCup=box(.17,.24,.17,windowBlue,-1.70,1.05,.56);waterCup.visible=initial>1;
  exerciseLeg=new THREE.Group();exerciseLeg.position.set(1.45,.52,-.65);s.add(exerciseLeg);box(.16,.48,.17,seatBack,0,-.22,0,exerciseLeg);box(.17,.14,.34,metal,0,-.47,-.10,exerciseLeg);
  for(const z of [-4,-1.4,1.2,3.8]){box(.65,.055,1.8,new THREE.MeshBasicMaterial({color:0xf1f8ff}),0,3.74,z).castShadow=false;const light=new THREE.PointLight(0xeaf4ff,9,8,2);light.position.set(0,3.5,z);s.add(light);}
 }
 function capsule(radius:number,length:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D){const o=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,10),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function person(female:boolean,color:number,height=1.7,sarong=false){
  const root=new THREE.Group();s.add(root);root.scale.setScalar(height/1.7);const cloth=mat(color),skin=mat(0xb98662),pants=mat(0x33464a),hair=mat(0x292823);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.34,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x372a20,transparent:true,opacity:.2,depthWrite:false}));shadow.position.y=.017;root.add(shadow);
  const body=new THREE.Group();root.add(body);const torso=capsule(.205,.29,cloth,0,1.02,0,body);torso.scale.set(1.1,1,.74);const hips=capsule(.19,.1,pants,0,.77,0,body);hips.scale.set(1.1,.75,.78);capsule(.072,.08,skin,0,1.34,0,body);
  const head=sphere(.155,skin,0,1.51,.035,body);head.scale.set(.91,1.15,.92);head.castShadow=true;if(female){const hood=sphere(.18,cloth,0,1.55,-.055,body);hood.scale.set(1.05,1.19,.85);box(.42,.4,.29,cloth,0,1.25,-.06,body);head.position.z=.11;const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.22,.31,.77,12),cloth);skirt.position.y=.6;body.add(skirt);}else{const cap=sphere(.155,hair,0,1.61,-.025,body);cap.scale.set(1,.47,1);cap.castShadow=true;if(sarong){const peci=cylinder(.15,.15,.105,hair,0,1.66,.008,body);peci.scale.z=.86;}}
  if(sarong){const wrap=new THREE.Mesh(new THREE.CylinderGeometry(.235,.255,.7,18),clothPattern);wrap.position.y=.51;wrap.castShadow=true;body.add(wrap);}
  const legs:THREE.Group[]=[],arms:THREE.Group[]=[];
  for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.12,.76,0);body.add(leg);capsule(.082,.44,pants,0,-.29,0,leg);const shoe=capsule(.09,.11,dark,0,-.65,.055,leg);shoe.rotation.x=Math.PI*.5;shoe.scale.set(1,.95,.65);legs.push(leg);const arm=new THREE.Group();arm.position.set(side*.29,1.27,0);body.add(arm);capsule(.076,.32,cloth,0,-.22,0,arm);sphere(.066,skin,0,-.46,0,arm);arms.push(arm);}
  return {root,body,legs,arms};
 }
 const hero=person(avatar==='female',avatar==='female'?0x69586d:0x597b89);
 const family=person(level!==7,level===10?0x385875:level===9?0x304b68:level===7?0xe6dfc9:level===5?0xf3f1e9:(level===6||level===8)?0xa87864:level>=3?0x386957:0xa87864,1.58);
 const family2=person(level===7,level===10?0x4d718c:level===9?0x546d86:level===7?0x667d6b:level===5?0x4d9795:(level===6||level===8)?0xe5dfc8:level>=3?0x587484:0xe5dfc8,1.68,level<3||level===6||level===8);
 family.root.position.set(level===10?-1.0:level===9?-4.5:level===8?-5.12:level===6?-5.5:level>=3?-4:-4.65,0,level===10?2.5:level===9?-4.05:level===8?-3.05:level===6?1.7:level>=3?-4.05:.47);family.root.rotation.y=level>=3?0:.65;
 family2.root.position.set(level===10?1.0:level===9?0:level===8?-6.2:level===6?-.9:level>=3?3.5:-5.8,0,level===10?0:level===9?-2.65:level===8?-3.55:level===6?-3.8:level>=3?-4.05:2.3);family2.root.rotation.y=level>=3?0:.9;
 const actors:Array<{name:Npc;actor:typeof family}>=[{name:level===10?'Pramugari':level===9?'Petugas Check-in':level===7?'Pembimbing':level===5?'Dokter':level===4?'Petugas Paspor':level===3?'Resepsionis':'Ibu',actor:family},{name:level===10?'Awak Kabin':level===9?'Petugas Keamanan':level===7?'Asisten Manasik':level===5?'Perawat':level===4?'Petugas Visa':level===3?'Konsultan':'Ayah',actor:family2}];
 if(level>=3&&level<=5){const admin=person(true,level===5?0xe9f3eb:0x776482,1.62);admin.root.position.set(4.5,0,0);actors.push({name:level===5?'Apoteker':level===4?'Petugas Berkas':'Admin',actor:admin});}
 if(level===8){const leader=person(false,0x42665d,1.7);leader.root.position.set(5.55,0,-.93);actors.push({name:'Ketua Rombongan',actor:leader});}
 if(level===9){const gateAgent=person(true,0x314f6b,1.62);gateAgent.root.position.set(4.5,0,-4.05);actors.push({name:'Petugas Gate',actor:gateAgent});}
 if(level===10){const mentor=person(false,0xe0d6bc,1.68);mentor.root.position.set(-1.0,0,-3.5);actors.push({name:'Pembimbing',actor:mentor});}
 for(const entry of actors){const p=entry.actor.root.position;obstacle(p.x,p.z,.45,.36,1.6);}
 const getActor=(name:string)=>name==='Kamu'?hero:actors.find(a=>a.name===name)?.actor??null;
 const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.63,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xd8a62f,side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.position.y=.065;s.add(ring);
 const pin=new THREE.Group();s.add(pin);const coinGroup=new THREE.Group();pin.add(coinGroup);const coinMetal=new THREE.MeshStandardMaterial({color:0xeab63d,metalness:.55,roughness:.3,emissive:0x886019,emissiveIntensity:.35});const coinFace=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.075,40),coinMetal);coinFace.rotation.x=Math.PI/2;coinGroup.add(coinFace);for(const z of [-.047,.047]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.194,.015,8,36),new THREE.MeshBasicMaterial({color:0xffedaa}));rim.position.z=z;coinGroup.add(rim);const center=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.012),new THREE.MeshBasicMaterial({color:0xffedaa}));center.position.z=z;center.rotation.z=Math.PI/4;coinGroup.add(center);}
 const cam=new THREE.PerspectiveCamera(60,1,.045,45);let x=0,z=level>=3?3.6:1.85,yaw=Math.PI,cameraYaw=Math.PI,pitch=.16,quest=initial,near=false,active=false,auto=false,raf=0,last=performance.now(),phase=0,cutUntil=0,disposed=false,doorOpen=level===1&&initial===3;let talking='',collected=false,taskStarted=false,coinReady=false,coinAt=0,taskHold=false,forcedNpc:Npc|null=null,nearNpc:Npc|null=null;const bubbleAnchor=new THREE.Vector3(),npcRay=new THREE.Ray(),npcDir=new THREE.Vector3(),npcStart=new THREE.Vector3(),npcHit=new THREE.Vector3();let cameraDistance=3.1,manualUntil=0,lastMotion=0,lookId:number|null=null,lookX=0,lookY=0;const pivotCam=new THREE.Vector3(),desiredCam=new THREE.Vector3(),direction=new THREE.Vector3(),hit=new THREE.Vector3(),ray=new THREE.Ray(),lookAt=new THREE.Vector3();const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
 const keys=new Set<string>();let waypoints:{x:number;z:number}[]=[];let jx=0,jz=0,pid:number|null=null;
 const bounds=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 function valid(px:number,pz:number){return px>-7&&px<7&&pz>-5&&pz<5&&!obstacles.some(o=>Math.abs(px-o.x)<o.w/2+.26&&Math.abs(pz-o.z)<o.d/2+.26);}
 // Navigate on a bounded half-metre grid. A nearby reachable point is sufficient for interaction.
 function plan(tx:number,tz:number){
  const step=.5,cols=27,rows=19,point=(i:number)=>({x:(i%cols-13)*step,z:(Math.floor(i/cols)-9)*step});
  let start=-1,best=Infinity;for(let i=0;i<cols*rows;i++){const p=point(i),d=Math.hypot(p.x-x,p.z-z);if(valid(p.x,p.z)&&d<best){best=d;start=i;}}
  if(start<0)return [];const prev=new Int32Array(cols*rows).fill(-2),queue=[start];prev[start]=-1;let goal=-1;
  for(let k=0;k<queue.length;k++){const i=queue[k],p=point(i);if(Math.hypot(p.x-tx,p.z-tz)<.45){goal=i;break;}const c=i%cols,row=Math.floor(i/cols);for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=row+dr;if(nc<0||nc>=cols||nr<0||nr>=rows)continue;const j=nr*cols+nc,n=point(j);if(prev[j]!==-2||!valid(n.x,n.z)||!valid((p.x+n.x)/2,(p.z+n.z)/2))continue;prev[j]=i;queue.push(j);}}
  const route:{x:number;z:number}[]=[];if(goal>=0)for(let i=goal;i>=0;i=prev[i])route.push(point(i));return route.reverse();
 }
 const keymap:Record<string,string>={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
 function down(e:KeyboardEvent){if(!active||taskHold||e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement)?.closest('input,select,textarea'))return;const key=keymap[e.code];if(key){e.preventDefault();keys.add(key);auto=false;}}
 function up(e:KeyboardEvent){keys.delete(keymap[e.code]);}
 function clear(){keys.clear();jx=jz=0;pid=null;lookId=null;auto=false;knob.style.transform='translate(-50%,-50%)';}
 function joy(e:PointerEvent){const q=joystick.getBoundingClientRect(),rad=q.width*.34,dx=e.clientX-q.left-q.width/2,dz=e.clientY-q.top-q.height/2,m=Math.max(rad,Math.hypot(dx,dz));jx=dx/m;jz=dz/m;knob.style.transform='translate(calc(-50% + '+jx*rad+'px),calc(-50% + '+jz*rad+'px))';}
 function jd(e:PointerEvent){if(!active||taskHold||pid!==null)return;e.preventDefault();auto=false;pid=e.pointerId;joystick.setPointerCapture(pid);joy(e);}
 function jm(e:PointerEvent){if(e.pointerId===pid)joy(e);}
 function ju(e:PointerEvent){if(e.pointerId===pid)clear();}
 function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);r.setSize(w,h,false);cam.aspect=w/h;cam.fov=cam.aspect<.85?70:60;cam.updateProjectionMatrix();}
 function lookDown(e:PointerEvent){if(!active||lookId!==null||e.button!==0)return;e.preventDefault();lookId=e.pointerId;lookX=e.clientX;lookY=e.clientY;canvas.setPointerCapture(e.pointerId);manualUntil=performance.now()+5000;}
 function lookMove(e:PointerEvent){if(e.pointerId!==lookId)return;cameraYaw-=(e.clientX-lookX)*.006;pitch=bounds(pitch+(e.clientY-lookY)*.004,-.10,.48);lookX=e.clientX;lookY=e.clientY;manualUntil=performance.now()+5000;}
 function lookUp(e:PointerEvent){if(e.pointerId===lookId)lookId=null;}
 canvas.addEventListener('pointerdown',lookDown);canvas.addEventListener('pointermove',lookMove);canvas.addEventListener('pointerup',lookUp);canvas.addEventListener('pointercancel',lookUp);canvas.addEventListener('lostpointercapture',lookUp);
 const ro=new ResizeObserver(resize);ro.observe(canvas);resize();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);joystick.addEventListener('pointerdown',jd);joystick.addEventListener('pointermove',jm);joystick.addEventListener('pointerup',ju);joystick.addEventListener('pointercancel',ju);joystick.addEventListener('lostpointercapture',ju);
 function syncTarget(){if(level===6)for(let q=0;q<packingProps.length;q++)for(const p of packingProps[q]){p.start=0;p.inside=q<quest;p.mesh.position.copy(p.inside?p.to:p.from);}collected=false;taskStarted=false;coinReady=false;coinAt=0;taskHold=false;forcedNpc=null;talking='';const t=QUESTS[quest];ring.visible=!!t;pin.visible=false;if(t){ring.position.set(t.x,.065,t.z);pin.position.set(t.x,1.1,t.z);}near=false;callbacks.onNear(false);}
 syncTarget();
 function frame(now:number){
  if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;if(document.hidden)return;
  const t=QUESTS[quest],cinema=now<cutUntil;
  let dx=0,dz=0;if(active&&!cinema&&t&&!taskHold){
   if(auto){if(Math.hypot(t.x-x,t.z-z)<.62){auto=false;waypoints=[];}else{while(waypoints.length&&Math.hypot(waypoints[0].x-x,waypoints[0].z-z)<.1)waypoints.shift();const p=waypoints[0];if(p){const d=Math.hypot(p.x-x,p.z-z);const speed=Math.min(2.5,d/Math.max(dt,.001));dx=(p.x-x)/Math.max(d,.001)*speed;dz=(p.z-z)/Math.max(d,.001)*speed;}else auto=false;}}

   else {const f=(keys.has('up')?1:0)-(keys.has('down')?1:0)-jz,side=(keys.has('right')?1:0)-(keys.has('left')?1:0)+jx,n=Math.max(1,Math.hypot(f,side));dx=(Math.sin(cameraYaw)*f-Math.cos(cameraYaw)*side)*2.65/n;dz=(Math.cos(cameraYaw)*f+Math.sin(cameraYaw)*side)*2.65/n;}
  }
  const ox=x,oz=z;if(valid(x+dx*dt,z))x+=dx*dt;if(valid(x,z+dz*dt))z+=dz*dt;
  const moving=Math.hypot(x-ox,z-oz)>.002;if(moving){lastMotion=now;const heading=Math.atan2(x-ox,z-oz);yaw+=angleDelta(yaw,heading)*Math.min(1,dt*13);if(auto&&now> manualUntil&&lookId===null)cameraYaw+=angleDelta(cameraYaw,heading)*Math.min(1,dt*4);phase+=dt*9;callbacks.onStep();}else if(active&&lastMotion>0&&now-lastMotion>500&&now>manualUntil&&lookId===null){cameraYaw+=angleDelta(cameraYaw,yaw)*Math.min(1,dt*2.2);}
  hero.root.position.set(x,0,z);hero.root.rotation.y=yaw;hero.body.position.y=moving?Math.abs(Math.sin(phase))*.035:0;for(let i=0;i<2;i++){const swing=moving?Math.sin(phase+i*Math.PI)*.5:0;hero.legs[i].rotation.x=swing;hero.arms[i].rotation.x=-swing*.7;}
  family.body.rotation.z=Math.sin(now*.0013)*.027;family.arms[1].rotation.x=-.22+Math.sin(now*.002)*.12;family2.body.rotation.z=Math.sin(now*.0011)*.02;
  blades.rotation.z=now*.009;fan.rotation.y=.92+Math.sin(now*.0008)*.19;curtain.rotation.y=Math.sin(now*.001)*.012;beam.position.x=-3.7+Math.sin(now*.0002)*.23;pivot.rotation.z=-now*.000105;coinGroup.rotation.y=now*.0022;if(t)pin.position.y=1.1+Math.sin(now*.003)*.15;
  const isNear=!!t&&Math.hypot(t.x-x,t.z-z)<1.35&&active&&!cinema;if(isNear!==near){near=isNear;callbacks.onNear(near);}
  if(t&&active&&!cinema&&!taskStarted&&Math.hypot(t.x-x,t.z-z)<.7){taskStarted=true;taskHold=true;clear();callbacks.onTask();}
  if(t&&active&&coinReady&&!collected&&now>=coinAt&&Math.hypot(t.x-x,t.z-z)<.7){collected=true;ring.visible=pin.visible=false;active=false;clear();callbacks.onCollect();}
  // Proximity chat is independent of quest collection; hysteresis prevents flicker/retrigger.
  function visibleNpc(actor:typeof family,max:number){const p=actor.root.position;const dst=Math.hypot(p.x-x,p.z-z);if(dst>max)return Infinity;npcStart.set(x,1.45,z);npcDir.set(p.x-x,0,p.z-z).normalize();npcRay.set(npcStart,npcDir);for(const blocker of blockers){const at=npcRay.intersectBox(blocker,npcHit);if(at){const d=at.distanceTo(npcStart);if(d>.28&&d<dst-.45)return Infinity;}}return dst;}
  let candidate:Npc|null=null,bestNpc=Infinity;if(active&&!cinema){for(const {name,actor} of actors){const distance=visibleNpc(actor,nearNpc===name?2.65:2.2);if(Number.isFinite(distance)&&(nearNpc===name||distance<bestNpc)){candidate=name;bestNpc=distance;if(nearNpc===name)break;}}}
  if(!taskHold&&candidate!==nearNpc){nearNpc=candidate;callbacks.onNpc(nearNpc);}
  if(talking&&(forcedNpc||nearNpc)){
   const npc=getActor(forcedNpc||nearNpc||'')??family;
   npc.root.rotation.y=Math.atan2(x-npc.root.position.x,z-npc.root.position.z);
   if(!moving){const face=Math.atan2(npc.root.position.x-x,npc.root.position.z-z);yaw+=angleDelta(yaw,face)*Math.min(1,dt*7);hero.root.rotation.y=yaw;if(forcedNpc)cameraYaw+=angleDelta(cameraYaw,face)*Math.min(1,dt*5);}
   const actor=getActor(talking);
   if(actor){actor.body.rotation.z=Math.sin(now*.004)*.025;actor.arms[1].rotation.x=-.28+Math.sin(now*.007)*.17;}
  }else hero.body.rotation.z=0;
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
  lookAt.set(x+forwardX*3.7+rightX*shoulder,1.45+Math.sin(pitch)*-.9,z+forwardZ*3.7+rightZ*shoulder);cam.lookAt(lookAt);cam.updateMatrixWorld();
  if(talking&&(forcedNpc||nearNpc)){const actor=getActor(talking);if(actor){bubbleAnchor.set(actor.root.position.x,actor.root.scale.y*1.76+.14,actor.root.position.z).project(cam);const visible=bubbleAnchor.z>-1&&bubbleAnchor.z<1&&Math.abs(bubbleAnchor.x)<1.08&&bubbleAnchor.y>-1.04;callbacks.onBubble((bubbleAnchor.x*.5+.5)*100,(.5-bubbleAnchor.y*.5)*100,visible);}else callbacks.onBubble(50,50,false);}else callbacks.onBubble(50,50,false);
  if(t){const bearing=Math.atan2(t.x-x,t.z-z);callbacks.onNav(angleDelta(cameraYaw,bearing),Math.hypot(t.x-x,t.z-z));}
  if(level===6)for(const group of packingProps)for(const p of group)if(p.start){const t=Math.min(1,Math.max(0,(now-p.start)/530));p.mesh.position.lerpVectors(p.from,p.to,t);p.mesh.position.y+=Math.sin(t*Math.PI)*.62;if(t>=1){p.start=0;p.inside=true;}}if(level===8&&busLoadAt&&busBag&&busHatch){const t=Math.min(1,(now-busLoadAt)/850);busHatch.position.y=.73+Math.sin(t*Math.PI)*.55;busBag.position.lerpVectors(bagStart,bagEnd,t);busBag.position.y+=Math.sin(t*Math.PI)*.45;if(t>=1){busBag.visible=false;busLoadAt=0;}}if(level===9){for(let i=0;i<airportProps.length;i++){if(airportTimes[i]){const progress=Math.min(1,Math.max(0,(now-airportTimes[i])/1050));airportProps[i].position.lerpVectors(airportStarts[i],airportEnds[i],progress);if(progress>=1){airportTimes[i]=0;if(i===0)airportProps[i].visible=false;}}}if(airportGateDoor&&gateOpen)airportGateDoor.position.x=THREE.MathUtils.lerp(airportGateDoor.position.x,7.1,Math.min(1,dt*4));}if(level===10){for(const cloud of cloudGroups){cloud.position.z+=dt*1.1;if(cloud.position.z>14)cloud.position.z=-14;}if(exerciseLeg&&exerciseAt){const t=(now-exerciseAt)/1000;exerciseLeg.rotation.x=Math.sin(t*7)*.28*Math.max(0,1-t/2);if(t>=2){exerciseAt=0;exerciseLeg.rotation.x=0;}}}if(level>=3&&level<=5)drawOfficeBrand();r.render(s,cam);
 }raf=requestAnimationFrame(frame);
 return {flightAction(q,index){if(q===0&&index===0&&beltLamp)(beltLamp.material as THREE.MeshBasicMaterial).color.setHex(0x4da477);if(q===1&&index===0&&waterCup)waterCup.visible=true;if(q===1&&index===1)exerciseAt=performance.now();},airportAction(q,index){if(q===0&&index===1&&airportProps[0]?.visible)airportTimes[0]=performance.now();if(q===1&&index===0&&airportProps[1])airportTimes[1]=performance.now();if(q===1&&index===1&&airportProps[1]){airportTimes[1]=0;airportProps[1].position.copy(airportStarts[1]);}if(q===2&&index===1)gateOpen=true;},loadLuggage(){if(busBag&&!busLoadAt&&busBag.visible)busLoadAt=performance.now();},practice(mode,p){const pos=practicePosition(mode,p);if(mode==='tawaf'&&tawafDot)tawafDot.position.set(2.06+pos.x*.77,1.025,.65+pos.y*.77);if(mode==='sai'&&saiDot)saiDot.position.set(4.7,1.045,-.14+pos.x*1.58);},packItem(index){const p=packingProps[quest]?.[index];if(p&&!p.inside&&!p.start)p.start=performance.now();},talk(speaker,npc){talking=speaker;forcedNpc=npc??null;},unlockCoin(){taskHold=true;forcedNpc=null;talking='';coinReady=true;coinAt=performance.now()+650;pin.visible=true;},target(q){if(level===1&&q===3)doorOpen=true;quest=q;auto=false;syncTarget();},setActive(on){active=on;if(!on){clear();talking='';if(nearNpc){nearNpc=null;callbacks.onNpc(null);}callbacks.onBubble(50,50,false);}},walkToTarget(){const t=QUESTS[quest];if(active&&t&&!taskHold){waypoints=plan(t.x,t.z);auto=waypoints.length>0;keys.clear();}},cinematic(seconds){clear();cutUntil=performance.now()+seconds*1000;},dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);joystick.removeEventListener('pointerdown',jd);joystick.removeEventListener('pointermove',jm);joystick.removeEventListener('pointerup',ju);joystick.removeEventListener('pointercancel',ju);joystick.removeEventListener('lostpointercapture',ju);canvas.removeEventListener('pointerdown',lookDown);canvas.removeEventListener('pointermove',lookMove);canvas.removeEventListener('pointerup',lookUp);canvas.removeEventListener('pointercancel',lookUp);canvas.removeEventListener('lostpointercapture',lookUp);const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();s.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});geos.forEach(v=>v.dispose());mats.forEach(v=>{if('map' in v)(v as THREE.MeshBasicMaterial).map?.dispose();v.dispose();});r.dispose();}};
}
