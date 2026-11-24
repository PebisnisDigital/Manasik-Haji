import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {HAJJ_CHAPTERS,campaignContext,fieldChapter,fieldKey,chapterHref,nextChapter,type FieldChapter} from '../src/adventure/hajjCampaign.ts';
import {newCore,writeCore,readCore,commitCore,saveCheckpoint,readCheckpoint,coreUrl,coreSession,type CoreSave,type CoreStep,checkpointCap} from '../src/coreProgress.ts';
import {loadCampaign,readField} from '../src/adventure/campaignProgress.ts';
import {walkPath} from '../src/coreWalk.ts';
import {QUEST_KEYS} from '../src/adventure/questProgress.ts';
import * as cloud from '../src/playerCloud.ts';

let data:Map<string,string>;
const context=(id:string)=>vi.stubGlobal('location',{search:'?campaign=hajj&chapter='+id,href:'https://example.test/game/manasik.html',origin:'https://example.test'});
const field=(id:string)=>fieldChapter(id)!;
const save=(chapter:FieldChapter,step:CoreStep=chapter.start):CoreSave=>({...newCore('hajj','female','Petualang'),step});
beforeEach(()=>{data=new Map();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)});});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('12-chapter Hajj campaign',()=>{
 it('has twelve concrete entries, nine reusable field segments and no planned placeholder',()=>{
  expect(HAJJ_CHAPTERS).toHaveLength(12);expect(HAJJ_CHAPTERS.filter(c=>'start' in c)).toHaveLength(9);
  for(const [i,c] of HAJJ_CHAPTERS.entries()){expect(c.number).toBe(i+1);expect(chapterHref(c)).toMatch(/\.html/);expect(nextChapter(c)).toBe(HAJJ_CHAPTERS[i+1]??null);}
 });
 it('preserves old runs, checkpoints and cloud outbox when a campaign advances',()=>{
  const original=save(field('miqat'));data.set('umroh-digital-preview-hajj',JSON.stringify(original));data.set('umroh-digital-checkpoint-hajj','legacy checkpoint');
  const enqueue=vi.spyOn(cloud,'enqueueRun');context('miqat');const current=save(field('miqat'));expect(writeCore(current)).toBe(true);
  expect(commitCore(current,0)?.step).toBe(1);expect(readCore('hajj')?.id).toBe(current.id);
  expect(data.get('umroh-digital-preview-hajj')).toBe(JSON.stringify(original));expect(data.get('umroh-digital-checkpoint-hajj')).toBe('legacy checkpoint');expect(enqueue).not.toHaveBeenCalled();
 });
 it('does not fall back to original saves for malformed campaign context or wrong program',()=>{
  vi.stubGlobal('location',{search:'?campaign=hajj&chapter=unknown'});expect(campaignContext()).toBeNull();expect(writeCore(newCore('hajj','male','Demo'))).toBe(false);
  context('miqat');expect(writeCore(newCore('umrah','female','Demo'))).toBe(false);expect(readCore('umrah')).toBeNull();expect(data.size).toBe(0);
 });
 it('rejects saves outside their own segment and never grants the next chapter accidentally',()=>{
  for(const c of HAJJ_CHAPTERS){if(!('start' in c))continue;context(c.id);const s=save(c);expect(writeCore(s)).toBe(true);expect(writeCore({...s,step:(c.end+1) as CoreStep})).toBe(false);expect(readField(c)?.step).toBe(c.start);}
 });
 it('requires all three physical arrival checkpoints and isolates their counts',()=>{
  context('arrival');const j=save(field('arrival'));writeCore(j);expect(commitCore(j,0)).toBeNull();expect(saveCheckpoint(j,4)).toBe(false);
  for(let count=1;count<=3;count++){expect(saveCheckpoint(j,count)).toBe(true);expect(readCheckpoint(j)).toBe(count);if(count<3)expect(commitCore(j,0)).toBeNull();}
  expect(commitCore(j,0)?.step).toBe(1);context('miqat');const other=save(field('miqat'));writeCore(other);expect(readCheckpoint(other)).toBe(0);
 });
 it('advances every field segment in order, with both nafar choices, and stops exactly at its boundary',()=>{
  for(const early of [false,true])for(const c of HAJJ_CHAPTERS){if(!('start' in c))continue;context(c.id);let j=save(c);writeCore(j);
   while(j.step<c.end){const cap=c.id==='arrival'?3:checkpointCap(j.step);if(cap){expect(commitCore(j,j.step,early)).toBeNull();saveCheckpoint(j,cap);}const next=commitCore(j,j.step,early);expect(next).not.toBeNull();j=next!;}
   expect(j.step).toBe(c.end);expect(commitCore(j,j.step)).toBeNull();expect(readField(c)?.step).toBe(c.end);
  }
 });
 it('reuses valid backups, keeps future versions and rejects stale tabs',()=>{
  context('arafah');const c=field('arafah'),j=save(c),key=fieldKey(c);writeCore(j);const completed=commitCore(j,6)!;
  data.set(key,'{broken');expect(readCore('hajj')?.step).toBe(6);expect(writeCore(completed)).toBe(true);
  data.set(key,JSON.stringify({...completed,version:2}));expect(writeCore(j)).toBe(false);expect(JSON.parse(data.get(key)!).version).toBe(2);
  data.delete(key);data.delete(key+'.backup');writeCore(j);writeCore({...j,id:'new-session'});expect(commitCore(j,6)).toBeNull();
 });
 it('carries campaign context through all training page transitions',()=>{
  context('ifadah');const j=save(field('ifadah'));writeCore(j);const url=coreUrl(j,'sai.html');expect(url).toContain('campaign=hajj&chapter=ifadah');expect(url).toContain('core='+j.id);
  vi.stubGlobal('location',{search:new URL(url,'https://example.test/').search});expect(coreSession()?.id).toBe(j.id);
 });
 it('derives full completion and rewards without modifying old progress or writing on map reads',()=>{
  data.set(QUEST_KEYS.tawaf,JSON.stringify({version:1,stage:3,laps:7}));data.set(QUEST_KEYS.sai,JSON.stringify({version:1,stage:3,legs:7}));data.set(QUEST_KEYS.tahallul,JSON.stringify({version:1,stage:4,cuts:3,avatar:'female',method:'trim'}));
  expect(loadCampaign().done).toBe(3);expect(loadCampaign().next.id).toBe('miqat');
  for(const c of HAJJ_CHAPTERS){if('end' in c)data.set(fieldKey(c),JSON.stringify(save(c,c.end)));}
  const before=[...data];for(let i=0;i<4;i++){const p=loadCampaign();expect(p.done).toBe(12);expect(p.complete).toBe(true);expect(p.reward).toBe(710);}
  expect([...data]).toEqual(before);data.delete(fieldKey(field('arafah')));expect(loadCampaign().complete).toBe(false);expect(loadCampaign().done).toBe(11);
 });
 it('has reachable Kaaba discovery checkpoints outside the solid building',()=>{
  const goals:[[number,number],[number,number],[number,number]]=[[25,10],[24,2],[19,0]];let start:[number,number]=[28,17];
  for(const goal of goals){const path=walkPath(start,goal,[{x:0,z:0,w:24,d:24}],[15,32,-5,22]);expect(path.length).toBeGreaterThan(0);start=goal;}
 });
});
