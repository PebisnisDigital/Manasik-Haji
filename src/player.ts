import * as THREE from 'three';
import {coreGameFor,completeCoreGame,coreUrl,type CoreGameStep} from './coreProgress.ts';
import {installLandscape} from './coreLandscape.ts';
import {tenantUrl} from './tenant.ts';
import { Environment } from './env/Environment.ts';
import { CrowdRenderer } from './characters/CrowdRenderer.ts';
import { resolveFrames } from './characters/CrowdView.ts';
import { Clip } from './sim/States.ts';
import { MATAF } from './config/site.ts';
import {guidedStage,completeStage} from './journey.ts';
import {hajjGame,completeHajj} from './hajjProgress.ts';
import {VoiceGuide} from './audio/VoiceGuide.ts';

const TAU = Math.PI * 2;
const START = MATAF.startLineBearing;
const MIN_RADIUS = 29, MAX_RADIUS = 56, START_RADIUS = 32;
const canvas = document.querySelector<HTMLCanvasElement>('#view')!;
const loading = document.querySelector<HTMLDivElement>('#loading')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const count = document.querySelector<HTMLDivElement>('#count')!;
const progress = document.querySelector<HTMLProgressElement>('#progress')!;
const autoButton = document.querySelector<HTMLButtonElement>('#auto')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const joy = document.querySelector<HTMLDivElement>('#joy')!;
const knob = document.querySelector<HTMLSpanElement>('#knob')!;
const avatar = document.querySelector<HTMLSelectElement>('#avatar')!;
const cameraMode = document.querySelector<HTMLSelectElement>('#cameraMode')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
const mapPlayer = document.querySelector<SVGGElement>('#mapPlayer')!;
const nextSai=document.querySelector<HTMLAnchorElement>('#nextSai')!;
const saiLink=document.querySelector<HTMLAnchorElement>('#saiLink')!;
const core=coreGameFor('tawaf');let coreFinished=false;let isPortrait=()=>false;
const guided=core?null:guidedStage(1);
const hajj=core?null:hajjGame('tawaf');
if(hajj){avatar.value=hajj.avatar;avatar.disabled=true;const title=document.querySelector('h1');if(title)title.textContent=hajj.stage==='wada'?'Latihan Tawaf Wada’':'Latihan Tawaf Ifadah';nextSai.textContent='Kembali ke perjalanan haji →';saiLink.textContent='Perjalanan haji';}
if(guided){avatar.value=guided.avatar;avatar.disabled=true;nextSai.textContent='Lanjut ke salat & zamzam →';}
function updateSaiLink():void{if(core){nextSai.href=coreUrl(core);return;}saiLink.href='./sai.html?avatar='+encodeURIComponent(avatar.value);if(hajj)saiLink.href='./hajj.html';nextSai.href=hajj?'./hajj.html':guided?'./umrah.html':saiLink.href;}
if(core){document.documentElement.classList.add('corePlay');avatar.value=core.avatar;avatar.disabled=true;nextSai.href=coreUrl(core);nextSai.textContent=core.step===10?'Lanjut sa’i haji':core.step===17?'Selesaikan manasik':'Lanjut salat & Zamzam';const heading=document.querySelector('h1');if(heading)heading.textContent=core.step===10?'Level 09 · Tawaf Ifadah':core.step===17?'Level 11 · Tawaf Wada’':'Level 02 · Tawaf';const back=document.querySelector<HTMLAnchorElement>('.hud > .panel:first-child > a');if(back){back.href=tenantUrl('./index.html');back.textContent='Lobby';back.classList.add('coreExit');}isPortrait=installLandscape(()=>window.dispatchEvent(new Event('blur')));}
nextSai.addEventListener('click',e=>{if(core&&(!coreFinished||!completeCoreGame(core,core.step as CoreGameStep))){e.preventDefault();status.textContent=coreFinished?'Progress belum tersimpan.':'Selesaikan tujuh putaran dahulu.';return;}if((guided&&!completeStage(1,guided.id))||(hajj&&!completeHajj(hajj))){e.preventDefault();status.textContent='Progress belum tersimpan. Periksa penyimpanan browser.';}});
avatar.addEventListener('change',updateSaiLink);updateSaiLink();

const intro=core?.step===17?"Tawaf wada’ sebagai perpisahan sebelum meninggalkan Makkah. Ada pengecualian sesuai ketentuan. Lakukan tujuh putaran latihan dengan Ka’bah di kiri.":core?.step===10?"Tawaf Ifadah adalah rukun haji. Lakukan tujuh putaran, Ka’bah di sebelah kiri.":"Selamat datang di area latihan tawaf. Mulai dari garis Hajar Aswad, berjalan mengelilingi Ka'bah berlawanan arah jarum jam. Jaga Ka'bah di sebelah kiri. Selesaikan tujuh putaran.";
const guide=new VoiceGuide(intro);
function boot(): void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc8c2b4, 210, 900);
  const environment = new Environment(renderer, scene, 'low');
  scene.add(environment.group);
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1000);
  const crowd = new CrowdRenderer(160, { lod0Budget: 12, lod1Budget: 160, lod0Distance: 18, lod1Distance: 60, blobShadows: true });
  scene.add(crowd.group);
  const playerQuality = {lod0Budget:1,lod1Budget:1,lod0Distance:100,lod1Distance:100,blobShadows:true};
  const male = new CrowdRenderer(1, playerQuality, {robeLength:0.19,coverHead:false,pilgrimStyle:'male'});
  scene.add(male.group);
  let female: CrowdRenderer | undefined;
  function hero(): CrowdRenderer {
    if(avatar.value !== 'female') return male;
    if(!female){female = new CrowdRenderer(1, playerQuality, {robeLength:0.065,coverHead:true,pilgrimStyle:'female'});scene.add(female.group);}
    return female;
  }
  const route = new THREE.Mesh(new THREE.RingGeometry(START_RADIUS - 0.11, START_RADIUS + 0.11, 160).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({color:0x477a68, transparent:true, opacity:0.55, side:THREE.DoubleSide, depthWrite:false}));
  route.position.y=0.05;scene.add(route);
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.44,0.54,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x216d55,side:THREE.DoubleSide,depthWrite:false}));
  marker.position.y=0.07;scene.add(marker);
  let x = Math.cos(START)*START_RADIUS, z = Math.sin(START)*START_RADIUS, yaw = Math.PI;
  let orbit = 0, walkPhase = 0, total = 0, completed = 0, auto = false, finished = false, last = performance.now();
  let lastAngle: number = START;
  let wrongSince=0,wrongAnnounced=false,announcedLap=0;
  const input = new Set<string>();
  let joyId:number|null=null, joyX=0, joyY=0, paused=false;
  let initializedCamera=false, animationTime=0;
  const desiredCamera = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();
  const smoothLook = new THREE.Vector3();
  const frameState = {f0:0,f1:0,frac:0};
  const keyMap: Record<string,string> = {KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  const wrap = (a:number) => Math.atan2(Math.sin(a),Math.cos(a));
  function setAuto(on:boolean):void {
    auto=on&&!finished;
    autoButton.setAttribute('aria-pressed',String(auto));
    autoButton.textContent=auto?'Hentikan otomatis':'Ikuti jalur otomatis';
  }
  function stopJoy():void{joyId=null;joyX=0;joyY=0;knob.style.transform='translate(0px,0px)';}
  function setPause(on:boolean):void{paused=on;pauseButton.setAttribute('aria-pressed',String(on));pauseButton.textContent=on?'Lanjutkan':'Jeda';input.clear();stopJoy();}
  function resetAll():void {coreFinished=false;
    x=Math.cos(START)*START_RADIUS;z=Math.sin(START)*START_RADIUS;lastAngle=START;
    yaw=Math.PI;orbit=0;total=0;completed=0;finished=false;walkPhase=0;input.clear();stopJoy();setAuto(false);
    wrongSince=0;wrongAnnounced=false;announcedLap=0;guide.reset(intro);nextSai.hidden=true;setPause(false);initializedCamera=false;cameraMode.value='follow';count.textContent='0 / 7';progress.value=0;status.textContent="Mulai dari garis Hajar Aswad. Ka'bah di sebelah kiri.";
  }
  function resize():void {renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  resize();window.addEventListener('resize',resize);
  window.addEventListener('keydown',e=>{if((e.target as HTMLElement)?.closest('select,input,textarea'))return;const k=keyMap[e.code];if(k&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();input.add(k);setAuto(false);}});
  window.addEventListener('keyup',e=>{const k=keyMap[e.code];if(k)input.delete(k);});
  window.addEventListener('blur',()=>{input.clear();stopJoy();setAuto(false);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){input.clear();stopJoy();setAuto(false);}last=performance.now();});
  function moveJoy(e:PointerEvent):void{
    const rect=joy.getBoundingClientRect(),r=rect.width*0.35;
    const dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;
    const mag=Math.hypot(dx,dy), scale=mag>r?r/mag:1;
    joyX=dx*scale/r;joyY=dy*scale/r;
    if(mag<r*.1){joyX=0;joyY=0;}
    knob.style.transform='translate('+joyX*r+'px,'+joyY*r+'px)';
  }
  joy.addEventListener('pointerdown',e=>{if(joyId!==null)return;e.preventDefault();joyId=e.pointerId;joy.setPointerCapture(e.pointerId);setAuto(false);moveJoy(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)moveJoy(e);});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(ev,e=>{if((e as PointerEvent).pointerId===joyId)stopJoy();});
  let dragId:number|null=null,dragX=0;
  canvas.addEventListener('pointerdown',e=>{if(dragId!==null)return;dragId=e.pointerId;dragX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==dragId)return;if(cameraMode.value!=='free'){cameraMode.value='free';}orbit-= (e.clientX-dragX)*0.008;dragX=e.clientX;});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if((e as PointerEvent).pointerId===dragId)dragId=null;});
  autoButton.addEventListener('click',()=>{setAuto(!auto);if(auto)guide.announce("Mode otomatis aktif. Perhatikan arah tawaf dan posisi Ka'bah di kiri.",'auto',3000);});reset.addEventListener('click',resetAll);
  pauseButton.addEventListener('click',()=>setPause(!paused));cameraMode.addEventListener('change',()=>{initializedCamera=false;});
  const pressed=(k:string)=>input.has(k);
  const npc=Array.from({length:124},(_,i)=>({a:i*2.399963,r:35.8+(i%9)*2.35,s:0.9+(i%5)*0.12,h:1.59+(i%7)*0.035}));
  function submit(target:CrowdRenderer,lod:number,px:number,pz:number,heading:number,h:number,palette:number,clip:number,phase:number):void{
    resolveFrames(clip,phase,frameState);
    target.submit(lod,px,0,pz,heading,h,1,frameState.f0,frameState.f1,frameState.frac,frameState.f0,0,palette,1);
  }
  function frame(now:number):void {
    const elapsed=Math.max(0,Math.min(0.05,(now-last)/1000));last=now;const dt=paused||isPortrait()?0:elapsed;animationTime+=dt;
    const angle=Math.atan2(z,x);
    if(cameraMode.value!=='free')orbit=-angle;
    let dx=0,dz=0;
    if(auto&&!finished){
      const r=Math.hypot(x,z);const a=Math.atan2(z,x);const correction=(START_RADIUS-r)*0.8;
      dx=Math.sin(a)*3.5+Math.cos(a)*correction;dz=-Math.cos(a)*3.5+Math.sin(a)*correction;
      if(cameraMode.value!=='free')orbit=-a;
    }else{
      const f=(pressed('up')?1:0)-(pressed('down')?1:0)-joyY;
      const s=(pressed('right')?1:0)-(pressed('left')?1:0)+joyX;
      const len=Math.max(1,Math.hypot(f,s));
      dx=(-Math.sin(orbit)*f+Math.cos(orbit)*s)*2.4/len;
      dz=(-Math.cos(orbit)*f-Math.sin(orbit)*s)*2.4/len;
    }
    const oldX=x,oldZ=z;
    if(!finished){
      x+=dx*dt;z+=dz*dt;const r=Math.hypot(x,z);const bounded=THREE.MathUtils.clamp(r,MIN_RADIUS,MAX_RADIUS);if(r>0){x*=bounded/r;z*=bounded/r;}
      const a=Math.atan2(z,x),delta=wrap(lastAngle-a);lastAngle=a;total+=delta;
      completed=Math.max(0,Math.min(7,Math.floor((total+1e-7)/TAU)));
      count.textContent=completed+' / 7';progress.value=Math.max(0,Math.min(7,total/TAU));
      if(completed>announcedLap&&completed<7){announcedLap=completed;guide.announce('Putaran ke '+completed+' selesai. Lanjutkan hingga tujuh putaran.','lap-'+completed,0,true);}
      if(delta < -0.0004){wrongSince+=dt;if(wrongSince>1.2&&!wrongAnnounced){wrongAnnounced=true;guide.announce("Arah tawaf terbalik. Berbaliklah sehingga Ka'bah berada di sebelah kiri.",'wrong',10000,true);}}else if(delta>0.0004){if(wrongAnnounced)guide.announce('Arah perjalanan sudah benar. Lanjutkan tawaf.','correct',10000);wrongSince=0;wrongAnnounced=false;}else if(!paused){wrongSince=0;}
      if(completed===7){guide.announce(core?.step===17?'Tawaf wada’ selesai. Rangkaian latihan haji selesai.':core?.step===10?'Tawaf ifadah selesai. Lanjut sa’i haji.':hajj?'Tujuh putaran latihan haji selesai. Kembali ke perjalanan haji.':'Alhamdulillah, tujuh putaran latihan selesai. Selanjutnya pelajari salat sunah tawaf dan minum air zamzam.','complete',0,true);finished=true;setAuto(false);status.textContent='Tujuh putaran latihan selesai. Pelajari salat sunah tawaf dan zamzam, lalu lanjut ke sa’i.';if(hajj||core?.step===10||core?.step===17)status.textContent=core?.step===17?'Tawaf wada’ selesai.':core?.step===10?'Tawaf Ifadah selesai. Lanjut sa’i haji.':'Tujuh putaran latihan selesai. Kembali ke perjalanan haji.';nextSai.hidden=false;coreFinished=true;if(guided&&!completeStage(1,guided.id))status.textContent='Latihan selesai. Progress belum tersimpan; periksa penyimpanan browser.';}
      else if(delta< -0.0004)status.textContent="Arah terbalik. Jaga Ka'bah di sebelah kiri.";
      else if(delta>0.0004)status.textContent=auto?"Ikuti jalur latihan otomatis. Ka'bah di sebelah kiri.":"Arah benar. Kembali ke garis awal untuk menyelesaikan putaran.";
    }
    const dist=Math.hypot(x-oldX,z-oldZ);
    if(dist>0.0001){const desired=Math.atan2(x-oldX,z-oldZ);yaw+=wrap(desired-yaw)*Math.min(1,dt*12);walkPhase=(walkPhase+dist/1.42)%1;}
    marker.position.x=x;marker.position.z=z;
    mapPlayer.setAttribute('transform','translate('+(70+x*1.08).toFixed(1)+' '+(70+z*1.08).toFixed(1)+')');
    const viewX=Math.sin(orbit),viewZ=Math.cos(orbit);
    const r=Math.hypot(x,z),rx=x/r,rz=z/r;
    if(cameraMode.value==='first'){
      desiredCamera.set(x,1.61,z);desiredLook.set(x-viewX*8,1.61,z-viewZ*8);
    }else if(cameraMode.value==='follow'){
      if(core)desiredCamera.set(x+viewX*3.8+rx*.8,2.65,z+viewZ*3.8+rz*.8);else desiredCamera.set(x+viewX*5.9+rx*6.4,3.6,z+viewZ*5.9+rz*6.4);
      if(core)desiredLook.set(x-viewX*1.4-rx*.7,1.4,z-viewZ*1.4-rz*.7);else desiredLook.set(x-viewX*3-rx*5,1.3,z-viewZ*3-rz*5);
    }else{
      desiredCamera.set(x+viewX*(core?4:5.6),core?2.65:3.2,z+viewZ*(core?4:5.6));
      desiredLook.set(x-viewX*2,1.45,z-viewZ*2);
    }
    if(!initializedCamera){camera.position.copy(desiredCamera);smoothLook.copy(desiredLook);initializedCamera=true;}
    else {const a=1-Math.exp(-elapsed*9);camera.position.lerp(desiredCamera,a);smoothLook.lerp(desiredLook,a);}
    camera.lookAt(smoothLook);camera.updateMatrixWorld();
    const active=hero();
    male.group.visible=active===male&&cameraMode.value!=='first';
    if(female)female.group.visible=active===female&&cameraMode.value!=='first';
    marker.visible=cameraMode.value!=='first';
    active.beginFrame();
    if(cameraMode.value!=='first')submit(active,0,x,z,yaw,avatar.value==='female'?1.62:1.74,avatar.value==='female'?8:0,dist>0.0001?Clip.WALK:Clip.IDLE,dist>0.0001?walkPhase:animationTime/3%1);
    active.endFrame();
    crowd.beginFrame();
    for(let i=0;i<npc.length;i++){
      const n=npc[i];n.a-=n.s/n.r*dt;const px=Math.cos(n.a)*n.r,pz=Math.sin(n.a)*n.r;
      if(Math.hypot(px-x,pz-z)<0.7)continue;
      submit(crowd,1,px,pz,Math.atan2(Math.sin(n.a),-Math.cos(n.a)),n.h,i%7,Clip.WALK,(animationTime*n.s/1.42+i*.13)%1);
    }
    crowd.endFrame();renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.hidden=false;loading.textContent='Konteks grafis terputus. Muat ulang halaman.';});
  loading.hidden=true;requestAnimationFrame(frame);
}
requestAnimationFrame(()=>{try{boot();}catch(e){console.error(e);loading.hidden=false;loading.textContent='Simulasi gagal dimulai. Gunakan browser dengan WebGL 2 lalu muat ulang.';}});
