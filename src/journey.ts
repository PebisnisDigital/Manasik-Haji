export type Avatar='male'|'female';
export type Stage=0|1|2|3|4|5;
export interface Journey{version:1;avatar:Avatar;stage:Stage;id:string}
import {scopedKey,tenantUrl,reportProgress} from './tenant.ts';
const KEY=()=>scopedKey('manasik-umrah-v1');
export function decodeJourney(raw:string|null):Journey|null{
  if(!raw)return null;
  try{
    const o=JSON.parse(raw);
    if(o.version!==1||!['male','female'].includes(o.avatar)||!Number.isInteger(o.stage)||o.stage<0||o.stage>5||typeof o.id!=='string'||!o.id)return null;
    return {version:1,avatar:o.avatar,stage:o.stage,id:o.id};
  }catch{return null;}
}
export function readJourney():Journey|null{
  try{return decodeJourney(localStorage.getItem(KEY()));}catch{return null;}
}
export function writeJourney(j:Journey):boolean{
  try{localStorage.setItem(KEY(),JSON.stringify(j));reportProgress('umrah',j.stage);return true;}catch{return false;}
}
export function newJourney(avatar:Avatar):Journey{
  return {version:1,avatar,stage:0,id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)};
}
export function advance(j:Journey,expected:Stage):Journey{
  return j.stage===expected&&expected<5?{...j,stage:(expected+1) as Stage}:j;
}
export function completeStage(expected:Stage,id:string):boolean{
  const j=readJourney();
  if(!j||j.id!==id)return false;
  if(j.stage===expected)return writeJourney(advance(j,expected));
  return j.stage>expected;
}
export function guidedStage(expected:Stage):Journey|null{
  const param=new URLSearchParams(location.search).get('journey');
  if(!param)return null;
  const j=readJourney();
  if(!j||j.id!==param||j.stage!==expected){location.replace(tenantUrl('./umrah.html'));return null;}
  return j;
}
export function stageUrl(page:string,j:Journey):string{
  return tenantUrl('./'+page+'?journey='+encodeURIComponent(j.id)+'&avatar='+j.avatar);
}
