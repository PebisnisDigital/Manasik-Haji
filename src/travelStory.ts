import {loadNusukRoute} from './adventure/nusukRoute.ts';
import {nusukNumber} from './adventure/nusukModel.ts';
import {playerKey} from './playerCloud.ts';
import {tenantUrl} from './tenant.ts';
import {loadCampaign} from './adventure/campaignProgress.ts';
import {chapterHref,HAJJ_CHAPTERS} from './adventure/hajjCampaign.ts';
import {readCore} from './coreProgress.ts';
import {readSetup} from './frontSettings.ts';
import {UMRAH_LEVELS} from './frontModel.ts';
import {loadProgress,QUEST_KEYS,decodeRoute,decodeTahallul} from './adventure/questProgress.ts';

export interface TravelStory{version:1;name:string;briefed:boolean;arrivals:string[]}
export const validStop=(id:string)=>/^hajj:(miqat|arrival|tawaf|sai|tahallul|ihram|arafah|muzdalifah|aqabah|ifadah|mina|wada)$|^umrah:[1-5]$/.test(id);
export function decodeStory(raw:string|null):TravelStory|null{
 try{const v=JSON.parse(raw??'null');return v?.version===1&&typeof v.name==='string'&&v.name.length<=60&&typeof v.briefed==='boolean'&&Array.isArray(v.arrivals)&&v.arrivals.length<=17&&v.arrivals.every((s:unknown)=>typeof s==='string'&&validStop(s))?{version:1,name:v.name,briefed:v.briefed,arrivals:[...new Set<string>(v.arrivals)]}:null;}catch{return null;}
}
const key=()=>playerKey('manasik-travel-story-v1');
export function readStory():TravelStory{try{return decodeStory(localStorage.getItem(key()))??decodeStory(localStorage.getItem(key()+'.backup'))??{version:1,name:'Petualang',briefed:false,arrivals:[]};}catch{return {version:1,name:'Petualang',briefed:false,arrivals:[]};}}
export function saveStory(change:Partial<Pick<TravelStory,'name'|'briefed'>>={},arrival?:string):boolean{
 try{const k=key(),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup]){try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}}
  if(arrival&&!validStop(arrival))return false;const previous=readStory(),next={...previous,...change,arrivals:[...new Set([...previous.arrivals,...(arrival?[arrival]:[])])]};if(!decodeStory(JSON.stringify(next)))return false;
  if(decodeStory(raw))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(next));return true;
 }catch{return false;}
}
export interface TravelStop{id:string;title:string;number:number;program:'hajj'|'umrah';href:string}
function oldQuest(id:string){return id==='tawaf'||id==='sai'?loadProgress(QUEST_KEYS[id],raw=>decodeRoute(raw,id)):id==='tahallul'?loadProgress(QUEST_KEYS.tahallul,decodeTahallul):null;}
export function resolveStop(id:string):TravelStop|null{
 if(id.startsWith('hajj:')){const progress=loadCampaign(),c=progress.chapters.find(c=>'hajj:'+c.id===id);if(c?.id==='tawaf'&&readSetup()&&!progress.chapters[1].done&&!c.done&&!oldQuest('tawaf'))return null;return c&&(c.available||loadNusukRoute().chapters[nusukNumber(c.id)-1].available)?{id,title:c.title,number:nusukNumber(c.id),program:'hajj',href:c.href}:null;}
 const match=id.match(/^umrah:([1-5])$/),run=readCore('umrah');if(!match||!readSetup()||Number(match[1])!==(run?Math.min(run.step+1,5):1))return null;
 return {id,title:UMRAH_LEVELS[Number(match[1])-1].title,number:Number(match[1]),program:'umrah',href:'./adventure-map.html?journey=umrah&arrived=1'};
}
export function transferUrl(id:string){return tenantUrl('./district.html?transfer='+encodeURIComponent(id));}
export function miqatEntryUrl(demo=false){const program=readSetup()?.program??'hajj';return tenantUrl('./index.html?play=miqat&program='+program+(program==='hajj'?'&campaign=hajj&chapter=miqat':'')+(demo?'&preview=1':''));}
export function arrivalEntryUrl(){return miqatEntryUrl()+'&arrival=1';}
export function continuousSaiUrl(){return miqatEntryUrl()+'&sai=1';}
export function continuousTawafUrl(){return miqatEntryUrl()+'&tawaf=1';}
export function umrahDeparture(step:number,fallback:string):string{return step>=0&&step<5&&readSetup()&&readStory().briefed&&!readStory().arrivals.includes('umrah:'+(step+1))?transferUrl('umrah:'+(step+1)):fallback;}
export function firstDeparture(){
 const setup=readSetup();if(!setup)return tenantUrl('./index.html?setup=1');
 if(setup.program==='umrah'){const run=readCore('umrah');return run?tenantUrl('./adventure-map.html?journey=umrah'):transferUrl('umrah:1');}
 const progress=loadCampaign();return progress.done||progress.chapters.some(c=>c.save)?tenantUrl('./adventure-map.html?journey=hajj'):transferUrl('hajj:miqat');
}
/** Access links preserve the furthest active mission; new players start at Miqat. */
export function magicDeparture(demo=false){
 const setup=readSetup();if(!setup)return tenantUrl('./index.html');
 let id:string;
 if(setup.program==='umrah'){const run=readCore('umrah');if(run&&run.step>=5)return tenantUrl('./adventure-map.html?journey=umrah');id='umrah:'+(run?run.step+1:1);}
 else{const progress=loadCampaign();if(loadNusukRoute().complete)return tenantUrl('./adventure-map.html?journey=hajj');const active=progress.chapters.filter(c=>c.id!=='tahallul'&&!c.done&&(c.save||oldQuest(c.id)));const next=loadNusukRoute().next.id;id='hajj:'+(active.at(-1)?.id??(next==='dam'||next==='hajj-tahallul'?'aqabah':next));}
 if(id==='hajj:sai'&&!oldQuest('sai')){const p=loadCampaign();if(p.chapters[0].done&&p.chapters[1].done&&p.chapters[2].done)return continuousSaiUrl();}
 const stop=resolveStop(id);if(!stop)return tenantUrl('./adventure-map.html?journey='+setup.program);
 if(!demo&&readStory().arrivals.includes(id))return tenantUrl(stop.href);
 return transferUrl(id)+'&boarding='+(demo?'demo':'magic');
}
/** New authored route only; existing direct bookmarks and resumed checkpoints keep working. */
export function withTransfer(href:string):string{
 if(!readSetup()||!readStory().briefed)return href;
 let chapter=HAJJ_CHAPTERS.find(c=>chapterHref(c)===href);
 if(!chapter){try{const base=typeof location==='undefined'?'https://manasik.invalid/index.html':location.href,u=new URL(href,base);if(u.origin!==new URL(base).origin)return href;chapter=HAJJ_CHAPTERS.find(c=>'href'in c?u.pathname.endsWith('/'+c.href.slice(2)):u.pathname.endsWith('/hajj-adventure.html')&&u.searchParams.get('campaign')==='hajj'&&u.searchParams.get('chapter')===c.id);}catch{return href;}}
 if(!chapter)return href;
 if(chapter.id==='miqat')return tenantUrl('./index.html?play=miqat&program=hajj&campaign=hajj&chapter=miqat');
 if(chapter.id==='arrival')return tenantUrl('./index.html?play=miqat&program=hajj&campaign=hajj&chapter=miqat&arrival=1');
 if(chapter.id==='tawaf'){const progress=loadCampaign();if(progress.chapters[0].done&&progress.chapters[1].done)return tenantUrl('./index.html?play=miqat&program=hajj&campaign=hajj&chapter=miqat&tawaf=1');}
 if(chapter.id==='tahallul')return tenantUrl('./hajj-adventure.html?campaign=hajj&chapter=ihram');
 if(chapter.id==='sai'&&!oldQuest('sai')){const p=loadCampaign();if(p.chapters[0].done&&p.chapters[1].done&&p.chapters[2].done)return continuousSaiUrl();}
 if(chapter.id==='ihram'||chapter.id==='arafah'||chapter.id==='muzdalifah'||chapter.id==='aqabah')return href;
 const status=loadCampaign().chapters[chapter.number-1],id='hajj:'+chapter.id;
 return status.available&&!status.done&&!status.save&&!oldQuest(chapter.id)&&resolveStop(id)&&!readStory().arrivals.includes(id)?transferUrl(id):href;
}
