import {describe,it,expect} from 'vitest';
import {DistrictLocomotion,DistrictCameraPresentation,wheelTravel,BUS_WHEEL_RADIUS} from '../src/adventure/districtPresentation.ts';
import {CLIPS,CLIP_OFFSETS} from '../src/characters/AnimationBank.ts';
import {Clip} from '../src/sim/States.ts';

describe('district animation presentation',()=>{
  it('crossfades walk and idle without changing stride when stopped',()=>{
    const motion=new DistrictLocomotion(),idle=motion.pose.f0;
    motion.update(.08,1/60,true);expect(motion.moving).toBe(true);expect(motion.pose.blend).toBe(1);expect(motion.pose.frameB).toBe(idle);
    motion.update(.08,.1,true);expect(motion.pose.blend).toBeGreaterThan(0);
    motion.update(.08,.1,true);expect(motion.pose.blend).toBe(0);const phase=motion.phase;
    motion.update(0,1/60,true);expect(motion.moving).toBe(false);expect(motion.pose.blend).toBe(1);
    motion.update(0,.2,true);expect(motion.pose.blend).toBe(0);expect(motion.phase).toBe(phase);
  });
  it('freezes the exact pose on menus/portrait/hidden tabs and resets on disembark',()=>{
    const motion=new DistrictLocomotion();motion.update(.12,.016,true);const before={...motion.pose},phase=motion.phase;
    motion.update(0,2,false);motion.update(2,0,true);expect(motion.pose).toEqual(before);expect(motion.phase).toBe(phase);
    motion.reset();expect(motion.moving).toBe(false);expect(motion.pose.blend).toBe(0);expect(motion.pose.f0).toBe(CLIP_OFFSETS[Clip.IDLE]);
  });
  it('keeps rapid start/stop and long walks inside packed clip boundaries',()=>{
    const motion=new DistrictLocomotion();
    for(let i=0;i<500;i++){
      motion.update(i%3?3:0,.016,true);const p=motion.pose,clip=motion.moving?Clip.WALK:Clip.IDLE;
      for(const frame of [p.f0,p.f1]){expect(frame).toBeGreaterThanOrEqual(CLIP_OFFSETS[clip]);expect(frame).toBeLessThan(CLIP_OFFSETS[clip]+CLIPS[clip].frames);}
      expect(p.frameB).toBeGreaterThanOrEqual(0);expect(p.frameB).toBeLessThan(CLIP_OFFSETS[Clip.WALK]+CLIPS[Clip.WALK].frames);
      expect(p.blend).toBeGreaterThanOrEqual(0);expect(p.blend).toBeLessThanOrEqual(1);expect(motion.phase).toBeLessThan(1);
    }
  });
  it('uses actual distance for identical stride at 30/60/120 Hz',()=>{
    const phases=[30,60,120].map(hz=>{const motion=new DistrictLocomotion();for(let i=0;i<hz*2;i++)motion.update(2.8/hz,1/hz,true);return motion.phase;});
    expect(phases[0]).toBeCloseTo(phases[2],10);expect(phases[1]).toBeCloseTo(phases[2],10);
  });
});

describe('district camera mode presentation',()=>{
  it('blends framing, focus and the short yaw arc, and settles exactly',()=>{
    const camera=new DistrictCameraPresentation();camera.update({x:1,z:2},Math.PI-.1,0);camera.transition(true);
    camera.update({x:4,z:5},-Math.PI+.1,.325);
    expect(camera.framing.distance).toBeCloseTo(10.15);expect(camera.focus.x).toBeCloseTo(2.5);expect(Math.abs(camera.focus.yaw-Math.PI)).toBeLessThan(.001);
    camera.update({x:4,z:5},-Math.PI+.1,.325);expect(camera.framing.distance).toBe(13.5);expect(camera.focus.x).toBe(4);expect(camera.focus.z).toBe(5);
  });
  it('pauses transitions, supports quick board/exit, and cuts checkpoint teleports',()=>{
    const camera=new DistrictCameraPresentation();camera.update({x:0,z:0},0,0);camera.transition(true);camera.update({x:3,z:4},1,.2);
    const before={...camera.focus},frame={...camera.framing};camera.update({x:3,z:4},1,0);expect(camera.focus).toEqual(before);expect(camera.framing).toEqual(frame);
    camera.transition(false);camera.update({x:2,z:3},.8,0);expect(camera.focus).toEqual(before);expect(camera.framing).toEqual(frame);
    camera.transition(false,true);camera.update({x:50,z:-30},2,0);expect(camera.focus.x).toBe(50);expect(camera.focus.z).toBe(-30);expect(camera.framing.distance).toBe(6.8);
  });
  it('has matching mode progress across 30/60/120 Hz',()=>{
    const values=[30,60,120].map(hz=>{const camera=new DistrictCameraPresentation();camera.update({x:0,z:0},0,0);camera.transition(true);for(let i=0;i<hz/2;i++)camera.update({x:3,z:4},1,1/hz);return camera;});
    for(const camera of values){expect(camera.focus.x).toBeCloseTo(values[0].focus.x,10);expect(camera.framing.distance).toBeCloseTo(values[0].framing.distance,10);}
  });
});

describe('bus wheel presentation',()=>{
  const bus={x:0,z:0,yaw:0,speed:0,steer:0};
  it('rolls with resolved forward/reverse travel and stays still at a blocked or parked pose',()=>{
    expect(wheelTravel(bus,{...bus,z:BUS_WHEEL_RADIUS})).toBeCloseTo(1);expect(wheelTravel(bus,{...bus,z:-BUS_WHEEL_RADIUS})).toBeCloseTo(-1);
    expect(wheelTravel(bus,{...bus,speed:8,steer:.4})).toBe(0);
  });
  it('tracks travel after turning and across the yaw wrap',()=>{
    expect(wheelTravel({...bus,yaw:Math.PI/2},{...bus,x:BUS_WHEEL_RADIUS,yaw:Math.PI/2})).toBeCloseTo(1);
    expect(wheelTravel({...bus,yaw:Math.PI-.1},{...bus,z:-BUS_WHEEL_RADIUS,yaw:-Math.PI+.1})).toBeCloseTo(1);
  });
});

import {stepQueueWalk} from '../src/adventure/queueWalk.ts';
describe('automatic queue walking',()=>{it('follows small slot movements continuously and uses walking frames without keyboard input',()=>{let p={x:0,z:0};const motion=new DistrictLocomotion();for(let i=1;i<=120;i++){const next=stepQueueWalk(p,{x:i*.004,z:0},1/60);expect(next.travel).toBeGreaterThan(0);p=next;motion.update(next.travel,1/60,true,.76);}expect(p.x).toBeCloseTo(.48,8);expect(motion.moving).toBe(true);expect(motion.phase).toBeCloseTo(.48/.76,8);expect(motion.pose.f0).toBeGreaterThanOrEqual(CLIP_OFFSETS[Clip.WALK]);const idle=stepQueueWalk(p,p,1/60);motion.update(idle.travel,1/60,true,.76);expect(motion.moving).toBe(false);});it('moves without teleporting or overshooting a slot',()=>{const next=stepQueueWalk({x:0,z:0},{x:2,z:0},.1);expect(next.x).toBeCloseTo(.28);expect(next.arrived).toBe(false);expect(stepQueueWalk({x:0,z:0},{x:.01,z:0},.1).arrived).toBe(true);});});
