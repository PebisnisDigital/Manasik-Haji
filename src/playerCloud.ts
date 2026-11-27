import {ticketOwner,ticketKey} from './ticketProgress.ts';
import {replayKey} from './adventure/levelReplay.ts';
import {isExampleMode,exampleKey} from './adventure/exampleAccess.ts';
import {configured,session,rest} from './commercialApi.ts';
import {slug} from './tenant.ts';
import type {CoreSave,Program,Avatar,CoreStep} from './coreProgress.ts';
export const scope=slug||'direct';
export const accountId=()=>isExampleMode()||ticketOwner()?'':session()?.user?.id??'';
export const guestKey=(base:string)=>exampleKey(slug?base+':'+slug+':guest':base);
export const playerKey=(base:string,owner=accountId())=>replayKey(base,isExampleMode()?guestKey(base):ticketOwner()?ticketKey(base):owner?base+':account:'+owner+':'+scope:guestKey(base));
export interface CloudRun{user_id:string;scope:string;run_id:string;program:Program;avatar:Avatar;name:string;step:CoreStep;checkpoint:number;completed_at:string|null;updated_at?:string}
export const runSnapshot=(j:CoreSave,count:number,uid:string):CloudRun=>({user_id:uid,scope,run_id:j.id,program:j.program,avatar:j.avatar,name:j.name.trim()||'Peserta',step:j.step,checkpoint:count,completed_at:j.completedAt??null});
export function mergeRun(a:CloudRun,b:CloudRun):CloudRun{if(a.user_id!==b.user_id||a.scope!==b.scope||a.program!==b.program||a.run_id!==b.run_id)throw Error('Different session');if(a.step>b.step)return a;if(b.step>a.step)return b;return {...b,checkpoint:Math.max(a.checkpoint,b.checkpoint),completed_at:a.completed_at??b.completed_at};}
const prefix=(uid:string)=>'umroh-outbox-v1:'+uid+':'+scope+':';
const keyFor=(r:CloudRun)=>prefix(r.user_id)+r.program+':'+r.run_id;
export function pendingRuns(uid=accountId()):CloudRun[]{if(!uid)return [];try{const rows:CloudRun[]=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k?.startsWith(prefix(uid)))continue;const r=JSON.parse(localStorage.getItem(k)??'null') as CloudRun|null;if(r?.user_id===uid&&r.scope===scope&&keyFor(r)===k)rows.push(r);}return rows;}catch{return [];}}
export function enqueueRun(j:CoreSave,count:number):boolean{const uid=accountId();if(!uid||!configured)return true;try{const row=runSnapshot(j,count,uid),key=keyFor(row),raw=localStorage.getItem(key);const prior=raw?JSON.parse(raw) as CloudRun:null;localStorage.setItem(key,JSON.stringify(prior?mergeRun(prior,row):row));void syncRuns().catch(()=>{});return true;}catch{return false;}}
let active:Promise<boolean>|null=null;
export async function syncRuns():Promise<boolean>{if(active)return active;const uid=accountId();if(!configured||!uid)return false;
 active=(async()=>{try{for(let round=0;round<3;round++){const rows=pendingRuns(uid);if(!rows.length)return true;for(const row of rows){if(accountId()!==uid)return false;const key=keyFor(row),snapshot=JSON.stringify(row);await rest('umroh_player_runs?on_conflict=user_id,scope,program,run_id',{auth:true,method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:row});if(localStorage.getItem(key)===snapshot)localStorage.removeItem(key);}}return pendingRuns(uid).length===0;}catch{return false;}})();try{return await active;}finally{active=null;}}
export async function fetchRuns():Promise<CloudRun[]>{const uid=accountId();if(!uid)throw Error('Masuk dahulu.');return rest<CloudRun[]>('umroh_player_runs?select=*&scope=eq.'+encodeURIComponent(scope)+'&user_id=eq.'+encodeURIComponent(uid)+'&order=updated_at.desc&limit=100',{auth:true});}
export interface Bookmark{certificate_id:string;saved_at:string}
export const getBookmarks=()=>rest<Bookmark[]>('umroh_certificate_bookmarks?select=certificate_id,saved_at&order=saved_at.desc&limit=100',{auth:true});
export const bookmark=(id:string)=>rest('umroh_certificate_bookmarks?on_conflict=user_id,certificate_id',{auth:true,method:'POST',prefer:'resolution=ignore-duplicates,return=minimal',body:{user_id:accountId(),certificate_id:id}});
export const removeBookmark=(id:string)=>rest('umroh_certificate_bookmarks?certificate_id=eq.'+encodeURIComponent(id),{auth:true,method:'DELETE'});
if(typeof window!=='undefined'){const flush=()=>{if(accountId()&&configured)void syncRuns();};window.addEventListener('online',flush);window.addEventListener('pageshow',flush);document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush();});window.setInterval(()=>{if(!document.hidden)flush();},15000);flush();}
