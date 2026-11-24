import {playerKey} from './playerCloud.ts';
import {decodeRoute,loadProgress,QUEST_KEYS} from './adventure/questProgress.ts';
import type {Avatar} from './coreProgress.ts';

export const TAHALLUL_STOPS=[
 {x:9,z:40,title:'Keluar dari galeri Sa’i',hint:'Dari Marwah, cari pintu keluar di sebelah kanan. Ikuti penanda emas tanpa kembali ke lintasan Sa’i.'},
 {x:20,z:40,title:'Lewati pelataran',hint:'Kamu sudah keluar dari galeri. Seberangi pelataran menuju papan TEMPAT TAHALLUL.'},
 {x:29,z:32,title:'Temukan tempat tahallul',hint:'Dekati pintu tempat tahallul, lalu tekan Masuk Level 5. Pembimbing menunggu di dalam.'},
] as const;
export interface TahallulTransfer {version:1;active:boolean;step:number}
export const tahallulTransferKey=(avatar:Avatar)=>playerKey('manasik-tahallul-approach-'+avatar+'-v1');
export const canStartTahallulTransfer=()=>loadProgress(QUEST_KEYS.sai,r=>decodeRoute(r,'sai'))?.stage===3;
export function decodeTahallulTransfer(raw:string|null):TahallulTransfer|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&typeof s.active==='boolean'&&Number.isInteger(s.step)&&s.step>=0&&s.step<=4&&(s.active||s.step===0)?{version:1,active:s.active,step:s.step}:null;}catch{return null;}}
export function readTahallulTransfer(avatar:Avatar):TahallulTransfer{try{const k=tahallulTransferKey(avatar);return decodeTahallulTransfer(localStorage.getItem(k))??decodeTahallulTransfer(localStorage.getItem(k+'.backup'))??{version:1,active:false,step:0};}catch{return {version:1,active:false,step:0};}}
export function storeTahallulTransfer(avatar:Avatar,next:TahallulTransfer):boolean{try{
 if(!canStartTahallulTransfer()||!decodeTahallulTransfer(JSON.stringify(next)))return false;
 const k=tahallulTransferKey(avatar),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');
 for(const r of [raw,backup])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
 const prior=decodeTahallulTransfer(raw)??decodeTahallulTransfer(backup);
 if(!prior&&(raw!==null||backup!==null))return false;
 const prev=prior??{version:1,active:false,step:0};
 if(next.step<prev.step||next.step>prev.step+1||prev.active&&!next.active||!prev.active&&next.step!==0)return false;
 if(decodeTahallulTransfer(raw))try{localStorage.setItem(k+'.backup',raw!);}catch{}
 localStorage.setItem(k,JSON.stringify(next));return true;
 }catch{return false;}}
export function tahallulTransferResume(step:number):readonly [number,number]{const p=step===0?{x:6,z:38}:TAHALLUL_STOPS[Math.min(2,step-1)];return [p.x,p.z];}
/** Walkable floor with a real side doorway, instead of crossing the gallery wall. */
export function tahallulWalkable(x:number,z:number):boolean{
 return x>=-10.9&&x<=10.9&&z>=-42&&z<=42 || x>=9&&x<=17&&z>=38.2&&z<=42 || x>=16&&x<=33&&z>=27&&z<=43;
}
