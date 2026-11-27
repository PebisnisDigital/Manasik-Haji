import {describe,it,expect,vi,afterEach} from 'vitest';import {mergeRun,playerKey,guestKey,type CloudRun} from '../src/playerCloud.ts';
const row:CloudRun={user_id:'u1',scope:'direct',run_id:'abc-123',program:'umrah',avatar:'male',name:'Test',step:1,checkpoint:4,completed_at:null};
describe('account cloud',()=>{it('keeps highest checkpoint within same stage',()=>{expect(mergeRun(row,{...row,checkpoint:1}).checkpoint).toBe(4);expect(mergeRun(row,{...row,checkpoint:7}).checkpoint).toBe(7);});it('never rolls back a completed stage',()=>{expect(mergeRun({...row,step:2,checkpoint:0},row).step).toBe(2);});it('blocks cross-account and run merges',()=>{expect(()=>mergeRun(row,{...row,user_id:'u2'})).toThrow();expect(()=>mergeRun(row,{...row,run_id:'other'})).toThrow();});it('partitions account and guest storage',()=>{expect(playerKey('training','u1')).not.toBe(playerKey('training','u2'));expect(playerKey('training','')).toBe(guestKey('training'));});});
import {bindTicket,ticketKey,captureTicketProgress,syncTicketProgress,clearTicketOwner} from '../src/ticketProgress.ts';
import {readField} from '../src/adventure/campaignProgress.ts';
import {fieldChapter} from '../src/adventure/hajjCampaign.ts';
import {readStars} from '../src/adventure/cityStars.ts';
class TicketMemory {
 private map=new Map<string,string>();
 get length(){return this.map.size;}
 key(i:number){return [...this.map.keys()][i]??null;}
 getItem(k:string){return this.map.get(k)??null;}
 setItem(k:string,v:string){this.map.set(k,v);}
 removeItem(k:string){this.map.delete(k);}
 clear(){this.map.clear();}
}
const memberA='HJ-123456789ABC',memberB='HJ-ABCDEF123456',miqat='manasik-hajj-miqat-v1',stars='manasik-city-stars-v1';
const chapter=fieldChapter('miqat')!;
const completed=JSON.stringify({version:1,id:'test-miqat',program:'hajj',avatar:'male',name:'Ahmad Test',step:1});
const legacyStory=JSON.stringify({version:1,name:'Ahmad Test',briefed:true,arrivals:['hajj:miqat']});
const rank=()=>{const done=readField(chapter)?.step===1;return done?13+readStars([{number:1,done}]).length:0;};
function ticketEnvironment(){const local=new TicketMemory();vi.stubGlobal('localStorage',local);vi.stubGlobal('sessionStorage',new TicketMemory());vi.stubGlobal('location',{search:'?board=magic',pathname:'/district.html'});return local;}
afterEach(()=>vi.unstubAllGlobals());
describe('paid member journey recovery',()=>{
 it('preserves a legacy completed Miqat and star for the matching registered member',()=>{
  const local=ticketEnvironment();local.setItem(miqat,completed);local.setItem(stars,'[1]');local.setItem('manasik-travel-story-v1',legacyStory);
  bindTicket(memberA,'Ahmad Test','hajj');expect(rank()).toBe(14);expect(local.getItem(miqat)).toBe(completed);
  expect(captureTicketProgress()[miqat]).toBe(completed);expect(captureTicketProgress()[stars]).toBe('[1]');
  bindTicket(memberB,'Other Player','hajj');expect(rank()).toBe(0);
  bindTicket(memberA,'Ahmad Test','hajj');expect(rank()).toBe(14);
 });
 it('restores completion and star after opening the same ticket on fresh storage',async()=>{
  ticketEnvironment();bindTicket(memberA,'Ahmad Test','hajj');
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({progress:{rank:14,snapshot:{[miqat]:completed,[stars]:'[1]'}}})})));
  await syncTicketProgress(rank);expect(rank()).toBe(14);expect(readField(chapter)?.step).toBe(1);
 });
 it('does not import a different member or replay save and refuses a lower cloud snapshot',async()=>{
  const local=ticketEnvironment();local.setItem(miqat,completed);local.setItem('manasik-travel-story-v1',legacyStory);local.setItem(stars,'[1]');
  bindTicket(memberB,'Other Player','hajj');expect(rank()).toBe(0);
  bindTicket(memberA,'Ahmad Test','hajj');local.setItem(ticketKey(miqat)+':replay:abc123456','{}');
  expect(Object.keys(captureTicketProgress()).some(k=>k.includes('replay'))).toBe(false);
  const fetchMock=vi.fn(async(_url:string,options:RequestInit)=>{const data=JSON.parse(String(options.body));return {ok:true,json:async()=>({progress:data.rank?{rank:data.rank,snapshot:data.snapshot}:{rank:13,snapshot:{[miqat]:completed}}})};});
  vi.stubGlobal('fetch',fetchMock);await syncTicketProgress(rank);expect(rank()).toBe(14);expect(fetchMock).toHaveBeenCalledTimes(2);clearTicketOwner();
 });
});
