import * as THREE from 'three';
import {CSS3DObject,CSS3DRenderer} from 'three/addons/renderers/CSS3DRenderer.js';
import {GATE_VIDEOTRON as V} from './gateVideotronModel.ts';
import {journeyVolume} from './frontSettings.ts';

// Public Dropbox direct media URL. Keep native playback independent of the scene renderer.
const VIDEO_URL='https://www.dropbox.com/scl/fi/yzak3q9d2f3kexkpol1li/YTDown.com_YouTube_Media_dPh-wxExciE_BACAAN-TALBIYAH-HAJI-DAN-UMRAH_001_1080p.mp4?rlkey=vzq192g392p7rutypcmntt2kq&raw=1';
export function mountGateVideotron(host:HTMLElement,canvas:HTMLCanvasElement){
 const css=new CSS3DRenderer(),scene=new THREE.Scene();
 css.domElement.className='gateVideotronLayer';css.domElement.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;visibility:hidden;';
 canvas.after(css.domElement);
 const panel=document.createElement('div');panel.style.cssText='width:640px;height:360px;background:#111b1b;pointer-events:none;';
 const object=new CSS3DObject(panel);panel.style.pointerEvents='none';object.position.set(V.x,V.y,V.z);object.scale.setScalar(V.width/V.iframeWidth);scene.add(object);
 const video=document.createElement('video');
 video.id='gateVideotronVideo';video.title='Videotron HAJJI.DIGITAL — Bacaan talbiyah';
 video.loop=true;video.autoplay=true;video.playsInline=true;video.controls=false;video.disablePictureInPicture=true;
 video.preload='auto';video.volume=.75*journeyVolume();
 video.style.cssText='display:block;width:100%;height:100%;object-fit:contain;background:#111b1b;pointer-events:none;';
 panel.append(video);video.src=VIDEO_URL;
 let disposed=false,suspended=false,attempt=0,w=0,h=0;
 function start(withAudio=false){
  if(disposed||suspended)return;
  if(withAudio)video.muted=false;
  const token=++attempt;
  void video.play().catch(()=>{
   if(disposed||suspended||token!==attempt||video.muted)return;
   // Browsers may require a gesture before allowing audible playback.
   video.muted=true;void video.play().catch(()=>{});
  });
 }
 function interaction(e:Event){if(!e.isTrusted||disposed||suspended)return;if(video.muted||video.paused)start(true);}
 function resume(){if(!document.hidden&&video.paused&&!suspended)start();}
 function volume(){video.volume=.75*journeyVolume();}
 document.addEventListener('click',interaction,true);
 document.addEventListener('pointerup',interaction,true);
 document.addEventListener('keydown',interaction,true);
 document.addEventListener('visibilitychange',resume);
 window.addEventListener('focus',resume);
 window.addEventListener('umroh-comfort-change',volume);
 const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y])=>new THREE.Vector3(V.x+x!*V.width/2,V.y+y!*V.height/2,V.z));
 const projected=corners.map(()=>new THREE.Vector3()),view=new THREE.Vector3();
 function resize(){w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);css.setSize(w,h);}
 function hideSurface(){css.domElement.style.visibility='hidden';}
 function draw(camera:THREE.PerspectiveCamera,enabled:boolean){
  if(disposed)return;if(!host.isConnected){dispose();return;}
  // Only the visual surface is culled. The video and audio stay alive regardless of orientation or tab focus.
  if(!enabled||document.hidden||camera.position.z<=V.z+.05){hideSurface();return;}
  if(!w||!h)resize();
  for(let i=0;i<corners.length;i++){
   view.copy(corners[i]!).applyMatrix4(camera.matrixWorldInverse);
   if(view.z>=-camera.near){hideSurface();return;}
   projected[i]!.copy(corners[i]!).project(camera);
  }
  const x0=Math.min(...projected.map(p=>p.x)),x1=Math.max(...projected.map(p=>p.x)),y0=Math.min(...projected.map(p=>p.y)),y1=Math.max(...projected.map(p=>p.y));
  if(x1<=-1||x0>=1||y1<=-1||y0>=1){hideSurface();return;}
  css.render(scene,camera);css.domElement.style.visibility='visible';
 }
 function pageHide(e:PageTransitionEvent){if(e.persisted){suspended=true;attempt++;video.pause();}else dispose();}
 function pageShow(){suspended=false;resume();}
 function dispose(){
  if(disposed)return;disposed=true;attempt++;video.pause();video.removeAttribute('src');video.load();
  document.removeEventListener('click',interaction,true);document.removeEventListener('pointerup',interaction,true);document.removeEventListener('keydown',interaction,true);
  document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);window.removeEventListener('umroh-comfort-change',volume);
  window.removeEventListener('pagehide',pageHide);window.removeEventListener('pageshow',pageShow);css.domElement.remove();
 }
 window.addEventListener('pagehide',pageHide);window.addEventListener('pageshow',pageShow);
 // CSS3DRenderer attaches objects on render; mount the panel now so media can load before first view.
 css.domElement.append(panel);
 resize();start();return {draw,resize,dispose};
}
