import {playerKey} from '../playerCloud.ts';
import {Clip} from '../sim/States.ts';

/** Ritual order follows Tarwiyah; the supply/escort beats are game activities. */
export const MINA_BEATS = [
 {id:'supplies',title:'Ambil bekal perjalanan',body:'Datangi meja bekal. Ambil air minum dan makanan untuk perjalanan rombongan.',action:'Ambil air & bekal',goal:[4.4,3.8],time:.18,seconds:0},
 {id:'wudu',title:'Kenali tempat bersuci',body:'Cari tempat wudu di tepi jalur. Ikuti tuntunan bersuci dari pembimbing sebelum salat. Aksi persiapan dalam game dipadatkan.',action:'Siapkan diri untuk salat',goal:[-4.3,9.7],time:.22,seconds:4},
 {id:'zuhr',title:'Zuhur · bergabung dalam saf',body:'Datangi area salat. Dalam contoh Tarwiyah ini, Zuhur dua rakaat secara qasar pada waktunya, tidak dijamak dengan Asar.',action:'Ikuti salat Zuhur',goal:[0,1.5],time:.28,rakaat:2,seconds:0},
 {id:'help',title:'Jemaah mencari tendanya',body:'Seorang jemaah terpisah di dekat deretan tenda. Temui dan tawarkan bantuan menuju tenda rombongan.',action:'Ajak jemaah kembali',goal:[4.4,-1],time:.37,seconds:0},
 {id:'escort',title:'Antarkan jemaah ke tenda',body:'Jemaah mengikuti di belakangmu. Berjalanlah ke penanda tenda rombongan; jangan meninggalkan jalur perkemahan.',action:'Pastikan jemaah tiba',goal:[-4.3,-1],time:.4,seconds:0},
 {id:'asr',title:'Asar · kembali ke area salat',body:'Asar dilaksanakan dua rakaat secara qasar pada waktunya. Ikuti saf dengan tertib.',action:'Ikuti salat Asar',goal:[0,1.5],time:.48,rakaat:2,seconds:0},
 {id:'maghrib',title:'Magrib · senja di Mina',body:'Magrib tetap tiga rakaat pada waktunya. Perhatikan perubahan suasana perkemahan menjelang malam.',action:'Ikuti salat Magrib',goal:[0,1.5],time:.76,rakaat:3,seconds:0},
 {id:'isha',title:'Isya · malam di perkemahan',body:'Isya dua rakaat secara qasar pada waktunya. Setelahnya, kembali beristirahat untuk perjalanan Arafah.',action:'Ikuti salat Isya',goal:[0,1.5],time:.96,rakaat:2,seconds:0},
 {id:'rest',title:'Bermalam di Mina',body:'Kembali ke tenda, jaga bekal dan beristirahat. Malam dalam game dipadatkan; Subuh dimainkan setelah istirahat selesai.',action:'Beristirahat di tenda',goal:[-4.3,-1],time:1,seconds:6},
 {id:'fajr',title:'Subuh · pagi 9 Zulhijah',body:'Datangi area salat dan ikuti Subuh dua rakaat. Setelah matahari terbit, rombongan bersiap berangkat ke Arafah.',action:'Ikuti salat Subuh',goal:[0,1.5],time:.16,rakaat:2,seconds:0},
 {id:'departure',title:'Berkumpul untuk Arafah',body:'Matahari mulai terbit. Datangi titik kumpul keberangkatan bersama pembimbing. Pakaian ihram tetap dipakai.',action:'Rombongan siap · menuju Arafah',goal:[0,10.6],time:.08,seconds:0},
] as const;
export interface MinaCampSave {version:1;id:string;beat:number;elapsed:number}
type Segment={clip:number;duration:number};
export function minaPrayer(rakaat:number):Segment[]{
 const cycle:Segment[]=[{clip:Clip.QIYAM,duration:1.1},{clip:Clip.TO_RUKU,duration:.45},{clip:Clip.RUKU,duration:.65},{clip:Clip.FROM_RUKU,duration:.4},{clip:Clip.ITIDAL,duration:.5},{clip:Clip.TO_SUJUD,duration:.5},{clip:Clip.SUJUD,duration:.7},{clip:Clip.SUJUD_TO_JALSA,duration:.4},{clip:Clip.JALSA,duration:.5},{clip:Clip.JALSA_TO_SUJUD,duration:.4},{clip:Clip.SUJUD,duration:.7}];
 const result:Segment[]=[{clip:Clip.TAKBIR,duration:.65}];
 for(let i=0;i<rakaat;i++){
  result.push(...cycle);
  if(i===rakaat-1||i===1)result.push({clip:Clip.SUJUD_TO_JALSA,duration:.4},{clip:Clip.TASHAHHUD,duration:.9});
  if(i<rakaat-1)result.push({clip:Clip.SUJUD_TO_STAND,duration:.6});
 }
 result.push({clip:Clip.TASLIM,duration:.9},{clip:Clip.SIT_TO_STAND,duration:.65});return result;
}
export function minaDuration(beat:number){const b=MINA_BEATS[beat];return b&&'rakaat' in b?minaPrayer(b.rakaat).reduce((n,s)=>n+s.duration,0):b?.seconds??0;}
export function minaPose(beat:number,elapsed:number){const b=MINA_BEATS[beat];if(b?.id==='rest')return {clip:Clip.TASHAHHUD,phase:.5};if(!b||!('rakaat' in b))return null;for(const s of minaPrayer(b.rakaat)){if(elapsed<s.duration)return {clip:s.clip,phase:Math.max(0,elapsed/s.duration)};elapsed-=s.duration;}return {clip:Clip.IDLE,phase:0};}
export const minaCampKey=(id:string)=>playerKey('manasik-mina-camp-v1:'+id);
export function decodeMinaCamp(raw:string|null,id:string):MinaCampSave|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&s.id===id&&Number.isInteger(s.beat)&&s.beat>=0&&s.beat<=MINA_BEATS.length&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&s.elapsed<=minaDuration(s.beat)+.001?{version:1,id,beat:s.beat,elapsed:s.elapsed}:null;}catch{return null;}}
export function readMinaCamp(id:string):MinaCampSave{try{const k=minaCampKey(id);return decodeMinaCamp(localStorage.getItem(k),id)??decodeMinaCamp(localStorage.getItem(k+'.backup'),id)??{version:1,id,beat:0,elapsed:0};}catch{return {version:1,id,beat:0,elapsed:0};}}
export function storeMinaCamp(next:MinaCampSave):boolean{try{
 const k=minaCampKey(next.id),raw=localStorage.getItem(k),bak=localStorage.getItem(k+'.backup');
 if(!decodeMinaCamp(JSON.stringify(next),next.id))return false;
 for(const r of [raw,bak])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
 const p=decodeMinaCamp(raw,next.id)??decodeMinaCamp(bak,next.id);
 if(!p&&(raw!==null||bak!==null))return false;
 const old=p??{beat:0,elapsed:0};
 if(next.beat<old.beat||next.beat>old.beat+1||next.beat===old.beat&&next.elapsed<old.elapsed||next.beat===old.beat+1&&old.elapsed+.001<minaDuration(old.beat))return false;
 if(decodeMinaCamp(raw,next.id))try{localStorage.setItem(k+'.backup',raw!);}catch{}
 localStorage.setItem(k,JSON.stringify(next));return true;
 }catch{return false;}}
