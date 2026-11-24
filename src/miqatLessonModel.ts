import {playerKey} from './playerCloud.ts';
import type {Avatar,Program} from './coreProgress.ts';
export interface MiqatLesson{version:1;stage:number;book:boolean}
export const MIQAT_GOALS=[
 {title:'Temui pembimbing',action:'Bicara dengan pembimbing',x:0,z:4.5},
 {title:'Masuk ruang persiapan',action:'Masuk ruang persiapan',x:0,z:-1.2},
 {title:'Kenakan pakaian ihram',action:'Siapkan pakaian ihram',x:-3.8,z:-3.5},
 {title:'Ambil buku & pelajari niat',action:'Buka buku panduan',x:0,z:-6},
 {title:'Pelajari bacaan talbiyah',action:'Belajar talbiyah',x:3.8,z:-4.8},
 {title:'Kembali ke pembimbing',action:'Laporkan persiapan',x:0,z:2.5},
 {title:'Miqat & Ihram selesai',action:'Lanjut Level 2',x:0,z:2.5},
] as const;
export const MIQAT_BOUNDS=[-6.3,6.3,-8.1,9.5] as const;
export const MIQAT_OBSTACLES=[{x:0,z:-8.65,w:14,d:.3},{x:-6.85,z:-4.2,w:.3,d:8.8},{x:6.85,z:-4.2,w:.3,d:8.8},{x:-4.55,z:0,w:4.9,d:.28},{x:4.55,z:0,w:4.9,d:.28},{x:-5.35,z:-4,w:1.25,d:1},{x:-2.6,z:-4.1,w:.12,d:2.8},{x:0,z:-7.1,w:1.8,d:.7},{x:5,z:-4.8,w:.8,d:2.6}];
export const MIQAT_GATE={x:0,z:0,w:3.8,d:.3};
export function decodeMiqatLesson(raw:string|null):MiqatLesson|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=6&&typeof s.book==='boolean'&&(s.stage<3?!s.book:s.stage>=4?s.book:true)?{version:1,stage:s.stage,book:s.book}:null;}catch{return null;}}
export const miqatLessonKey=(program:Program,avatar:Avatar)=>playerKey('manasik-miqat-room-'+program+'-'+avatar+'-v1');
export function readMiqatLesson(program:Program,avatar:Avatar):MiqatLesson{try{const k=miqatLessonKey(program,avatar);return decodeMiqatLesson(localStorage.getItem(k))??decodeMiqatLesson(localStorage.getItem(k+'.backup'))??{version:1,stage:0,book:false};}catch{return {version:1,stage:0,book:false};}}
export function storeMiqatLesson(program:Program,avatar:Avatar,next:MiqatLesson):boolean{
 try{if(!decodeMiqatLesson(JSON.stringify(next)))return false;const k=miqatLessonKey(program,avatar),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
  const prior=decodeMiqatLesson(raw)??decodeMiqatLesson(backup)??{version:1,stage:0,book:false};if(next.stage<prior.stage||next.stage>prior.stage+1||prior.book&&!next.book||next.stage===4&&!prior.book)return false;
  if(decodeMiqatLesson(raw))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(next));return true;
 }catch{return false;}
}
