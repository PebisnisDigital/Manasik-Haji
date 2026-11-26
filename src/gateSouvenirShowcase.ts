import * as THREE from 'three';
import {GIFTS,type GiftId} from './souvenirModel.ts';
import {GATE_SOUVENIR_TABLE as T} from './gateSouvenirLayout.ts';
import {block,batchMarketBlocks,marketSign} from './marketGeometry.ts';

const forest=0x12553d,gold=0xe7b744,ivory=0xfff1c7,red=0xb94336,blue=0x3667a1,black=0x1c2429,wood=0x91663a;
const order:readonly GiftId[]=['prayers','ebook','checklist','planner','audio','tasbih','wallpaper','stickers','coupon','commission','wallet','mystery','photo','congrats','replay','alumni','certificate','medal','trophy','badge','graduates','motion','stickman'];
const names:Partial<Record<GiftId,string>>={certificate:'SERTIFIKAT',medal:'MEDALI EMAS',trophy:'PIALA',badge:'12 BINTANG',graduates:'LULUSAN',alumni:'KARTU ALUMNI',prayers:'BUKU DOA',ebook:'E-BOOK',checklist:'CHECKLIST',planner:'PLANNER',audio:'AUDIO DOA',tasbih:'TASBIH',wallpaper:'WALLPAPER',stickers:'STIKER WA',photo:'FOTO KENANGAN',congrats:'VIDEO UCAPAN',replay:'AKSES ULANG',coupon:'KUPON',commission:'KOMISI 30%',wallet:'DOMPET',mystery:'MYSTERY BOX',motion:'KELAS MOTION',stickman:'KELAS STICKMAN'};
export const gateSouvenirTitles=()=>GIFTS.filter(g=>g.id!=='guide').map(g=>g.title);
export function buildGateSouvenirShowcase(scene:THREE.Scene){
 const root=new THREE.Group();root.name='gate-souvenir-showcase';root.position.set(T.x,0,T.z);scene.add(root);
 const metal=new THREE.MeshStandardMaterial({color:gold,metalness:.64,roughness:.29});
 const cylinder=new THREE.CylinderGeometry(1,1,1,16),taper=new THREE.CylinderGeometry(1,.45,1,20),torus=new THREE.TorusGeometry(1,.14,8,24),sphere=new THREE.SphereGeometry(1,10,8);
 function shape(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);root.add(o);return o;}
 const b=(w:number,h:number,d:number,x:number,y:number,z:number,m:number|THREE.Material)=>block(root,w,h,d,x,y,z,m);
 const label=(title:string,x:number,y:number,z:number,w=.5,h=.12)=>marketSign(root,title,'',x,y,z,w,h,'#174c36','#fff1bf');
 // Long front table, green draped skirt and gold trim, with three stepped display rows.
 b(T.w,.82,T.d,0,.41,0,forest);b(T.w+.02,.075,T.d,0,.85,0,wood);
 b(T.w,.055,.05,0,.9,T.d/2,gold);b(T.w,.055,.05,0,.13,T.d/2,gold);
 for(let i=0;i<15;i++)b(.025,.65,.025,-2.1+i*.3,.48,T.d/2+.012,gold);
 marketSign(root,'23 OLEH-OLEH','BONUS PESERTA · SELESAIKAN 12 LEVEL',0,.51,T.d/2+.035,4.22,.67,'#104632','#ffdf82');
 b(4.4,.35,1.12,0,1.06,-.3,forest);b(4.45,.06,1.12,0,1.26,-.3,gold);
 b(4.4,.31,.55,0,1.43,-.59,forest);b(4.45,.06,.55,0,1.61,-.59,gold);
 function mini(id:GiftId,x:number,y:number,z:number){
  const g=GIFTS.find(g=>g.id===id)!;const tag=names[id]??g.title;
  switch(g.kind){
   case 'book':{
    for(let k=0;k<2;k++){const xx=x+(k-.5)*.13,yy=y+.21+(k===1?.015:0);b(.22,.36,.12,xx,yy,z-.05,k===0?forest:id==='stickers'?red:blue);b(.18,.30,.022,xx,yy,z+.015,ivory);}
    label(tag,x,y+.22,z+.04,.39,.115);break;}
   case 'certificate':case 'wall':case 'photo':case 'screen':case 'card':{
    const w=.43,h=g.kind==='card'?.25:.39; b(w,h,.07,x,y+h/2,z,metal);b(w-.045,h-.05,.075,x,y+h/2,z+.02,ivory);label(tag,x,y+h/2,z+.065,w-.065,.10);break;}
   case 'medal':case 'badge':{
    const disc=shape(cylinder,metal,x,y+.23,z,.145,.055,.145);disc.rotation.x=Math.PI/2;
    if(g.kind==='medal')for(const dx of [-.055,.055]){const ribbon=b(.065,.24,.025,x+dx,y+.37,z-.01,red);ribbon.rotation.z=dx*5;}
    else label('12',x,y+.23,z+.04,.15,.095);break;}
   case 'trophy':{
    shape(cylinder,metal,x,y+.04,z,.135,.07,.135);shape(cylinder,metal,x,y+.15,z,.035,.20,.035);shape(taper,metal,x,y+.32,z,.16,.25,.16);
    for(const dx of [-.15,.15])shape(torus,metal,x+dx,y+.32,z,.075,.09,.075);break;}
   case 'audio':{
    const arc=shape(torus,metal,x,y+.24,z,.13,.13,.13);arc.rotation.z=Math.PI;for(const dx of [-.13,.13])b(.09,.16,.08,x+dx,y+.13,z,black);break;}
   case 'tasbih':for(let k=0;k<10;k++){const a=k*Math.PI/5;shape(sphere,metal,x+Math.cos(a)*.135,y+.19+Math.sin(a)*.135,z,.033,.033,.033);}break;
   case 'coins':for(let k=0;k<5;k++)shape(cylinder,metal,x+(k%2-.5)*.16,y+.026+Math.floor(k/2)*.052,z,.085,.045,.085);label('30%',x,y+.25,z+.035,.26,.13);break;
   case 'wallet':b(.34,.25,.14,x,y+.14,z,wood);b(.09,.13,.025,x,y+.14,z+.08,metal);break;
   case 'gift':b(.32,.30,.26,x,y+.15,z,red);b(.07,.31,.27,x,y+.15,z,metal);b(.35,.06,.29,x,y+.31,z,red);break;
   case 'cinema':{
    b(.49,.37,.25,x,y+.185,z,black);b(.46,.22,.028,x,y+.25,z+.14,metal);b(.41,.18,.03,x,y+.25,z+.16,ivory);label(id==='motion'?'MOTION':'STICKMAN',x,y+.25,z+.18,.36,.09);
    for(const dx of [-.12,0,.12])b(.09,.065,.07,x+dx,y+.055,z+.19,red);break;}
  }
  label(tag,x,y+.05,z+.245,.53,.12);
 }
 order.forEach((id,i)=>{const row=Math.floor(i/8),col=i%8;mini(id,(col-3.5)*.54,[.91,1.3,1.65][row]!,[.60,.04,-.50][row]!);});
 // Extra copies signal abundance without inventing additional benefits.
 for(const [x,id] of [[-1.86,'trophy'],[-1.29,'medal'],[1.3,'gift'],[1.87,'gift']] as const){
  if(id==='gift'){b(.24,.23,.24,x,1.45,-.05,red);b(.055,.24,.25,x,1.45,-.05,metal);}
  else{shape(taper,metal,x,1.46,-.10,.09,.17,.09);shape(cylinder,metal,x,1.34,-.10,.085,.06,.085);}
 }
 marketSign(root,'OLEH-OLEH KELULUSAN','LIHAT SEMUA HADIAH DI SINI',0,2.37,-.76,4.1,.62,'#0a5539','#ffdf82');
 for(const x of [-2.13,2.13])b(.055,.87,.055,x,1.93,-.78,metal);
 batchMarketBlocks(root);
 root.userData.rewardCount=order.length;
 return root;
}
