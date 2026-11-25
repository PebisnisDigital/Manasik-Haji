import * as THREE from 'three';
import {CSS3DObject,CSS3DRenderer} from 'three/addons/renderers/CSS3DRenderer.js';
import {GATE_VIDEOTRON as V,youtubeGateEmbed} from './gateVideotronModel.ts';
type YouTubePlayer={mute():void;unMute():void;playVideo():void;pauseVideo():void;destroy():void;isMuted():boolean};
type YouTubeApi={Player:new (frame:HTMLIFrameElement,config:{events:{onReady:(e:{target:YouTubePlayer})=>void;onAutoplayBlocked:()=>void;onStateChange:(e:{target:YouTubePlayer;data:number})=>void;onError:()=>void}})=>YouTubePlayer};
const ytWindow=window as Window&{YT?:YouTubeApi;onYouTubeIframeAPIReady?:()=>void};
let apiPromise:Promise<YouTubeApi>|undefined;
function loadYouTubeApi(){
 if(ytWindow.YT?.Player)return Promise.resolve(ytWindow.YT);
 return apiPromise??=new Promise<YouTubeApi>((resolve,reject)=>{
  const prior=ytWindow.onYouTubeIframeAPIReady;
  ytWindow.onYouTubeIframeAPIReady=()=>{prior?.();if(ytWindow.YT?.Player)resolve(ytWindow.YT);else reject(Error('YouTube API unavailable'));};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>reject(Error('YouTube API failed'));document.head.append(script);
 });
}
/** Official iframe, spatially anchored to the facade. Never attempt to copy cross-origin video pixels. */
export function mountGateVideotron(host:HTMLElement,canvas:HTMLCanvasElement){
 const css=new CSS3DRenderer(),scene=new THREE.Scene();
 css.domElement.className='gateVideotronLayer';css.domElement.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;';
 // Insert immediately above the game canvas, below the shade, HUD and modal.
 canvas.after(css.domElement);
 const panel=document.createElement('div');panel.style.cssText='width:640px;height:360px;background:#111b1b;pointer-events:none;';
 const object=new CSS3DObject(panel);object.position.set(V.x,V.y,V.z);object.scale.setScalar(V.width/V.iframeWidth);scene.add(object);
 const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y])=>new THREE.Vector3(V.x+x!*V.width/2,V.y+y!*V.height/2,V.z));
 const projected=corners.map(()=>new THREE.Vector3()),view=new THREE.Vector3();
 let iframe:HTMLIFrameElement|null=null,w=0,h=0,player:YouTubePlayer|null=null;
 let ready=false,retryAudio=true,mutedFallback=false,visible=false,disposed=false;
 // A single iframe survives camera changes. Visibility controls playback, not the lifetime of the player.
 function resumeAudio(){if(!visible||!player||!ready||!retryAudio||document.hidden)return;mutedFallback=false;try{player.unMute();player.playVideo();}catch{retryAudio=true;}}
 document.addEventListener('click',resumeAudio,true);
 document.addEventListener('pointerup',resumeAudio,true);
 document.addEventListener('keydown',resumeAudio,true);
 function playVisible(){if(!visible||!ready||!player||document.hidden)return;if(retryAudio)resumeAudio();else try{player.playVideo();}catch{}}
 function hide(){if(!visible)return;visible=false;try{if(ready)player?.pauseVideo();}catch{}css.domElement.hidden=true;}
 function unload(){hide();const old=player;player=null;ready=false;retryAudio=true;mutedFallback=false;const frame=iframe;iframe=null;try{old?.destroy();}catch{}frame?.remove();css.domElement.hidden=true;}
 function connect(frame:HTMLIFrameElement){void loadYouTubeApi().then(api=>{
  if(disposed||frame!==iframe||!frame.isConnected)return;
  player=new api.Player(frame,{events:{
   onReady:({target})=>{if(frame!==iframe)return;player=target;ready=true;if(visible)playVisible();else target.pauseVideo();},
   onAutoplayBlocked:()=>{if(frame!==iframe||!player||!visible||document.hidden)return;retryAudio=true;if(!mutedFallback){mutedFallback=true;try{player.mute();player.playVideo();}catch{}}},
   onStateChange:({target,data})=>{if(frame!==iframe)return;if(data===1||data===3){if(!visible||document.hidden){try{target.pauseVideo();}catch{}return;}if(data===1)retryAudio=target.isMuted();}},
   onError:()=>{if(frame===iframe)ready=false;}
  }});
 }).catch(()=>{/* If the API fails, leave the official iframe available for manual playback. */});}
 // Prepare the official API before character selection, so audible playback can start after player interaction.
 void loadYouTubeApi().catch(()=>{});
 function resize(){w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);css.setSize(w,h);}
 function draw(camera:THREE.PerspectiveCamera,enabled:boolean){
  if(disposed)return;
  if(!host.isConnected){dispose();return;}
  if(!enabled||document.hidden||camera.position.z<=V.z+.05){hide();return;}
  if(!w||!h)resize();
  for(let i=0;i<corners.length;i++){
   view.copy(corners[i]!).applyMatrix4(camera.matrixWorldInverse);
   if(view.z>=-camera.near){hide();return;}
   projected[i]!.copy(corners[i]!).project(camera);
  }
  const x0=Math.min(...projected.map(p=>p.x)),x1=Math.max(...projected.map(p=>p.x)),y0=Math.min(...projected.map(p=>p.y)),y1=Math.max(...projected.map(p=>p.y));
  const area=(x1-x0)*(y1-y0),shown=Math.max(0,Math.min(1,x1)-Math.max(-1,x0))*Math.max(0,Math.min(1,y1)-Math.max(-1,y0));
  // Only initiate playback when sufficiently visible, per the YouTube embed requirements.
  // Keep the iframe and playback position when the player turns away.
  if(!Number.isFinite(area)||area<=0||shown/area<.5){hide();return;}
  const returning=!visible;visible=true;css.domElement.hidden=false;
  css.render(scene,camera);
  if(!iframe){
   iframe=document.createElement('iframe');iframe.title='Videotron HAJJI.DIGITAL — YouTube';
   iframe.width=String(V.iframeWidth);iframe.height=String(V.iframeHeight);
   iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.referrerPolicy='strict-origin-when-cross-origin';
   iframe.style.cssText='display:block;width:100%;height:100%;border:0;pointer-events:auto;';
   // The API starts playback only after the projected player is visible, avoiding a late autoplay race.
   const url=new URL(youtubeGateEmbed(V.videoId,location.origin));url.searchParams.set('autoplay','0');
   iframe.src=url.href;panel.append(iframe);connect(iframe);
  }else if(returning){playVisible();}
 }
 const visibilityChange=()=>{if(document.hidden)hide();};
 const pageHide=(event:PageTransitionEvent)=>{if(event.persisted)hide();else dispose();};
 const dispose=()=>{if(disposed)return;disposed=true;document.removeEventListener('visibilitychange',visibilityChange);window.removeEventListener('pagehide',pageHide);unload();document.removeEventListener('click',resumeAudio,true);document.removeEventListener('pointerup',resumeAudio,true);document.removeEventListener('keydown',resumeAudio,true);css.domElement.remove();};
 document.addEventListener('visibilitychange',visibilityChange);window.addEventListener('pagehide',pageHide);
 resize();css.domElement.hidden=true;return {draw,resize,dispose};
}
