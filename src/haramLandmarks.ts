import * as THREE from 'three';
import {KAABA,HIJR,MAQAM} from './config/site.ts';
import {HIJR_CENTRE,HIJR_NORMAL} from './sim/Obstacles.ts';
/** Shared model-space anchors, not GPS coordinates or a measured survey. */
export function kaabaLocalPoint(x:number,y:number,z:number){const c=Math.cos(KAABA.yaw),s=Math.sin(KAABA.yaw);return {x:x*c+z*s,y,z:-x*s+z*c};}
const w=KAABA.lengthNE/2,d=KAABA.lengthNW/2;
export const BLACK_STONE_LOCAL={x:w+.13,y:1.5,z:d+.13};
export const DOOR_LOCAL_Z=d-2.55;
export const MAQAM_POSITION={x:Math.cos(-Math.PI/4)*MAQAM.distanceFromCentre,z:Math.sin(-Math.PI/4)*MAQAM.distanceFromCentre};
export const CLOCK_POSITION={x:-36,y:0,z:269};
const local=(x:number,y:number,z:number)=>kaabaLocalPoint(x,y,z);
export const HARAM_LANDMARKS=[
 {id:'hajar',name:'Hajar Aswad',at:local(BLACK_STONE_LOCAL.x,2.55,BLACK_STONE_LOCAL.z),detail:'Batu hitam berbingkai perak. Tawaf dimulai dan diakhiri sejajar sudut ini.',near:10,far:40},
 {id:'door',name:'Pintu Ka’bah',at:local(w+.45,5.75,DOOR_LOCAL_Z),detail:'Pintu emas yang ditinggikan dari lantai pelataran.',near:9,far:36},
 {id:'multazam',name:'Multazam',at:local(w+.28,2.85,(DOOR_LOCAL_Z+KAABA.doorWidth/2+d)/2),detail:'Bagian dinding antara pintu Ka’bah dan Hajar Aswad.',near:8,far:24},
 {id:'maqam',name:'Maqam Ibrahim',at:{x:MAQAM_POSITION.x,y:MAQAM.totalHeight+.55,z:MAQAM_POSITION.z},detail:'Batu tempat Nabi Ibrahim berdiri ketika membangun Ka’bah, terlindung dalam selubung kaca berbingkai emas.',near:10,far:44},
 {id:'hijr',name:'Hijr Ismail',at:{x:HIJR_CENTRE.x+Math.cos(HIJR_NORMAL)*HIJR.radius,y:2.2,z:HIJR_CENTRE.z+Math.sin(HIJR_NORMAL)*HIJR.radius},detail:'Area berdinding marmer melengkung. Tawaf dilakukan di luar dinding ini.',near:11,far:42},
 {id:'mizab',name:'Mizab Rahmah',at:local(0,KAABA.height+.75,-d-1.1),detail:'Talang emas di atap Ka’bah yang mengarah ke Hijr Ismail.',near:11,far:36},
 {id:'yamani',name:'Rukun Yamani',at:local(-w-.15,2.65,d+.15),detail:'Sudut Ka’bah sebelum Hajar Aswad pada arah tawaf.',near:10,far:40},
 {id:'kiswah',name:'Kiswah & Hizam',at:local(w+.25,KAABA.hizamCentreHeight+.9,-1.9),detail:'Kain hitam penutup Ka’bah dengan sabuk berhias emas.',near:9,far:34},
] as const;
export function mountHaramLandmarks(host:HTMLElement,scene:THREE.Scene,kaaba:THREE.Group,centre:{x:number;z:number}){
 const root=document.createElement('div');root.className='haramLandmarks';root.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden';const world=host.querySelector('.miqatWorld')??host;world.append(root);
 const info=document.createElement('aside');info.style.cssText='position:absolute;right:2%;top:13%;max-width:min(270px,35vw);padding:8px 11px;background:#173d32ed;border:1px solid #bfa66b;border-radius:8px;color:#fff4db;font:600 clamp(10px,1.25vw,13px)/1.35 system-ui;text-align:left';info.hidden=true;root.append(info);
 const entries=HARAM_LANDMARKS.map(item=>{const label=document.createElement('div');label.textContent=item.name;label.dataset.landmark=item.id;label.style.cssText='position:absolute;white-space:nowrap;transform:translate(-50%,-100%);background:#173d32ec;border:1px solid #ddc28b;border-radius:5px;padding:4px 7px;color:#fff5dc;font:700 clamp(10px,1.2vw,14px) system-ui;box-shadow:0 2px 6px #0004;text-shadow:none';label.hidden=true;root.append(label);return {item,label};});
 const ray=new THREE.Raycaster(),point=new THREE.Vector3(),projected=new THREE.Vector3(),eye=new THREE.Vector3();const occluders:THREE.Mesh[]=[];kaaba.traverse(o=>{if(o instanceof THREE.Mesh&&o.name==='kaaba-body')occluders.push(o);});
 let last=0,signature='';
 function tick(camera:THREE.Camera,player:{x:number;z:number},active=true){if(!active){root.hidden=true;return;}root.hidden=false;const now=performance.now();if(now-last<80)return;last=now;camera.updateMatrixWorld();scene.updateMatrixWorld();camera.getWorldPosition(eye);
 const visible:{label:HTMLElement;item:typeof HARAM_LANDMARKS[number];x:number;y:number;distance:number}[]=[];
 for(const {label,item} of entries){label.hidden=true;point.set(item.at.x+centre.x,item.at.y,item.at.z+centre.z);const distance=Math.hypot(player.x-point.x,player.z-point.z);if(distance>item.far)continue;projected.copy(point).project(camera);if(projected.z< -1||projected.z>1||Math.abs(projected.x)>.92||Math.abs(projected.y)>.91)continue;
  const length=eye.distanceTo(point);ray.set(eye,point.clone().sub(eye).normalize());ray.far=Math.max(0,length-.15);if(ray.intersectObjects(occluders,false).length)continue;
  visible.push({label,item,x:(projected.x*.5+.5)*root.clientWidth,y:(.5-projected.y*.5)*root.clientHeight,distance});
 }
 visible.sort((a,b)=>a.distance-b.distance);const placed:{x:number;y:number;w:number;h:number}[]=[];
 for(const v of visible){const width=Math.max(78,v.item.name.length*7.3+16),height=25;const x=Math.max(width/2+3,Math.min(root.clientWidth-width/2-3,v.x));let y=v.y;
  for(let i=0;i<4&&placed.some(p=>Math.abs(p.x-x)<(p.w+width)/2+5&&Math.abs(p.y-y)<height+4);i++)y-=height+4;
  if(y<30||placed.some(p=>Math.abs(p.x-x)<(p.w+width)/2+5&&Math.abs(p.y-y)<height+4))continue;
  v.label.style.left=x+'px';v.label.style.top=y+'px';v.label.style.borderColor=v.distance<v.item.near?'#f7d78b':'#bca66f';v.label.hidden=false;placed.push({x,y,w:width,h:height});
 }
 const closest=visible.find(v=>v.distance<v.item.near);const next=closest?.item.id??'';if(signature!==next){signature=next;info.hidden=!closest;if(closest){const title=document.createElement('strong');title.textContent=closest.item.name;title.style.cssText='display:block;color:#f5d48b;margin-bottom:3px';const desc=document.createElement('span');desc.textContent=closest.item.detail;info.replaceChildren(title,desc);}}
 }
 host.dataset.haramLandmarks=String(entries.length);return {tick,dispose(){root.remove();delete host.dataset.haramLandmarks;}};
}
