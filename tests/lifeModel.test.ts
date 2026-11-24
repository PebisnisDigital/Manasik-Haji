import {describe,it,expect} from 'vitest';
import {actLife,decodeLife,lifeProfile,lifeSpeed,newLife,readLife,storeLife,strength,tickLife,trialChapter,trialThreshold} from '../src/adventure/lifeModel.ts';

function travel(chapter:string,metres=trialThreshold(chapter),s=newLife()){
 for(let d=0;d<metres;d+=.5)s=tickLife(s,chapter,.1,Math.min(.5,metres-d));return s;
}
function memory(initial:Record<string,string>={}){const map=new Map(Object.entries(initial));return {map,getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}};}
describe('expedition needs and trials',()=>{
 it('keeps original state immutable and pauses without draining needs',()=>{const s=newLife(),raw=JSON.stringify(s);expect(tickLife(s,'sai',0,2,true)).toBe(s);travel('sai',30,s);expect(JSON.stringify(s)).toBe(raw);});
 it('gives every playable chapter a challenge and reachable-distance trigger',()=>{
  for(const id of ['district','miqat','arrival','tawaf','sai','tahallul','ihram','arafah','muzdalifah','aqabah','ifadah','mina','wada',...Array.from({length:11},(_,i)=>'classic-'+(i+1))]){
   expect(trialThreshold(id)).toBeLessThanOrEqual(24);expect(travel(id).trials[id].active,id).toBe(true);
  }
 });
 it('requires drinking and an actual station rest for heat, in either order',()=>{
  for(const order of [['drink','rest'],['rest','drink']] as const){let s=travel('arafah');expect(s.water).toBeLessThan(52);expect(actLife(s,'arafah','rest',false,false)).toBeNull();
   s=actLife(s,'arafah',order[0],true,false)!;expect(s.trials.arafah.done).toBe(false);s=actLife(s,'arafah',order[1],true,false)!;expect(s.trials.arafah.done).toBe(true);
  }
 });
 it('makes fatigue affect stamina and requires food plus station rest',()=>{let s=travel('sai');expect(s.stamina).toBeLessThan(60);expect(s.food).toBeLessThan(67);s=actLife(s,'sai','eat',false,false)!;expect(s.meals).toBe(1);expect(s.trials.sai.done).toBe(false);s=actLife(s,'sai','rest',true,false)!;expect(s.trials.sai.done).toBe(true);});
 it('requires sanitation plus drinking after dust when dehydrated',()=>{let s=travel('mina',6,{...newLife(),water:30});expect(s.clean).toBeLessThan(49);expect(actLife(s,'mina','wash',false,false)).toBeNull();s=actLife(s,'mina','wash',true,false)!;expect(s.clean).toBe(100);expect(s.trials.mina.done).toBe(false);s=actLife(s,'mina','drink',false,false)!;expect(s.trials.mina.done).toBe(true);});
 it('does not force a hydrated player to waste a drink to finish sanitation',()=>{const s=travel('mina',6,{...newLife(),water:100});expect(actLife(s,'mina','drink',false,false)).toBeNull();const n=actLife(s,'mina','wash',true,false)!;expect(n.trials.mina.done).toBe(true);expect(n.bottles).toBe(s.bottles);});
 it('recovers lost provisions only at the bag and cannot farm the reward',()=>{let s=travel('district');expect([s.meals,s.bottles]).toEqual([1,2]);expect(actLife(s,'district','recover',true,false)).toBeNull();s=actLife(s,'district','recover',false,true)!;expect([s.meals,s.bottles]).toEqual([3,4]);expect(s.trials.district.done).toBe(true);expect(actLife(s,'district','recover',false,true)).toBeNull();});
 it('slows movement in a crowded zone and completes with 32 further metres',()=>{let s=travel('aqabah');expect(lifeSpeed(s,true)).toBeLessThan(lifeSpeed(s));expect(s.trials.aqabah.done).toBe(false);s=travel('aqabah',32,s);expect(s.trials.aqabah.done).toBe(true);expect(actLife(s,'aqabah','rest',true,false)!.trials.aqabah.done).toBe(true);});
 it('carries unfinished hardship into the next chapter without another stacked penalty',()=>{let s=travel('district');expect(trialChapter(s,'sai')).toBe('district');s=travel(trialChapter(s,'sai'),40,s);expect(s.meals).toBe(1);expect(s.trials.sai).toBeUndefined();s=actLife(s,'district','recover',false,true)!;expect(trialChapter(s,'sai')).toBe('sai');});
 it('keeps bounded finite supplies and rejects empty/full consumption atomically',()=>{const s={...newLife(),food:35,water:30,meals:0,bottles:0};expect(actLife(s,'miqat','eat',false,false)).toBeNull();expect(actLife(s,'miqat','drink',false,false)).toBeNull();expect([s.food,s.water,s.meals]).toEqual([35,30,0]);expect(actLife(s,'miqat','refill',false,false)).toBeNull();const n=actLife(s,'miqat','refill',true,false)!;expect([n.meals,n.bottles]).toEqual([4,4]);expect(actLife(n,'miqat','refill',true,false)).toBeNull();expect(actLife({...n,food:100},'miqat','eat',false,false)).toBeNull();});
 it('makes sprint cost more and never locks an exhausted player out of recovery',()=>{const s=newLife();expect(tickLife(s,'sai',.1,1,true).stamina).toBeLessThan(tickLife(s,'sai',.1,1,false).stamina);let low={...s,stamina:0,health:20,food:0,water:0,clean:0};for(let i=0;i<400;i++)low=tickLife(low,'sai',.25,0);expect(low.health).toBe(20);expect(lifeSpeed(low)).toBeGreaterThanOrEqual(.55);expect(strength(low)).toBeLessThan(strength(s));expect(actLife(low,'sai','rest',true,false)!.stamina).toBeGreaterThan(50);});
 it('uses elapsed active time consistently at 30 and 60 Hz, with no offline decay',()=>{function run(hz:number){let s=newLife();for(let i=0;i<hz*60;i++)s=tickLife(s,'district',1/hz,0);return s;}expect(run(30).water).toBeCloseTo(run(60).water,7);const raw=JSON.stringify(run(30));expect(decodeLife(raw)).toEqual(run(30));expect(lifeProfile('arafah').heat).toBeGreaterThan(lifeProfile('muzdalifah').heat);});
 it('provides a moderate nutrition clock and early warning margin',()=>{
  // Walking 2.8 m/s: nutrition warning (<25) should take minutes, not seconds.
  for(const chapter of ['sai','arafah','muzdalifah']){let s=newLife(),warning=0,empty=0;for(let seconds=.25;seconds<2400;seconds+=.25){s=tickLife(s,chapter,.25,.7);if(!warning&&s.water<25)warning=seconds;if(!empty&&s.water===0){empty=seconds;break;}}expect(warning).toBeGreaterThan(120);expect(empty-warning).toBeGreaterThan(150);}
 });
});
describe('separate versioned life save',()=>{
 it('round trips every trial and rejects corrupt/incompatible data',()=>{const s=travel('district');expect(decodeLife(JSON.stringify(s))).toEqual(s);for(const raw of ['{','null',JSON.stringify({...s,version:2}),JSON.stringify({...s,health:19}),JSON.stringify({...s,meals:2.1}),JSON.stringify({...s,water:101}),JSON.stringify({...s,trials:{district:{distance:0,active:false,done:true,steps:0}}})])expect(decodeLife(raw)).toBeNull();});
 it('preserves old checkpoint keys and recovers a valid backup',()=>{const mem=memory({'manasik-tawaf-quest-v1':'old-checkpoint'}),s=travel('district');expect(storeLife(mem,'life',s)).toBe(true);expect(storeLife(mem,'life',{...s,food:50})).toBe(true);mem.setItem('life','{');const result=readLife(mem,'life');expect(result.recovered).toBe(true);expect(result.save).toEqual(s);expect(mem.getItem('manasik-tawaf-quest-v1')).toBe('old-checkpoint');});
 it.each(['life','life.backup'])('protects future versions in %s from replacement',key=>{const raw=JSON.stringify({version:99,opaque:'preserve'}),mem=memory({[key]:raw});expect(readLife(mem,'life').future).toBe(true);expect(storeLife(mem,'life',newLife())).toBe(false);expect(mem.getItem(key)).toBe(raw);});
 it('reports quota/access failure without claiming successful consumption',()=>{const original=newLife(),next=actLife(original,'district','eat',false,false)!;const mem={getItem:()=>JSON.stringify(original),setItem:()=>{throw Error('quota');}};expect(storeLife(mem,'life',next)).toBe(false);expect(original.meals).toBe(2);expect(readLife({getItem:()=>{throw Error('denied');},setItem:()=>{}},'life').save).toEqual(newLife());});
});
