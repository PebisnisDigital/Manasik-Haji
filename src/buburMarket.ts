import * as THREE from 'three';
import {Clip} from './sim/States.ts';
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
export function insideHijab(x:number,z:number){return Math.abs(x+26)<1.15&&z< -3.05&&z> -6.05;}
export function marketWalkable(x:number,z:number){
 const pad=.32;
 // The central doorway and clear shopping aisle are walkable; shelves and counter are not.
 if(Math.abs(x+26)<.79&&z>=-5.65&&z<=-2.52)return true;
 return !marketSolids.some(b=>x>b.min.x-pad&&x<b.max.x+pad&&z>b.min.z-pad&&z<b.max.z+pad);
}
// Player escort routes respect the same public paths as manual movement.
export function escortDestination(job:SalesJob){return job==='bubur'?new THREE.Vector3(14.7,0,8.65):new THREE.Vector3(-26,0,-5.35);}
export function planEscortRoute(start:THREE.Vector3,job:SalesJob):THREE.Vector3[]{
 const goal=escortDestination(job),step=.4,ox=-30,oz=-5.6,nx=128,nz=40;
 const valid=(x:number,z:number)=>x>=-30.1&&x<=21&&z>=-5.65&&z<=10.2&&(Math.abs(x)<=5.6||z>=5.9||Math.abs(x)>=11.8)&&(z>=-3||Math.abs(x+26)<.79)&&marketWalkable(x,z);
 const at=(id:number)=>new THREE.Vector3(ox+(id%nx)*step,0,oz+Math.floor(id/nx)*step);
 const segment=(a:THREE.Vector3,b:THREE.Vector3)=>{const n=Math.max(1,Math.ceil(a.distanceTo(b)/.12));for(let i=1;i<=n;i++){const t=i/n;if(!valid(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;};
 if(segment(start,goal))return [goal];
 const nearest=(p:THREE.Vector3)=>{let best=-1,d=Infinity;for(let i=0;i<nx*nz;i++){const q=at(i),dist=q.distanceToSquared(p);if(dist<d&&valid(q.x,q.z)&&segment(p,q)){best=i;d=dist;}}return best;};
 const s=nearest(start),g=nearest(goal);if(s<0||g<0)return [];
 const prev=new Int32Array(nx*nz);prev.fill(-2);prev[s]=-1;const pending=[s];
 for(let i=0;i<pending.length&&prev[g]===-2;i++){const id=pending[i]!,x=id%nx,z=Math.floor(id/nx);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]] as const){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const n=zz*nx+xx;if(prev[n]!==-2)continue;const p=at(n);if(!valid(p.x,p.z)||!segment(at(id),p))continue;prev[n]=id;pending.push(n);}}
 if(prev[g]===-2)return [];
 const nodes=[goal];for(let id=g;id>=0;id=prev[id]!)nodes.unshift(at(id));
 const route:THREE.Vector3[]=[];let from=start;
 while(nodes.length){let j=-1;for(let i=nodes.length-1;i>=0;i--){if(segment(from,nodes[i]!)){j=i;break;}}if(j<0)return [];const next=nodes[j]!;route.push(next);from=next;nodes.splice(0,j+1);}
 return route;
}
const cameraRay=new THREE.Ray(),cameraHit=new THREE.Vector3(),cameraDir=new THREE.Vector3();
// Shorten the orbit before a solid object can hide the player or contain the camera.
export function keepMarketCameraClear(pivot:THREE.Vector3,goal:THREE.Vector3){
 if(insideHijab(pivot.x,pivot.z)){goal.x=THREE.MathUtils.clamp(goal.x,-29.6,-22.4);goal.z=THREE.MathUtils.clamp(goal.z,-8.8,-3.3);goal.y=Math.min(goal.y,3.25);return goal;}
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
 const addProspect=(actor:THREE.Group,palette:number)=>{actor.userData.marketPalette=palette;const id=prospects.length;prospects.push({id,name:names[id%names.length]!,actor});};
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
   actor.userData.noCollision=true;addProspect(actor,i+3);
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
 for(let i=0;i<3;i++){const a=humanActor(scene,0xb1a27f,i===1,undefined,undefined,{palette:5+i,build:1,brightness:1,cull:true,registration:true});a.position.set(x-3.5-i*.65,0,z+2.8);a.rotation.y=Math.PI;a.userData.noCollision=true;addProspect(a,5+i);}
 for(let i=0;i<4;i++){const actor=humanActor(scene,0xc0b39a,i%2===1,undefined,undefined,{palette:i+4,build:1,brightness:1,cull:true,registration:true});actor.userData.noCollision=true;addProspect(actor,i+4);const points=[new THREE.Vector3(-29,0,7.8+i*.45),new THREE.Vector3(-12,0,7.8+i*.45),new THREE.Vector3(12,0,7.8+i*.45),new THREE.Vector3(21,0,7.8+i*.45)];actor.position.copy(points[i]!);walkers.push({actor,points,index:(i+1)%4,wait:0});}
 const hijabOwner=humanActor(scene,0x866b88,true,undefined,undefined,{palette:7,build:1,brightness:1,registration:true});
 hijabOwner.position.set(-26,0,-6.55);hijabOwner.rotation.y=0;
 box(root,1.65,1.02,.64,-26,.51,-6.02,0x8d6c70);box(root,1.75,.08,.72,-26,1.06,-6.02,0xe8cfb8);box(root,.30,.28,.10,-26.48,1.23,-6.15,0x354448);sign(root,'KASIR','KOKOSALAMA',-26,2.45,-6.44,1.55,.42,'#6f526a','#fff4df');
 // Two dining tables and four plastic chairs beside the cart, outside the main footpath.
 const seats:{point:THREE.Vector3;table:THREE.Vector3;yaw:number;busy:number|null}[]=[];
 for(const tx of [17.9,19.9]){
  const tz=5.95;box(root,1.12,.10,.86,tx,.77,tz,0xc5a77b);
  for(const dx of [-.43,.43])for(const dz of [-.31,.31])box(root,.075,.72,.075,tx+dx,.36,tz+dz,0x555d58);
  for(const side of [-1,1]){
   const sz=tz+side*.83;box(root,.46,.075,.44,tx,.45,sz,0x39735b);
   for(const dx of [-.17,.17])for(const dz of [-.15,.15])box(root,.055,.42,.055,tx+dx,.21,sz+dz,0x39735b);
   box(root,.44,.30,.065,tx,.67,sz+side*.19,0x39735b);
   seats.push({point:new THREE.Vector3(tx,0,sz),table:new THREE.Vector3(tx,.85,tz+side*.20),yaw:side===1?Math.PI:0,busy:null});
  }
 }
 // A sale changes the actual NPC's activity; the normal pedestrian loop pauses until purchase finishes.
 type Purchase={job:SalesJob;stage:'approach'|'queue'|'seat-walk'|'seated'|'eat'|'thank'|'shop'|'shop-wait'|'bag-thank'|'exit'|'done';route:THREE.Vector3[];time:number;prop?:THREE.Group;seat?:number;paid?:boolean};
 const served:number[]=[];
 let speech:{actor:THREE.Group;name:string;text:string;left:number}|null=null;
 const speak=(actor:THREE.Group,name:string,text:string)=>{speech={actor,name,text,left:2.7};};
 const markServed=(id:number,b:Purchase)=>{if(!b.paid){b.paid=true;served.push(id);}};
 let service:{id:number;route:THREE.Vector3[];phase:'carry'|'return';prop?:THREE.Group;time:number}|null=null;
 const vendorHome=vendor.position.clone();
 const purchases=new Map<number,Purchase>(),line:number[]=[];
 let escort:{id:number;trail:THREE.Vector3[];last:THREE.Vector3}|null=null;
 const v=(x:number,z:number)=>new THREE.Vector3(x,0,z);
 const fabric=[0x315e75,0xb28b51,0x687b63,0x8e5460,0x3d465c,0xb6a793,0x527d76,0x735f92,0xefe7d3,0x284c3f];
 const advance=(a:THREE.Group,t:THREE.Vector3,dt:number,speed=1.55)=>{const dx=t.x-a.position.x,dz=t.z-a.position.z,d=Math.hypot(dx,dz);if(d<.055){a.position.copy(t);return true;}const step=Math.min(d,dt*speed);a.position.x+=dx/d*step;a.position.z+=dz/d*step;a.rotation.y=Math.atan2(dx,dz);return d<=step;};
 const follow=(a:THREE.Group,p:Purchase,dt:number)=>{const t=p.route[0];if(t&&advance(a,t,dt))p.route.shift();return p.route.length===0;};
 const clearSegment=(a:THREE.Vector3,b:THREE.Vector3)=>{const n=Math.ceil(a.distanceTo(b)/.22);for(let i=1;i<=n;i++){const t=i/n;if(!marketWalkable(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;};
 // Grid search is run once per sale, not each frame. Route via the public pavement.
 function outsideRoute(a:THREE.Vector3,dest:THREE.Vector3){
  const path:THREE.Vector3[]=[];let from=a.clone();
  if(from.z< -2.5){const shop=shops.find(s=>Math.abs(s.x-from.x)<4.5);if(shop){path.push(v(shop.x+.2,from.z),v(shop.x+.2,-1.95));from=path[path.length-1]!.clone();}}
  if(clearSegment(from,dest))return [...path,dest];
  const step=.6,ox=-31,oz=-2.1,nx=90,nz=22;
  const cell=(p:THREE.Vector3)=>[Math.max(0,Math.min(nx-1,Math.round((p.x-ox)/step))),Math.max(0,Math.min(nz-1,Math.round((p.z-oz)/step)))];
  const at=(id:number)=>v(ox+(id%nx)*step,oz+Math.floor(id/nx)*step);
  const [sx,sz]=cell(from),[ex,ez]=cell(dest);const start=sz!*nx+sx!,goal=ez!*nx+ex!;
  const prev=new Int32Array(nx*nz);prev.fill(-2);prev[start]=-1;const pending=[start];
  for(let i=0;i<pending.length&&prev[goal]===-2;i++){const id=pending[i]!,cx=id%nx,cz=Math.floor(id/nx);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]] as const){const x=cx+dx,z=cz+dz;if(x<0||x>=nx||z<0||z>=nz)continue;const next=z*nx+x;if(prev[next]!==-2)continue;const point=at(next);if(!marketWalkable(point.x,point.z))continue;prev[next]=id;pending.push(next);}}
  if(prev[goal]===-2)return [...path,v(from.x,9.65),v(dest.x,9.65),dest];
  const nodes:THREE.Vector3[]=[];for(let id=goal;id!==start&&id>=0;id=prev[id]!)nodes.unshift(at(id));nodes.push(dest);
  while(nodes.length){let last=0;for(let i=nodes.length-1;i>=0;i--){if(clearSegment(from,nodes[i]!)){last=i;break;}}const next=nodes[last]!;path.push(next);from=next;nodes.splice(0,last+1);}
  return path;
 }
 function propFor(p:Prospect,kind:'bag'|'bowl'|'belly'){
  const g=new THREE.Group();g.name='market-'+kind;p.actor.add(g);
  if(kind==='bag'){
   box(g,.28,.32,.16,0,0,0,0xd4ad83);box(g,.25,.045,.17,0,.15,0,0x94664a);
   for(const z of [-.065,.065]){const h=new THREE.Mesh(new THREE.TorusGeometry(.075,.012,6,14,Math.PI),material(0x896447));h.position.set(0,.17,z);g.add(h);}
   sign(g,'KOKOSALAMA','HIJAB',0,0,.083,.255,.13,'#6f526a','#fff4df');g.position.set(.31,.66,.09);
  }else if(kind==='bowl'){
   const bowl=new THREE.Mesh(new THREE.SphereGeometry(.14,16,10,0,Math.PI*2,Math.PI/2,Math.PI/2),material(0xf3f0e5));g.add(bowl);cylinder(g,.13,.025,0,.005,0,0xe9d5ad);g.position.set(.06,1.12,.30);for(let k=0;k<4;k++)cylinder(g,.027,.014,Math.cos(k*1.8)*.065,.025,Math.sin(k*1.8)*.065,[0xd4ac68,0x6f925e,0xe3c598,0xba873e][k]!);
  }else{
   const palette=Number(p.actor.userData.marketPalette??5);
   const belly=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),material(fabric[palette]??0xb6a793));belly.scale.set(.30,.25,.27);g.position.set(0,1.00,.17);g.add(belly);
   g.scale.setScalar(.12);
  }
  return g;
 }
 function removeProp(p:Purchase){if(p.prop){p.prop.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});p.prop.removeFromParent();p.prop=undefined;}}
 function complete(p:Prospect,buy:Purchase){removeProp(buy);buy.prop=propFor(p,buy.job==='bubur'?'belly':'bag');buy.stage='done';buy.time=0;p.actor.userData.marketPurchase='done';}
 function purchase(id:number,job:SalesJob,restored=false){
  const p=prospects[id];if(!p||purchases.has(id))return;
  const buy:Purchase={job,stage:'approach',route:[],time:0};purchases.set(id,buy);p.actor.userData.marketPurchase=job;
  if(restored){buy.paid=true;complete(p,buy);buy.time=1;if(buy.prop)buy.prop.scale.setScalar(1);return;}
  if(job==='bubur'){line.push(id);buy.route=outsideRoute(p.actor.position,v(16.8,8.85));speak(vendor,'Penjual Bubur','Silakan duduk, saya siapkan buburnya.');}
  else if(insideHijab(p.actor.position.x,p.actor.position.z)){buy.stage='shop';buy.route=[v(-25.8,-5.15)];}
  else{buy.route=outsideRoute(p.actor.position,v(-25.8,-1.95));}
 }
 function startEscort(id:number,player:THREE.Vector3){const p=prospects[id];if(!p||purchases.has(id))return;escort={id,trail:clearSegment(p.actor.position,player)?[player.clone()]:outsideRoute(p.actor.position,player.clone()),last:player.clone()};p.actor.userData.marketPurchase='escort';}
 function cancelEscort(){if(escort){const p=prospects[escort.id];if(p)delete p.actor.userData.marketPurchase;}escort=null;}
 function escortReady(id:number,player:THREE.Vector3){const p=prospects[id];return !!p&&escort?.id===id&&Math.hypot(player.x-p.actor.position.x,player.z-p.actor.position.z)<2.6;}
 function updateEscort(dt:number,player:THREE.Vector3){if(!escort)return;const p=prospects[escort.id];if(!p)return;const a=p.actor;if(escort.last.distanceTo(player)>.30){escort.trail.push(player.clone());escort.last.copy(player);}const t=escort.trail[0];if(t&&(escort.trail.length>1||a.position.distanceTo(player)>1.1)&&advance(a,t,dt,2.85))escort.trail.shift();if(escort.trail.length===0&&a.position.distanceTo(player)>1.5){escort.trail.push(player.clone());escort.last.copy(player);}}
 function handoff(id:number,job:SalesJob,player:THREE.Vector3){const p=prospects[id];if(!p||!escortReady(id,player)||player.distanceTo(escortDestination(job))>2.0||(job==='hijab'&&(!insideHijab(player.x,player.z)||!insideHijab(p.actor.position.x,p.actor.position.z))))return false;escort=null;purchase(id,job);return true;}
 function resetPurchases(){cancelEscort();if(service?.prop){service.prop.removeFromParent();}service=null;vendor.position.copy(vendorHome);delete vendor.userData.campPose;delete hijabOwner.userData.campPose;for(const seat of seats)seat.busy=null;for(const [id,buy] of purchases){removeProp(buy);const p=prospects[id];if(p){delete p.actor.userData.marketPurchase;delete p.actor.userData.marketDeparture;delete p.actor.userData.campPose;}}purchases.clear();line.length=0;served.length=0;speech=null;}
 function vendorRoute(seatIndex:number){const seat=seats[seatIndex]!;return [v(14.7,4.78),v(16.65,4.78),v(16.65,8.35),v(seat.table.x-.85,8.35),v(seat.table.x-.85,5.95)];}
 function updateVendor(dt:number){
  if(!service){const next=Array.from(purchases.entries()).find(([,b])=>b.stage==='seated');if(!next)return;const [id,b]=next;if(b.seat===undefined)return;service={id,route:vendorRoute(b.seat),phase:'carry',time:0,prop:propFor({id:-1,name:'Penjual Bubur',actor:vendor},'bowl')};return;}
  const s=service;const buy=purchases.get(s.id),customer=prospects[s.id];if(!buy||!customer){service=null;return;}
  const target=s.route[0];if(target&&advance(vendor,target,dt,1.8))s.route.shift();s.time+=dt;
  if(s.phase==='carry'){vendor.userData.campPose={clip:Clip.MARKET_CARRY,phase:(s.time*1.8)%1};if(s.route.length===0&&buy.seat!==undefined){
   const seat=seats[buy.seat]!;vendor.rotation.y=Math.PI/2;delete vendor.userData.campPose;
   if(s.prop){root.add(s.prop);s.prop.position.copy(seat.table);s.prop.rotation.set(0,0,0);buy.prop=s.prop;s.prop=undefined;}
   buy.stage='eat';buy.time=0;speak(vendor,'Penjual Bubur','Ini buburnya, silakan dinikmati.');markServed(s.id,buy);
   s.phase='return';s.route=vendorRoute(buy.seat).reverse().slice(1).concat([vendorHome.clone()]);
  }}else if(s.route.length===0){vendor.position.copy(vendorHome);vendor.rotation.y=0;service=null;}
 }
 function updatePurchase(p:Prospect,buy:Purchase,dt:number){
  const a=p.actor,id=p.id;
  if(buy.stage==='approach'&&follow(a,buy,dt)){
   if(buy.job==='bubur')buy.stage='queue';
   else{buy.stage='shop';buy.route=[v(-25.8,-3.5),v(-25.8,-5.15)];}
  }else if(buy.stage==='queue'){
   const index=line.indexOf(id);if(index<0)return;
   const free=seats.findIndex(s=>s.busy===null);
   if(index===0&&free>=0){line.shift();const seat=seats[free]!;seat.busy=id;buy.seat=free;buy.stage='seat-walk';buy.route=seat.yaw===Math.PI?[v(seat.point.x,8.45),seat.point.clone()]:[v(seat.point.x-.85,8.45),v(seat.point.x-.85,seat.point.z),seat.point.clone()];}
   else advance(a,v(16.8+Math.min(index,5)*.65,8.85),dt);
  }else if(buy.stage==='seat-walk'&&follow(a,buy,dt)){const seat=seats[buy.seat!]!;a.rotation.y=seat.yaw;a.userData.campPose={clip:Clip.MARKET_SEAT,phase:0};buy.stage='seated';buy.time=0;speak(a,p.name,'Baik, saya duduk dulu.');}
  else if(buy.stage==='seated'){buy.time+=dt;a.userData.campPose={clip:Clip.MARKET_SEAT,phase:(buy.time*.3)%1};}
  else if(buy.stage==='eat'){buy.time+=dt;a.userData.campPose={clip:Clip.MARKET_EAT,phase:(buy.time*.8)%1};if(buy.time>=5.0){buy.stage='thank';buy.time=0;removeProp(buy);speak(a,p.name,'Alhamdulillah, enak buburnya. Terima kasih!');a.userData.campPose={clip:Clip.MARKET_SEAT,phase:0};}}
  else if(buy.stage==='thank'){buy.time+=dt;if(buy.time>=1.8){if(buy.seat!==undefined)seats[buy.seat]!.busy=null;delete a.userData.campPose;complete(p,buy);}}
  else if(buy.stage==='shop'&&follow(a,buy,dt)){buy.stage='shop-wait';buy.time=0;a.rotation.y=Math.PI;speak(hijabOwner,'Kasir KOKOSALAMA','Ini tas belanjaannya. Terima kasih!');buy.prop=propFor(p,'bag');root.add(buy.prop);buy.prop.position.set(-26,1.13,-6.05);buy.prop.rotation.set(0,0,0);}
  else if(buy.stage==='shop-wait'){buy.time+=dt;if(buy.prop){const t=Math.min(1,buy.time/1.1);const from=new THREE.Vector3(-26,1.13,-6.05);const to=a.localToWorld(new THREE.Vector3(.31,.66,.09));buy.prop.position.copy(from.lerp(to,t));hijabOwner.userData.campPose={clip:Clip.GUIDE_WAVE,phase:Math.min(.88,t*.88)};if(t===1){a.add(buy.prop);buy.prop.position.set(.31,.66,.09);buy.prop.rotation.set(0,0,0);delete hijabOwner.userData.campPose;buy.stage='bag-thank';buy.time=0;speak(a,p.name,'Iya, terima kasih!');markServed(id,buy);}}}
  else if(buy.stage==='bag-thank'){buy.time+=dt;if(buy.time>=1.7){buy.stage='exit';buy.route=[v(-25.8,-3.5),v(-25.8,-1.7),v(-25.8,4.4),v(-25.8,9.65)];}}
  else if(buy.stage==='exit'&&follow(a,buy,dt)){buy.stage='done';buy.time=1;a.userData.marketPurchase='done';}
  else if(buy.stage==='done'&&buy.job==='bubur'&&buy.prop){buy.time=Math.min(1,buy.time+dt*2.5);buy.prop.scale.setScalar(.12+.88*Math.sin(buy.time*Math.PI/2));}
 }
 return {owners:{bubur:vendor,hijab:hijabOwner},prospects,purchase,startEscort,cancelEscort,escortReady,drainServed:()=>served.splice(0),speech:()=>speech,hasEscort:(id:number)=>escort?.id===id,handoff,resetPurchases,update(dt:number,hold:THREE.Group|null=null,player?:THREE.Vector3){
  if(player&&escort&&prospects[escort.id]?.actor!==hold)updateEscort(dt,player);
  if(speech){speech.left-=dt;if(speech.left<=0)speech=null;}
  for(const p of prospects){const buy=purchases.get(p.id);if(buy&&p.actor!==hold)updatePurchase(p,buy,dt);}
  updateVendor(dt);
  for(const w of walkers){if(w.actor===hold)continue;const p=prospects.find(p=>p.actor===w.actor),buy=p?purchases.get(p.id):undefined;if(p&&escort?.id===p.id)continue;if(buy&&buy.stage!=='done')continue;
   if(buy?.stage==='done'&&!w.actor.userData.marketDeparture){w.actor.userData.marketDeparture=true;w.points=[...outsideRoute(w.actor.position,v(w.actor.position.x,9.65)),v(-29,9.65),v(21,9.65)];w.index=0;w.wait=.6;}
   if(w.wait>0){w.wait-=dt;continue;}const t=w.points[w.index]!;if(advance(w.actor,t,dt,1.1)){w.index=(w.index+1)%w.points.length;w.wait=.45;}
  }
  // Previously stationary customers join a visible departure loop after eating or shopping.
  for(const p of prospects){const buy=purchases.get(p.id);if(buy?.stage==='done'&&!walkers.some(w=>w.actor===p.actor)){const points=[v(12,9.65),v(2,9.65),v(-12,9.65),v(20,9.65)];walkers.push({actor:p.actor,points,index:0,wait:1.5});}}
  document.documentElement.dataset.marketQueue=String(line.length);
  document.documentElement.dataset.marketCompleted=String([...purchases.values()].filter(p=>p.stage==='done').length);
 }};
}


type SalesState={job:SalesJob|null;accepted:number[];rejected:number[];claimed:boolean;pending:number|null;serving:number|null};
const storeKey='hajji-market-sales-v1';
export function loadSales():SalesState{
 try{const s=JSON.parse(sessionStorage.getItem(storeKey)??'null');if(s&&(s.job==='bubur'||s.job==='hijab')&&Array.isArray(s.accepted)&&Array.isArray(s.rejected))return {job:s.job,accepted:s.accepted,rejected:s.rejected,claimed:!!s.claimed,pending:Number.isInteger(s.pending)&&s.pending>=0&&s.pending<16?s.pending:null,serving:Number.isInteger(s.serving)&&s.serving>=0&&s.serving<16&&!s.accepted.includes(s.serving)?s.serving:null};}catch{}
 return {job:null,accepted:[],rejected:[],claimed:false,pending:null,serving:null};
}
export function saveSales(s:SalesState){try{sessionStorage.setItem(storeKey,JSON.stringify(s));}catch{}}
export function salesResponse(id:number,pitch:number,job:SalesJob){
 // Stable outcomes: four of sixteen prospects decline politely regardless of pitch.
 // Others accept if approached respectfully; all ten sales are attainable.
 if(id%4===3)return {ok:false,line:job==='bubur'?'Maaf, saya sudah makan.':'Maaf, saya belum membutuhkan hijab.'};
 if(pitch===2)return {ok:false,line:'Maaf, saya kurang nyaman kalau ditawari seperti itu.'};
 return {ok:true,line:job==='bubur'?'Boleh, saya mau satu porsi. Tolong antarkan saya ke penjualnya, ya.':'Boleh, saya mau beli hijab. Tolong antar saya ke kasir, ya.'};
}
type SalesSide='player'|'npc'|'system';
type SalesAnchor={x:number;y:number;visible:boolean};
type Speech={text:string;who:SalesSide};
/** Share the standing-guide world overlay: one projected speech bubble, player choices below. */
export function salesDialog(title:string,build:(say:(s:string,who?:SalesSide)=>void,button:(s:string,fn:()=>void,primary?:boolean)=>void,close:()=>void,clearChoices:()=>void)=>void,onClose:()=>void,project:(side:'npc'|'player')=>SalesAnchor){
 const root=document.createElement('section');root.className='gateWorldDialogue gateGuideDialogue gateSalesDialogue';root.setAttribute('role','dialog');root.setAttribute('aria-label','Percakapan dengan '+title);root.dataset.guide=title;
 const bubble=document.createElement('div');bubble.className='gateWorldBubble';bubble.setAttribute('aria-live','polite');
 const who=document.createElement('strong'),line=document.createElement('p');bubble.append(who,line);
 const panel=document.createElement('section');panel.className='gateWorldPanel';panel.setAttribute('aria-label','Pilihan jawaban pemain');
 const actions=document.createElement('div');actions.className='travelActions gateWorldActions gateGuideActions';panel.append(actions);
 const x=document.createElement('button');x.type='button';x.className='gateWorldClose';x.textContent='×';x.setAttribute('aria-label','Tutup percakapan');
 root.append(bubble,panel,x);document.body.append(root);document.documentElement.classList.add('gateDialogueActive');
 let closed=false,raf=0,timer:ReturnType<typeof setTimeout>|undefined,side:SalesSide='npc',collecting=false,busy=false,closeAfter=false;
 let messages:Speech[]=[];
 function render(m:Speech){side=m.who;bubble.dataset.side=side==='player'?'player':side==='system'?'system':'guide';who.textContent=side==='player'?'Pemain':side==='system'?'Misi penjualan':title;line.textContent=m.text;}
 function say(text:string,who:SalesSide='npc'){messages.push({text,who});}
 function layout(){
  if(closed)return;
  const a=project(side==='player'?'player':'npc'),w=innerWidth,h=innerHeight,bw=bubble.offsetWidth,bh=bubble.offsetHeight,p=panel.getBoundingClientRect();
  const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(v,Math.max(lo,hi)));
  let left=clamp(a.x-bw/2,12,w-bw-12),top=clamp(a.y-bh-12,58,h-bh-12);
  let detached=!a.visible||side==='system'||Math.abs(top-(a.y-bh-12))>18;
  if(!a.visible||side==='system'){left=clamp((w-bw)/2,12,w-bw-12);top=side==='player'&&!panel.hidden?clamp(p.top-bh-14,58,h-bh-12):58;}
  if(!panel.hidden&&left<p.right&&left+bw>p.left&&top<p.bottom&&top+bh>p.top){top=clamp(p.top-bh-14,12,h-bh-12);detached=true;}
  bubble.style.left=Math.round(left)+'px';bubble.style.top=Math.round(top)+'px';bubble.style.setProperty('--gate-tail',Math.round(clamp(a.x-left,16,bw-16))+'px');bubble.classList.toggle('detached',detached||a.x<left||a.x>left+bw);
  raf=requestAnimationFrame(layout);
 }
 function finish(){if(closed)return;closed=true;clearTimeout(timer);cancelAnimationFrame(raf);document.removeEventListener('keydown',escape);root.remove();document.documentElement.classList.remove('gateDialogueActive');onClose();}
 function close(){if(collecting&&messages.length){closeAfter=true;return;}finish();}
 function escape(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();finish();}}
 function clearChoices(){actions.replaceChildren();}
 function play(){
  if(closed)return;clearTimeout(timer);const queue=messages;messages=[];
  if(!queue.length){if(closeAfter){finish();return;}busy=false;panel.hidden=!actions.childElementCount;return;}
  busy=true;panel.hidden=true;
  const next=()=>{
   if(closed)return;
   const m=queue.shift();
   if(!m){if(closeAfter){finish();return;}busy=false;panel.hidden=!actions.childElementCount;return;}
   render(m);
   if(!queue.length&&!closeAfter){busy=false;panel.hidden=!actions.childElementCount;return;}
   // Readable alternating NPC/player lines; no text history or modal covers the world.
   timer=setTimeout(next,Math.min(1900,Math.max(850,m.text.length*19)));
  };next();
 }
 function button(text:string,fn:()=>void,primary=false){
  const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='travelPrimary';
  b.onclick=()=>{if(closed||busy)return;collecting=true;try{fn();}finally{collecting=false;}play();};
  actions.append(b);
 }
 x.onclick=finish;document.addEventListener('keydown',escape);
 collecting=true;try{build(say,button,close,clearChoices);}finally{collecting=false;}
 play();layout();
}
