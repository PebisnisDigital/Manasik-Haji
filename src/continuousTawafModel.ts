import {HARAM_LANDMARKS} from './haramLandmarks.ts';
import {playerKey} from './playerCloud.ts';
import {readField} from './adventure/campaignProgress.ts';
import {fieldChapter} from './adventure/hajjCampaign.ts';
import {decodeRoute,QUEST_KEYS,type RouteProgress} from './adventure/questProgress.ts';
import type {Avatar} from './coreProgress.ts';
import {canStartSaiTransfer,readSaiTransfer,saiTransferResume} from './saiTransferModel.ts';

export const TAWAF_CENTRE={x:0,z:64},TAWAF_RADIUS=30,TAWAF_STEP=Math.PI/4;
export const TAWAF_BOUNDS=[-36,36,-8.1,96] as const;
const landmarkLook=(id:string):readonly [number,number,number]=>{const p=HARAM_LANDMARKS.find(l=>l.id===id)!.at;return [p.x,id==='hajar'?1.5:id==='maqam'?2:id==='hijr'?1.2:1.6,p.z+64];};
export const TAWAF_PLACES=[
 {id:'hajar',title:'Hajar Aswad & garis awal',x:23,z:64,look:landmarkLook('hajar'),hint:'Cari sudut Hajar Aswad: amati garis awal yang menjulur dari sisi Ka’bah. Jelajahi sendiri dan dekati tanda saat menemukannya.',body:'Kenali Hajar Aswad berbingkai perak dan garis awal yang sejajar dengannya. Kita mengenali titik ini dari jalur yang lapang, tanpa perlu menerobos jemaah. Hitungan latihan belum dimulai.'},
 {id:'maqam',title:'Maqam Ibrahim',x:21,z:48,look:landmarkLook('maqam'),hint:'Cari Maqam Ibrahim, bangunan kecil berwarna emas dan kaca di dekat Ka’bah. Perhatikan bentuknya dari pelataran.',body:'Kenali Maqam Ibrahim, tempat batu bersejarah Nabi Ibrahim yang dilindungi bingkai emas dan kaca. Gunakan sebagai penanda orientasi arena, lalu ikuti pembimbing ke titik berikutnya. Penjelajahan ini belum menambah putaran.'},
 {id:'hijr',title:'Hijr Ismail',x:-18,z:48,look:landmarkLook('hijr'),hint:'Cari Hijr Ismail: perhatikan dinding rendah melengkung di sisi Ka’bah. Berjalanlah di luar kawasan dindingnya.',body:'Perhatikan dinding rendah melengkung di sisi Ka’bah. Jalur latihan berputar mengitari bagian luar kawasan ini. Ikuti penanda hijau agar tetap pada rute yang disediakan.'},
 {id:'yamani',title:'Rukun Yamani',x:0,z:87,look:landmarkLook('yamani'),hint:'Cari sudut Rukun Yamani di sisi berikutnya. Amati sudut Ka’bah dari pelataran dan dekati penanda pengenalannya.',body:'Kenali sudut Rukun Yamani. Bagian perjalanan sesudahnya menuju Hajar Aswad dapat dikenali dengan penanda arah. Setelah mengenali arena, kita kembali ke garis awal untuk mulai menghitung.'},
] as const;
/** The learning interaction uses the same landmark and proximity range as the visible label.
 * The old safe observation point stays valid for existing saves and guided walking.
 * This affects discovery only, not the seven-lap checkpoint radius.
 */
export function tawafDiscoveryNear(index:number,player:{x:number;z:number}):boolean{
 const p=TAWAF_PLACES[index];if(!p||!Number.isFinite(player.x)||!Number.isFinite(player.z))return false;
 const landmark=HARAM_LANDMARKS.find(l=>l.id===p.id)!;
 return Math.hypot(player.x-landmark.at.x,player.z-(landmark.at.z+TAWAF_CENTRE.z))<=landmark.near||
 Math.hypot(player.x-p.x,player.z-p.z)<=1.15;
}
export function tawafDiscoveryAction(index:number,player:{x:number;z:number}){
 const p=TAWAF_PLACES[index];if(!p)return '';
 const name=HARAM_LANDMARKS.find(l=>l.id===p.id)!.name;
 return (tawafDiscoveryNear(index,player)?'Kenali ':'Dekati ')+name;
}
export const TAWAF_EXTRA_SOLIDS=[{x:-6,z:58,w:14,d:14},{x:12.7,z:51.3,w:3.2,d:3.2},{x:21.6,z:74.4,w:5.3,d:5.3}];
export interface TawafTour{version:1;active:boolean;poi:number;started:boolean}
export const tawafTourKey=(avatar:Avatar)=>playerKey('manasik-continuous-tawaf-'+avatar+'-v1');
export function decodeTawafTour(raw:string|null):TawafTour|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&typeof s.active==='boolean'&&Number.isInteger(s.poi)&&s.poi>=0&&s.poi<=4&&typeof s.started==='boolean'&&(!s.started||s.poi===4)&&(!s.active?s.poi===0&&!s.started:true)?{version:1,active:s.active,poi:s.poi,started:s.started}:null;}catch{return null;}}
export function readTawafTour(avatar:Avatar):TawafTour{try{const k=tawafTourKey(avatar);return decodeTawafTour(localStorage.getItem(k))??decodeTawafTour(localStorage.getItem(k+'.backup'))??{version:1,active:false,poi:0,started:false};}catch{return {version:1,active:false,poi:0,started:false};}}
export const canEnterContinuousTawaf=()=>readField(fieldChapter('miqat')!)?.step===1&&readField(fieldChapter('arrival')!)?.step===1;
export function storeTawafTour(avatar:Avatar,next:TawafTour){try{if(!canEnterContinuousTawaf()||!decodeTawafTour(JSON.stringify(next)))return false;const k=tawafTourKey(avatar),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
 const prior=decodeTawafTour(raw)??decodeTawafTour(backup)??{version:1,active:false,poi:0,started:false};if(next.poi<prior.poi||next.poi>prior.poi+1||prior.active&&!next.active||prior.started&&!next.started||!prior.active&&next.poi!==0)return false;if(decodeTawafTour(raw))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(next));return true;}catch{return false;}}
export function readTawafRoute():RouteProgress|null{try{return decodeRoute(localStorage.getItem(QUEST_KEYS.tawaf),'tawaf')??decodeRoute(localStorage.getItem(QUEST_KEYS.tawaf+'.backup'),'tawaf');}catch{return null;}}
export const tawafGates=(p:RouteProgress|null)=>p?Math.min(56,p.count*8+p.gate):0;
/** Share the shipped Tawaf save/reward; never replace a newer, unreadable, or more advanced run. */
export function storeTawafRoute(next:RouteProgress):boolean{try{if(!canEnterContinuousTawaf())return false;const value={version:1,stage:next.stage,laps:next.count,gate:next.gate};const decoded=decodeRoute(JSON.stringify(value),'tawaf');if(next.version!==1||!decoded||decoded.stage!==next.stage||decoded.gate!==next.gate)return false;const k=QUEST_KEYS.tawaf,raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
 const old=decodeRoute(raw,'tawaf')??decodeRoute(backup,'tawaf');if(!old&&(raw!==null||backup!==null))return false;const prev=tawafGates(old),total=tawafGates(next);if(old&&(next.stage<old.stage||total<prev)||total>prev+1||!old&&next.stage>1)return false;
 if(old&&old.stage===next.stage&&old.count===next.count&&old.gate===next.gate)return true;
 if(decodeRoute(raw,'tawaf'))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(value));return true;}catch{return false;}}
export function tawafPoint(gate:number){const angle=-gate*TAWAF_STEP;return {x:Math.cos(angle)*TAWAF_RADIUS,z:64+Math.sin(angle)*TAWAF_RADIUS};}
export interface OrbitTracker{gates:number;sweep:number;last:{x:number;z:number}|null;recover:boolean;wrong:boolean}
export const orbitTracker=(gates:number):OrbitTracker=>({gates,sweep:gates*TAWAF_STEP,last:null,recover:true,wrong:false});
export const nextOrbitSegment=(t:OrbitTracker)=>Math.min((t.gates+1)*4,Math.max(t.gates*4+1,Math.floor(t.sweep/(TAWAF_STEP/4))+1));
/** Count net forward travel through ordered sectors; leaving the band or teleporting requires recovery. */
export function stepOrbit(t:OrbitTracker,p:{x:number;z:number}):OrbitTracker{
 if(t.gates>=56)return t;const last={x:p.x,z:p.z},r=Math.hypot(p.x,p.z-64),anchor=tawafPoint(t.gates),a=Math.atan2(p.z-64,p.x);
 if(r<24||r>35||t.last&&Math.hypot(p.x-t.last.x,p.z-t.last.z)>1)return {...t,last,recover:true,sweep:t.gates*TAWAF_STEP,wrong:false};
 if(t.recover){if(Math.hypot(p.x-anchor.x,p.z-anchor.z)>1.15)return {...t,last};const expected=-t.gates*TAWAF_STEP,offset=Math.atan2(Math.sin(expected-a),Math.cos(expected-a));return {...t,last,recover:false,sweep:t.gates*TAWAF_STEP+offset,wrong:false};}
 if(!t.last)return {...t,last};const old=Math.atan2(t.last.z-64,t.last.x),delta=Math.atan2(Math.sin(old-a),Math.cos(old-a)),sweep=t.sweep+delta,target=tawafPoint(t.gates+1);
 const crossed=sweep>=(t.gates+1)*TAWAF_STEP-.035&&delta>=-.0001&&Math.hypot(p.x-target.x,p.z-target.z)<1.8;
 return {gates:t.gates+Number(crossed),sweep,last,recover:false,wrong:delta<-.002};
}
export function continuousTawafResume(avatar:Avatar,independent=false):readonly [number,number]{if(!independent&&canStartSaiTransfer()&&readSaiTransfer(avatar).active&&(readSaiTransfer(avatar).step<4||typeof location!=='undefined'&&new URLSearchParams(location.search).has('sai')))return saiTransferResume(avatar);const s=readTawafTour(avatar),p=readTawafRoute();if(s.started){if((p?.stage??0)>=2)return [30,64];const point=tawafPoint(tawafGates(p));return [point.x,point.z];}if(s.poi){const point=TAWAF_PLACES[s.poi-1];return [point.x,point.z];}return [19,64];}
