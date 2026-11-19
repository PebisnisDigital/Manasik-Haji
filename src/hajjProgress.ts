import type {Avatar} from './journey.ts';
export const STAGES=['ihram','arafah','muzdalifah','aqabah','trim','ifadah','sai','mina','day11','day12','nafar','day13','wada','done'] as const;
export type HStage=typeof STAGES[number];
export interface HajjState{version:1;id:string;avatar:Avatar;stage:HStage}
import {scopedKey,tenantUrl,reportProgress} from './tenant.ts';
const KEY=()=>scopedKey('manasik-hajj-v2');
export function decodeHajj(raw:string|null):HajjState|null{try{const j=JSON.parse(raw??'null');if(!j||j.version!==1||typeof j.id!=='string'||!j.id||!['male','female'].includes(j.avatar)||!STAGES.includes(j.stage))return null;return j;}catch{return null;}}
export function readHajj():HajjState|null{try{return decodeHajj(localStorage.getItem(KEY()));}catch{return null;}}
export function saveHajj(j:HajjState):boolean{try{localStorage.setItem(KEY(),JSON.stringify(j));reportProgress('hajj',STAGES.indexOf(j.stage));return true;}catch{return false;}}
export function newHajj(avatar:Avatar):HajjState{return {version:1,id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),stage:'ihram',avatar};}
export function advanceHajj(j:HajjState,expected:HStage,early=false):HajjState{
 if(j.stage!==expected||expected==='done')return j;
 const next=expected==='nafar'&&early?'wada':STAGES[STAGES.indexOf(expected)+1];return {...j,stage:next};
}
export function hajjGame(kind:'tawaf'|'sai'):HajjState|null{
 const p=new URLSearchParams(location.search).get('hajj');if(!p)return null;
 const j=readHajj();if(!j||j.id!==p||(kind==='tawaf'?!['ifadah','wada'].includes(j.stage):j.stage!=='sai')){location.replace(tenantUrl('./hajj.html'));return null;}return j;
}
export function completeHajj(j:HajjState):boolean{const current=readHajj();if(!current||current.id!==j.id)return false;if(current.stage!==j.stage)return STAGES.indexOf(current.stage)>STAGES.indexOf(j.stage);return saveHajj(advanceHajj(current,j.stage));}
export function hajjUrl(j:HajjState,page:string):string{return tenantUrl('./'+page+'?hajj='+encodeURIComponent(j.id)+'&avatar='+j.avatar);}
