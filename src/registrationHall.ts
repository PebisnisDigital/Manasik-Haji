import {drawNamePlate} from './characters/NamePlate.ts';
import {sweepGround,type SolidBody} from './sim/GroundCollision.ts';
import {GATE_OFFICE as O,GATE_VIDEOTRON as V} from './gateVideotronModel.ts';
import {joinQueue,serveQueue,type QueueTicket} from './queueTicket.ts';
import * as THREE from 'three';
import {humanActor} from './characters/HumanActors.ts';

type LaneNPC={root:THREE.Group;label:THREE.Sprite;canvas:HTMLCanvasElement;nameIndex:number;target:THREE.Vector3};
type Lane={ticket:QueueTicket|null;side:number;female:boolean;queue:LaneNPC[];spare:LaneNPC|null;outgoing:LaneNPC|null;exitStep:number;service:number;pen:THREE.Group;clerk:THREE.Group;clock:number;nextName:number;names:readonly string[]};
const namesMale=['Asep','Dedi','Ujang','Agus','Bambang','Eko','Jajang','Yanto','Dadang','Sutrisno','Wawan','Tatang','Rudi','Dadan','Wahyu','Hendra','Rizky','Budi','Ari','Rohmat','Slamet','Bayu','Dimas','Joko'];
const namesFemale=['Siti','Neneng','Nining','Yuni','Dewi','Sri','Titin','Enung','Rina','Wati','Euis','Nani','Yayah','Ratna','Wulan','Rini','Tuti','Sulastri','Fitri','Ayu','Nia','Rahayu','Linda','Dian'];
const material=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.72});
const green=material(0x194c3c),gold=material(0xc6a260),wood=material(0x815f40),cream=material(0xe7dac0),paper=material(0xfff8e9),ink=material(0x243c48);
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function sphere(parent:THREE.Object3D,r:number,x:number,y:number,z:number,m:THREE.Material){
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function sign(parent:THREE.Object3D,heading:string,sub:string,x:number,y:number,z:number,w:number,h:number){
 const c=document.createElement('canvas');c.width=768;c.height=220;const g=c.getContext('2d')!;
 g.fillStyle='#194b3c';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#d8ba78';g.lineWidth=8;g.strokeRect(9,9,750,202);g.textAlign='center';g.fillStyle='#f9e1a7';g.font='bold 57px sans-serif';g.fillText(heading,384,92,715);g.font='32px sans-serif';g.fillStyle='#eef3e6';g.fillText(sub,384,163,715);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;box(parent,w,h,.045,x,y,z,new THREE.MeshBasicMaterial({map:tex}));
}
function post(scene:THREE.Scene,x:number,z:number){
 const foot=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.08,12),green);foot.position.set(x,.04,z);scene.add(foot);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.74,12),gold);pole.position.set(x,.43,z);scene.add(pole);sphere(scene,.052,x,.83,z,gold);
}
function rope(scene:THREE.Scene,x:number,a:number,b:number){
 const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,.74,a),new THREE.Vector3(x,.51,(a+b)/2),new THREE.Vector3(x,.74,b));
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.018,5,false),green);scene.add(mesh);
}
function label(root:THREE.Group,height:number):{label:THREE.Sprite;canvas:HTMLCanvasElement}{
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false}));sprite.position.y=height+.24;sprite.scale.set(1.22,.305,1);root.add(sprite);return {label:sprite,canvas};
}
function rename(npc:LaneNPC,lane:Lane){
 const name=lane.names[lane.nextName++%lane.names.length];npc.nameIndex=lane.nextName;
 drawNamePlate(npc.canvas.getContext('2d')!,name);npc.label.material.map!.needsUpdate=true; npc.root.userData.registrationName=name;
}
function makeAdmin(scene:THREE.Scene,x:number,female:boolean){
 const admin=new THREE.Group();admin.position.set(x,0,-4.06);scene.add(admin);
 const uniform=material(female?0x191919:0x305e55),skin=material(female?0xc99d7b:0x9c7153);
 // A seated clerk behind the counter. Forearm and pencil move over the ledger.
 box(admin,.48,.46,.32,0,1.04,0,uniform);const faceRoot=new THREE.Group();faceRoot.position.set(0,1.50,.02);admin.add(faceRoot);sphere(faceRoot,.25,0,0,0,skin);
 if(female){sphere(faceRoot,.272,0,0,-.05,uniform);const face=sphere(faceRoot,.212,0,0,.10,skin);face.scale.set(.92,1,.75);sphere(faceRoot,.19,0,-.16,-.025,uniform);}
 else{const cap=sphere(faceRoot,.245,0,.15,-.02,cream);cap.scale.set(1,.48,.92);}
 for(const side of [-1,1]){sphere(faceRoot,.047,side*.089,.03,.237,paper);sphere(faceRoot,.029,side*.089,.03,.272,ink);sphere(faceRoot,.011,side*.089-.008,.047,.292,paper);}
 const smile=sphere(faceRoot,.045,0,-.078,.239,ink);smile.scale.set(1,.24,.25);
 box(admin,.13,.12,.40,-.15,1.09,.18,uniform);sphere(admin,.064,-.15,1.09,.38,skin);
 const pen=new THREE.Group();pen.position.set(.15,1.10,.22);admin.add(pen);box(pen,.12,.11,.34,0,0,.10,uniform);sphere(pen,.064,0,0,.28,skin);const pencil=box(pen,.025,.025,.20,0,.018,.36,gold);pencil.rotation.x=-.36;
 return {pen,clerk:admin};
}
const slot=(lane:Lane,i:number)=>{const rank=i+(lane.ticket&&i>=lane.ticket.ahead?1:0);return new THREE.Vector3(lane.side*(4.15+(rank%2?.075:0)),0,-2.77+rank*.77);};
const entrance=(side:number)=>new THREE.Vector3(side*5.65,0,5.85);
function createLane(scene:THREE.Scene,side:number,female:boolean):Lane{
 const x=side*4.15;
 // Open-front booth, service counter, ledger, register monitor and queue rails.
 box(scene,1.72,.99,.58,x,.5,-3.53,green);box(scene,1.84,.085,.75,x,1.035,-3.53,wood);
 box(scene,1.48,.12,.08,x,.24,-3.21,gold);
 box(scene,.09,2.65,.09,x-.84,1.33,-3.95,green);box(scene,.09,2.65,.09,x+.84,1.33,-3.95,green);
 box(scene,1.92,.11,1.35,x,2.69,-3.56,green);box(scene,1.98,.07,1.43,x,2.75,-3.56,gold);
 sign(scene,female?'LOKET PEREMPUAN':'LOKET LAKI-LAKI','PENDAFTARAN · SIMULASI NPC',x,2.43,-2.96,2.03,.58);
 box(scene,.30,.018,.23,x+.15,1.089,-3.52,paper);for(let i=0;i<4;i++)box(scene,.22,.003,.008,x+.15,1.10,-3.59+i*.038,ink);
 const screen=box(scene,.32,.22,.045,x-.42,1.26,-3.68,ink);screen.rotation.x=-.12;box(scene,.07,.12,.06,x-.42,1.13,-3.68,green);
 const {pen,clerk}=makeAdmin(scene,x,female);
 sign(scene,'GERBANG','KEBERANGKATAN',side*6,2.77,-5.68,2.05,.53);
 sign(scene,'MULAI ANTREAN','MASUK ANTREAN',x,1.95,5.34,1.95,.56);box(scene,.82,.025,.76,x,.021,4.93,gold);
 const railX=side*4.83;for(let i=0;i<5;i++){const z=-2.30+i*1.55;post(scene,railX,z);if(i)rope(scene,railX,z-1.55,z);}
 const lane:Lane={ticket:null,side,female,queue:[],spare:null,outgoing:null,exitStep:0,service:side<0?1.3:4.1,pen,clerk,clock:0,nextName:0,names:female?namesFemale:namesMale};
 for(let i=0;i<11;i++){
  const height=(female?1.57:1.66)+(i%4)*.055;
  const root=humanActor(scene,0xffffff,female,height,undefined,{palette:i%10,build:.87+(i%5)*.067,brightness:.94+(i%3)*.045,registration:true,cull:true});
  const tag=label(root,height),npc:LaneNPC={root,...tag,nameIndex:0,target:slot(lane,Math.min(i,9))};
  rename(npc,lane);root.position.copy(npc.target);root.rotation.y=Math.PI;root.userData.registrationNPC=true;
  if(i===10){root.visible=false;lane.spare=npc;}else lane.queue.push(npc);
 }
 return lane;
}
function advance(npc:LaneNPC,dt:number,speed:number,bodies:readonly SolidBody[]){
 const p=npc.root.position,dx=npc.target.x-p.x,dz=npc.target.z-p.z,d=Math.hypot(dx,dz);
 if(d<.015)return true;
 const distance=Math.min(d,speed*dt),next=sweepGround(p,{x:p.x+dx/d*distance,z:p.z+dz/d*distance},bodies,undefined,.30);p.x=next.x;p.z=next.z;
 const yaw=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(yaw-npc.root.rotation.y),Math.cos(yaw-npc.root.rotation.y));npc.root.rotation.y+=delta*(1-Math.exp(-dt*9));return Math.hypot(p.x-npc.target.x,p.z-npc.target.z)<.015;
}

/** Parked Indonesian-style MPVs and scooters; outside the pedestrian and gate lanes. */
function createParking(scene:THREE.Scene){
 const asphalt=material(0x686e6a),stripe=material(0xe8e3ce),rubber=material(0x25292c),chrome=material(0xaab3b4),glass=material(0x284450),lamp=material(0xfaf0d4),tail=material(0xc13835),plate=material(0x171d20);
 glass.roughness=.28;chrome.metalness=.55;
 function wheel(parent:THREE.Group,x:number,y:number,z:number,r:number,width:number){
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(r,r,width,18),rubber);tire.rotation.z=Math.PI/2;tire.position.set(x,y,z);parent.add(tire);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,width+.018,14),chrome);rim.rotation.z=Math.PI/2;rim.position.copy(tire.position);parent.add(rim);
 }
 function rod(parent:THREE.Group,a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material){
  const v=b.clone().sub(a),part=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),8),m);part.position.copy(a.clone().add(b).multiplyScalar(.5));part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(part);
 }
 function mpv(x:number,z:number,color:number,yaw:number){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;g.name='parked-mpv';scene.add(g);
  const paint=material(color);paint.roughness=.34;paint.metalness=.23;
  // Hood, passenger cabin, windows, pillars, bumper, lamps and wheels.
  box(g,1.72,.50,3.85,0,.59,0,paint);
  box(g,1.70,.14,3.97,0,.34,0,rubber);
  box(g,1.59,.24,1.02,0,.88,1.30,paint);
  box(g,1.54,.62,2.52,0,1.15,-.33,glass);
  box(g,1.60,.10,2.61,0,1.48,-.33,paint);
  for(const side of [-1,1]){
   for(const pz of [-1.49,-.66,.20,.85])box(g,.075,.60,.075,side*.795,1.15,pz,paint);
   box(g,.055,.085,.22,side*.87,.80,.30,chrome);
   box(g,.055,.085,.22,side*.87,.80,-.63,chrome);
   box(g,.18,.12,.20,side*.94,1.12,.88,paint);
   for(const pz of [-1.28,1.28])wheel(g,side*.81,.30,pz,.30,.20);
   box(g,.40,.15,.07,side*.56,.78,1.96,lamp);
   box(g,.30,.18,.065,side*.64,.80,-1.96,tail);
  }
  const wind=box(g,1.46,.64,.045,0,1.13,.97,glass);wind.rotation.x=-.28;
  box(g,1.14,.14,.07,0,.62,1.97,rubber);box(g,.38,.13,.035,0,.43,2.015,plate);box(g,.38,.13,.035,0,.55,-2.015,plate);
 }
 function scooter(x:number,z:number,color:number,yaw:number){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;g.name='parked-scooter';scene.add(g);
  const paint=material(color);paint.roughness=.38;paint.metalness=.16;
  wheel(g,0,.215,.60,.215,.12);wheel(g,0,.215,-.57,.215,.14);
  box(g,.38,.18,.94,0,.36,-.12,paint);box(g,.29,.075,.54,0,.46,.18,rubber);
  box(g,.40,.37,.63,0,.60,-.40,paint);
  box(g,.39,.115,.64,0,.82,-.40,rubber);
  const front=box(g,.38,.50,.26,0,.65,.45,paint);front.rotation.x=-.20;
  box(g,.33,.15,.34,0,.92,.48,paint);box(g,.25,.09,.045,0,.94,.67,lamp);box(g,.26,.07,.04,0,.68,-.74,tail);
  for(const side of [-1,1]){
   rod(g,new THREE.Vector3(side*.065,.22,.58),new THREE.Vector3(side*.065,.84,.39),.023,chrome);
   rod(g,new THREE.Vector3(0,.99,.42),new THREE.Vector3(side*.32,.99,.38),.026,rubber);
   rod(g,new THREE.Vector3(side*.23,.99,.38),new THREE.Vector3(side*.32,1.20,.38),.013,chrome);
   box(g,.13,.09,.045,side*.32,1.20,.38,rubber);
  }
  box(g,.22,.10,.035,0,.43,-.76,plate);
  rod(g,new THREE.Vector3(-.10,.38,-.16),new THREE.Vector3(-.26,.02,-.22),.018,chrome);
 }
 for(const side of [-1,1]){
  box(scene,5.05,.035,10.4,side*9.24,.014,.65,asphalt);
  for(let i=0;i<5;i++)box(scene,1.78,.009,.04,side*7.38,.037,-3.2+i*1.52,stripe);
  box(scene,.045,.009,9.7,side*11.65,.037,.65,stripe);
  mpv(side*10.0,-.25,side<0?0xf0efeb:0x59636a,side<0?.10:-.10);
  const colors=[0x263c4b,0xb32f35,0xe8e9de,0x355d59,0x34559b,0x222528];
  for(let i=0;i<6;i++)scooter(side*7.0,-1.55+i*1.13,colors[(i+(side<0?0:2))%colors.length]!,side<0?-Math.PI/2:Math.PI/2);
  sign(scene,'PARKIR','MOBIL & MOTOR',side*9.6,2.12,-4.55,1.65,.48);
 }
}


/** Upper floors are built over the original arcade; both departure tunnels stay open. */
function createGrandOffice(scene:THREE.Scene){
 const stone=material(0xf2e9d9),trim=material(0xfffaf0),emerald=material(0xe1d0aa),deep=material(0x8c7049),windowMat=material(0x42474e);
 gold.metalness=.35;
 function cylinder(parent:THREE.Object3D,rt:number,rb:number,h:number,x:number,y:number,z:number,m:THREE.Material,segments=24){
  const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
 }
 function dome(x:number,y:number,z:number,r:number,h:number){
  const pts=[new THREE.Vector2(0,0),new THREE.Vector2(r*.88,0),new THREE.Vector2(r,.16*h),new THREE.Vector2(r*.96,.37*h),new THREE.Vector2(r*.78,.61*h),new THREE.Vector2(r*.48,.83*h),new THREE.Vector2(r*.15,.96*h),new THREE.Vector2(0,h)];
  const o=new THREE.Mesh(new THREE.LatheGeometry(pts,40),emerald);o.position.set(x,y,z);o.castShadow=true;scene.add(o);
  cylinder(scene,r*.90,r*.90,.14,x,y-.06,z,gold,40);
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4,points=pts.slice(1,-1).map(p=>new THREE.Vector3(x+Math.cos(angle)*(p.x+.014),y+p.y,z+Math.sin(angle)*(p.x+.014)));
   const rib=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.025,5,false),gold);scene.add(rib);
  }
  cylinder(scene,.025,.055,.30,x,y+h+.13,z,gold,12);sphere(scene,.085,x,y+h+.31,z,gold);
  const moon=new THREE.Shape();moon.absarc(0,0,.20,.65,5.63,false);moon.quadraticCurveTo(-.07,-.12,-.07,0);moon.quadraticCurveTo(-.07,.12,.159,.121);
  const c=new THREE.Mesh(new THREE.ExtrudeGeometry(moon,{depth:.035,bevelEnabled:false,curveSegments:16}),gold);c.position.set(x,y+h+.53,z);scene.add(c);
 }
 // Four-storey headquarters: original ground level plus three taller upper floors.
 const roof=O.groundTop+(O.floors-1)*O.floorHeight;
 const front=O.z+O.depth/2;
 // Extend side wings without changing the two ground-floor departure tunnels.
 for(const side of [-1,1]){box(scene,2,3.7,4.5,side*10,1.85,O.z,stone);box(scene,2.12,.18,4.85,side*10,3.75,O.z,trim);}
 box(scene,O.width,roof-O.groundTop,O.depth,0,(roof+O.groundTop)/2,O.z,stone);
 // Cornices along the sides preserve the uninterrupted central two-floor video wall.
 for(let f=0;f<=3;f++){
  const y=O.groundTop+f*O.floorHeight;
  if(f===1){for(const side of [-1,1]){box(scene,5.75,.17,4.86,side*8.38,y,O.z,trim);box(scene,5.75,.075,4.94,side*8.38,y-.12,O.z,gold);}}
  else{box(scene,O.width+.5,.18,4.86,0,y,O.z,trim);box(scene,O.width+.56,.09,4.94,0,y-.13,O.z,gold);}
 }
 for(let floor=0;floor<3;floor++){
  const y=O.groundTop+floor*O.floorHeight+1.49;
  for(const x of [-9,-6.7,6.7,9]){
   box(scene,1.50,1.68,.08,x,y,front+.06,deep);
   const arch=new THREE.Mesh(new THREE.CircleGeometry(.75,24,0,Math.PI),deep);arch.position.set(x,y+.83,front+.115);scene.add(arch);
   const frame=new THREE.Mesh(new THREE.TorusGeometry(.75,.060,7,24,Math.PI),gold);frame.position.set(x,y+.83,front+.17);scene.add(frame);
   for(const dx of [-.70,.70])box(scene,.11,1.68,.12,x+dx,y,front+.15,trim);
   box(scene,1.27,1.42,.06,x,y,front+.16,windowMat);box(scene,.052,1.49,.08,x,y,front+.22,gold);box(scene,1.30,.052,.08,x,y,front+.22,gold);
  }
 }
 // Actual 16:9 screen with gold frame; dark panel remains when YouTube cannot be displayed.
 const frame=box(scene,V.width+.38,V.height+.38,.19,V.x,V.y,V.z-.17,gold);frame.name='hajji-videotron-frame';
 const screen=box(scene,V.width,V.height,.065,V.x,V.y,V.z-.075,new THREE.MeshBasicMaterial({color:0x101b1d}));screen.name='hajji-videotron-screen';
 sign(scene,'HAJJI.DIGITAL','PUSAT PENGARAHAN & PENDAFTARAN',0,roof-1.55,front+.22,10.6,2.10);
 const emblemTex=new THREE.TextureLoader().load('./pwa-icon.svg');emblemTex.colorSpace=THREE.SRGBColorSpace;
 const emblem=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.8),new THREE.MeshBasicMaterial({map:emblemTex,transparent:true,toneMapped:false}));emblem.position.set(7.35,roof-1.55,front+.28);scene.add(emblem);
 cylinder(scene,2.5,2.5,.55,0,roof+.35,-8.25,stone,40);
 dome(0,roof+.64,-8.25,2.65,2.65);
 for(const side of [-1,1]){
  const x=side*10.75,z=-7.65;
  box(scene,1.65,.32,1.65,x,.16,z,trim);
  cylinder(scene,.65,.86,roof-.25,x,(roof+.25)/2,z,trim,16);
  for(const y of [3.8,7.24,10.64,roof]){cylinder(scene,.9,.9,.20,x,y,z,gold,20);cylinder(scene,.96,.96,.15,x,y+.15,z,trim,20);}
  cylinder(scene,.48,.48,1.45,x,roof+.86,z,emerald,16);
  for(let i=0;i<8;i++){const angle=i*Math.PI/4;box(scene,.10,.82,.10,x+Math.cos(angle)*.50,roof+.89,z+Math.sin(angle)*.50,trim);}
  cylinder(scene,.67,.67,.15,x,roof+1.65,z,gold,20);
  dome(x,roof+1.73,z,.66,1.42);
 }

}
type SnackActor={arm:THREE.Group;head:THREE.Group;phase:number;vendor:boolean};
function createFoodCourt(scene:THREE.Scene){
 const actors:SnackActor[]=[];
 const tile=material(0xd9c8a5),rubber=material(0x24292b),metal=material(0xaab1af),glass=material(0xb5d6d5);
 glass.transparent=true;glass.opacity=.25;glass.depthWrite=false;metal.metalness=.35;
 function tube(parent:THREE.Object3D,rt:number,rb:number,h:number,x:number,y:number,z:number,m:THREE.Material){
  const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,12),m);o.position.set(x,y,z);parent.add(o);return o;
 }
 function person(parent:THREE.Group,x:number,z:number,h:number,color:number,skinColor:number,hijab:boolean,vendor:boolean,phase:number,drink=false){
  const body=new THREE.Group();body.position.set(x,0,z);body.scale.setScalar(h);parent.add(body);
  const outfit=material(color),skin=material(skinColor),hair=material(0x29241e),pants=material(0x39484b);
  for(const dx of [-.105,.105]){tube(body,.068,.053,.39,dx,.21,0,pants);box(body,.145,.075,.21,dx,.055,.04,rubber);}
  tube(body,.19,.15,.30,0,.49,0,outfit);
  const head=new THREE.Group();head.position.set(0,.76,0);head.scale.setScalar(1.70);body.add(head);
  if(hijab){sphere(head,.154,0,0,-.025,outfit);tube(body,.15,.25,.19,0,.73,-.015,outfit);}
  else sphere(head,.143,0,.035,-.025,hair);
  const face=sphere(head,.131,0,0,.045,skin);face.scale.set(.91,1.04,.88);
  for(const dx of [-.048,.048]){sphere(head,.027,dx,.024,.145,paper);sphere(head,.017,dx,.024,.166,rubber);sphere(head,.006,dx-.004,.031,.179,paper);}
  const mouth=box(head,.038,.009,.008,0,-.052,.157,rubber);mouth.castShadow=false;
  for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.17,.69,0);body.add(arm);
   tube(arm,.057,.048,.21,0,-.085,0,outfit);tube(arm,.045,.042,.16,0,-.24,0,skin);sphere(arm,.049,0,-.34,0,skin);
   if(side===1){
    if(vendor){const stick=box(arm,.017,.19,.017,0,-.36,.065,wood);stick.rotation.x=.75;}
    else if(drink){const cup=tube(arm,.045,.029,.085,0,-.34,.055,paper);cup.rotation.x=.22;const straw=box(arm,.009,.085,.009,0,-.275,.057,gold);straw.rotation.x=.22;}else{const skewer=box(arm,.012,.18,.012,0,-.34,.085,wood);skewer.rotation.x=Math.PI/2;for(let k=0;k<3;k++)sphere(arm,.035,0,-.34,.10+k*.055,cream);}
    actors.push({arm,head,phase,vendor});
   }else arm.rotation.z=side*.1;
  }
  return body;
 }
 function cart(side:number,z:number,title:string,color:number,food:number,index:number){
  const g=new THREE.Group();g.name='umkm-'+title.toLowerCase().replaceAll(' ','-');g.position.set(side*13.1,0,z);g.rotation.y=side<0?Math.PI/2:-Math.PI/2;scene.add(g);
  const paint=material(color),snack=material(food);
  // Wooden Indonesian pushcart, glass display case and striped canopy.
  box(g,1.58,.67,.66,0,.65,0,paint);box(g,1.69,.075,.77,0,1.02,0,wood);
  for(const x of [-.76,.76]){
   const wheel=tube(g,.25,.25,.09,x,.29,0,rubber);wheel.rotation.z=Math.PI/2;
   const hub=tube(g,.105,.105,.105,x,.29,0,metal);hub.rotation.z=Math.PI/2;
   for(const zz of [-.31,.31])box(g,.052,1.03,.052,x,1.51,zz,wood);
  }
  box(g,1.5,.40,.045,0,1.27,.32,glass);box(g,1.5,.055,.69,0,1.50,0,metal);
  box(g,1.50,.04,.66,0,1.12,0,paper);
  for(let i=0;i<8;i++)sphere(g,.058,-.49+(i%4)*.16,1.18,-.12+Math.floor(i/4)*.17,snack);
  tube(g,.18,.16,.22,.53,1.15,-.04,metal);tube(g,.19,.19,.035,.53,1.28,-.04,metal);sphere(g,.037,.53,1.31,-.04,rubber);
  for(let i=0;i<8;i++)box(g,.226,.085,.94,-.79+i*.226,2.04,0,i%2?cream:paint);
  sign(g,title,'JAJANAN NUSANTARA',0,1.80,.46,1.65,.46);
  // Seller faces the customers. Three children gather by each cart and snack.
  person(g,0,-.68,1.56,color,0xb78a67,index%2===1,true,index*.9);
  for(let i=0;i<3;i++){
   const child=person(g,-.70+i*.70,.83+(i%2)*.38,.99+i*.09,[0x4a83a3,0xd6a24e,0xc06b85][(i+index)%3]!,[0xc99a73,0xe1b793,0x9e7357][i]!,i===1,false,index+i*.8,index===3||i===2);
   child.rotation.y=Math.PI+(i-1)*.23;
  }
 }
 for(const side of [-1,1]){
  box(scene,4.1,.04,9.7,side*13.75,.022,-.65,tile);
  sign(scene,'JAJANAN UMKM','KULINER INDONESIA',side*13.6,2.9,-5.15,2.8,.8);
  for(let i=0;i<3;i++){const x=side*15.2,z=-3+i*2.6;box(scene,1.2,.10,.38,x,.45,z,wood);for(const dz of [-.12,.12])box(scene,.08,.43,.08,x,.21,z+dz,green);}
 }
 cart(-1,-3.15,'CILOK',0x368b52,0xe6cd91,0);
 cart(-1,.45,'SIOMAY',0xb6813b,0xe8d6b2,1);
 cart(1,-3.15,'BATAGOR',0xc66b3d,0xd7a45e,2);
 cart(1,.45,'ES TEH',0x397c92,0x9a5b34,3);
 return (time:number)=>{for(const a of actors){const t=time+a.phase;a.arm.rotation.x=a.vendor?-.72+Math.sin(t*3)*.25:-.40-Math.pow(Math.max(0,Math.sin(t*1.6)),4)*1.38;a.arm.rotation.z=a.vendor?-.16+Math.sin(t*2)*.12:-.12;a.head.rotation.y=Math.sin(t*.8)*.10;}};
}

export function createRegistrationHall(scene:THREE.Scene){
 createParking(scene);
 createGrandOffice(scene);
 const animateMarket=createFoodCourt(scene);
 let marketTime=0;
 const lanes=[createLane(scene,-1,false),createLane(scene,1,true)];
 let completed=0,registrationBusy=false;
 function update(dt:number,player?:SolidBody){
  marketTime+=dt;animateMarket(marketTime);
  if(registrationBusy)return;
  for(const lane of lanes){
   lane.clock+=dt;lane.pen.rotation.y=Math.sin(lane.clock*7)*.16;lane.pen.position.x=.15+Math.sin(lane.clock*5)*.025;lane.pen.position.z=.22+Math.cos(lane.clock*5)*.015;
   const bodies=(npc:LaneNPC)=>[...lane.queue.filter(n=>n!==npc).map(n=>({...n.root.position,radius:.30})),...(lane.outgoing&&lane.outgoing!==npc?[{...lane.outgoing.root.position,radius:.30}]:[]),...(player?[player]:[])];
   for(const npc of lane.queue)advance(npc,dt,1.12,bodies(npc));
   if(lane.outgoing){
    const npc=lane.outgoing;if(advance(npc,dt,1.55,bodies(npc))){
     if(lane.exitStep===0){lane.exitStep=1;npc.target.set(lane.side*5.9,0,-4.55);}
     else if(lane.exitStep===1){lane.exitStep=2;npc.target.set(lane.side*6,0,-7.20);}
     else{npc.root.visible=false;lane.spare=npc;lane.outgoing=null;completed++;}
    }
   }
   lane.service-=dt;
   if(lane.service<=0&&lane.ticket?.ahead!==0&&lane.spare&&!lane.outgoing&&lane.queue[0]!.root.position.distanceTo(slot(lane,0))<.08){
    const first=lane.queue.shift()!;if(lane.ticket)lane.ticket=serveQueue(lane.ticket);lane.outgoing=first;lane.exitStep=0;first.target.set(lane.side*5.65,0,-2.77);
    const incoming=lane.spare;lane.spare=null;rename(incoming,lane);incoming.root.position.copy(entrance(lane.side));incoming.root.rotation.y=Math.PI;incoming.root.visible=true;lane.queue.push(incoming);
    lane.queue.forEach((npc,i)=>npc.target.copy(slot(lane,i)));
    lane.service=7.5;
   }
  }
 }
 const get=(female:boolean)=>lanes[female?1:0]!;
 function join(female:boolean){const lane=get(female);if(!lane.ticket)lane.ticket=joinQueue(lane.queue.length);lane.queue.forEach((npc,i)=>npc.target.copy(slot(lane,i)));}
 function leave(female:boolean){const lane=get(female);lane.ticket=null;lane.queue.forEach((npc,i)=>npc.target.copy(slot(lane,i)));}
 function playerSlot(female:boolean){const lane=get(female),rank=lane.ticket?.ahead??lane.queue.length;return new THREE.Vector3(lane.side*(4.15+(rank%2?.075:0)),0,-2.77+rank*.77);}
 return {update,join,leave,playerSlot,clerk:(female:boolean)=>get(female).clerk,setRegistrationBusy:(busy:boolean)=>{registrationBusy=busy;},ahead:(female:boolean)=>get(female).ticket?.ahead??null,stats:()=>({male:lanes[0]!.queue.length,female:lanes[1]!.queue.length,completed})};
}
