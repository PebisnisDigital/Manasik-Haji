import * as THREE from 'three';
import {Clip} from './sim/States.ts';
import {humanActor,humanBodies,groundBodyRadius} from './characters/HumanActors.ts';
import {alfamartSolids,createAlfamartStore,insideAlfamart,type MarketAudioCue} from './alfamartStore.ts';
import {STORE_REPORT} from './alfamartInterior.ts';
import {createAlfamartNPCs} from './alfamartNPC.ts';
import {ALFAMART_PRODUCTS,ALFAMART_SALES} from './alfamartProducts.ts';
import {createMarketStreet,streetSolids,vendorInfo} from './marketStreet.ts';
import {canWalkOnPlaza,gatePlazaSolids,groundBox,legacyPlazaSolids,PLAZA} from './lobbyGround.ts';
import {walkMarketActor,type MarketWalk} from './marketGeometry.ts';

export const BUBUR_POINT = new THREE.Vector3(14.7, 1.9, 6.4);
const colors = new Map<number,THREE.MeshStandardMaterial>();
function material(color:number){let m=colors.get(color);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.78});colors.set(color,m);}return m;}
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,color:number){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent:THREE.Object3D,r:number,h:number,x:number,y:number,z:number,color:number){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),material(color));m.position.set(x,y,z);parent.add(m);return m;}
function sign(parent:THREE.Object3D,title:string,sub:string,x:number,y:number,z:number,w:number,h:number,bg:string,fg:string){
 const c=document.createElement('canvas');c.width=768;c.height=192;const g=c.getContext('2d')!;g.fillStyle=bg;g.fillRect(0,0,768,192);g.fillStyle=fg;g.textAlign='center';g.font='bold 76px sans-serif';g.fillText(title,384,92,730);g.font='bold 29px sans-serif';g.fillText(sub,384,151,730);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);parent.add(m);
}
const shops=[{x:-16.5,name:'INDOMARET',sub:'MINIMARKET',bg:'#ffffff',fg:'#204f9e',stripe:0xe63835},{x:-26,name:'KOKOSALAMA',sub:'TOKO HIJAB',bg:'#6f526a',fg:'#fff2df',stripe:0xd4a78b}];
// Shared static collision volumes for walking and camera obstruction, padded for body clearance.
const marketSolids=[
 ...gatePlazaSolids,...alfamartSolids,...streetSolids,
 ...shops.flatMap(({x})=>[
  groundBox(x,-9.6,8.5,.2,3.9),
  ...[-1,1].flatMap(side=>[
   groundBox(x+side*4.15,-6.4,.22,6.4,3.9),
   groundBox(x+side*2.55,-3.1,3.10,.17,2.7),
   groundBox(x+side*1.01,-3.02,.09,.17,2.7),
   groundBox(x+side*2.55,-4.35,2.6,.72,1.9),
  ]),
 ]),
 groundBox(-26,-6.02,1.75,.72,1.1),
 groundBox(14.7,6.4,2.35,1.20,2.48),
 ...[-19,19].map(x=>groundBox(x,1.3,1.87,3.8,1.49)),
 ...[17.9,19.9].map(x=>groundBox(x,5.95,1.12,.86,.82)),
];
export function insideHijab(x:number,z:number){return Math.abs(x+26)<4.05&&z< -3.10&&z> -9.45;}
export function marketWalkable(x:number,z:number,radius?:number){
 return canWalkOnPlaza(x,z,PLAZA,marketSolids,radius);
}
// Player escort routes respect the same public paths as manual movement.
export function escortDestination(job:SalesJob){return job==='alfamart'?new THREE.Vector3(STORE_REPORT.x,0,STORE_REPORT.z):job==='bubur'?new THREE.Vector3(14.7,0,8.65):new THREE.Vector3(-26.65,0,-4.85);}
export function planEscortRoute(start:THREE.Vector3,job:SalesJob):THREE.Vector3[]{
 return planMarketRoute(start,escortDestination(job));
}
export function planMarketRoute(start:THREE.Vector3,goal:THREE.Vector3,valid:(x:number,z:number)=>boolean=marketWalkable):THREE.Vector3[]{
 const step=.4,ox=PLAZA.x-PLAZA.width/2,nx=Math.floor(PLAZA.width/step)+1,oz=-PLAZA.depth/2,nz=Math.floor(PLAZA.depth/step)+1;
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
export function insideMarketShop(x:number,z:number){
 return insideAlfamart(x,z)||shops.some(shop=>Math.abs(x-shop.x)<4.05&&z<-3.10&&z>-9.45);
}
export function keepMarketCameraClear(pivot:THREE.Vector3,goal:THREE.Vector3,market=true){
 if(market&&insideMarketShop(pivot.x,pivot.z))goal.y=Math.min(goal.y,3.27);
 cameraDir.subVectors(goal,pivot);const length=cameraDir.length();if(length<.001)return goal;
 cameraRay.set(pivot,cameraDir.multiplyScalar(1/length));let nearest=length;
 for(const b of market?marketSolids:legacyPlazaSolids){if(b.containsPoint(pivot))continue;const hit=cameraRay.intersectBox(b,cameraHit);if(hit){const d=hit.distanceTo(pivot);if(d<nearest)nearest=d;}}
 if(nearest<length)goal.copy(pivot).addScaledVector(cameraDir,Math.max(.16,nearest-.23));
 return goal;
}
export type SalesJob='bubur'|'hijab'|'alfamart';
export const SALES_TARGET=ALFAMART_SALES.target;
export const salesNames={bubur:'Bubur Ayam',hijab:'Hijab KOKOSALAMA',alfamart:'Alfamart'} as const;
export const salesCommission={bubur:2000,hijab:5000,alfamart:ALFAMART_SALES.commission} as const;
export const SALES_COUPON='MAUHAJJI';
type Prospect={id:number;name:string;actor:THREE.Group};
const names=['Asep','Siti','Dedi','Neneng','Budi','Yuni','Agus','Rina','Dian','Eko','Nining','Wawan','Titin','Rizky','Dewi','Ari','Fitri','Slamet','Rani','Ujang'];
// Roaming destinations are spread across the plaza, away from queues and storefront doors.
export const marketRoamZones=[
 {x:-30,z:8},{x:-31,z:13.8},{x:-23,z:12},{x:-21,z:7.6},
 {x:-14,z:11.8},{x:-9,z:15},{x:-2,z:12},{x:5,z:15},
 {x:11,z:11.8},{x:18,z:14.2},{x:25,z:11.5},{x:25,z:6.5},
] as const;
export function marketRoamWalkable(x:number,z:number,radius=.36){
 if(!marketWalkable(x,z,radius+.08))return false;
 // Keep both registration lines, their entrances and central approach free.
 if(Math.abs(x)<7.2&&z<9.4)return false;
 // Leave a buffer around snack carts, customer service points and dining tables.
 if(vendorInfo.some(v=>Math.abs(x-v.x)<3.4&&Math.abs(z-v.z)<3.4))return false;
 if(x>11.9&&x<21.9&&z>3.1&&z<9.8)return false;
 // Don't roam into parking areas, store doorways or behind the buildings.
 return z>=6.5;
}
type RoamState={zone:number;previous:number;speed:number;stall:number;best:number};
export function createBuburMarket(scene:THREE.Scene,tier:string,audio:(cue:MarketAudioCue)=>void){
 const root=new THREE.Group();root.name='bubur-market';scene.add(root);
 const parkedWalkers=new Map<THREE.Group,{points:THREE.Vector3[];position:THREE.Vector3;index:number;wait:number}>();
 const walkers:{actor:THREE.Group;points:THREE.Vector3[];index:number;wait:number}[]=[];
 const roaming=new Map<THREE.Group,RoamState>();let nextRoamPlan=0;
 const prospects:Prospect[]=[];
 const addProspect=(actor:THREE.Group,palette:number)=>{actor.userData.marketPalette=palette;const id=prospects.length;prospects.push({id,name:names[id%names.length]!,actor});};
 const store=createAlfamartStore(root,audio);
 for(let i=0;i<3;i++){
  const actor=humanActor(scene,0x739385,i===1,undefined,undefined,{palette:i+3,build:1,brightness:1,cull:true,registration:true});
  addProspect(actor,i+3);
  // Loop on a separate path from Alfamart's two door lanes.
  const lane=14.47+i*.90, z=4.62+i*.67;
  const path=[new THREE.Vector3(lane,0,z),new THREE.Vector3(lane,0,3.55+i*.67)];
  actor.position.copy(path[0]!);walkers.push({actor,points:path,index:1,wait:i*.65});
 }
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
   addProspect(actor,i+3);
   // Leave the narrow shop entrance for the player and escorted customers.
   const lane=x-2.5+i*1.13, front=4.55+i*.75;
   const path=[new THREE.Vector3(lane,0,front),new THREE.Vector3(lane+.3,0,front+.48)];
   actor.position.copy(path[0]!);walkers.push({actor,points:path,index:1,wait:i*.8});
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
 // Spread sales prospects along the outer plaza instead of a static crowd in front of the food stalls.
 for(let i=0;i<3;i++){const a=humanActor(scene,0xb1a27f,i===1,undefined,undefined,{palette:5+i,build:1,brightness:1,cull:true,registration:true});const lane=[8.5,16.5,24.5][i]!;const points=[new THREE.Vector3(lane,0,14.3),new THREE.Vector3(lane+1.4,0,14.8)];a.position.copy(points[0]!);a.rotation.y=Math.PI;addProspect(a,5+i);walkers.push({actor:a,points,index:1,wait:i*1.2});}
 for(let i=0;i<4;i++){const actor=humanActor(scene,0xc0b39a,i%2===1,undefined,undefined,{palette:i+4,build:1,brightness:1,cull:true,registration:true});addProspect(actor,i+4);const points=[new THREE.Vector3(-29,0,10.1+i*.83),new THREE.Vector3(-12,0,10.1+i*.83),new THREE.Vector3(12,0,10.1+i*.83),new THREE.Vector3(21,0,10.1+i*.83)];actor.position.copy(points[i]!);walkers.push({actor,points,index:(i+1)%4,wait:0});}
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
 // Start dispersed, even before the first route is picked. Preserve sales prospect IDs.
 const spawnOrder=[0,4,8,2,6,10,1,5,9,3,7,11];
 const occupied:THREE.Vector3[]=[];
 for(const [i,w] of walkers.entries()){
  const radius=groundBodyRadius(w.actor);
  const zones=spawnOrder.map(j=>marketRoamZones[j]!);
  for(let n=0;n<zones.length;n++){
   const zone=zones[(i+n)%zones.length]!;
   const offset=i>=zones.length?1.35:0;
   const p=new THREE.Vector3(zone.x+offset,0,zone.z+offset);
   if(marketRoamWalkable(p.x,p.z,radius)&&occupied.every(q=>q.distanceToSquared(p)>1.8)){w.actor.position.copy(p);break;}
  }
  occupied.push(w.actor.position.clone());w.actor.rotation.y=Math.random()*Math.PI*2;
  w.points=[];w.index=0;w.wait=.25+Math.random()*2.8;
  parkedWalkers.set(w.actor,{points:[],position:w.actor.position.clone(),index:0,wait:w.wait});
 }
 // A sale changes the actual NPC's activity; the normal pedestrian loop pauses until purchase finishes.
 type Purchase={job:SalesJob;stage:'approach'|'queue'|'seat-walk'|'seated'|'eat'|'thank'|'shop'|'shop-wait'|'bag-thank'|'exit'|'done';route:THREE.Vector3[];time:number;prop?:THREE.Group;seat?:number;paid?:boolean};
 const served:number[]=[];
 const completedAlfamart=new Set<number>();
 let speech:{actor:THREE.Group;name:string;text:string;left:number}|null=null;
 const speak=(actor:THREE.Group,name:string,text:string)=>{speech={actor,name,text,left:2.7};};
 let playerBody:THREE.Vector3|undefined;
 const bodiesFor=(actor:THREE.Group)=>{
  const bodies=humanBodies(scene,actor);
  if(playerBody)bodies.push({x:playerBody.x,z:playerBody.z,radius:.32});
  return bodies;
 };
 const advance:MarketWalk=(actor,target,dt,speed=1.55,detour=true)=>{
  const radius=groundBodyRadius(actor);
  return walkMarketActor(actor,target,dt,speed,bodiesFor(actor),(x,z)=>marketWalkable(x,z,radius),radius,detour);
 };
 const spawnIsClear=(actor:THREE.Group,point:THREE.Vector3)=>{
  const radius=groundBodyRadius(actor);
  return marketWalkable(point.x,point.z,radius)&&bodiesFor(actor).every(body=>Math.hypot(body.x-point.x,body.z-point.z)>=radius+body.radius);
 };
 const alfamart=createAlfamartNPCs(scene,root,tier==='low'?2:3,speak,audio,id=>{completedAlfamart.add(id);served.push(id);},advance,spawnIsClear);
 const street=createMarketStreet(scene,root,tier!=='low',speak,audio,advance,spawnIsClear);
 const markServed=(id:number,b:Purchase)=>{if(!b.paid){b.paid=true;served.push(id);}};
 let service:{id:number;route:THREE.Vector3[];phase:'carry'|'return';prop?:THREE.Group;time:number}|null=null;
 const vendorHome=vendor.position.clone();
 const purchases=new Map<number,Purchase>(),line:number[]=[];
 let escort:{id:number;trail:THREE.Vector3[];last:THREE.Vector3;retry:number}|null=null;
 const v=(x:number,z:number)=>new THREE.Vector3(x,0,z);
 const fabric=[0x315e75,0xb28b51,0x687b63,0x8e5460,0x3d465c,0xb6a793,0x527d76,0x735f92,0xefe7d3,0x284c3f];
 const follow=(a:THREE.Group,p:Purchase,dt:number)=>{const t=p.route[0];if(t&&advance(a,t,dt))p.route.shift();return p.route.length===0;};
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
 function purchase(id:number,job:SalesJob,restored=false,product=0,player?:THREE.Vector3){
  if(job==='alfamart'){
   const customer=prospects[id];
   if(restored)completedAlfamart.add(id);
   else if(customer&&!completedAlfamart.has(id))alfamart.handoff(id,customer.actor,customer.name,product);
   return;
  }
  const p=prospects[id];if(!p||purchases.has(id))return;
  const buy:Purchase={job,stage:'approach',route:[],time:0};purchases.set(id,buy);p.actor.userData.marketPurchase=job;
  if(restored){buy.paid=true;complete(p,buy);buy.time=1;if(buy.prop)buy.prop.scale.setScalar(1);return;}
  if(job==='bubur'){line.push(id);buy.route=planMarketRoute(p.actor.position,v(16.8,8.85));speak(vendor,'Penjual Bubur','Silakan duduk, saya siapkan buburnya.');}
  else if(insideHijab(p.actor.position.x,p.actor.position.z)){
   const side=player&&player.x>=-26?-1:1;
   buy.stage='shop';buy.route=[v(-26+side*.74,-5.23)];
  }
  else{buy.route=planMarketRoute(p.actor.position,v(-25.8,-1.95));}
 }
 function startEscort(id:number,player:THREE.Vector3){const p=prospects[id];if(!p||purchases.has(id))return;escort={id,trail:planMarketRoute(p.actor.position,player.clone()),last:player.clone(),retry:0};p.actor.userData.marketPurchase='escort';}
 function cancelEscort(){if(escort){const p=prospects[escort.id];if(p)delete p.actor.userData.marketPurchase;}escort=null;}
 function escortReady(id:number,player:THREE.Vector3){const p=prospects[id];return !!p&&escort?.id===id&&Math.hypot(player.x-p.actor.position.x,player.z-p.actor.position.z)<2.6;}
 function updateEscort(dt:number,player:THREE.Vector3){
  if(!escort)return;
  const p=prospects[escort.id];if(!p)return;
  const a=p.actor;
  if(escort.last.distanceTo(player)>.30){escort.trail.push(player.clone());escort.last.copy(player);}
  const t=escort.trail[0];
  if(t&&(escort.trail.length>1||a.position.distanceTo(player)>1.1)&&advance(a,t,dt,2.85))escort.trail.shift();
  escort.retry-=dt;
  if(escort.trail.length===0&&a.position.distanceTo(player)>1.5&&escort.retry<=0){escort.trail=planMarketRoute(a.position,player.clone());escort.last.copy(player);escort.retry=.6;}
 }
 function handoff(id:number,job:SalesJob,player:THREE.Vector3,product:number|null){const p=prospects[id];if(!p||!escortReady(id,player)||player.distanceTo(escortDestination(job))>2.0||(job==='hijab'&&(!insideHijab(player.x,player.z)||!insideHijab(p.actor.position.x,p.actor.position.z))))return false;if(job==='alfamart'){
   if(product===null||!insideAlfamart(p.actor.position.x,p.actor.position.z)||!insideAlfamart(player.x,player.z)||!alfamart.handoff(id,p.actor,p.name,product))return false;
  }else purchase(id,job,false,0,player);
  escort=null;return true;}
 function resetPurchases(){roaming.clear();nextRoamPlan=0;cancelEscort();alfamart.reset();for(const customer of prospects){delete customer.actor.userData.marketPurchase;delete customer.actor.userData.marketDeparture;}completedAlfamart.clear();if(service?.prop){service.prop.removeFromParent();}service=null;vendor.position.copy(vendorHome);delete vendor.userData.campPose;delete hijabOwner.userData.campPose;for(const seat of seats)seat.busy=null;for(const [id,buy] of purchases){removeProp(buy);const p=prospects[id];if(p){delete p.actor.userData.marketPurchase;delete p.actor.userData.marketDeparture;delete p.actor.userData.campPose;}}purchases.clear();
  for(let i=walkers.length-1;i>=0;i--){
   const walker=walkers[i]!, initial=parkedWalkers.get(walker.actor);
   delete walker.actor.userData.marketDeparture;delete walker.actor.userData.marketPurchase;
   if(initial){Object.assign(walker,{points:[],index:0,wait:initial.wait+.2});walker.actor.position.copy(initial.position);}
   else walkers.splice(i,1);
  }
  line.length=0;served.length=0;speech=null;}

 function vendorRoute(seatIndex:number){const seat=seats[seatIndex]!;return [v(14.7,4.78),v(16.65,4.78),v(16.65,8.35),v(seat.table.x-.95,8.35),v(seat.table.x-.95,5.95)];}
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
   if(index===0&&free>=0){line.shift();const seat=seats[free]!;seat.busy=id;buy.seat=free;buy.stage='seat-walk';buy.route=seat.yaw===Math.PI?[v(seat.point.x,8.45),seat.point.clone()]:[v(seat.point.x-.95,8.45),v(seat.point.x-.95,seat.point.z),seat.point.clone()];}
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
 // One route calculation at a time, with a short cooldown to avoid frame spikes.
 function roam(w:typeof walkers[number],dt:number){
  let s=roaming.get(w.actor);
  if(!s){s={zone:-1,previous:-1,speed:.85+Math.random()*.52,stall:0,best:Infinity};roaming.set(w.actor,s);}
  if(w.wait>0){w.wait-=dt;return;}
  const a=w.actor,p=a.position,radius=groundBodyRadius(a);
  if(w.index>=w.points.length){
   if(nextRoamPlan>0)return;nextRoamPlan=.18;
   const candidates=marketRoamZones.map((zone,i)=>({i,zone,dist:Math.hypot(zone.x-p.x,zone.z-p.z)}))
    .filter(q=>q.i!==s.zone&&q.i!==s.previous&&q.dist>5&&!Array.from(roaming.entries()).some(([other,state])=>other!==a&&state.zone===q.i&&other.position.distanceToSquared(new THREE.Vector3(q.zone.x,0,q.zone.z))<36));
   // Prefer an unoccupied destination, never simply turn back to the last stop.
   const pool=candidates.length?candidates:marketRoamZones.map((zone,i)=>({i,zone,dist:Math.hypot(zone.x-p.x,zone.z-p.z)})).filter(q=>q.i!==s.zone&&q.dist>5);
   if(!pool.length){w.wait=1;return;}
   const pick=pool[Math.floor(Math.random()*pool.length)]!;
   const target=new THREE.Vector3(pick.zone.x+(Math.random()-.5)*1.2,0,pick.zone.z+(Math.random()-.5)*.8);
   if(!marketRoamWalkable(target.x,target.z,radius)||bodiesFor(a).some(b=>Math.hypot(b.x-target.x,b.z-target.z)<1.3)){w.wait=.5+Math.random();return;}
   // Actors already in shops or beside carts may exit via normal collision-safe paths.
   const safeStart=marketRoamWalkable(p.x,p.z,radius);
   const valid=(x:number,z:number)=>safeStart?marketRoamWalkable(x,z,radius):marketWalkable(x,z,radius);
   const route=planMarketRoute(p,target,valid);
   if(!route.length){w.wait=.7+Math.random();return;}
   s.previous=s.zone;s.zone=pick.i;s.stall=0;s.best=Infinity;w.points=route;w.index=0;
  }
  const target=w.points[w.index];if(!target)return;
  const distance=Math.hypot(target.x-p.x,target.z-p.z);
  if(distance<s.best-.05){s.best=distance;s.stall=0;}else s.stall+=dt;
  // If a moving pedestrian or player blocks the route, wait and choose another destination.
  if(s.stall>3){w.points=[];w.index=0;w.wait=.8+Math.random()*1.4;s.stall=0;s.best=Infinity;return;}
  const oldYaw=a.rotation.y;
  const safe=marketRoamWalkable(p.x,p.z,radius);
  const arrived=walkMarketActor(a,target,dt,s.speed,bodiesFor(a),(x,z)=>safe?marketRoamWalkable(x,z,radius):marketWalkable(x,z,radius),radius);
  const turn=Math.atan2(Math.sin(a.rotation.y-oldYaw),Math.cos(a.rotation.y-oldYaw));
  a.rotation.y=oldYaw+turn*Math.min(1,dt*8);
  if(arrived){w.index++;s.best=Infinity;s.stall=0;if(w.index>=w.points.length)w.wait=1+Math.random()*3.5;}
 }
 return {owners:{bubur:vendor,hijab:hijabOwner,alfamart:alfamart.cashier},talkers:street.talkers,prospects,purchase,startEscort,cancelEscort,escortReady,drainServed:()=>served.splice(0),speech:()=>speech,hasEscort:(id:number)=>escort?.id===id,handoff,resetPurchases,update(dt:number,hold:THREE.Group|null=null,player?:THREE.Vector3){
  playerBody=player;nextRoamPlan=Math.max(0,nextRoamPlan-dt);
  if(player&&escort&&prospects[escort.id]?.actor!==hold)updateEscort(dt,player);
  if(speech){speech.left-=dt;if(speech.left<=0)speech=null;}
  for(const p of prospects){const buy=purchases.get(p.id);if(buy&&p.actor!==hold)updatePurchase(p,buy,dt);}
  updateVendor(dt);
  if(player){
   const shoppers=alfamart.update(dt,hold,player);
   const escorted=escort&&prospects[escort.id]?.actor;
   if(escorted)shoppers.push(escorted);
   store.update(dt,player,shoppers);
   street.update(dt,player);
   document.documentElement.dataset.alfamartDoor=store.root.userData.doorOpen?'open':'closed';
  }
  for(const w of walkers){if(w.actor===hold)continue;const p=prospects.find(p=>p.actor===w.actor),buy=p?purchases.get(p.id):undefined;if(p&&(escort?.id===p.id||alfamart.has(p.id)))continue;if(buy&&buy.stage!=='done')continue;
   if((buy?.stage==='done'||p&&completedAlfamart.has(p.id))&&!w.actor.userData.marketDeparture){w.actor.userData.marketDeparture=true;w.points=[];w.index=0;w.wait=.6;roaming.delete(w.actor);}
   roam(w,dt);
  }
  // Completed customers rejoin free exploration without returning to a fixed loop.
  for(const p of prospects){const buy=purchases.get(p.id);if((buy?.stage==='done'||completedAlfamart.has(p.id))&&!alfamart.has(p.id)&&!walkers.some(w=>w.actor===p.actor))walkers.push({actor:p.actor,points:[],index:0,wait:1.5});}
  document.documentElement.dataset.marketQueue=String(line.length);
  document.documentElement.dataset.marketCompleted=String([...purchases.values()].filter(p=>p.stage==='done').length);
 }};
}


type SalesState={job:SalesJob|null;accepted:number[];rejected:number[];claimed:boolean;pending:number|null;serving:number|null;product:number|null};
const storeKey='hajji-market-sales-v1';
export function loadSales(job?:SalesJob):SalesState{
 const validId=(value:unknown):value is number=>typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<16;
 try{
  const s=JSON.parse(sessionStorage.getItem(job?storeKey+'-'+job:storeKey)??'null');
  if(s&&(s.job==='bubur'||s.job==='hijab'||s.job==='alfamart')&&Array.isArray(s.accepted)&&Array.isArray(s.rejected)){
   const accepted=[...new Set<number>(s.accepted.filter(validId))],rejected=[...new Set<number>(s.rejected.filter(validId))];
   const product=Number.isInteger(s.product)&&ALFAMART_PRODUCTS[s.product]?s.product as number:null;
   const validTransaction=s.job!=='alfamart'||product!==null;
   return {job:s.job,accepted,rejected,claimed:!!s.claimed,pending:validTransaction&&validId(s.pending)&&!accepted.includes(s.pending)?s.pending:null,serving:validTransaction&&validId(s.serving)&&!accepted.includes(s.serving)?s.serving:null,product};
  }
 }catch{}
 return {job:null,accepted:[],rejected:[],claimed:false,pending:null,serving:null,product:null};
}
export function saveSales(s:SalesState){
 try{
  const json=JSON.stringify(s);
  sessionStorage.setItem(storeKey,json);
  if(s.job)sessionStorage.setItem(storeKey+'-'+s.job,json);
 }catch{}
}
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
  b.onclick=()=>{if(closed||busy)return;collecting=true;let result:unknown;try{result=fn();}catch(err){collecting=false;say(err instanceof Error?err.message:'Coba lagi.','system');play();return;}if(result instanceof Promise){busy=true;panel.hidden=true;void result.catch(err=>{if(!closed)say(err instanceof Error?err.message:'Coba lagi.','system');}).finally(()=>{collecting=false;play();});}else{collecting=false;play();}};
  actions.append(b);
 }
 x.onclick=finish;document.addEventListener('keydown',escape);
 collecting=true;try{build(say,button,close,clearChoices);}finally{collecting=false;}
 play();layout();
}
