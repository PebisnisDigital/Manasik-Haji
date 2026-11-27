import {describe,it,expect,vi,afterEach} from 'vitest';
import {NUSUK_LEVELS,nusukNumber,nusukCompletion} from '../src/adventure/nusukModel.ts';
import {loadNusukRoute} from '../src/adventure/nusukRoute.ts';
import {fieldChapter,fieldKey} from '../src/adventure/hajjCampaign.ts';
import {miqatCards} from '../src/adventure/miqat.ts';
import {finishIfadahAfterEarlierSai,writeCore,type CoreSave} from '../src/coreProgress.ts';
import {resolveStop} from '../src/travelStory.ts';
function setup(search=''){const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});vi.stubGlobal('location',{search,href:'https://example.test/manasik.html'+search});return data;}
afterEach(()=>vi.unstubAllGlobals());
describe('Nusuk public route and original save compatibility',()=>{
 it('follows the twelve Nusuk steps without early Umrah tahallul or a second ihram entry',()=>{expect(NUSUK_LEVELS.map(l=>l.id)).toEqual(['miqat','tawaf','sai','ihram','arafah','muzdalifah','aqabah','dam','hajj-tahallul','ifadah','mina','wada']);expect(NUSUK_LEVELS.filter(l=>l.id.includes('tahallul'))).toHaveLength(1);expect(NUSUK_LEVELS[0].description).toContain('qiran');expect(NUSUK_LEVELS[3].description).toContain('Tidak mengulang niat');expect(miqatCards(1,'male','madinah','qiran')[1].latin).toContain('hajjan wa');expect(miqatCards(1,'female','madinah')[1].latin).toContain('‘umratan');});
 it('unlocks Mina after completed initial Sai without requiring an early haircut',()=>{const data=setup();data.set('manasik-tawaf-quest-v1',JSON.stringify({version:1,stage:3,laps:7}));data.set('manasik-sai-quest-v1',JSON.stringify({version:1,stage:3,legs:7}));const before=[...data];const route=loadNusukRoute();expect(route.chapters[2].done).toBe(true);expect(route.chapters[3].available).toBe(true);expect(resolveStop('hajj:ihram')?.number).toBe(4);expect(route.chapters.some(l=>l.href.includes('tahallul-adventure'))).toBe(false);expect([...data]).toEqual(before);});
 it('separates Aqabah, dam and haircut completion without granting future stages',()=>{expect(nusukCompletion({},8,6).slice(6,9)).toEqual([false,false,false]);expect(nusukCompletion({},9,7).slice(6,9)).toEqual([true,false,false]);expect(nusukCompletion({},9,8).slice(6,9)).toEqual([true,true,false]);expect(nusukCompletion({},10,12).slice(6,9)).toEqual([true,true,true]);expect([nusukNumber('aqabah',5),nusukNumber('aqabah',7),nusukNumber('aqabah',8)]).toEqual([7,8,9]);});
 it('derives all three new Nahr milestones from old completed Aqabah without rewriting it',()=>{const data=setup(),c=fieldChapter('aqabah')!,raw=JSON.stringify({version:1,id:'old',program:'hajj',avatar:'male',name:'Old',step:10});data.set(fieldKey(c),raw);const before=[...data];expect(loadNusukRoute().chapters.slice(6,9).every(l=>l.done)).toBe(true);expect([...data]).toEqual(before);});
 it('never offers the dam or haircut card before the Aqabah route is actually complete',()=>{const data=setup();data.set('manasik-hajj-aqabah-v1',JSON.stringify({version:1,id:'q',program:'hajj',avatar:'female',name:'QA',step:8}));expect(loadNusukRoute().chapters.slice(7,9).every(l=>!l.available)).toBe(true);});
 it('finishes Ifadah using earlier Sai, without inventing another seven-leg checkpoint',()=>{const data=setup('?campaign=hajj&chapter=ifadah'),j:CoreSave={version:1,id:'q',program:'hajj',avatar:'male',name:'QA',step:11};expect(writeCore(j)).toBe(true);expect(finishIfadahAfterEarlierSai(j)).toBeNull();data.set('manasik-sai-quest-v1',JSON.stringify({version:1,stage:3,legs:7}));const oldCheckpoint=JSON.stringify({id:'q',step:10,count:7});data.set('manasik-hajj-ifadah-checkpoint-v1',oldCheckpoint);expect(finishIfadahAfterEarlierSai(j)?.step).toBe(12);expect(data.get('manasik-hajj-ifadah-checkpoint-v1')).toBe(oldCheckpoint);expect(finishIfadahAfterEarlierSai(j)).toBeNull();});
 it.each(['','.backup'])('protects a future Ifadah save at %s when using earlier Sai',suffix=>{const data=setup('?campaign=hajj&chapter=ifadah'),j:CoreSave={version:1,id:'q',program:'hajj',avatar:'female',name:'QA',step:11};writeCore(j);data.set('manasik-sai-quest-v1',JSON.stringify({version:1,stage:3,legs:7}));const k='manasik-hajj-ifadah-v1'+suffix,raw=JSON.stringify({...j,version:2,keep:true});data.set(k,raw);expect(finishIfadahAfterEarlierSai(j)).toBeNull();expect(data.get(k)).toBe(raw);});
});

import {replayKey,activeReplay,endReplay} from '../src/adventure/levelReplay.ts';
import {directMissionEntry} from '../src/adventure/cityMissionEntry.ts';
import {awardStar} from '../src/adventure/cityStars.ts';
import {readAqabah} from '../src/adventure/aqabahModel.ts';
describe('completed Hajj level replay preserves the original journey',()=>{
 const replay={number:1,id:'replay-test-123'};
 it('isolates only selected chapter checkpoints and keeps stars and prerequisites intact',()=>{
  const chapters=['miqat','arrival','', 'ihram','arafah','muzdalifah','aqabah','aqabah','aqabah','ifadah','mina','wada'];
  for(let i=0;i<12;i++){const r={...replay,number:i+1};const key=chapters[i]?'manasik-hajj-'+chapters[i]+'-v1':'manasik-sai-quest-v1';expect(replayKey(key,key,r)).toBe(key+':replay:'+r.id);expect(replayKey('manasik-city-stars-v1','manasik-city-stars-v1',r)).toBe('manasik-city-stars-v1');}
  expect(replayKey('manasik-tawaf-quest-v1','manasik-tawaf-quest-v1',{...replay,number:2})).toContain(':replay:');
  expect(replayKey('manasik-tawaf-quest-v1','manasik-tawaf-quest-v1',{...replay,number:3})).toBe('manasik-tawaf-quest-v1');
  expect(replayKey('manasik-sai-quest-v1','manasik-sai-quest-v1',{...replay,number:10})).toBe('manasik-sai-quest-v1');
 });
 it('uses the replay namespace in an arena but never in district or ordinary landing',()=>{
  const session=new Map([['hajji-level-replay-v1',JSON.stringify(replay)]]);vi.stubGlobal('sessionStorage',{getItem:(k:string)=>session.get(k)??null,removeItem:(k:string)=>session.delete(k)});
  for(const path of ['/district.html','/adventure-map.html','/oleh-oleh.html','/index.html']){vi.stubGlobal('location',{pathname:path,search:''});expect(activeReplay()).toBeNull();}
  vi.stubGlobal('location',{pathname:'/index.html',search:'?play=miqat'});expect(activeReplay()).toEqual(replay);endReplay();expect(activeReplay()).toBeNull();
 });
 it.each([4,7,8,9,10,11,12])('creates a separate playable field save for completed level %s',number=>{
  const data=setup(),r={...replay,number},chapter=fieldChapter(number===4?'ihram':number>=7&&number<=9?'aqabah':number===10?'ifadah':number===11?'mina':'wada')!;
  vi.stubGlobal('location',{pathname:'/district.html',search:'?board=magic',href:'https://example.test/district.html?board=magic',origin:'https://example.test'});
  const key=fieldKey(chapter),original=JSON.stringify({version:1,id:'old-completed',program:'hajj',avatar:'male',name:'QA',step:chapter.end});
  data.set(key,original);
  const href=directMissionEntry('./hajj-adventure.html?campaign=hajj&chapter='+chapter.id,'male','QA',r);
  expect(href).toBeTruthy();const fresh=JSON.parse(data.get(replayKey(key,key,r))!);expect(fresh.id).not.toBe('old-completed');expect(fresh.step).toBe(number===8||number===9?9:chapter.start);expect(data.get(key)).toBe(original);
  if(number===9)expect(readAqabah(fresh.id,7,true).beat).toBe(8);
 });
 it('never awards a second star or awards an unfinished level',()=>{
  const levels=[{number:1,done:true},{number:2,done:false}];
  expect(awardStar([1],levels,1)).toEqual({stars:[1],awarded:false});
  expect(awardStar([1],levels,2)).toEqual({stars:[1],awarded:false});
 });
});
