import {replayKey,type Replay} from './levelReplay.ts';
import {aqabahKey,initialAqabah} from './aqabahModel.ts';
import {fieldChapter,fieldKey,validFieldSave} from './hajjCampaign.ts';
import {readField} from './campaignProgress.ts';
import {decodeCore,newCore,type Avatar} from '../coreProgress.ts';
import {playerKey} from '../playerCloud.ts';
import {tenantUrl} from '../tenant.ts';
import type {Point} from './districtModel.ts';

/** The authorized player walks through a recessed doorway, rather than teleporting from the queue. */
export function doorwayPoint(building:Point&{yaw:number},depth:number):Point{
 return {x:building.x+Math.sin(building.yaw)*depth,z:building.z+Math.cos(building.yaw)*depth};
}
export function slidingDoorOffset(open:number){return .90+Math.max(0,Math.min(1,open))*1.85;}
export function directFieldChapter(href:string,base='https://manasik.invalid/district.html'){
 const u=new URL(href,base);if(u.origin!==new URL(base).origin||!u.pathname.endsWith('/hajj-adventure.html')||u.searchParams.get('campaign')!=='hajj')return null;
 return fieldChapter(u.searchParams.get('chapter'));
}
/** Create only the initial checkpoint of this chapter; never award completion or replace existing progress. */
export function directMissionEntry(href:string,avatar:Avatar,name:string,replay:Replay|null=null):string|null{
 const chapter=directFieldChapter(href,location.href);if(!chapter)return tenantUrl(href);
 try{
  const key=replayKey(fieldKey(chapter),playerKey(fieldKey(chapter)),replay),raw=localStorage.getItem(key),backup=localStorage.getItem(key+'.backup');
  for(const item of [raw,backup])try{if(JSON.parse(item??'null')?.version>1)return null;}catch{}
  const previous=replay?null:readField(chapter),next=previous??{...newCore('hajj',avatar,name),step:chapter.id==='aqabah'&&replay&&replay.number>=8?9 as const:chapter.start};
  if(!validFieldSave(next,chapter))return null;
  if(!previous){if((raw!==null||backup!==null)&&!validFieldSave(decodeCore(raw),chapter)&&!validFieldSave(decodeCore(backup),chapter))return null;localStorage.setItem(key,JSON.stringify(next));}
  if(replay?.number===9&&chapter.id==='aqabah'){localStorage.setItem(aqabahKey(next.id),JSON.stringify({...initialAqabah(next.id,7,true),beat:8}));}
  const url=new URL('./manasik.html',location.href);url.searchParams.set('program','hajj');url.searchParams.set('core',next.id);url.searchParams.set('avatar',next.avatar);url.searchParams.set('campaign','hajj');url.searchParams.set('chapter',chapter.id);
  const segment=new URL(href,location.href).searchParams.get('segment');if(segment)url.searchParams.set('segment',segment);
  return tenantUrl(url.pathname+url.search);
 }catch{return null;}
}
