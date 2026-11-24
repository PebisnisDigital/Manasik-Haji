import {playerKey} from './playerCloud.ts';
import {decodeCore,newCore,readCore,type Avatar,type Program} from './coreProgress.ts';
import {readField} from './adventure/campaignProgress.ts';
import {fieldChapter,validFieldSave} from './adventure/hajjCampaign.ts';
import {readStory} from './travelStory.ts';
import {safePosition,type Obstacle} from './coreWalk.ts';

export const ARRIVAL_CENTRE={x:0,z:64};
export const ARRIVAL_BOUNDS=[-6.3,36,-8.1,72] as const;
export const ARRIVAL_SOLIDS:Obstacle[]=[{x:0,z:64,w:24,d:24}];
export const ARRIVAL_STOPS=[
 {x:13,z:25,title:'Berjalan ke pelataran',body:'Ikuti pembimbing dari ruang Miqat. Ia akan menunggu jika kamu tertinggal.',action:'Tiba di pelataran',route:[[0,10],[6,17],[13,25]]},
 {x:21,z:31,title:'Masuki kawasan Ka’bah',body:'Masuk bersama pembimbing melalui jalur yang lapang. Jaga ruang bagi jemaah lain.',action:'Masuk bersama pembimbing',route:[[21,31]]},
 {x:26,z:38,title:'Temukan rombonganmu',body:'Cari bendera hijau bertuliskan HAJJI.DIGITAL. Cocokkan nama rombongan sebelum bergabung.',action:'Periksa rombongan',route:[[26,38]]},
 {x:24,z:50,title:'Lihat dan kenali Ka’bah',body:'Dekati titik pandang. Gunakan tombol Arahkan kamera, lalu lihat Ka’bah bersama pembimbing.',action:'Saya sudah melihat Ka’bah',route:[[24,50]]},
 {x:19,z:64,title:'Temukan titik awal tawaf',body:'Cari garis yang sejajar Hajar Aswad. Di titik ini Ka’bah berada di sebelah kiri saat mulai bergerak.',action:'Tandai titik awal tawaf',route:[[22,56],[19,64]]},
] as const;
export interface ArrivalJourneySave{version:1;active:boolean;stage:number}
export const arrivalJourneyKey=(program:Program,avatar:Avatar)=>playerKey('manasik-arrival-walk-'+program+'-'+avatar+'-v1');
export function decodeArrivalJourney(raw:string|null):ArrivalJourneySave|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&typeof s.active==='boolean'&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=5&&(s.active||s.stage===0)?{version:1,active:s.active,stage:s.stage}:null;}catch{return null;}}
export function readArrivalJourney(program:Program,avatar:Avatar):ArrivalJourneySave{try{const k=arrivalJourneyKey(program,avatar);return decodeArrivalJourney(localStorage.getItem(k))??decodeArrivalJourney(localStorage.getItem(k+'.backup'))??{version:1,active:false,stage:0};}catch{return {version:1,active:false,stage:0};}}
export function canEnterArrival(program:Program){return program==='hajj'?readField(fieldChapter('miqat')!)?.step===1:(readCore('umrah')?.step??0)>=1;}
export function storeArrivalJourney(program:Program,avatar:Avatar,next:ArrivalJourneySave):boolean{
 try{if(!decodeArrivalJourney(JSON.stringify(next))||!canEnterArrival(program))return false;const k=arrivalJourneyKey(program,avatar),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
  const prior=decodeArrivalJourney(raw)??decodeArrivalJourney(backup)??{version:1,active:false,stage:0};if(next.stage<prior.stage||next.stage>prior.stage+1||prior.active&&!next.active||!prior.active&&next.stage!==0)return false;
  if(decodeArrivalJourney(raw))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(next));return true;
 }catch{return false;}
}
/** The original arrival chapter stores three actual discoveries. Keep its id and any earlier progress. */
export function completeArrivalJourney(program:Program,avatar:Avatar):boolean{
 if(readArrivalJourney(program,avatar).stage<4||!canEnterArrival(program))return false;
 if(program==='umrah')return true; // The existing Umroh step 1 is Tawaf; arrival must not grant a lap or skip it.
 try{const chapter=fieldChapter('arrival')!,key=playerKey('manasik-hajj-arrival-v1'),cpKey=playerKey('manasik-hajj-arrival-checkpoint-v1'),raw=localStorage.getItem(key),backup=localStorage.getItem(key+'.backup');
  for(const r of [raw,backup,localStorage.getItem(cpKey)])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
  const valid=(r:string|null)=>{const s=decodeCore(r);return validFieldSave(s,chapter)?s:null;};const old=valid(raw)??valid(backup);if(old?.step===1)return true;if(!old&&(raw!==null||backup!==null))return false;
  const run=old??newCore('hajj',avatar,readStory().name),checkpoint=JSON.stringify({id:run.id,step:0,count:3});
  localStorage.setItem(cpKey,checkpoint);if(old&&valid(raw))localStorage.setItem(key+'.backup',raw!);localStorage.setItem(key,JSON.stringify({...run,step:1}));return true;
 }catch{return false;}
}
export interface Escort{ x:number;z:number;yaw:number;waiting:boolean;cursor:number;path:[number,number][];state:'walking'|'waiting'|'arrived' }
/** Distance hysteresis avoids constant stop/start; an ahead player never strands the guide. */
export function stepEscort(a:Escort,player:{x:number;z:number},dt:number,paused:boolean,obstacles:readonly Obstacle[],bounds:readonly [number,number,number,number]){
 if(paused)return;
 while(a.cursor<a.path.length&&Math.hypot(a.path[a.cursor][0]-a.x,a.path[a.cursor][1]-a.z)<.16)a.cursor++;
 if(a.cursor>=a.path.length){a.state='arrived';a.waiting=false;return;}
 const [tx,tz]=a.path[a.cursor],dx=tx-a.x,dz=tz-a.z,n=Math.hypot(dx,dz),gap=Math.hypot(player.x-a.x,player.z-a.z),behind=(player.x-a.x)*dx+(player.z-a.z)*dz<0;
 if(a.waiting&&gap<3.2||!behind)a.waiting=false;else if(gap>6&&behind)a.waiting=true;
 if(a.waiting){a.state='waiting';return;}a.state='walking';const pace=!behind&&gap>2?3.6:2.35,step=Math.min(n,Math.max(0,Math.min(.05,dt))*pace),x=a.x+dx/n*step,z=a.z+dz/n*step;
 if(safePosition(x,z,obstacles,bounds)){a.x=x;a.z=z;a.yaw=Math.atan2(dx,dz);}
}
