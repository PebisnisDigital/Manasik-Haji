import * as THREE from 'three';
import {humanActor} from './characters/HumanActors.ts';

export const BUBUR_POINT = new THREE.Vector3(14.7, 1.9, 6.4);
const colors = new Map<number,THREE.MeshStandardMaterial>();
function material(color:number){let m=colors.get(color);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.78});colors.set(color,m);}return m;}
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,color:number){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent:THREE.Object3D,r:number,h:number,x:number,y:number,z:number,color:number){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),material(color));m.position.set(x,y,z);parent.add(m);return m;}
function sign(parent:THREE.Object3D,title:string,sub:string,x:number,y:number,z:number,w:number,h:number,bg:string,fg:string){
 const c=document.createElement('canvas');c.width=768;c.height=192;const g=c.getContext('2d')!;g.fillStyle=bg;g.fillRect(0,0,768,192);g.fillStyle=fg;g.textAlign='center';g.font='bold 76px sans-serif';g.fillText(title,384,92,730);g.font='bold 29px sans-serif';g.fillText(sub,384,151,730);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);parent.add(m);
}
const shops=[{x:16.5,name:'ALFAMART',sub:'MINIMARKET',bg:'#d52a28',fg:'#fff8d4',stripe:0xffd331},{x:-16.5,name:'INDOMARET',sub:'MINIMARKET',bg:'#ffffff',fg:'#204f9e',stripe:0xe63835},{x:-26,name:'KOKOSALAMA',sub:'TOKO HIJAB',bg:'#6f526a',fg:'#fff2df',stripe:0xd4a78b}];
// Shared static collision volumes for walking and camera obstruction, padded for body clearance.
const marketSolids=[
 ...shops.map(shop=>new THREE.Box3(new THREE.Vector3(shop.x-4.32,0,-9.72),new THREE.Vector3(shop.x+4.32,4.2,-2.86))),
 new THREE.Box3(new THREE.Vector3(13.38,0,5.57),new THREE.Vector3(16.03,2.48,7.23)),
 ...[-19,19].map(x=>new THREE.Box3(new THREE.Vector3(x-1.05,0,-.82),new THREE.Vector3(x+1.05,1.49,3.42))),
 ...[-1,1].map(side=>new THREE.Box3(new THREE.Vector3(side*10-1.02,0,-2.35),new THREE.Vector3(side*10+1.02,1.65,1.85))),
];
export function marketWalkable(x:number,z:number){
 const pad=.32;
 return !marketSolids.some(b=>x>b.min.x-pad&&x<b.max.x+pad&&z>b.min.z-pad&&z<b.max.z+pad);
}
const cameraRay=new THREE.Ray(),cameraHit=new THREE.Vector3(),cameraDir=new THREE.Vector3();
// Shorten the orbit before a solid object can hide the player or contain the camera.
export function keepMarketCameraClear(pivot:THREE.Vector3,goal:THREE.Vector3){
 cameraDir.subVectors(goal,pivot);const length=cameraDir.length();if(length<.001)return goal;
 cameraRay.set(pivot,cameraDir.multiplyScalar(1/length));let nearest=length;
 for(const b of marketSolids){if(b.containsPoint(pivot))continue;const hit=cameraRay.intersectBox(b,cameraHit);if(hit){const d=hit.distanceTo(pivot);if(d<nearest)nearest=d;}}
 if(nearest<length)goal.copy(pivot).addScaledVector(cameraDir,Math.max(.16,nearest-.23));
 return goal;
}
export type SalesJob='bubur'|'hijab';
export const salesNames={bubur:'Bubur Ayam',hijab:'Hijab KOKOSALAMA'} as const;
export const salesCommission={bubur:2000,hijab:5000} as const;
export const SALES_COUPON='MAUHAJJI';
type Prospect={id:number;name:string;actor:THREE.Group};
const names=['Asep','Siti','Dedi','Neneng','Budi','Yuni','Agus','Rina','Dian','Eko','Nining','Wawan','Titin','Rizky','Dewi','Ari','Fitri','Slamet','Rani','Ujang'];
export function createBuburMarket(scene:THREE.Scene){
 const root=new THREE.Group();root.name='bubur-market';scene.add(root);
 const walkers:{actor:THREE.Group;points:THREE.Vector3[];index:number;wait:number}[]=[];
 const prospects:Prospect[]=[];
 const addProspect=(actor:THREE.Group)=>{const id=prospects.length;prospects.push({id,name:names[id%names.length]!,actor});};
 for(const shop of shops){
  const x=shop.x;const building=new THREE.Group();building.name=shop.name;root.add(building);
  box(building,8.5,.14,6.8,x,.04,-6.4,0xd5cbb9);box(building,8.5,3.9,.2,x,1.95,-9.6,0xeee7dc);
  for(const side of [-1,1])box(building,.22,3.9,6.4,x+side*4.15,1.95,-6.4,0xeee7dc);
  box(building,8.65,.25,6.65,x,4.06,-6.35,0xe8dfce);
  box(building,8.55,.84,.35,x,3.48,-3.08,0xf4ebda);box(building,8.55,.14,.4,x,2.98,-2.99,shop.stripe);
  sign(building,shop.name,shop.sub,x,3.48,-2.88,7.9,.79,shop.bg,shop.fg);
  for(const side of [-1,1]){
   box(building,3.1,2.67,.09,x+side*2.55,1.37,-3.1,0x7eaaa9);
   box(building,.09,2.7,.17,x+side*1.01,1.37,-3.02,0xeee7dc);
   box(building,3.1,.12,.16,x+side*2.55,.2,-3.02,0xeee7dc);
   for(let j=0;j<3;j++){box(building,2.6,.11,.72,x+side*2.55,.55+j*.63,-4.35,0x795d4c);for(let k=0;k<5;k++)box(building,.35,.32,.3,x+side*2.55-1+k*.5,.77+j*.63,-4.3,[0xd8a56a,0xe1cdd7,0x98b9aa,0xdbc65c,0xa291bc][k]!);}
  }
  box(root,8.2,.04,5.7,x,.02,.2,0x646b6c);for(let j=0;j<4;j++)box(root,.055,.012,4.3,x-3.3+j*2.2,.048,.1,0xf8e9bf);
  box(root,8.6,.09,1.1,x,.045,3.65,0xbeb5a2);
  for(let i=0;i<3;i++){
   const female=shop.name==='KOKOSALAMA'||i%2===1;
   const actor=humanActor(scene,[0x739385,0xb28b84,0x9f9b75][i]!,female,undefined,undefined,{palette:i+3,build:1,brightness:1,cull:true,registration:true});
   actor.userData.noCollision=true;addProspect(actor);
   const path=[new THREE.Vector3(x-3+i*.6,0,4.25+i*.36),new THREE.Vector3(x+.2,0,3.6),new THREE.Vector3(x+.2,0,-2.65),new THREE.Vector3(x+.2,0,-5.3),new THREE.Vector3(x+.2,0,-2.65),new THREE.Vector3(x+.2,0,3.6),new THREE.Vector3(x+3-i*.6,0,4.25+i*.36)];
   const index=i*2;actor.position.copy(path[index]!);walkers.push({actor,points:path,index:(index+1)%path.length,wait:i*.8});
  }
 }
 for(const x of [-19,19]){
  box(root,1.7,.6,3.8,x,.55,1.3,0x9eafb2);box(root,1.5,.54,2.1,x,1.09,1.05,0x375364);box(root,1.55,.12,2.12,x,1.39,1.05,0x9eafb2);
  for(const side of [-1,1])for(const z of [.1,2.5]){const w=cylinder(root,.36,.2,x+side*.84,.35,z,0x292b2e);w.rotation.z=Math.PI/2;}
 }
 const x=BUBUR_POINT.x,z=BUBUR_POINT.z;const cart=new THREE.Group();cart.name='gerobak-bubur';root.add(cart);
 box(cart,2.25,.85,1.08,x,.62,z,0x327452);box(cart,2.35,.12,1.2,x,1.09,z,0xe8d8b7);
 for(const side of [-1,1]){const wheel=cylinder(cart,.4,.14,x+side*1.05,.4,z,0x303334);wheel.rotation.z=Math.PI/2;for(const dz of [-.48,.48])box(cart,.07,1.25,.07,x+side*1.05,1.75,z+dz,0x785539);}
 box(cart,2.65,.18,1.65,x,2.38,z,0x37794e);sign(cart,'BUBUR AYAM','TABUNGAN HAJI',x,2.18,z+.85,2.5,.37,'#204c35','#fff4cc');
 cylinder(cart,.33,.40,x-.7,1.31,z,0xb5bfc2);cylinder(cart,.35,.055,x-.7,1.54,z,0xd5dadd);cylinder(cart,.08,.06,x-.7,1.59,z,0x222222);
 for(let i=0;i<4;i++){cylinder(cart,.15,.075,x-.1+i*.28,1.18,z+.22,[0xffe5b3,0xb78851,0xf2cf92,0x8eac6d][i]!);}
 cylinder(cart,.21,.42,x+.85,1.37,z-.2,0xd0ae54);
 const vendor=humanActor(scene,0x547e64,false,undefined,undefined,{palette:8,build:1,brightness:1,registration:true});vendor.position.set(x,0,z-.92);vendor.rotation.y=0;
 for(let i=0;i<3;i++){const a=humanActor(scene,0xb1a27f,i===1,undefined,undefined,{palette:5+i,build:1,brightness:1,cull:true,registration:true});a.position.set(x+.18+i*.7,0,z+1.3+i*.12);a.rotation.y=Math.PI;a.userData.noCollision=true;addProspect(a);}
 for(let i=0;i<4;i++){const actor=humanActor(scene,0xc0b39a,i%2===1,undefined,undefined,{palette:i+4,build:1,brightness:1,cull:true,registration:true});actor.userData.noCollision=true;addProspect(actor);const points=[new THREE.Vector3(-29,0,7.8+i*.45),new THREE.Vector3(-12,0,7.8+i*.45),new THREE.Vector3(12,0,7.8+i*.45),new THREE.Vector3(21,0,7.8+i*.45)];actor.position.copy(points[i]!);walkers.push({actor,points,index:(i+1)%4,wait:0});}
 const hijabOwner=humanActor(scene,0x866b88,true,undefined,undefined,{palette:7,build:1,brightness:1,registration:true});
 hijabOwner.position.set(-26,0,-1.8);hijabOwner.rotation.y=0;
 return {owners:{bubur:vendor,hijab:hijabOwner},prospects,update(dt:number,hold:THREE.Group|null=null){for(const w of walkers){if(w.actor===hold)continue;if(w.wait>0){w.wait-=dt;continue;}const p=w.actor.position,t=w.points[w.index]!;const dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz);if(d<.08){w.index=(w.index+1)%w.points.length;w.wait=.45;continue;}const step=Math.min(d,dt*1.1);p.x+=dx/d*step;p.z+=dz/d*step;w.actor.rotation.y=Math.atan2(dx,dz);}}};
}


type SalesState={job:SalesJob|null;accepted:number[];rejected:number[];claimed:boolean};
const storeKey='hajji-market-sales-v1';
export function loadSales():SalesState{
 try{const s=JSON.parse(sessionStorage.getItem(storeKey)??'null');if(s&&(s.job==='bubur'||s.job==='hijab')&&Array.isArray(s.accepted)&&Array.isArray(s.rejected))return {job:s.job,accepted:s.accepted,rejected:s.rejected,claimed:!!s.claimed};}catch{}
 return {job:null,accepted:[],rejected:[],claimed:false};
}
export function saveSales(s:SalesState){try{sessionStorage.setItem(storeKey,JSON.stringify(s));}catch{}}
export function salesResponse(id:number,pitch:number,job:SalesJob){
 // Stable outcomes: four of sixteen prospects decline politely regardless of pitch.
 // Others accept if approached respectfully; all ten sales are attainable.
 if(id%4===3)return {ok:false,line:job==='bubur'?'Maaf, saya sudah makan.':'Maaf, saya belum membutuhkan hijab.'};
 if(pitch===2)return {ok:false,line:'Maaf, saya kurang nyaman kalau ditawari seperti itu.'};
 return {ok:true,line:job==='bubur'?'Boleh, saya mau satu porsi. Nanti saya ke gerobaknya.':'Boleh, saya mau beli hijab. Saya ke toko sekarang.'};
}
export function salesDialog(title:string,build:(say:(s:string)=>void,button:(s:string,fn:()=>void,primary?:boolean)=>void,close:()=>void)=>void,onClose:()=>void){
 const dlg=document.createElement('dialog');dlg.setAttribute('aria-label',title);dlg.style.cssText='width:min(420px,92vw);max-height:82dvh;overflow:auto;border:1px solid #d0b36d;border-radius:16px;background:#15382e;color:#fff5dd;padding:16px;font:16px system-ui;box-sizing:border-box;margin:auto';
 let closed=false;const close=()=>{if(closed)return;closed=true;dlg.close();dlg.remove();onClose();};
 const say=(s:string)=>{const p=document.createElement('p');p.textContent=s;p.style.margin='8px 0';p.setAttribute('aria-live','polite');dlg.append(p);};
 const button=(s:string,fn:()=>void,primary=false)=>{const b=document.createElement('button');b.type='button';b.textContent=s;b.style.cssText='display:block;width:100%;min-height:44px;padding:9px;margin:7px 0;border-radius:9px;border:1px solid #d5bd7b;background:'+(primary?'#e8c974':'#285343')+';color:'+(primary?'#15382e':'#fff5dd')+';font:inherit;cursor:pointer';b.onclick=()=>fn();dlg.append(b);};
 const h=document.createElement('h3');h.textContent=title;h.style.margin='0 0 10px';dlg.append(h);build(say,button,close);dlg.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(dlg);dlg.showModal();
}
