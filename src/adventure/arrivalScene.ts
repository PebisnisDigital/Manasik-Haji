import * as THREE from 'three';
import {Environment} from '../env/Environment.ts';
import {attachWalker,type WalkOptions} from '../coreWalk.ts';
import {graphicsTier,createRenderBudget} from '../graphicsQuality.ts';
import {CrowdRenderer} from '../characters/CrowdRenderer.ts';
import {resolveFrames} from '../characters/CrowdView.ts';
import {Clip} from '../sim/States.ts';

export const ARRIVAL_GOALS=[
 {x:25,z:10,title:'Temui rombongan',body:'Dekati pembimbing di pelataran. Tetap bersama rombongan dan jaga ruang untuk jemaah lain.',action:'Temui pembimbing'},
 {x:24,z:2,title:'Kenali Ka’bah',body:'Amati Ka’bah dari pelataran. Titik-titik perjalanan ini membantu navigasi permainan dan belum menghitung putaran tawaf.',action:'Amati Ka’bah'},
 {x:19,z:0,title:'Temukan titik awal',body:'Tawaf dimulai sejajar Hajar Aswad dengan Ka’bah di sebelah kiri. Level berikutnya mengajakmu berlatih tujuh putaran.',action:'Tandai titik awal'},
] as const;

/** Reuses the shipped Haram assets and the shared desktop/touch third-person controller. */
export function mountArrival(host:HTMLElement,checkpoint:number,options:WalkOptions){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Pelataran Ka’bah — ikuti penanda rombongan');host.replaceChildren(canvas);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:graphicsTier()!=='low',powerPreference:'low-power'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1,.1,500);
 const environment=new Environment(renderer,scene,graphicsTier());scene.add(environment.group);
 const budget=createRenderBudget(renderer,{maxFps:30});
 const goal=ARRIVAL_GOALS[Math.min(checkpoint,2)],previous=ARRIVAL_GOALS[Math.max(0,checkpoint-1)];
 const walker=attachWalker(scene,camera,canvas,host,{...options,lifeKind:'arrival'},[15,32,-5,22],[{x:0,z:0,w:24,d:24}],checkpoint?[previous.x,previous.z]:[28,17],[goal.x,goal.z]);
 const people=new CrowdRenderer(4,{lod0Budget:4,lod1Budget:4,lod0Distance:35,lod1Distance:35,blobShadows:true},{robeLength:options.avatar==='male'?.19:.065,coverHead:options.avatar==='female',pilgrimStyle:options.avatar});scene.add(people.group);
 const frame={f0:0,f1:0,frac:0};let raf=0,disposed=false;
 const observer=new ResizeObserver(()=>{const rect=host.getBoundingClientRect();budget.resize(rect.width,rect.height);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();});observer.observe(host);
 function tick(now:number){if(disposed)return;raf=requestAnimationFrame(tick);if(budget.lost())return;walker.update(now);if(document.hidden||options.blocked())return;
  resolveFrames(Clip.IDLE,now/3000%1,frame);people.beginFrame();
  for(let i=0;i<4;i++){const point=ARRIVAL_GOALS[Math.min(i,2)];people.submit(0,point.x+(i===3?2:1.6),0,point.z+.4,Math.PI,1.7,1,frame.f0,frame.f1,frame.frac,frame.f0,0,0,1);}people.endFrame();budget.draw(now,scene,camera);
 }
 raf=requestAnimationFrame(tick);
 return {near:walker.near,approach:walker.approach,setGoal(index:number){const p=ARRIVAL_GOALS[Math.min(index,2)];walker.setGoal(p.x,p.z);},
  dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();budget.dispose();walker.dispose();people.dispose();environment.dispose();renderer.dispose();}};
}
