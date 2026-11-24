import {playerKey} from './playerCloud.ts';
import {decodeRoute,QUEST_KEYS,loadProgress} from './adventure/questProgress.ts';
import type {Avatar} from './coreProgress.ts';
export const SAI_TRANSFER_BOUNDS=[-36,62,-8.1,96] as const;
export const SAI_TRANSFER_STOPS=[
 {x:34,z:55,title:'Tinggalkan jalur tawaf',hint:'Keluar dengan tenang ke sisi pelataran. Ikuti arah menuju Mas’a, tanpa memotong jemaah yang sedang tawaf.'},
 {x:44,z:43,title:'Temukan pelataran Mas’a',hint:'Lanjutkan ke pelataran di luar lingkaran tawaf. Cari gerbang bertuliskan MAS’A · SAFA–MARWAH.'},
 {x:54,z:40,title:'Masuk melalui pintu Safa',hint:'Pintu galeri sudah di depanmu. Masuk dari sisi Safa; hitungan Sa’i baru dimulai setelah mencapai titik awal di dalam.'},
] as const;
export interface SaiTransfer {version:1;active:boolean;step:number}
export const saiTransferKey=(avatar:Avatar)=>playerKey('manasik-sai-approach-'+avatar+'-v1');
export const canStartSaiTransfer=()=>loadProgress(QUEST_KEYS.tawaf,r=>decodeRoute(r,'tawaf'))?.stage===3;
export function decodeSaiTransfer(raw:string|null):SaiTransfer|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&typeof s.active==='boolean'&&Number.isInteger(s.step)&&s.step>=0&&s.step<=4&&(s.active||s.step===0)?{version:1,active:s.active,step:s.step}:null;}catch{return null;}}
export function readSaiTransfer(avatar:Avatar):SaiTransfer{try{const k=saiTransferKey(avatar);return decodeSaiTransfer(localStorage.getItem(k))??decodeSaiTransfer(localStorage.getItem(k+'.backup'))??{version:1,active:false,step:0};}catch{return {version:1,active:false,step:0};}}
export function storeSaiTransfer(avatar:Avatar,next:SaiTransfer){try{if(!canStartSaiTransfer()||!decodeSaiTransfer(JSON.stringify(next)))return false;const k=saiTransferKey(avatar),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
 const prior=decodeSaiTransfer(raw)??decodeSaiTransfer(backup);if(!prior&&(raw!==null||backup!==null))return false;const prev=prior??{version:1,active:false,step:0};if(next.step<prev.step||next.step>prev.step+1||prev.active&&!next.active||!prev.active&&next.step!==0)return false;
 if(decodeSaiTransfer(raw))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(next));return true;}catch{return false;}}
export function saiTransferResume(avatar:Avatar):readonly [number,number]{const s=readSaiTransfer(avatar);if(s.step<=1)return [30,64];const p=SAI_TRANSFER_STOPS[Math.min(2,s.step-2)];return [p.x,p.z];}
