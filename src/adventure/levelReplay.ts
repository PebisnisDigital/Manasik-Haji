/** Replay is per browser tab, never a reset of the member's completed journey. */
export type Replay={number:number;id:string};
const KEY='hajji-level-replay-v1';
export function activeReplay():Replay|null{
 if(typeof location==='undefined'||typeof sessionStorage==='undefined')return null;
 const page=location.pathname.split('/').pop()??'';
 if(page==='district.html'||page==='district'||page==='adventure-map.html'||page==='oleh-oleh.html'||page==='admin.html')return null;
 if((page===''||page==='index.html'||page==='index')&&!new URLSearchParams(location.search).has('play'))return null;
 try{const r=JSON.parse(sessionStorage.getItem(KEY)??'null');return Number.isInteger(r?.number)&&r.number>=1&&r.number<=12&&/^[a-z0-9-]{8,80}$/i.test(r.id)?r:null;}catch{return null;}
}
export function beginReplay(number:number):Replay|null{
 if(!Number.isInteger(number)||number<1||number>12)return null;
 try{const r={number,id:crypto.randomUUID()};sessionStorage.setItem(KEY,JSON.stringify(r));return r;}catch{return null;}
}
export function endReplay(){try{sessionStorage.removeItem(KEY);}catch{}}
export function replayKey(base:string,key=base,r:Replay|null=activeReplay()):string{
 if(!r||key.includes(':replay:'))return key;
 const chapter=({1:'miqat',2:'arrival',4:'ihram',5:'arafah',6:'muzdalifah',7:'aqabah',8:'aqabah',9:'aqabah',10:'ifadah',11:'mina',12:'wada'} as Record<number,string>)[r.number];
 const scoped=(chapter&&new RegExp('^manasik-hajj-'+chapter+'(?:-checkpoint)?-v1$').test(base))
 ||(r.number===1&&base.startsWith('manasik-miqat-room-'))
 ||(r.number===2&&(base.startsWith('manasik-arrival-walk-')||base.startsWith('manasik-continuous-tawaf-')||base==='manasik-tawaf-quest-v1'))
 ||(r.number===3&&base==='manasik-sai-quest-v1')
 ||base==='manasik-player-appearance-v1'||base==='manasik-travel-story-v1';
 return scoped?key+':replay:'+r.id:key;
}
