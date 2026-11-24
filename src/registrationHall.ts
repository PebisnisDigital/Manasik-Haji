import * as THREE from 'three';
import {humanActor} from './characters/HumanActors.ts';

type LaneNPC={root:THREE.Group;label:THREE.Sprite;canvas:HTMLCanvasElement;nameIndex:number;target:THREE.Vector3};
type Lane={side:number;female:boolean;queue:LaneNPC[];spare:LaneNPC|null;outgoing:LaneNPC|null;exitStep:number;service:number;pen:THREE.Group;clock:number;nextName:number;names:readonly string[]};
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
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false}));sprite.position.y=height+.24;sprite.scale.set(.92,.23,1);root.add(sprite);return {label:sprite,canvas};
}
function rename(npc:LaneNPC,lane:Lane){
 const name=lane.names[lane.nextName++%lane.names.length];npc.nameIndex=lane.nextName;
 const c=npc.canvas,g=c.getContext('2d')!;g.clearRect(0,0,c.width,c.height);g.fillStyle='#163b30ed';g.fillRect(0,4,256,56);g.strokeStyle='#d5bb79';g.lineWidth=2;g.strokeRect(2,6,252,52);g.font='bold 30px sans-serif';g.textAlign='center';g.fillStyle='#fff4db';g.fillText(name,128,44,242);npc.label.material.map!.needsUpdate=true; npc.root.userData.registrationName=name;
}
function makeAdmin(scene:THREE.Scene,x:number,female:boolean){
 const admin=new THREE.Group();admin.position.set(x,0,-4.06);scene.add(admin);
 const uniform=material(female?0x427b69:0x305e55),skin=material(female?0xc99d7b:0x9c7153);
 // A seated clerk behind the counter. Forearm and pencil move over the ledger.
 box(admin,.48,.6,.32,0,1.04,0,uniform);sphere(admin,.137,0,1.49,.015,skin);
 if(female){sphere(admin,.154,0,1.49,-.05,uniform);sphere(admin,.128,0,1.49,.078,skin);box(admin,.34,.23,.18,0,1.28,.02,uniform);}
 else{sphere(admin,.141,0,1.55,-.02,green);box(admin,.26,.065,.23,0,1.58,.016,cream);}
 box(admin,.13,.12,.40,-.15,1.09,.18,uniform);sphere(admin,.064,-.15,1.09,.38,skin);
 const pen=new THREE.Group();pen.position.set(.15,1.10,.22);admin.add(pen);box(pen,.12,.11,.34,0,0,.10,uniform);sphere(pen,.064,0,0,.28,skin);const pencil=box(pen,.025,.025,.20,0,.018,.36,gold);pencil.rotation.x=-.36;
 return pen;
}
const slot=(lane:Lane,i:number)=>new THREE.Vector3(lane.side*(4.15+(i%2?.075:0)),0,-2.77+i*.77);
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
 const pen=makeAdmin(scene,x,female);
 sign(scene,'GERBANG','KEBERANGKATAN',side*6,2.77,-5.68,2.05,.53);
 const railX=side*4.83;for(let i=0;i<5;i++){const z=-2.30+i*1.55;post(scene,railX,z);if(i)rope(scene,railX,z-1.55,z);}
 const lane:Lane={side,female,queue:[],spare:null,outgoing:null,exitStep:0,service:side<0?1.3:4.1,pen,clock:0,nextName:0,names:female?namesFemale:namesMale};
 for(let i=0;i<11;i++){
  const height=(female?1.57:1.66)+(i%4)*.055;
  const root=humanActor(scene,0xffffff,female,height,undefined,{palette:i%10,build:.87+(i%5)*.067,brightness:.94+(i%3)*.045,registration:true,cull:true});
  const tag=label(root,height),npc:LaneNPC={root,...tag,nameIndex:0,target:slot(lane,Math.min(i,9))};
  rename(npc,lane);root.position.copy(npc.target);root.rotation.y=Math.PI;root.userData.registrationNPC=true;
  if(i===10){root.visible=false;lane.spare=npc;}else lane.queue.push(npc);
 }
 return lane;
}
function advance(npc:LaneNPC,dt:number,speed:number){
 const p=npc.root.position,dx=npc.target.x-p.x,dz=npc.target.z-p.z,d=Math.hypot(dx,dz);
 if(d<.015){p.copy(npc.target);return true;}
 const distance=Math.min(d,speed*dt);p.x+=dx/d*distance;p.z+=dz/d*distance;
 const yaw=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(yaw-npc.root.rotation.y),Math.cos(yaw-npc.root.rotation.y));npc.root.rotation.y+=delta*(1-Math.exp(-dt*9));return distance===d;
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
 const stone=material(0xe9dfc8),trim=material(0xf4e9cc),emerald=material(0x145a43),deep=material(0x143d35),windowMat=material(0x355b60);
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
 // Deep building body and roof above the existing 3.7 m ground-floor facade.
 box(scene,18,3.0,4.5,0,5.40,-8.7,stone);
 box(scene,18.5,.18,4.85,0,3.94,-8.7,trim);
 box(scene,18.6,.17,4.95,0,6.96,-8.7,trim);
 box(scene,18.6,.12,4.95,0,6.77,-8.7,gold);
 for(const x of [-6.9,-4.6,4.6,6.9]){
  box(scene,1.45,1.52,.07,x,5.21,-6.42,deep);
  const arch=new THREE.Mesh(new THREE.CircleGeometry(.72,24,0,Math.PI),deep);arch.position.set(x,5.96,-6.36);scene.add(arch);
  const frame=new THREE.Mesh(new THREE.TorusGeometry(.72,.057,7,24,Math.PI),gold);frame.position.set(x,5.96,-6.29);scene.add(frame);
  for(const dx of [-.65,.65])box(scene,.10,1.57,.12,x+dx,5.21,-6.30,trim);
  box(scene,1.26,1.29,.065,x,5.24,-6.29,windowMat);
  box(scene,.055,1.45,.09,x,5.24,-6.22,gold);box(scene,1.28,.055,.09,x,5.25,-6.22,gold);
 }
 sign(scene,'HAJJI.DIGITAL','LATIHAN MENUJU HAJI MABRUR',0,5.52,-6.23,6.9,1.97);
 cylinder(scene,2.4,2.4,.65,0,7.34,-8.25,stone,40);
 dome(0,7.65,-8.25,2.65,2.65);
 for(const side of [-1,1]){
  const x=side*8.65,z=-7.65;
  box(scene,1.48,.32,1.48,x,.16,z,trim);
  cylinder(scene,.64,.78,6.55,x,3.51,z,stone,12);
  for(const y of [3.8,6.75]){cylinder(scene,.88,.88,.20,x,y,z,gold,20);cylinder(scene,.93,.93,.15,x,y+.15,z,trim,20);}
  cylinder(scene,.48,.48,1.55,x,7.66,z,emerald,16);
  for(let i=0;i<8;i++){const angle=i*Math.PI/4;box(scene,.10,.82,.10,x+Math.cos(angle)*.50,7.70,z+Math.sin(angle)*.50,trim);}
  cylinder(scene,.66,.66,.15,x,8.51,z,gold,20);
  dome(x,8.59,z,.65,1.42);
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
  tube(body,.19,.15,.35,0,.56,0,outfit);
  const head=new THREE.Group();head.position.set(0,.88,0);body.add(head);
  if(hijab){sphere(head,.154,0,0,-.025,outfit);tube(body,.15,.25,.19,0,.73,-.015,outfit);}
  else sphere(head,.143,0,.035,-.025,hair);
  const face=sphere(head,.131,0,0,.045,skin);face.scale.set(.91,1.04,.88);
  for(const dx of [-.048,.048])sphere(head,.012,dx,.024,.145,rubber);
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
 let completed=0;
 function update(dt:number){
  marketTime+=dt;animateMarket(marketTime);
  for(const lane of lanes){
   lane.clock+=dt;lane.pen.rotation.y=Math.sin(lane.clock*7)*.16;lane.pen.position.x=.15+Math.sin(lane.clock*5)*.025;lane.pen.position.z=.22+Math.cos(lane.clock*5)*.015;
   for(const npc of lane.queue)advance(npc,dt,1.12);
   if(lane.outgoing){
    const npc=lane.outgoing;if(advance(npc,dt,1.55)){
     if(lane.exitStep===0){lane.exitStep=1;npc.target.set(lane.side*5.9,0,-4.55);}
     else if(lane.exitStep===1){lane.exitStep=2;npc.target.set(lane.side*6,0,-7.20);}
     else{npc.root.visible=false;lane.spare=npc;lane.outgoing=null;completed++;}
    }
   }
   lane.service-=dt;
   if(lane.service<=0&&lane.spare&&!lane.outgoing&&lane.queue[0]!.root.position.distanceTo(slot(lane,0))<.08){
    const first=lane.queue.shift()!;lane.outgoing=first;lane.exitStep=0;first.target.set(lane.side*5.65,0,-2.77);
    const incoming=lane.spare;lane.spare=null;rename(incoming,lane);incoming.root.position.copy(entrance(lane.side));incoming.root.rotation.y=Math.PI;incoming.root.visible=true;lane.queue.push(incoming);
    lane.queue.forEach((npc,i)=>npc.target.copy(slot(lane,i)));
    lane.service=7.5;
   }
  }
 }
 return {update,stats:()=>({male:lanes[0]!.queue.length,female:lanes[1]!.queue.length,completed})};
}
