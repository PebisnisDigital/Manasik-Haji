import {playerKey} from '../playerCloud.ts';
export type FieldKind='mina'|'arafah';
export interface FieldActivity{version:1;id:string;phase:number;elapsed:number}
export const fieldLimit=(kind:FieldKind)=>kind==='mina'?5:4;
export const fieldDuration=(kind:FieldKind)=>kind==='mina'?6:12;
export const fieldActivityKey=(kind:FieldKind,id:string)=>playerKey('manasik-'+kind+'-activity-v1:'+id);
export function decodeFieldActivity(raw:string|null,kind:FieldKind,id:string):FieldActivity|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&s.id===id&&Number.isInteger(s.phase)&&s.phase>=0&&s.phase<=fieldLimit(kind)&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&s.elapsed<=fieldDuration(kind)?{version:1,id,phase:s.phase,elapsed:s.elapsed}:null;}catch{return null;}}
export function readFieldActivity(kind:FieldKind,id:string):FieldActivity{try{const k=fieldActivityKey(kind,id);return decodeFieldActivity(localStorage.getItem(k),kind,id)??decodeFieldActivity(localStorage.getItem(k+'.backup'),kind,id)??{version:1,id,phase:0,elapsed:0};}catch{return {version:1,id,phase:0,elapsed:0};}}
export function storeFieldActivity(kind:FieldKind,next:FieldActivity):boolean{try{const k=fieldActivityKey(kind,next.id),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');if(!decodeFieldActivity(JSON.stringify(next),kind,next.id))return false;for(const r of [raw,backup])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
 const previous=decodeFieldActivity(raw,kind,next.id)??decodeFieldActivity(backup,kind,next.id);if(!previous&&(raw!==null||backup!==null))return false;const p=previous??{phase:0,elapsed:0};if(next.phase<p.phase||next.phase>p.phase+1||next.phase===p.phase&&next.elapsed<p.elapsed)return false;
 if(next.phase===p.phase+1&&(kind==='mina'?p.phase===4:p.phase>=1&&p.phase<=3)&&p.elapsed<fieldDuration(kind))return false;
 if(decodeFieldActivity(raw,kind,next.id))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(next));return true;}catch{return false;}}
export function fieldTick(elapsed:number,dt:number,playing:boolean,kind:FieldKind){return Math.min(fieldDuration(kind),elapsed+(playing?Math.max(0,Math.min(.25,dt)):0));}
export function wukufDayProgress(phase:number,elapsed:number){return Math.min(1,Math.max(0,(Math.max(0,phase-1)+elapsed/12)/3));}
export const earlyHaircutMethod=(program:'hajj'|'umrah',requested:'trim'|'shave')=>program==='hajj'?'trim':requested;
