import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {graphicsTier} from '../graphicsQuality.ts';
import {staticShadows} from './GraphicsDetail.ts';
/** Reflections match the bus district; old arenas reserve static key shadows for High. */
export function lightPlace(renderer:THREE.WebGLRenderer,scene:THREE.Scene,sun:THREE.DirectionalLight):void {
  const tier=graphicsTier();renderer.shadowMap.enabled=false;
  if(tier==='low')return;
  const generator=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),target=generator.fromScene(room,.04);
  scene.environment=target.texture;scene.environmentIntensity=.32;room.dispose();generator.dispose();
  if(tier==='high')staticShadows(renderer,sun,45);
  const dispose=(event:PageTransitionEvent)=>{if(event.persisted)return;scene.environment=null;target.dispose();window.removeEventListener('pagehide',dispose);};
  window.addEventListener('pagehide',dispose);
}
