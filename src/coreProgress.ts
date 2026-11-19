import {scopedKey,tenantUrl} from './tenant.ts';
export type Program='hajj'|'umrah';
export type Avatar='male'|'female';
export type CoreStep=0|1|2|3|4|5;
export interface CoreSave{version:1;id:string;program:Program;avatar:Avatar;name:string;step:CoreStep;completedAt?:string}
export function decodeCore(raw:string|null):CoreSave|null{try{const j=JSON.parse(raw??'null');if(!j||j.version!==1||!['hajj','umrah'].includes(j.program)||!['male','female'].includes(j.avatar)||typeof j.id!=='string'||!j.id||typeof j.name!=='string'||!Number.isInteger(j.step)||j.step<0||j.step>5)return null;return {version:1,id:j.id,program:j.program,avatar:j.avatar,name:j.name.slice(0,100),step:j.step,...(typeof j.completedAt==='string'&&Number.isFinite(Date.parse(j.completedAt))?{completedAt:j.completedAt}:{})};}catch{return null;}}
export function newCore(program:Program,avatar:Avatar,name:string):CoreSave{return {version:1,id:globalThis.crypto?.randomUUID?.()??Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),program,avatar,name:name.trim().slice(0,100),step:0};}
export function advanceCore(j:CoreSave,expected:CoreStep):CoreSave{return j.step===expected&&expected<5?{...j,step:(expected+1) as CoreStep,...(expected===4&&j.program==='umrah'?{completedAt:new Date().toISOString()}:{})}:j;}
export function readCore(program:Program):CoreSave|null{try{const s=decodeCore(localStorage.getItem(scopedKey('umroh-digital-preview-'+program)));return s?.program===program?s:null;}catch{return null;}}
export function writeCore(j:CoreSave):boolean{try{localStorage.setItem(scopedKey('umroh-digital-preview-'+j.program),JSON.stringify(j));return true;}catch{return false;}}
export function coreUrl(j:CoreSave,page='manasik.html'):string{return tenantUrl('./'+page+'?program='+j.program+'&core='+encodeURIComponent(j.id)+'&avatar='+j.avatar);}
export function coreSession():CoreSave|null{const p=new URLSearchParams(location.search),program=p.get('program'),id=p.get('core');if(!id||(program!=='hajj'&&program!=='umrah'))return null;const j=readCore(program);return j?.id===id?j:null;}
export function coreGame(step:1|3):CoreSave|null{if(!new URLSearchParams(location.search).has('core'))return null;const j=coreSession();if(!j||j.step!==step){location.replace(j?coreUrl(j):tenantUrl('./index.html'));return null;}return j;}
export function completeCoreGame(j:CoreSave,step:1|3):boolean{const v=readCore(j.program);if(!v||v.id!==j.id)return false;if(v.step===step)return writeCore(advanceCore(v,step));return v.step===step+1;}
export function levelNumber(step:CoreStep):number{return step===0?1:step<=2?2:step===3?3:4;}
