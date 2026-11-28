import {ticketOwner} from '../ticketProgress.ts';
import {playerKey} from '../playerCloud.ts';
import {replayKey} from './levelReplay.ts';
import {exampleKey} from './exampleAccess.ts';
export const QUEST_KEYS = {
 get tawaf(){return ticketOwner()?playerKey('manasik-tawaf-quest-v1'):replayKey('manasik-tawaf-quest-v1',exampleKey('manasik-tawaf-quest-v1'));},
 get sai(){return ticketOwner()?playerKey('manasik-sai-quest-v1'):replayKey('manasik-sai-quest-v1',exampleKey('manasik-sai-quest-v1'));},
 get tahallul(){return ticketOwner()?playerKey('manasik-tahallul-quest-v1'):replayKey('manasik-tahallul-quest-v1',exampleKey('manasik-tahallul-quest-v1'));},
} as const;
export type Chapter = keyof typeof QUEST_KEYS;
export interface RouteProgress {version:1;stage:number;count:number;gate:number}

/** Version 1 stays readable by shipped pages. Missing gate means the old full-lap checkpoint. */
export function decodeRoute(raw:string|null, kind:'tawaf'|'sai'):RouteProgress|null {
  try {
    const s=JSON.parse(raw??'null'),count=s?.[kind==='tawaf'?'laps':'legs'];
    if(s?.version!==1||!Number.isInteger(s.stage)||s.stage<0||s.stage>3||!Number.isInteger(count)||count<0||count>7)return null;
    if(s.stage===0&&count!==0||s.stage>=2&&count!==7)return null;
    const stage=count===7?Math.max(2,s.stage):s.stage;
    const gate=s.gate??0;
    if(!Number.isInteger(gate)||gate<0||gate>=(kind==='tawaf'?8:5))return null;
    return {version:1,stage,count,gate:stage===1?gate:0};
  } catch {return null;}
}
export interface TahallulProgress {version:1;stage:number;avatar:'male'|'female';method:'trim'|'shave';cuts:number}
export function decodeTahallul(raw:string|null):TahallulProgress|null {
  try {
    const s=JSON.parse(raw??'null');
    if(s?.version!==1||!Number.isInteger(s.stage)||s.stage<0||s.stage>4||!Number.isInteger(s.cuts)||s.cuts<0||s.cuts>3||!['male','female'].includes(s.avatar)||!['trim','shave'].includes(s.method))return null;
    if(s.stage<2&&s.cuts!==0||s.stage>=3&&s.cuts!==3||s.avatar==='female'&&s.method==='shave')return null;
    return {version:1,stage:s.stage===2&&s.cuts===3?3:s.stage,avatar:s.avatar,method:s.method,cuts:s.cuts};
  } catch {return null;}
}
// Older arena scripts pass a literal base key; resolve it to the same member/replay key as the district.
function resolveQuestKey(key:string){
 if(key==='manasik-tawaf-quest-v1')return QUEST_KEYS.tawaf;
 if(key==='manasik-sai-quest-v1')return QUEST_KEYS.sai;
 if(key==='manasik-tahallul-quest-v1')return QUEST_KEYS.tahallul;
 return key;
}
export function loadProgress<T>(key:string,decode:(raw:string|null)=>T|null):T|null {
  try {key=resolveQuestKey(key);return decode(localStorage.getItem(key))??decode(localStorage.getItem(key+'.backup'));} catch {return null;}
}
export function storeProgress(key:string,value:object):boolean {
  try {key=resolveQuestKey(key);
    const previous=localStorage.getItem(key);
    if(previous){try{const record=JSON.parse(previous);if(typeof record?.version==='number'&&record.version>1)return false;}catch{/* Recovery can replace truncated JSON. */}}
    // Retain a valid previous record. A broken primary must not replace a good backup.
    const validator=key===QUEST_KEYS.tawaf?(r:string|null)=>decodeRoute(r,'tawaf'):key===QUEST_KEYS.sai?(r:string|null)=>decodeRoute(r,'sai'):decodeTahallul;
    if(previous&&validator(previous)) {
      try {localStorage.setItem(key+'.backup',previous);} catch {/* A backup failure must not prevent a primary write. */}
    }
    localStorage.setItem(key,JSON.stringify(value));return true;
  } catch {return false;}
}
export function routeReward(stage:number,count:number):number {return (stage>=1?10:0)+count*10+(stage===3?30:0);}
export function chapterSummary(t:RouteProgress|null,s:RouteProgress|null,h:TahallulProgress|null) {
  const tawaf=t?.stage===3,sai=tawaf&&s?.stage===3,tahallul=sai&&h?.stage===4;
  return {tawaf,sai,tahallul,done:Number(tawaf)+Number(sai)+Number(tahallul),
    reward:(t?routeReward(t.stage,t.count):0)+(tawaf&&s?routeReward(s.stage,s.count):0)+(sai&&h?h.stage*10:0)};
}
/** NPCs yield with hysteresis, without hard collision that could trap the player. */
export function npcWaiting(distance:number,waiting:boolean):boolean {return distance<(waiting?2.1:1.45);}
