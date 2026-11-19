/** Optional, device-local guidance; tutorial state cannot award ritual progress. */
export type TutorialKind='lobby'|'field'|'tawaf'|'sai';
export type Skill='walk'|'look'|'guide'|'arrival'|'action'|'route';
export type TutorialEvent={type:'walk'|'look';amount:number}|{type:'guide'|'arrival'|'action'|'route'};
export interface TutorialState{distance:number;look:number;guide:boolean;arrival:boolean;action:boolean;route:boolean}
export const freshTutorial=():TutorialState=>({distance:0,look:0,guide:false,arrival:false,action:false,route:false});
export function train(s:TutorialState,e:TutorialEvent):TutorialState{
 if(e.type==='walk'||e.type==='look'){if(!Number.isFinite(e.amount)||e.amount<=0)return s;const key=e.type==='walk'?'distance':'look';return {...s,[key]:Math.min(e.type==='walk'?1.1:28,s[key]+e.amount)};}
 if(e.type==='guide')return {...s,guide:true};
 if(e.type==='arrival')return {...s,arrival:true};
 if(e.type==='action')return {...s,action:true,arrival:true};
 return {...s,route:true};
}
export const skills=(kind:TutorialKind):Skill[]=>kind==='lobby'?['walk','look','guide']:kind==='field'?['arrival','action']:['walk','route'];
export function learned(s:TutorialState,k:Skill,kind:TutorialKind){switch(k){case 'walk':return s.distance>=1.1||(kind==='lobby'&&s.guide)||(kind!=='lobby'&&s.route);case 'look':return s.look>=28||s.guide;case 'guide':return s.guide;case 'arrival':return s.arrival;case 'action':return s.action;case 'route':return s.route;}}
export function nextSkill(s:TutorialState,k:TutorialKind):Skill|null{return skills(k).find(v=>!learned(s,v,k))??null;}
