import {afterEach,describe,it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {simpleMenuOpen,simpleSprinting,setSimpleMenu,toggleSimpleRun,setSimpleShift,clearSimpleInput} from '../src/simpleInput.ts';
import {installLife} from '../src/adventure/lifeWorld.ts';
afterEach(()=>{clearSimpleInput();setSimpleMenu(false);vi.unstubAllGlobals();});
describe('simple adventure controls',()=>{
 it('supports touch toggle and keyboard hold, and clears sprint on menu entry',()=>{expect(simpleSprinting()).toBe(false);toggleSimpleRun();expect(simpleSprinting()).toBe(true);toggleSimpleRun();setSimpleShift(true);expect(simpleSprinting()).toBe(true);setSimpleShift(false);expect(simpleSprinting()).toBe(false);toggleSimpleRun();setSimpleMenu(true);expect(simpleMenuOpen()).toBe(true);expect(simpleSprinting()).toBe(false);toggleSimpleRun();setSimpleMenu(false);expect(simpleSprinting()).toBe(false);});
 it('removes hidden fatigue penalties without deleting, rewriting or spawning old condition content',()=>{const raw='{"version":99,"oldCondition":"keep"}',data=new Map([['manasik-life-v1',raw]]),write=vi.fn();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:write});vi.stubGlobal('location',{search:'',pathname:'/player.html',href:'http://example.test/player.html'});const scene=new THREE.Scene(),life=installLife(scene,{chapter:'wada',station:{x:0,z:0},bag:{x:1,z:1},active:()=>true});life.tick(300,{x:999,z:0},true,true);expect(life.factor({x:0,z:0})).toBe(1);expect(life.canSprint()).toBe(true);expect(life.campCare('hydrate')).toBe(true);expect(scene.children).toHaveLength(0);life.dispose();expect(write).not.toHaveBeenCalled();expect(data.get('manasik-life-v1')).toBe(raw);});
});
