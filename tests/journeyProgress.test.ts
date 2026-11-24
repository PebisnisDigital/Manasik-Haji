import {describe,it,expect} from 'vitest';
import {journeyProgress,type JourneyRecords} from '../src/adventure/journeyProgress.ts';
const blank:JourneyRecords={district:null,errands:null,tawaf:null,sai:null,tahallul:null};
const route=(stage:number,count=7,gate=0)=>({version:1 as const,stage,count,gate});
const district={version:1 as const,stage:5 as const,avatar:'female' as const};
describe('derived campaign journey',()=>{
  it('starts new players in the district without locking the direct Tawaf entry',()=>{const s=journeyProgress(blank);expect(s.next.href).toBe('./district.html');expect(s.done).toBe(0);expect(s.stops.map(x=>x.available)).toEqual([true,true,false,false]);});
  it('resumes a partial district checkpoint',()=>{expect(journeyProgress({...blank,district:{...district,stage:2}}).next.label).toMatch(/checkpoint kawasan/);});
  it('moves from the finished district to Tawaf while optional errands stay optional',()=>{const s=journeyProgress({...blank,district,errands:{version:1,stage:0,escortGate:0}});expect(s.next.href).toBe('./tawaf-adventure.html');expect(s.done).toBe(1);expect(s.bonusDone).toBe(0);});
  it('preserves active legacy Tawaf progress without forcing a district replay',()=>{const s=journeyProgress({...blank,tawaf:route(1,3,4)});expect(s.next.href).toBe('./tawaf-adventure.html');expect(s.stops[1].detail).toContain('3/7');});
  it('requires the guide after seven laps before unlocking Sai',()=>{const s=journeyProgress({...blank,tawaf:route(2)});expect(s.stops[2].available).toBe(false);expect(s.stops[1].detail).toMatch(/pembimbing/);expect(s.next.href).toBe('./tawaf-adventure.html');});
  it('resumes Sai and Tahallul for old users who have no district save',()=>{
    expect(journeyProgress({...blank,tawaf:route(3)}).next.href).toBe('./sai-adventure.html');
    expect(journeyProgress({...blank,tawaf:route(3),sai:route(3)}).next.href).toBe('./tahallul-adventure.html');
  });
  it('does not unlock a stray Sai or Tahallul record without prerequisite completion',()=>{const s=journeyProgress({...blank,sai:route(3),tahallul:{version:1,stage:4,avatar:'female',method:'trim',cuts:3}});expect(s.stops[2].available).toBe(false);expect(s.stops[3].available).toBe(false);expect(s.done).toBe(0);});
  it.each([1,3] as const)('continues an explicitly active optional activity %i',stage=>{const s=journeyProgress({...blank,district,errands:{version:1,stage,escortGate:stage===1?1:3},tawaf:route(3)});expect(s.next.href).toBe('./district.html');expect(s.next.label).toMatch(stage===1?/Hasan/:/paket/);});
  it('recognizes the complete playable route, with optional help reported separately',()=>{
    const records:JourneyRecords={...blank,district,tawaf:route(3),sai:route(3),tahallul:{version:1,stage:4,avatar:'female',method:'trim',cuts:3}};
    let s=journeyProgress(records);expect(s.complete).toBe(true);expect(s.done).toBe(4);expect(s.bonusDone).toBe(0);expect(s.next.href).toBe('./district.html');
    s=journeyProgress({...records,errands:{version:1,stage:4,escortGate:3}});expect(s.bonusDone).toBe(2);expect(s.next.label).toMatch(/ulang/);
  });
  it('reads and returns a view without changing original records',()=>{const r:JourneyRecords={...blank,district,errands:{version:1,stage:3,escortGate:3},tawaf:route(1,4,2)};const before=JSON.stringify(r);journeyProgress(r);expect(JSON.stringify(r)).toBe(before);});
});
