import {describe,it,expect} from 'vitest';
import {advanceDistrict,decodeDistrict,storeDistrict,districtReward,districtSpawn,busSpawn,busFits,stepBus,exitPoint,insideBus,canStand,atTerminal,STATIONS,type DistrictSave,type Vehicle,type DistrictEvent} from '../src/adventure/districtModel.ts';
const initial:DistrictSave={version:1,stage:0,avatar:'female'};
function simulate(bus:Vehicle,seconds:number,throttle=1,steer=0,brake=false,hz=60,obstacles:Parameters<typeof stepBus>[5]=[]){for(let i=0;i<Math.round(seconds*hz);i++)bus=stepBus(bus,throttle,steer,brake,1/hz,obstacles);return bus;}
describe('district progression and compatibility',()=>{
  it('awards exactly five ordered goals without skipping or repeated rewards',()=>{
    let s=initial;expect(advanceDistrict(s,'board')).toBe(s);
    for(const event of ['briefing','luggage','board','arrive','arrivalBriefing'] as DistrictEvent[]){const previous=s;s=advanceDistrict(s,event);expect(s.stage).toBe(previous.stage+1);expect(advanceDistrict(s,event)).toBe(s);}
    expect(s.avatar).toBe('female');expect(districtReward(s)).toBe(100);expect(advanceDistrict(s,'briefing')).toBe(s);
  });
  it('rejects invalid, truncated and future saves',()=>{
    for(const value of [null,'{','{}',JSON.stringify({...initial,version:2}),JSON.stringify({...initial,stage:6}),JSON.stringify({...initial,stage:1.5}),JSON.stringify({...initial,avatar:'x'})])expect(decodeDistrict(value)).toBeNull();
    expect(decodeDistrict(JSON.stringify({...initial,stage:3}))).toEqual({...initial,stage:3});
  });
  it('writes only its own save and valid backup, never newer data',()=>{
    const values=new Map([['quest-old','untouched'],['district',JSON.stringify(initial)]]),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
    expect(storeDistrict(storage,'district',{...initial,stage:1})).toBe(true);expect(values.get('district.backup')).toBe(JSON.stringify(initial));expect(values.get('quest-old')).toBe('untouched');
    values.set('district','{');storeDistrict(storage,'district',{...initial,stage:2});expect(values.get('district.backup')).toBe(JSON.stringify(initial));
    values.set('district','{"version":2}');expect(storeDistrict(storage,'district',initial)).toBe(false);expect(values.get('district')).toBe('{"version":2}');
  });
  it('continues without throwing if browser storage is full',()=>{expect(storeDistrict({getItem:()=>null,setItem:()=>{throw new Error('quota');}},'district',initial)).toBe(false);});
  it.each([0,1,2,3,4,5] as const)('resumes stage %i on safe ground beside a valid bus',stage=>{const s={...initial,stage},p=districtSpawn(s),bus=busSpawn(s);expect(canStand(p.x,p.z)).toBe(true);expect(insideBus(p,bus)).toBe(false);expect(busFits(bus)).toBe(true);});
});
describe('bus controls and safety',()=>{
  const straight:Vehicle={x:0,z:0,yaw:0,speed:0,steer:0};
  it('accelerates, reverses and stops using the brake',()=>{
    const forward=simulate(straight,2);expect(forward.z).toBeGreaterThan(5);expect(forward.speed).toBeGreaterThan(5);
    const stopped=simulate(forward,1,0,0,true);expect(stopped.speed).toBe(0);expect(exitPoint(stopped,[])).not.toBeNull();
    const reverse=simulate(straight,2,-1);expect(reverse.z).toBeLessThan(-3);expect(reverse.speed).toBe(-3);expect(exitPoint(reverse,[])).toBeNull();
  });
  it('steers toward screen-right in forward gear and opposite while reversing',()=>{
    const right=simulate(straight,2,1,1);expect(right.yaw).toBeLessThan(0);expect(right.x).toBeLessThan(0);
    const reverse=simulate(straight,2,-1,1);expect(reverse.yaw).toBeGreaterThan(0);
  });
  it('gives matching travel and turn across 30/60/120Hz',()=>{
    const ref=simulate(straight,2,1,.5,false,120);for(const hz of [30,60]){const value=simulate(straight,2,1,.5,false,hz);expect(Math.hypot(value.x-ref.x,value.z-ref.z)).toBeLessThan(.001);expect(value.yaw).toBeCloseTo(ref.yaw,6);}
  });
  it('catches thin obstacles between bus corners and stops at walls',()=>{
    expect(busFits(straight,[{x:0,z:2,w:1,d:.1}])).toBe(false);
    const b=simulate(straight,5,1,0,false,30,[{x:0,z:14,w:20,d:.1}]);expect(b.z).toBeLessThan(9.1);expect(busFits(b,[{x:0,z:14,w:20,d:.1}])).toBe(true);expect(b.speed).toBe(0);
  });
  it('blocks exits while moving and finds a free alternate side',()=>{
    expect(exitPoint({...straight,speed:1},[])).toBeNull();const p=exitPoint(straight,[{x:2.5,z:1.8,w:2,d:2}]);expect(p).not.toBeNull();expect(p!.x).toBeLessThan(0);expect(insideBus(p!,straight)).toBe(false);
    expect(exitPoint(straight,[{x:0,z:0,w:30,d:30}])).toBeNull();
  });
  it('requires a stopped bus within the terminal parking bay',()=>{
    expect(atTerminal({...straight,...STATIONS.terminal})).toBe(true);expect(atTerminal({...straight,...STATIONS.terminal,speed:1})).toBe(false);expect(atTerminal(straight)).toBe(false);
  });
  it('keeps foot movement out of buildings and planters',()=>{expect(canStand(-22,0)).toBe(false);expect(canStand(0,6)).toBe(false);expect(canStand(75,0)).toBe(false);expect(canStand(-20,15)).toBe(true);});
});

import {CITY_BUILDINGS,CITY_BOUNDS,cityCanStand,cityDrive,type CityVehicle,type CityKind} from '../src/adventure/missionCity.ts';
describe('mission city layout and transport',()=>{
 it('keeps all 12 buildings separated, reachable and numbered',()=>{
  expect(CITY_BUILDINGS.map(b=>b.number)).toEqual(Array.from({length:12},(_,i)=>i+1));
  for(const b of CITY_BUILDINGS){
   expect(cityCanStand(b.door,CITY_BUILDINGS)).toBe(true);
   expect(cityCanStand(b,CITY_BUILDINGS)).toBe(false);
   for(const other of CITY_BUILDINGS)if(b!==other)expect(Math.hypot(b.x-other.x,b.z-other.z)).toBeGreaterThan(50);
  }
 });
 it.each(['motor','mobil','bus'] as CityKind[])('allows %s to accelerate, steer, reverse and brake',kind=>{
  let v:CityVehicle={kind,x:0,z:0,yaw:0,speed:0,steer:0};
  for(let i=0;i<180;i++)v=cityDrive(v,1,.15,false,1/60,[]);
  expect(v.z).toBeGreaterThan(5);expect(Math.abs(v.yaw)).toBeGreaterThan(.05);
  for(let i=0;i<180;i++)v=cityDrive(v,0,0,true,1/60,[]);
  expect(v.speed).toBe(0);
  for(let i=0;i<60;i++)v=cityDrive(v,-1,0,false,1/60,[]);
  expect(v.speed).toBeLessThan(0);
 });
 it('blocks vehicles from buildings and city edges',()=>{
  let v:CityVehicle={kind:'mobil',x:0,z:0,yaw:0,speed:10,steer:0};
  for(let i=0;i<180;i++)v=cityDrive(v,1,0,false,1/60,[{x:0,z:10,w:20,d:2}]);
  expect(v.z).toBeLessThan(7);expect(v.speed).toBe(0);
  v={...v,x:0,z:CITY_BOUNDS.maxZ-5,yaw:0,speed:10};
  for(let i=0;i<120;i++)v=cityDrive(v,1,0,false,1/60,[]);
  expect(v.z).toBeLessThan(CITY_BOUNDS.maxZ-2);expect(v.speed).toBe(0);
 });
});

import {checkGateProgress} from '../src/adventure/gateProgress.ts';
describe('mission security checkpoint',()=>{
 const levels=Array.from({length:12},(_,i)=>({number:i+1,done:false}));
 it('allows the first building but rejects every later building with unfinished predecessor',()=>{
  expect(checkGateProgress(levels,1).allowed).toBe(true);
  for(let n=2;n<=12;n++)expect(checkGateProgress(levels,n).allowed).toBe(false);
  expect(checkGateProgress(levels,13).allowed).toBe(false);
 });
 it('unlocks only after the actual previous checkpoint is complete and never mutates saves',()=>{
  const saved=levels.map(l=>({...l,done:l.number<=5}));
  const before=JSON.stringify(saved);
  expect(checkGateProgress(saved,6).allowed).toBe(true);
  expect(checkGateProgress(saved,7).allowed).toBe(false);
  expect(JSON.stringify(saved)).toBe(before);
 });
});

import {QUEUE_COUNT,QUEUE_PERIOD,queuePose,plazaName} from '../src/adventure/cityLivePlazas.ts';
describe('live plaza ambient queues',()=>{
 it('assigns unique Indonesian names to 132 queue actors',()=>{const names=new Set<string>();for(let b=1;b<=12;b++)for(let i=0;i<=QUEUE_COUNT;i++)names.add(plazaName(b,i));expect(names.size).toBe(132);});
 it('has ten visible people at rest and recycles the front and rear slots',()=>{expect(Array.from({length:11},(_,i)=>queuePose(i,0)).filter(p=>p.visible).length).toBe(10);expect(queuePose(0,5).visible).toBe(false);expect(queuePose(10,5).visible).toBe(true);expect(queuePose(10,QUEUE_PERIOD-.001).x).toBeCloseTo(queuePose(9,0).x,1);expect(queuePose(1,QUEUE_PERIOD-.001).x).toBeCloseTo(queuePose(0,0).x,1);});
});

import {joinQueue,serveQueue,queueReady} from '../src/queueTicket.ts';
describe('FIFO player tickets',()=>{it('requires all ten preceding participants to finish before service',()=>{let ticket=joinQueue(10);for(let i=0;i<10;i++){expect(queueReady(ticket)).toBe(false);ticket=serveQueue(ticket);}expect(queueReady(ticket)).toBe(true);expect(serveQueue(ticket).ahead).toBe(0);});it('leaving and joining again never preserves the old position',()=>{expect(serveQueue(joinQueue(10)).ahead).toBe(9);expect(joinQueue(10).ahead).toBe(10);expect(queueReady(null)).toBe(false);});});

import {cityRoute,CITY_ROADS} from '../src/adventure/cityNavigation.ts';
import {DISTRICT_ROADS,BUILDINGS} from '../src/adventure/districtModel.ts';
describe('city map navigation',()=>{it('uses connected street layout to reach every mission entrance',()=>{for(const building of CITY_BUILDINGS){const path=cityRoute({x:-8,z:17.8},building.door,[...DISTRICT_ROADS,...CITY_ROADS],[...BUILDINGS,...CITY_BUILDINGS]);expect(path.length).toBeGreaterThan(2);expect(path.at(-1)).toEqual(building.door);}});it('does not route through a solid building',()=>{const wall={x:0,z:0,w:20,d:20},p=cityRoute({x:-20,z:0},{x:20,z:0},[],[wall]);expect(p.length).toBeGreaterThan(2);for(const q of p)expect(Math.abs(q.x)>=10||Math.abs(q.z)>=10).toBe(true);});});

import {validStars,awardStar} from '../src/adventure/cityStars.ts';
import {guardQueuePhase} from '../src/adventure/cityLivePlazas.ts';
describe('city building stars',()=>{const levels=Array.from({length:12},(_,i)=>({number:i+1,done:i<3}));it('never grants a star without a completed checkpoint',()=>{expect(awardStar([],levels,4).awarded).toBe(false);expect(validStars([1,1,2,12,13,'3'],levels)).toEqual([1,2]);});it('awards one unique star per completed level and caps at 12',()=>{const all=levels.map(l=>({...l,done:true}));let stars:number[]=[];for(let i=1;i<=12;i++)stars=awardStar(stars,all,i).stars;expect(stars.length).toBe(12);expect(awardStar(stars,all,12).awarded).toBe(false);});it('checks each NPC before admitting it and reserves player turn',()=>{expect(guardQueuePhase(0)).toBe('check');expect(guardQueuePhase(2)).toBe('allow');expect(guardQueuePhase(5)).toBe('wait');expect(guardQueuePhase(0,true)).toBe('player');});});

import {validExampleCode,isExampleMode,exampleKey} from '../src/adventure/exampleAccess.ts';
describe('public CONTOH practice access',()=>{it('accepts only the intended practice code, ignoring case and spaces',()=>{expect(validExampleCode(' CONTOH ')).toBe(true);expect(validExampleCode('contoh')).toBe(true);expect(validExampleCode('')).toBe(false);expect(validExampleCode('magic')).toBe(false);});it('separates sample saves and does not enable demo from normal paid board',()=>{expect(isExampleMode('?board=contoh')).toBe(true);expect(isExampleMode('?contoh=1&play=miqat')).toBe(true);expect(isExampleMode('?board=magic')).toBe(false);expect(exampleKey('stars',true)).toBe('contoh:stars');expect(exampleKey('contoh:stars',true)).toBe('contoh:stars');expect(exampleKey('stars',false)).toBe('stars');});});

import {doorwayPoint,slidingDoorOffset,directFieldChapter} from '../src/adventure/cityMissionEntry.ts';
describe('direct building entry',()=>{it('walks inward through the correct face of all twelve buildings',()=>{for(const b of CITY_BUILDINGS){const outside=doorwayPoint(b,11.5),inside=doorwayPoint(b,8.35);expect(Math.hypot(outside.x-b.x,outside.z-b.z)).toBeCloseTo(11.5);expect(Math.hypot(inside.x-b.x,inside.z-b.z)).toBeCloseTo(8.35);}});it('slides the two panels clear of the entrance',()=>{expect(slidingDoorOffset(0)).toBe(.9);expect(slidingDoorOffset(1)).toBeCloseTo(2.75);});it('resolves field missions without using the setup or launch cover',()=>{for(const id of ['ihram','arafah','muzdalifah','aqabah','ifadah','mina','wada'])expect(directFieldChapter('./hajj-adventure.html?campaign=hajj&chapter='+id)?.id).toBe(id);expect(directFieldChapter('./index.html?play=miqat')).toBeNull();expect(directFieldChapter('https://elsewhere.invalid/hajj-adventure.html?campaign=hajj&chapter=ihram')).toBeNull();});});

import {cityArenaHref,QUDUM_ENTRY} from '../src/adventure/arenaDoor.ts';
describe('independent city arena routes',()=>{it('opens Qudum courtyard without the previous lesson and Sa’i directly in the gallery',()=>{expect(cityArenaHref(2,'./hajj-adventure.html')).toContain('arrival=1');expect(cityArenaHref(3,'./index.html?sai=1')).toBe('./sai-adventure.html?approach=complete');expect(QUDUM_ENTRY).toEqual([13,25]);for(let n=4;n<=12;n++)expect(cityArenaHref(n,'./manasik.html')).toBe('./manasik.html');});});

import {SOUVENIR_BUILDING,SOUVENIR_NUMBER,canOpenSouvenir} from '../src/adventure/citySouvenir.ts';
describe('souvenir building separate from twelve mission levels',()=>{it('has a walkable entrance and an independent route without changing level count',()=>{expect(CITY_BUILDINGS).toHaveLength(12);expect(SOUVENIR_NUMBER).toBe(13);const solids=[...BUILDINGS,...CITY_BUILDINGS,SOUVENIR_BUILDING];expect(cityCanStand(SOUVENIR_BUILDING.door,solids)).toBe(true);expect(cityRoute({x:-8,z:17.8},SOUVENIR_BUILDING.door,[...DISTRICT_ROADS,...CITY_ROADS],solids).at(-1)).toEqual(SOUVENIR_BUILDING.door);});it('requires all twelve distinct stars and completion, with no paid reward in example mode',()=>{const all=Array.from({length:12},(_,i)=>i+1);expect(canOpenSouvenir(true,all)).toBe(true);expect(canOpenSouvenir(false,all)).toBe(false);expect(canOpenSouvenir(true,Array(12).fill(1))).toBe(false);expect(canOpenSouvenir(true,all,true)).toBe(false);expect(canOpenSouvenir(true,all,false,true)).toBe(false);});});

import {celebrationGuests,CELEBRATION_FLAGS} from '../src/adventure/citySouvenir.ts';
describe('souvenir victory plaza',()=>{it('keeps a clear red-carpet passage between crowd groups',()=>{const guests=celebrationGuests();expect(guests).toHaveLength(32);expect(guests.filter(g=>g.role==='press')).toHaveLength(6);expect(guests.every(g=>Math.abs(g.x)>=4.2&&g.z>=17)).toBe(true);expect(new Set(guests.map(g=>g.x+':'+g.z)).size).toBe(32);expect(CELEBRATION_FLAGS).toHaveLength(4);});});

import {CITY_LAYOUT,DISTRICT_HQ,DISTRICT_SHOPS,SOUVENIR_POSITION} from '../src/adventure/cityLayout.ts';
import {CITY_BOUNDS,CITY_ROADS,cityRoute} from '../src/adventure/cityNavigation.ts';
import {DISTRICT_SOLIDS} from '../src/adventure/districtModel.ts';
describe('compact member city',()=>{
 const places=CITY_LAYOUT.map(([x,z,yaw])=>({x,z,w:20,d:20,door:{x:x+Math.sin(yaw)*10.9,z:z+Math.cos(yaw)*10.9}}));
 const gift={...SOUVENIR_POSITION,w:20,d:20,door:{x:SOUVENIR_POSITION.x,z:SOUVENIR_POSITION.z+10.9}};
 const solids=[...DISTRICT_SOLIDS,...places,gift,DISTRICT_HQ,...DISTRICT_SHOPS,{x:-8,z:11.7,w:10.2,d:.65}];
 const roads=[...DISTRICT_ROADS,...CITY_ROADS];
 const overlap=(a:{x:number;z:number;w:number;d:number},b:{x:number;z:number;w:number;d:number})=>Math.abs(a.x-b.x)<(a.w+b.w)/2-1e-7&&Math.abs(a.z-b.z)<(a.d+b.d)/2-1e-7;
 it('fits all buildings in a map under 51% of the former area without footprint collisions',()=>{
  expect((CITY_BOUNDS.maxX-CITY_BOUNDS.minX)*(CITY_BOUNDS.maxZ-CITY_BOUNDS.minZ)).toBeLessThan(300*256*.51);
  for(const a of [...places,gift,DISTRICT_HQ,...DISTRICT_SHOPS]){
   expect(a.x-a.w/2).toBeGreaterThan(CITY_BOUNDS.minX);expect(a.x+a.w/2).toBeLessThan(CITY_BOUNDS.maxX);
   expect(a.z-a.d/2).toBeGreaterThan(CITY_BOUNDS.minZ);expect(a.z+a.d/2).toBeLessThan(CITY_BOUNDS.maxZ);
   expect(solids.filter(b=>a!==b&&overlap(a,b))).toEqual([]);
   expect(roads.filter(b=>overlap(a,b))).toEqual([]);
  }
 });
 it('provides walking routes from the board to every level and from each level to the next',()=>{
  const destinations=[...places,gift];
  for(const [i,p] of destinations.entries()){
   const start=i===0?{x:-8,z:17.8}:destinations[i-1]!.door;
   const path=cityRoute(start,p.door,roads,solids);
   expect(path.length).toBeGreaterThan(1);expect(path[0]).toEqual(start);expect(path.at(-1)).toEqual(p.door);
   const fromBoard=cityRoute({x:-8,z:17.8},p.door,roads,solids);expect(fromBoard.length).toBeGreaterThan(1);
  }
 });
 it('uses the direct walking route when no solid blocks it',()=>{
  expect(cityRoute(places[0]!.door,places[1]!.door,roads,solids)).toEqual([places[0]!.door,places[1]!.door]);
 });
});
