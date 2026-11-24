import {describe,it,expect} from 'vitest';
import {NEW_ERRANDS,ESCORT_PATH,ERRAND_STATIONS,advanceErrand,decodeErrands,storeErrands,errandReward,errandSpawn,companionSpawn,stepCompanion,routeCue,TERMINAL_ROUTE,walkingRoute,walkSegmentClear,type ErrandSave} from '../src/adventure/districtActivities.ts';
import {canStand,busSpawn} from '../src/adventure/districtModel.ts';
const bus=busSpawn({version:1,stage:5,avatar:'male'});
describe('optional district activities',()=>{
  it('requires companion arrival and parcel pickup, deriving rewards only once',()=>{
    let s:ErrandSave={...NEW_ERRANDS};expect(advanceErrand(s,'deliverParcel')).toBe(s);s=advanceErrand(s,'acceptEscort');expect(advanceErrand(s,'finishEscort')).toBe(s);
    s={...s,escortGate:3};s=advanceErrand(s,'finishEscort');expect(errandReward(s)).toBe(30);expect(advanceErrand(s,'finishEscort')).toBe(s);s=advanceErrand(s,'takeParcel');expect(errandReward(s)).toBe(30);s=advanceErrand(s,'deliverParcel');expect(errandReward(s)).toBe(70);expect(advanceErrand(s,'deliverParcel')).toBe(s);
  });
  it('rejects malformed, impossible or future progress',()=>{
    for(const raw of [null,'{','{}',JSON.stringify({version:2,stage:1,escortGate:0}),JSON.stringify({version:1,stage:3,escortGate:0}),JSON.stringify({version:1,stage:0,escortGate:1}),JSON.stringify({version:1,stage:1,escortGate:4})])expect(decodeErrands(raw)).toBeNull();
    expect(decodeErrands(JSON.stringify({version:1,stage:1,escortGate:2}))).toEqual({version:1,stage:1,escortGate:2});
  });
  it('preserves main saves, a valid backup and a newer errand version',()=>{
    const map=new Map([['main','old-main'],['bonus',JSON.stringify(NEW_ERRANDS)]]),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}};
    storeErrands(storage,'bonus',{version:1,stage:1,escortGate:1});expect(map.get('main')).toBe('old-main');expect(map.get('bonus.backup')).toBe(JSON.stringify(NEW_ERRANDS));
    map.set('bonus','{');storeErrands(storage,'bonus',{version:1,stage:1,escortGate:2});expect(map.get('bonus.backup')).toBe(JSON.stringify(NEW_ERRANDS));map.set('bonus','{"version":9}');expect(storeErrands(storage,'bonus',NEW_ERRANDS)).toBe(false);expect(map.get('bonus')).toBe('{"version":9}');
    expect(storeErrands({getItem:()=>null,setItem:()=>{throw Error('quota');}},'bonus',NEW_ERRANDS)).toBe(false);
  });
  it('waits for distant players with hysteresis and waits for vehicles',()=>{
    const n=companionSpawn(NEW_ERRANDS),far={x:n.x,z:n.z+8};let out=stepCompanion(n,far,.1,false,bus);expect(out.waiting).toBe('distance');expect(out.z).toBe(n.z);
    out=stepCompanion(out,{x:n.x,z:n.z+6.5},.1,false,bus);expect(out.waiting).toBe('distance');out=stepCompanion(out,{x:n.x,z:n.z+5},.1,false,bus);expect(out.waiting).toBeNull();expect(out.z).toBeGreaterThan(n.z);
    const stopped=stepCompanion(out,out,.1,true,bus);expect(stopped.waiting).toBe('vehicle');expect(stopped.z).toBe(out.z);
  });
  it('does not walk through a bus obstructing the crossing',()=>{const n=companionSpawn(NEW_ERRANDS),out=stepCompanion(n,n,.1,false,{...bus,x:n.x,z:n.z+3});expect(out.waiting).toBe('bus');expect(out.z).toBe(n.z);});
  it('walks the complete authored path safely, checkpoint by checkpoint',()=>{
    let n=companionSpawn(NEW_ERRANDS);for(let i=0;i<900&&n.gate<3;i++){const next=stepCompanion(n,n,1/60,false,bus);expect(canStand(next.x,next.z)).toBe(true);expect(next.gate-n.gate).toBeLessThanOrEqual(1);n=next;}
    expect(n.gate).toBe(3);expect(n.z).toBe(ESCORT_PATH[3].z);
    for(const escortGate of [0,1,2,3] as const){const point=errandSpawn({version:1,stage:1,escortGate})!;expect(canStand(point.x,point.z)).toBe(true);}expect(errandSpawn({version:1,stage:3,escortGate:3})).not.toBeNull();expect(errandSpawn(NEW_ERRANDS)).toBeNull();
  });
});
describe('district navigation',()=>{
  it('guides from the south road around the corner, detects detours and parking',()=>{
    expect(routeCue({...bus,x:-4,z:24,yaw:Math.PI/2}).text).toMatch(/Terus/);
    expect(routeCue({...bus,x:32,z:20,yaw:Math.PI/2}).text).toMatch(/kiri/);
    expect(routeCue({...bus,x:-50,z:40}).offRoute).toBe(true);expect(routeCue({...bus,x:38,z:-10}).text).toMatch(/Parkir/);
    expect(TERMINAL_ROUTE.every(p=>canStand(p.x,p.z,[],.1))).toBe(true);
  });
  it('routes around the hotel and centre rather than through walls',()=>{
    for(const [a,b]of [[ERRAND_STATIONS.shelter,ERRAND_STATIONS.rizal],[ERRAND_STATIONS.rizal,ERRAND_STATIONS.delivery],[{x:31,z:-6},ERRAND_STATIONS.rizal],[ERRAND_STATIONS.delivery,ERRAND_STATIONS.hasan]]){
      const path=walkingRoute(a,b);expect(path.length).toBeGreaterThanOrEqual(2);if(a===ERRAND_STATIONS.shelter)expect(path.length).toBeGreaterThan(2);expect(path[0]).toEqual(a);expect(path.at(-1)).toEqual(b);for(let i=0;i<path.length-1;i++)expect(walkSegmentClear(path[i],path[i+1])).toBe(true);
    }
  });
  it('returns direct paths when clear and rejects destinations inside buildings',()=>{expect(walkingRoute({x:-20,z:15},{x:-14,z:19})).toHaveLength(2);expect(walkingRoute({x:-20,z:15},{x:-22,z:0})).toEqual([]);});
});
