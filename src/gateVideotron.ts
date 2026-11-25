import * as THREE from 'three';
import {CSS3DObject,CSS3DRenderer} from 'three/addons/renderers/CSS3DRenderer.js';
import {GATE_VIDEOTRON as V,youtubeGateEmbed} from './gateVideotronModel.ts';
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
 let iframe:HTMLIFrameElement|null=null,w=0,h=0;
 function unload(){iframe?.remove();iframe=null;css.domElement.hidden=true;}
 function resize(){w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);css.setSize(w,h);}
 function draw(camera:THREE.PerspectiveCamera,enabled:boolean){
  if(!host.isConnected){unload();return;}
  if(!enabled||document.hidden||camera.position.z<=V.z+.05){unload();return;}
  if(!w||!h)resize();
  for(let i=0;i<corners.length;i++){
   view.copy(corners[i]!).applyMatrix4(camera.matrixWorldInverse);
   if(view.z>=-camera.near){unload();return;}
   projected[i]!.copy(corners[i]!).project(camera);
  }
  const x0=Math.min(...projected.map(p=>p.x)),x1=Math.max(...projected.map(p=>p.x)),y0=Math.min(...projected.map(p=>p.y)),y1=Math.max(...projected.map(p=>p.y));
  const area=(x1-x0)*(y1-y0),visible=Math.max(0,Math.min(1,x1)-Math.max(-1,x0))*Math.max(0,Math.min(1,y1)-Math.max(-1,y0));
  // Do not autoplay when the video is offscreen or mostly obscured by the viewport.
  if(!Number.isFinite(area)||area<=0||visible/area<.5){unload();return;}
  if(!iframe){
   iframe=document.createElement('iframe');iframe.title='Videotron HAJJI.DIGITAL — YouTube';
   iframe.width=String(V.iframeWidth);iframe.height=String(V.iframeHeight);
   iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.referrerPolicy='strict-origin-when-cross-origin';
   iframe.style.cssText='display:block;width:100%;height:100%;border:0;pointer-events:auto;';
   iframe.src=youtubeGateEmbed();panel.append(iframe);
  }
  css.domElement.hidden=false;css.render(scene,camera);
 }
 const hide=()=>{if(document.hidden)unload();};document.addEventListener('visibilitychange',hide);
 const dispose=()=>{document.removeEventListener('visibilitychange',hide);unload();css.domElement.remove();};window.addEventListener('pagehide',event=>{if(event.persisted)unload();else dispose();});
 resize();unload();return {draw,resize,dispose};
}
