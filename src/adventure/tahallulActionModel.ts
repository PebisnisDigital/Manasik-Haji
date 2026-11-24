import type {TahallulProgress} from './questProgress.ts';
export const CUT_SECONDS=2.6;
export function haircutMethod(avatar:'male'|'female',method:'shave'|'trim'):'shave'|'trim'{return avatar==='female'?'trim':method;}
export function haircutArea(avatar:'male'|'female',cuts:number):string{
 return (avatar==='female'?['Kumpulkan ujung rambut','Potong ujung 1–2 cm','Rapikan seluruh ujung rambut']:['Bagian kanan kepala','Bagian kiri kepala','Bagian belakang dan atas kepala'])[Math.min(2,Math.max(0,cuts))];
}
/** Three saved animation sections cover the whole head; they are not a religious hair-count rule. */
export function afterHaircutStroke(s:TahallulProgress):TahallulProgress|null{
 if(s.stage!==2||s.cuts>=3)return null;const cuts=s.cuts+1;
 return {...s,method:haircutMethod(s.avatar,s.method),cuts,stage:cuts===3?3:2};
}
export function haircutTick(elapsed:number,dt:number,playing:boolean){return Math.min(CUT_SECONDS,elapsed+(playing?Math.max(0,Math.min(.05,dt)):0));}
