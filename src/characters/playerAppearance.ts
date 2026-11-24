import type {CharacterVariant} from './CharacterMesh.ts';
import {playerKey} from '../playerCloud.ts';
import {decodeCore} from '../coreProgress.ts';
import {decodeTahallul,loadProgress,QUEST_KEYS} from '../adventure/questProgress.ts';
import {readSetup} from '../frontSettings.ts';
export type Hair='natural'|'trimmed'|'shaved';
export type Wardrobe='casual'|'ritual'|'journey';
export interface PlayerLook{version:1;hair:Hair;ihram:boolean;hajjPeak?:true}
export const APPEARANCE_EVENT='manasik-player-appearance';
const key=()=>playerKey('manasik-player-appearance-v1');
export function decodeLook(raw:string|null):PlayerLook|null{try{const v=JSON.parse(raw??'null');return v?.version===1&&['natural','trimmed','shaved'].includes(v.hair)&&typeof v.ihram==='boolean'?{version:1,hair:v.hair,ihram:v.ihram,...(v.hajjPeak===true?{hajjPeak:true as const}:{})}:null;}catch{return null;}}
/** Old completed runs remain readable; opening a scene never migrates or rewrites saves. */
export function readLook():PlayerLook{
 let saved:PlayerLook|null=null,backup:PlayerLook|null=null;try{backup=decodeLook(localStorage.getItem(key()+'.backup'));saved=decodeLook(localStorage.getItem(key()))??backup;}catch{}
 let hair=saved?.hair??'natural';if(backup?.hair==='shaved'||backup?.hair==='trimmed'&&hair==='natural')hair=backup.hair;
 try{const old=loadProgress(QUEST_KEYS.tahallul,decodeTahallul);if(old?.avatar==='male'&&old.stage>=3&&old.cuts>=3){if(old.method==='shave')hair='shaved';else if(hair==='natural')hair='trimmed';}
  const legacy=['umroh-digital-preview-hajj','umroh-digital-preview-umrah'].map(k=>decodeCore(localStorage.getItem(playerKey(k))));
  const field=['aqabah','ifadah','mina','wada'].map(id=>decodeCore(localStorage.getItem(playerKey('manasik-hajj-'+id+'-v1'))));
  // The older core has a single male shaving demonstration. Original adventure method is respected.
  const peak=legacy.some(s=>s?.program==='hajj'&&s.avatar==='male'&&s.step>=10)||field.some(s=>s?.avatar==='male'&&s.step>=10)||saved?.hajjPeak||backup?.hajjPeak;
  if(legacy.some(s=>s?.avatar==='male'&&s.step>=5&&(s.program==='umrah'||s.step>=10||!saved&&!(old?.avatar==='male'&&old.stage>=3&&old.method==='trim')))||peak)hair='shaved';
  // Correct the earlier Hajj presentation without rewriting its completed Umrah quest.
  if(readSetup()?.program==='hajj'&&old?.avatar==='male'&&old.stage>=3&&!peak)hair='trimmed';
 }catch{}
 return {version:1,hair,ihram:saved?.ihram??false,...(saved?.hajjPeak||backup?.hajjPeak?{hajjPeak:true as const}:{})};
}
function storeLook(next:PlayerLook):boolean{
 try{const k=key(),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup]){try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}}
  if(!decodeLook(JSON.stringify(next)))return false;
  // A delayed outfit write from another tab must not undo an already saved shave.
  if(decodeLook(raw)?.hair==='shaved'||decodeLook(backup)?.hair==='shaved')next={...next,hair:'shaved'};
  const primary=decodeLook(raw),previous=decodeLook(backup);
  if(primary&&!(previous?.hair==='shaved'&&primary.hair!=='shaved'))try{localStorage.setItem(k+'.backup',raw!);}catch{}
  localStorage.setItem(k,JSON.stringify(next));
  if(typeof window!=='undefined')window.dispatchEvent(new Event(APPEARANCE_EVENT));return true;
 }catch{return false;}
}
export function wearIhram():boolean{return storeLook({...readLook(),ihram:true});}
export function finishHaircut(avatar:'male'|'female',method:'trim'|'shave'='shave',milestone?:'hajj'):boolean{
 const current=readLook();return storeLook({...current,hair:avatar==='female'?current.hair:current.hair==='shaved'||method==='shave'?'shaved':'trimmed',ihram:false,...(avatar==='male'&&milestone==='hajj'?{hajjPeak:true as const}:{})});
}
export function playerVariant(avatar:'male'|'female',wardrobe:Wardrobe='ritual'):CharacterVariant{
 const look=readLook(),casual=wardrobe==='casual'||wardrobe==='journey'&&!look.ihram;
 return {robeLength:avatar==='female'?.065:casual?.49:.19,coverHead:avatar==='female',pilgrimStyle:avatar,casual,hair:avatar==='female'?'shaved':look.hair};
}
