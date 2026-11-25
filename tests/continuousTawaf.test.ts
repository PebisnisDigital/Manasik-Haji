import {describe,it,expect,vi,afterEach} from 'vitest';
import {decodeTawafTour,readTawafTour,storeTawafTour,tawafTourKey,readTawafRoute,storeTawafRoute,orbitTracker,stepOrbit,nextOrbitSegment,tawafPoint,TAWAF_RADIUS,TAWAF_BOUNDS,TAWAF_PLACES,TAWAF_EXTRA_SOLIDS} from '../src/continuousTawafModel.ts';
import {MIQAT_OBSTACLES} from '../src/miqatLessonModel.ts';
import {ARRIVAL_SOLIDS} from '../src/arrivalJourneyModel.ts';
import {safePosition,walkPath} from '../src/coreWalk.ts';
import {loadCampaign} from '../src/adventure/campaignProgress.ts';
class Memory{map=new Map<string,string>();getItem(k:string){return this.map.get(k)??null;}setItem(k:string,v:string){this.map.set(k,v);}removeItem(k:string){this.map.delete(k);}}
const KEY='manasik-tawaf-quest-v1';
function setup(){const m=new Memory();vi.stubGlobal('localStorage',m);vi.stubGlobal('location',{search:'?campaign=hajj&chapter=miqat'});for(const chapter of ['miqat','arrival'])m.setItem('manasik-hajj-'+chapter+'-v1',JSON.stringify({version:1,id:'keep-'+chapter,program:'hajj',avatar:'male',name:'A',step:1}));return m;}
function circle(t=orbitTracker(0),laps=1,reverse=false){const base=t.gates*Math.PI/4;for(let i=0;i<=laps*700;i++){const a=base+(reverse?-1:1)*i/700*2*Math.PI;t=stepOrbit(t,{x:TAWAF_RADIUS*Math.cos(a),z:64-TAWAF_RADIUS*Math.sin(a)});}return t;}
afterEach(()=>vi.unstubAllGlobals());
describe('connected Tawaf, ordered route and shared old saves',()=>{
 it('validates tour states and requires Level 2 before activation',()=>{const m=setup();for(const s of [{version:2,active:true,poi:0,started:false},{version:1,active:true,poi:1,started:true},{version:1,active:false,poi:3,started:false}])expect(decodeTawafTour(JSON.stringify(s))).toBeNull();m.removeItem('manasik-hajj-arrival-v1');expect(storeTawafTour('male',{version:1,active:true,poi:0,started:false})).toBe(false);});
 it('saves four physical discoveries in order and keeps separate character tours',()=>{setup();expect(storeTawafTour('male',{version:1,active:true,poi:2,started:false})).toBe(false);for(let poi=0;poi<=4;poi++)expect(storeTawafTour('male',{version:1,active:true,poi,started:false})).toBe(true);expect(storeTawafTour('male',{version:1,active:true,poi:4,started:true})).toBe(true);expect(storeTawafTour('male',{version:1,active:true,poi:3,started:false})).toBe(false);expect(readTawafTour('female').active).toBe(false);});
 it.each(['','.backup'])('protects future tour and route snapshots at %s',suffix=>{const m=setup(),future=JSON.stringify({version:4,payload:'keep'});for(const key of [tawafTourKey('male'),KEY])m.setItem(key+suffix,future);expect(storeTawafTour('male',{version:1,active:true,poi:0,started:false})).toBe(false);expect(storeTawafRoute({version:1,stage:1,count:0,gate:0})).toBe(false);expect(m.getItem(KEY+suffix)).toBe(future);});
 it('reads an old partial lap without rewriting it and never rolls it back',()=>{const m=setup(),old=JSON.stringify({version:1,stage:1,laps:3,gate:5});m.setItem(KEY,old);expect(readTawafRoute()).toMatchObject({count:3,gate:5});expect(m.getItem(KEY)).toBe(old);expect(storeTawafRoute({version:1,stage:1,count:0,gate:0})).toBe(false);expect(storeTawafRoute({version:1,stage:1,count:3,gate:6})).toBe(true);expect(storeTawafRoute({version:1,stage:1,count:4,gate:0})).toBe(false);});
 it('requires every sector, seven complete laps, then the guide report; reward is derived once',()=>{const m=setup();m.setItem('manasik-sai-quest-v1','keep-sai');expect(storeTawafRoute({version:1,stage:1,count:0,gate:0})).toBe(true);for(let gates=1;gates<=56;gates++)expect(storeTawafRoute({version:1,stage:gates===56?2:1,count:Math.floor(gates/8),gate:gates===56?0:gates%8})).toBe(true);expect(loadCampaign().chapters[2].done).toBe(false);expect(storeTawafRoute({version:1,stage:3,count:7,gate:0})).toBe(true);const raw=m.getItem(KEY),reward=loadCampaign().reward;expect(loadCampaign().chapters[2].done).toBe(true);expect(storeTawafRoute({version:1,stage:3,count:7,gate:0})).toBe(true);expect(m.getItem(KEY)).toBe(raw);expect(loadCampaign().reward).toBe(reward);expect(m.getItem('manasik-sai-quest-v1')).toBe('keep-sai');});
 it('counts seven real anticlockwise circuits, caps at seven and resumes an old partial checkpoint',()=>{expect(circle(orbitTracker(0),7).gates).toBe(56);expect(circle(orbitTracker(0),8).gates).toBe(56);expect(circle(orbitTracker(19),1).gates).toBe(27);});
 it('does not count standing, clockwise walking or repeatedly crossing only the start line',()=>{let t=orbitTracker(0);for(let i=0;i<100;i++)t=stepOrbit(t,tawafPoint(0));expect(t.gates).toBe(0);expect(circle(orbitTracker(0),2,true).gates).toBe(0);t=orbitTracker(0);for(let i=0;i<5000;i++){const a=Math.sin(i*.02)*.06;t=stepOrbit(t,{x:TAWAF_RADIUS*Math.cos(a),z:64-TAWAF_RADIUS*Math.sin(a)});}expect(t.gates).toBe(0);});
 it('rejects teleporting and shortcuts outside the route until the last accepted checkpoint is reached',()=>{let t=stepOrbit(orbitTracker(0),tawafPoint(0));t=stepOrbit(t,tawafPoint(1));expect(t.gates).toBe(0);expect(t.recover).toBe(true);t=stepOrbit(t,{x:0,z:64});expect(t.recover).toBe(true);t=stepOrbit(t,tawafPoint(0));t=stepOrbit(t,tawafPoint(0));expect(t.recover).toBe(false);expect(circle(t).gates).toBe(8);});
 it('resumes assistance ahead of manual movement while retaining the next required sector',()=>{const t=orbitTracker(8);expect(nextOrbitSegment({...t,sweep:8*Math.PI/4+.5})).toBe(35);expect(nextOrbitSegment({...t,sweep:8*Math.PI/4+1.2})).toBe(36);expect(nextOrbitSegment({...t,sweep:7*Math.PI/4})).toBe(33);});
 it('preserves corrupt data on read, recovers a valid backup and reports quota failures',()=>{const m=setup();m.setItem(KEY,'{');expect(storeTawafRoute({version:1,stage:1,count:0,gate:0})).toBe(false);m.setItem(KEY+'.backup',JSON.stringify({version:1,stage:1,laps:1,gate:2}));expect(readTawafRoute()).toMatchObject({count:1,gate:2});expect(m.getItem(KEY)).toBe('{');m.setItem=()=>{throw Error('quota');};expect(storeTawafRoute({version:1,stage:1,count:1,gate:3})).toBe(false);});
 it('keeps all exploration points reachable and the assisted full ring outside Ka’bah, Hijr, Maqam and Zamzam solids',()=>{const obs=[...MIQAT_OBSTACLES,...ARRIVAL_SOLIDS,...TAWAF_EXTRA_SOLIDS];let from:[number,number]=[19,64];for(const p of [...TAWAF_PLACES,tawafPoint(0)]){const path=walkPath(from,[p.x,p.z],obs,TAWAF_BOUNDS);expect(path.length).toBeGreaterThan(0);expect(path.every(([x,z])=>safePosition(x,z,obs,TAWAF_BOUNDS))).toBe(true);from=path.at(-1)!;}let tracker=stepOrbit(orbitTracker(0),tawafPoint(0));for(let part=1;part<=32;part++){const a=tawafPoint((part-1)/4),b=tawafPoint(part/4),path=walkPath([a.x,a.z],[b.x,b.z],obs,TAWAF_BOUNDS);expect(path.length,`part ${part}`).toBeGreaterThan(0);for(const [x,z]of path){expect(Math.hypot(x,z-64)).toBeGreaterThanOrEqual(27);expect(safePosition(x,z,obs,TAWAF_BOUNDS)).toBe(true);tracker=stepOrbit(tracker,{x,z});}}expect(tracker.gates).toBe(8);
 // Replan from actual approach distances, rather than ideal checkpoint centres.
 let player=tawafPoint(0),moving=stepOrbit(orbitTracker(0),player);
 for(let part=1;part<=32;part++){
  const goal=tawafPoint(part/4),path=walkPath([player.x,player.z],[goal.x,goal.z],obs,TAWAF_BOUNDS);
  for(const [x,z]of path){
   while(Math.hypot(player.x-x,player.z-z)>.18&&Math.hypot(player.x-goal.x,player.z-goal.z)>=.9){const d=Math.hypot(x-player.x,z-player.z),step=Math.min(.07,d);player={x:player.x+(x-player.x)/d*step,z:player.z+(z-player.z)/d*step};moving=stepOrbit(moving,player);expect(moving.recover).toBe(false);}
   if(Math.hypot(player.x-goal.x,player.z-goal.z)<.9)break;
  }
 }
 expect(moving.gates).toBe(8);});
});

import * as THREE from 'three';
import {KAABA,GALLERY} from '../src/config/site.ts';
import {BLACK_STONE_LOCAL,DOOR_LOCAL_Z,HARAM_LANDMARKS,CLOCK_POSITION,kaabaLocalPoint} from '../src/haramLandmarks.ts';
import {buildKaaba} from '../src/env/Kaaba.ts';
import type {EnvMaterials} from '../src/env/Materials.ts';
describe('Haram landmark geometry',()=>{
 it('puts the silver frame outside the actual east corner and exposes it to a ray from the courtyard',()=>{
  expect(BLACK_STONE_LOCAL.x).toBeGreaterThan(KAABA.lengthNE/2);
  expect(BLACK_STONE_LOCAL.z).toBeGreaterThan(KAABA.lengthNW/2);
  const m=new THREE.MeshStandardMaterial(),mats=new Proxy({},{get:()=>m}) as EnvMaterials;
  const g=buildKaaba(mats);g.updateMatrixWorld(true);
  const stone=g.getObjectByName('hajar-aswad')!;
  const at=stone.getWorldPosition(new THREE.Vector3());
  const ray=new THREE.Raycaster(new THREE.Vector3(at.x+8,at.y,at.z),new THREE.Vector3(-1,0,0));
  const hits=ray.intersectObject(g,true);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits[0]!.object.parent).toBe(stone);
  g.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});m.dispose();
 });
 it('anchors the four discovery targets to the same rendered geometry without changing checkpoints',()=>{
  expect(HARAM_LANDMARKS.map(l=>l.id)).toEqual(['hajar','door','multazam','maqam','hijr','mizab','yamani','kiswah']);
  for(const p of TAWAF_PLACES){const l=HARAM_LANDMARKS.find(l=>l.id===p.id)!;expect(p.look[0]).toBeCloseTo(l.at.x);expect(p.look[2]).toBeCloseTo(l.at.z+64);}
  expect(DOOR_LOCAL_Z).toBeGreaterThan(0);
  const east=kaabaLocalPoint(BLACK_STONE_LOCAL.x,BLACK_STONE_LOCAL.y,BLACK_STONE_LOCAL.z);
  expect(east.x).toBeGreaterThan(8);
  expect(Math.hypot(CLOCK_POSITION.x,CLOCK_POSITION.z-64)).toBeGreaterThan(GALLERY.outerWallRadius);
 });
});

import {tawafDiscoveryNear,tawafDiscoveryAction} from '../src/continuousTawafModel.ts';
describe('Qudum landmark interactions match the visible objects',()=>{
 it('accepts a walkable position close to the real Maqam rather than requiring its old marker',()=>{
  const m=HARAM_LANDMARKS.find(l=>l.id==='maqam')!,p=TAWAF_PLACES[1],obs=[...ARRIVAL_SOLIDS,...TAWAF_EXTRA_SOLIDS];
  const pos={x:m.at.x+3.5,z:m.at.z+64};
  expect(Math.hypot(pos.x-p.x,pos.z-p.z)).toBeGreaterThan(1.15);
  expect(safePosition(pos.x,pos.z,obs,TAWAF_BOUNDS)).toBe(true);
  expect(tawafDiscoveryNear(1,pos)).toBe(true);
  expect(tawafDiscoveryAction(1,pos)).toBe('Kenali Maqam Ibrahim');
 });
 it('accepts accessible points within each rendered landmark zone and preserves old approach markers',()=>{
  const obs=[...ARRIVAL_SOLIDS,...TAWAF_EXTRA_SOLIDS];
  for(const [i,p] of TAWAF_PLACES.entries()){
   const l=HARAM_LANDMARKS.find(l=>l.id===p.id)!;
   let count=0;
   for(let x=-35;x<=35;x++)for(let z=28;z<=96;z++){
    if(safePosition(x,z,obs,TAWAF_BOUNDS)&&Math.hypot(x-l.at.x,z-l.at.z-64)<=l.near&&Math.hypot(x-p.x,z-p.z)>1.15){expect(tawafDiscoveryNear(i,{x,z})).toBe(true);count++;}
   }
   expect(count,p.id).toBeGreaterThan(0);
   expect(tawafDiscoveryNear(i,p)).toBe(true);
   expect(tawafDiscoveryAction(i,{x:35,z:0})).toBe('Dekati '+l.name);
   expect(tawafDiscoveryNear(i,{x:35,z:0})).toBe(false);
  }
 });
 it('does not accept an invalid position or nonexistent discovery',()=>{expect(tawafDiscoveryNear(4,{x:23,z:64})).toBe(false);expect(tawafDiscoveryNear(1,{x:NaN,z:51})).toBe(false);});
});
