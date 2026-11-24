export type TrialKind='heat'|'lost'|'fatigue'|'dust'|'crowd';
export type LifeAction='eat'|'drink'|'rest'|'wash'|'refill'|'recover';
export interface Trial {distance:number;active:boolean;done:boolean;steps:number}
export interface LifeSave {version:1;health:number;stamina:number;food:number;water:number;clean:number;meals:number;bottles:number;trials:Record<string,Trial>}
export interface LifeProfile {kind:TrialKind;title:string;body:string;heat:number}
const kinds:Record<TrialKind,Omit<LifeProfile,'kind'|'heat'>>={
 heat:{title:'Terik perjalanan',body:'Air minum menipis dan tenaga terkuras. Minum dari bekal, lalu beristirahat di pos berbendera hijau.'},
 lost:{title:'Bekal tercecer',body:'Kantong bekal tertinggal di tepi jalur. Temukan tas jingga bertanda BEKAL, dekati, lalu ambil kembali.'},
 fatigue:{title:'Tenaga menurun',body:'Perjalanan panjang membuatmu lelah. Makan bekal, lalu istirahat di pos untuk memulihkan tenaga.'},
 dust:{title:'Debu perjalanan',body:'Badan terasa kotor setelah perjalanan. Datangi sanitasi di pos untuk mandi. Jika air tubuh rendah, minum dari bekal.'},
 crowd:{title:'Arus jemaah padat',body:'Area jingga sedang padat. Berjalan pelan melintasinya atau ambil jalur samping, lalu lanjutkan perjalanan sampai kawasan ini terlewati.'},
};
const chapterKinds:Record<string,TrialKind>={district:'lost',miqat:'lost',arrival:'heat',tawaf:'crowd',sai:'fatigue',tahallul:'dust',ihram:'lost',arafah:'heat',muzdalifah:'fatigue',aqabah:'crowd',ifadah:'heat',mina:'dust',wada:'lost'};
export function lifeProfile(chapter:string):LifeProfile{const kind=chapterKinds[chapter]??(['lost','fatigue','dust'] as const)[(Number(chapter.split('-').at(-1))||0)%3];return {kind,...kinds[kind],heat:['arafah','mina','arrival','district','ihram'].includes(chapter)?1.5:chapter==='muzdalifah'?.55:1};}
export function newLife():LifeSave{return {version:1,health:100,stamina:100,food:82,water:78,clean:88,meals:2,bottles:3,trials:{}};}
export function trialChapter(s:LifeSave,current:string):string{return Object.keys(s.trials).find(id=>s.trials[id].active&&!s.trials[id].done)??current;}
export const trialThreshold=(chapter:string)=>chapter.startsWith('classic-')?3:({miqat:1.5,arrival:6,tahallul:10,ihram:2,arafah:6,muzdalifah:3,aqabah:3,mina:6} as Record<string,number>)[chapter]??24;
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
export function decodeLife(raw:string|null):LifeSave|null {
 try{const s=JSON.parse(raw??'null');if(s?.version!==1)return null;
  for(const k of ['health','stamina','food','water','clean'])if(!Number.isFinite(s[k])||s[k]<0||s[k]>100)return null;
  if(s.health<20||!Number.isInteger(s.meals)||s.meals<0||s.meals>4||!Number.isInteger(s.bottles)||s.bottles<0||s.bottles>4||!s.trials||typeof s.trials!=='object'||Array.isArray(s.trials)||Object.keys(s.trials).length>64)return null;
  const trials:Record<string,Trial>={};for(const [id,value]of Object.entries(s.trials)){const t=value as Trial;if(!/^[a-z0-9-]{1,40}$/.test(id)||!t||!Number.isFinite(t.distance)||t.distance<0||t.distance>1e6||typeof t.active!=='boolean'||typeof t.done!=='boolean'||t.done&&!t.active||!Number.isInteger(t.steps)||t.steps<0||t.steps>3)return null;trials[id]={distance:t.distance,active:t.active,done:t.done,steps:t.steps};}
  return {version:1,health:s.health,stamina:s.stamina,food:s.food,water:s.water,clean:s.clean,meals:s.meals,bottles:s.bottles,trials};
 }catch{return null;}
}
export const strength=(s:LifeSave)=>Math.round(s.health*.45+s.food*.2+s.water*.2+s.clean*.15);
export function lifeSpeed(s:LifeSave,crowded=false):number {return Math.max(.55,Math.min(1,.65+s.stamina/80,s.food<20?.75:1,s.water<20?.7:1,s.health<40?.7:1))*(crowded?.65:1);}
export function tickLife(s:LifeSave,chapter:string,dt:number,distance:number,sprint=false,heat=lifeProfile(chapter).heat):LifeSave {
 dt=Math.max(0,Math.min(.25,dt));if(!dt)return s;distance=Math.max(0,Math.min(3,distance));const p=lifeProfile(chapter),moving=distance>.001;
 let next:LifeSave={...s,food:clamp(s.food-dt*.024-distance*.012),water:clamp(s.water-(dt*.04+distance*.018)*heat),clean:clamp(s.clean-distance*.025),stamina:clamp(s.stamina+(moving?-(distance*(sprint?.52:.075)+dt*.06):dt*(s.food>15&&s.water>15&&s.clean>25?3.8:1.8)))};
 next.health=clamp(Math.max(20,s.health+(s.food<8||s.water<8?-dt*.18:s.food>50&&s.water>50&&s.clean>40?dt*.06:0)));
 const previous=s.trials[chapter]??{distance:0,active:false,done:false,steps:0},trial={...previous,distance:Math.min(1e6,previous.distance+distance)};
 if(!trial.active&&trial.distance>=trialThreshold(chapter)){trial.active=true;if(p.kind==='heat'){next.water=clamp(next.water-27);next.stamina=clamp(next.stamina-18);}if(p.kind==='fatigue'){next.stamina=clamp(next.stamina-42);next.food=clamp(next.food-15);}if(p.kind==='dust')next.clean=clamp(next.clean-40);if(p.kind==='lost'){next.meals=Math.max(0,next.meals-1);next.bottles=Math.max(0,next.bottles-1);}}
 // Crowd pressure ends by covering another 32 m, by a calm crossing or a detour.
 if(trial.active&&!trial.done&&p.kind==='crowd'&&trial.distance>=trialThreshold(chapter)+32)trial.done=true;
 next={...next,trials:{...s.trials,[chapter]:trial}};return next;
}
export function actLife(s:LifeSave,chapter:string,action:LifeAction,nearStation:boolean,nearBag:boolean):LifeSave|null {
 if(action==='eat'&&(!s.meals||s.food>=98)||action==='drink'&&(!s.bottles||s.water>=98)||['rest','wash','refill'].includes(action)&&!nearStation)return null;
 const t=s.trials[chapter],kind=lifeProfile(chapter).kind;
 if(action==='recover'&&(!nearBag||!t?.active||t.done||kind!=='lost'))return null;
 let n={...s};
 if(action==='eat'){n.meals--;n.food=clamp(n.food+45);n.stamina=clamp(n.stamina+14);n.health=clamp(n.health+6);}
 if(action==='drink'){n.bottles--;n.water=clamp(n.water+48);n.stamina=clamp(n.stamina+10);}
 if(action==='rest'){n.stamina=clamp(n.stamina+55);n.health=clamp(n.health+12);}
 if(action==='wash'){n.clean=100;n.stamina=clamp(n.stamina+12);}
 if(action==='refill'){if(s.meals===4&&s.bottles===4)return null;n.meals=4;n.bottles=4;}
 if(action==='recover'){n.meals=Math.min(4,n.meals+2);n.bottles=Math.min(4,n.bottles+2);}
 if(t?.active&&!t.done){let steps=t.steps;const first=kind==='heat'?'drink':kind==='fatigue'?'eat':'wash',second=kind==='dust'?'drink':'rest';
  if(action===first)steps|=1;if(action===second)steps|=2;
  if(kind==='dust'&&action==='wash'&&n.water>=65)steps|=2;
  n={...n,trials:{...n.trials,[chapter]:{...t,steps,done:kind==='lost'?action==='recover':kind==='crowd'?false:steps===3}}};
 }
 return n;
}

export interface LifeStorage {getItem(k:string):string|null;setItem(k:string,v:string):void}
export function readLife(storage:LifeStorage,key:string):{save:LifeSave;future:boolean;recovered:boolean} {
 try{const raw=storage.getItem(key);try{if(JSON.parse(raw??'null')?.version>1)return {save:newLife(),future:true,recovered:false};}catch{}
  const main=decodeLife(raw);if(main)return {save:main,future:false,recovered:false};const backupRaw=storage.getItem(key+'.backup');try{if(JSON.parse(backupRaw??'null')?.version>1)return {save:newLife(),future:true,recovered:false};}catch{}const backup=decodeLife(backupRaw);return {save:backup??newLife(),future:false,recovered:!!backup};
 }catch{return {save:newLife(),future:false,recovered:false};}
}
export function storeLife(storage:LifeStorage,key:string,s:LifeSave):boolean {
 try{if(readLife(storage,key).future)return false;const previous=storage.getItem(key);
  if(decodeLife(previous))try{storage.setItem(key+'.backup',previous!);}catch{}
  storage.setItem(key,JSON.stringify(s));return true;
 }catch{return false;}
}
