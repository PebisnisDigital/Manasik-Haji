import {afterEach,describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {cameraMove,stickVector} from '../src/adventure/adventureControls.ts';
import {ThirdPersonCamera} from '../src/adventure/thirdPersonCamera.ts';
import {decodeRoute,decodeTahallul,loadProgress,storeProgress,QUEST_KEYS,chapterSummary,routeReward,npcWaiting} from '../src/adventure/questProgress.ts';
afterEach(()=>vi.unstubAllGlobals());
const route=(kind:'tawaf'|'sai',stage=1,count=0,gate=0)=>JSON.stringify({version:1,stage,[kind==='tawaf'?'laps':'legs']:count,gate});
function storage(){const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)});return values;}
describe('adventure controls and camera',()=>{
  it('right input moves screen-right for every camera heading, without faster diagonals',()=>{
    for(const yaw of [0,Math.PI/2,Math.PI,4.9]){
      const camera=new THREE.PerspectiveCamera();camera.position.set(-Math.sin(yaw)*8,4,-Math.cos(yaw)*8);camera.lookAt(0,1.6,0);camera.updateMatrixWorld();
      const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),move=cameraMove(0,1,yaw);
      expect(new THREE.Vector3(move.x,0,move.z).dot(right)).toBeCloseTo(1,6);
      expect(Math.hypot(...Object.values(cameraMove(1,1,yaw)))).toBeCloseTo(1);
    }
  });
  it('touch drift is ignored and diagonals retain analog range',()=>{
    expect(stickVector(.05,.05)).toEqual({x:0,y:0});
    expect(Math.hypot(...Object.values(stickVector(1,1)))).toBeCloseTo(1);
    const half=stickVector(.5,0);expect(half.x).toBeGreaterThan(.3);expect(half.x).toBeLessThan(.5);expect(half.y).toBe(0);
  });
  it('camera settles equivalently at 30 and 144 Hz and resets after a respawn',()=>{
    const sample=(fps:number)=>{const cam=new THREE.PerspectiveCamera(),rig=new ThirdPersonCamera(cam);rig.update(0,0,0,0);for(let i=0;i<fps;i++)rig.update(4,2,.7,1/fps);return {cam,rig};};
    const a=sample(30),b=sample(144);expect(a.cam.position.distanceTo(b.cam.position)).toBeLessThan(.000001);
    a.rig.reset();a.rig.update(80,0,0,0);expect(a.cam.position.x).toBeGreaterThan(79);
    a.rig.orbitPitch(1e6);expect(a.rig.pitch).toBe(.65);a.rig.orbitPitch(-1e6);expect(a.rig.pitch).toBe(.08);
  });
  it('camera avoids an occluder on initial framing and after a smoothed orbit',()=>{
    const wall=new THREE.Box3(new THREE.Vector3(-20,0,-3),new THREE.Vector3(20,20,-2));
    const cam=new THREE.PerspectiveCamera(),rig=new ThirdPersonCamera(cam,[wall]);rig.update(0,0,Math.PI,0);
    for(let i=0;i<80;i++){rig.update(0,0,0,1/60);expect(cam.position.z).toBeGreaterThan(-1.8);expect(wall.containsPoint(cam.position)).toBe(false);}
  });
});
describe('compatible checkpoints and campaign rewards',()=>{
  it.each(['tawaf','sai'] as const)('retains shipped %s saves and every completed sub-checkpoint',kind=>{
    const field=kind==='tawaf'?'laps':'legs',gates=kind==='tawaf'?8:5;
    for(let count=0;count<7;count++)for(let gate=0;gate<gates;gate++){
      const value=decodeRoute(route(kind,1,count,gate),kind)!;expect(value).toMatchObject({stage:1,count,gate});
      expect(decodeRoute(JSON.stringify({version:1,stage:1,[field]:count}),kind)?.gate).toBe(0);
    }
    expect(decodeRoute(route(kind,1,7),kind)?.stage).toBe(2);
  });
  it('refuses corrupt, impossible and future records',()=>{
    for(const raw of ['{',route('tawaf',3,2),route('tawaf',0,4),route('tawaf',1,2,8),route('sai',1,2,5),'{"version":2,"stage":1,"laps":2}'])expect(decodeRoute(raw,'tawaf')).toBeNull();
    expect(decodeRoute(route('sai',1,2,5),'sai')).toBeNull();
    expect(decodeTahallul(JSON.stringify({version:1,stage:4,avatar:'male',method:'trim',cuts:0}))).toBeNull();
  });
  it.each(['male','female'] as const)('preserves %s tahallul progress and a finished demonstration',avatar=>{
    const value={version:1,stage:2,avatar,method:'trim',cuts:3};expect(decodeTahallul(JSON.stringify(value))).toEqual({...value,stage:3});
  });
  it('recovers a valid previous checkpoint without backing up corrupt data',()=>{
    const values=storage(),key=QUEST_KEYS.tawaf,decode=(raw:string|null)=>decodeRoute(raw,'tawaf');
    values.set(key,route('tawaf',1,2,4));expect(storeProgress(key,{version:1,stage:1,laps:2,gate:5})).toBe(true);
    expect(loadProgress(key,decode)?.gate).toBe(5);values.set(key,'{truncated');
    expect(loadProgress(key,decode)?.gate).toBe(4);
    expect(storeProgress(key,{version:1,stage:1,laps:2,gate:6})).toBe(true);
    expect(values.get(key+'.backup')).toBe(route('tawaf',1,2,4));
  });
  it('reports storage failures and leaves the existing checkpoint intact',()=>{
    const existing=route('tawaf',1,5,2);vi.stubGlobal('localStorage',{getItem:()=>existing,setItem:()=>{throw Error('quota');}});
    expect(storeProgress(QUEST_KEYS.tawaf,{version:1,stage:3,laps:7})).toBe(false);
    expect(loadProgress(QUEST_KEYS.tawaf,raw=>decodeRoute(raw,'tawaf'))?.count).toBe(5);
  });
  it('does not overwrite a save created by a future release',()=>{
    const values=storage(),key=QUEST_KEYS.tawaf,future='{"version":2,"stage":1,"laps":3}';values.set(key,future);
    expect(storeProgress(key,{version:1,stage:0,laps:0})).toBe(false);expect(values.get(key)).toBe(future);
  });
  it('unlocks chapters in order and derives stable rewards on replay/reload',()=>{
    const t=decodeRoute(route('tawaf',3,7),'tawaf'),s=decodeRoute(route('sai',3,7),'sai');
    const h=decodeTahallul(JSON.stringify({version:1,stage:4,cuts:3,avatar:'female',method:'trim'}));
    expect(chapterSummary(null,s,h)).toMatchObject({done:0,reward:0});expect(chapterSummary(t,null,h)).toMatchObject({done:1,reward:110});
    expect(chapterSummary(t,s,h)).toMatchObject({done:3,reward:260});expect(routeReward(1,5)).toBe(60);
    expect(chapterSummary(decodeRoute(route('tawaf',3,7),'tawaf'),s,h).reward).toBe(260);
  });
  it('NPCs resume only outside the hysteresis radius',()=>{
    expect(npcWaiting(1.4,false)).toBe(true);expect(npcWaiting(1.8,true)).toBe(true);expect(npcWaiting(2.2,true)).toBe(false);expect(npcWaiting(1.8,false)).toBe(false);
  });
});
