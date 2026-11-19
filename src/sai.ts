import * as THREE from 'three';
import {coreGame,completeCoreGame,coreUrl} from './coreProgress.ts';
import {installLandscape} from './coreLandscape.ts';
import {tenantUrl} from './tenant.ts';
import { buildSaiHall, END, GREEN_START, GREEN_END, WALK_WIDTH } from './env/SaiHall.ts';
import { SaiProgress } from './sim/SaiProgress.ts';
import {guidedStage,completeStage} from './journey.ts';
import {hajjGame,completeHajj} from './hajjProgress.ts';
import {VoiceGuide} from './audio/VoiceGuide.ts';
import { CrowdRenderer } from './characters/CrowdRenderer.ts';
import { resolveFrames } from './characters/CrowdView.ts';
import { Clip } from './sim/States.ts';

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
const targetLabel = document.querySelector<HTMLElement>('#destination')!;
const zoneLabel = document.querySelector<HTMLElement>('#zone')!;
const pace = document.querySelector<HTMLButtonElement>('#pace')!;
const nextLink = document.querySelector<HTMLAnchorElement>('#next')!;
const avatarPref=new URLSearchParams(location.search).get('avatar');
if(avatarPref==='male'||avatarPref==='female')avatar.value=avatarPref;
const core=coreGame(3);let coreFinished=false;let isPortrait=()=>false;
const guided=core?null:guidedStage(3);
const hajj=core?null:hajjGame('sai');if(hajj){avatar.value=hajj.avatar;avatar.disabled=true;const title=document.querySelector('h1');if(title)title.textContent='Latihan Sa’i Haji';nextLink.textContent='Kembali ke perjalanan haji →';nextLink.href='./hajj.html';}
if(guided){avatar.value=guided.avatar;avatar.disabled=true;nextLink.textContent='Lanjut ke tahallul →';nextLink.href='./umrah.html';}
if(core){document.documentElement.classList.add('corePlay');avatar.value=core.avatar;avatar.disabled=true;nextLink.href=coreUrl(core);nextLink.textContent='Lanjut tahallul';const heading=document.querySelector('h1');if(heading)heading.textContent='Level 03 · Sa’i';const back=document.querySelector<HTMLAnchorElement>('.hud > .panel:first-child > a');if(back){back.href=tenantUrl('./index.html');back.textContent='Lobby';back.classList.add('coreExit');}isPortrait=installLandscape(()=>window.dispatchEvent(new Event('blur')));}
nextLink.addEventListener('click',e=>{if(core&&(!coreFinished||!completeCoreGame(core,3))){e.preventDefault();status.textContent=coreFinished?'Progress belum tersimpan.':'Selesaikan tujuh lintasan dahulu.';return;}if((guided&&!completeStage(3,guided.id))||(hajj&&!completeHajj(hajj))){e.preventDefault();status.textContent='Progress belum tersimpan. Periksa penyimpanan browser.';}});

const intro='Sekarang kita berada di Safa. Berjalan menuju Marwah sebagai lintasan pertama. Lanjutkan bolak-balik hingga tujuh lintasan dan berakhir di Marwah.';
const guide=new VoiceGuide(intro);
function boot(): void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  const scene = new THREE.Scene();
  scene.background=new THREE.Color(0xece7dc);
  scene.fog=new THREE.Fog(0xece7dc,40,117);
  scene.add(buildSaiHall());
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
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.44,0.54,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x216d55,side:THREE.DoubleSide,depthWrite:false}));
  marker.position.y=0.07;scene.add(marker);
  let x=3,z=END,yaw=Math.PI;
  const track=new SaiProgress();
  let wasGreen=false,wrongSince=0,wrongAnnounced=false;
  let orbit=0,walkPhase=0,auto=false,finished=false,last=performance.now(),brisk=false;
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
    x=3;z=END;track.reset();wasGreen=false;wrongSince=0;wrongAnnounced=false;guide.reset(intro);yaw=Math.PI;orbit=0;finished=false;walkPhase=0;input.clear();stopJoy();setAuto(false);setBrisk(false);
    setPause(false);initializedCamera=false;cameraMode.value='follow';count.textContent='0 / 7';progress.value=0;targetLabel.textContent='Menuju Marwah';status.textContent='Mulai di Safa. Berjalan menuju Marwah.';nextLink.hidden=true;
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
  autoButton.addEventListener('click',()=>{setAuto(!auto);if(auto)guide.announce('Mode otomatis aktif. Perhatikan tujuan setiap lintasan.','auto',3000);});reset.addEventListener('click',resetAll);
  pauseButton.addEventListener('click',()=>setPause(!paused));cameraMode.addEventListener('change',()=>{initializedCamera=false;});
  function setBrisk(on:boolean):void{brisk=on&&avatar.value==='male';pace.setAttribute('aria-pressed',String(brisk));pace.textContent=brisk?'Kecepatan biasa':'Jalan lebih cepat';}
  pace.addEventListener('click',()=>setBrisk(!brisk));avatar.addEventListener('change',()=>setBrisk(false));
  const pressed=(k:string)=>input.has(k);
  const npc=Array.from({length:78},(_,i)=>({t:i*2.399963%168,x:(i%2===0?1:-1)*(2.0+(i%5)*.95),s:0.9+(i%5)*.12,h:1.59+(i%7)*.035}));
  function submit(target:CrowdRenderer,lod:number,px:number,pz:number,heading:number,h:number,palette:number,clip:number,phase:number):void{
    resolveFrames(clip,phase,frameState);
    target.submit(lod,px,0,pz,heading,h,1,frameState.f0,frameState.f1,frameState.frac,frameState.f0,0,palette,1);
  }
  function frame(now:number):void {
    const elapsed=Math.max(0,Math.min(0.05,(now-last)/1000));last=now;const dt=paused||isPortrait()?0:elapsed;animationTime+=dt;
    const inGreen=z<=-GREEN_START&&z>=-GREEN_END;
    if(!finished&&inGreen!==wasGreen&&!paused){wasGreen=inGreen;if(inGreen)guide.announce(avatar.value==='male'?'Masuk area lampu hijau. Bagi laki-laki, dianjurkan berlari kecil bila mampu.':'Masuk area lampu hijau. Jamaah perempuan tetap berjalan biasa.','green-in-'+track.completed,5000,true);else guide.announce('Keluar area lampu hijau. Lanjutkan berjalan biasa menuju '+track.destination+'.','green-out-'+track.completed,5000);}
    pace.hidden=avatar.value!=='male'||!inGreen||finished;
    if(pace.hidden&&brisk)setBrisk(false);
    zoneLabel.textContent=inGreen?(avatar.value==='male'?'Area lampu hijau: dianjurkan lari kecil bila mampu.':'Area lampu hijau: tetap berjalan biasa.'):'Jalur sa’i • berjalan biasa';
    if(cameraMode.value!=='free')orbit=track.direction===-1?0:Math.PI;
    let dx=0,dz=0;
    if(auto&&!finished){
      const lane=track.direction===-1?3:-3;
      dx=(lane-x)*1.1;dz=track.direction*(inGreen&&avatar.value==='male'?4.2:3.2);
    }else{
      const f=(pressed('up')?1:0)-(pressed('down')?1:0)-joyY;
      const lateral=(pressed('right')?1:0)-(pressed('left')?1:0)+joyX;
      const len=Math.max(1,Math.hypot(f,lateral));
      const speed=brisk&&inGreen?3.5:2.4;
      dx=(-Math.sin(orbit)*f+Math.cos(orbit)*lateral)*speed/len;
      dz=(-Math.cos(orbit)*f-Math.sin(orbit)*lateral)*speed/len;
    }
    const oldX=x,oldZ=z;
    if(!finished){
      x=THREE.MathUtils.clamp(x+dx*dt,-WALK_WIDTH,WALK_WIDTH);z=THREE.MathUtils.clamp(z+dz*dt,-END,END);
      const arrived=track.update(z);
      count.textContent=track.completed+' / 7';progress.value=track.fraction(z);
      finished=track.finished;
      if(finished){guide.announce(hajj?'Tujuh lintasan latihan haji selesai di Marwah. Kembali ke perjalanan haji.':'Alhamdulillah, tujuh lintasan latihan selesai di Marwah. Berikutnya adalah tahallul.','complete',0,true);setAuto(false);setBrisk(false);targetLabel.textContent='Selesai di Marwah';status.textContent='Tujuh lintasan selesai di Marwah. Selanjutnya tahallul dalam rangkaian umrah.';if(hajj)status.textContent='Tujuh lintasan selesai. Kembali ke perjalanan haji.';nextLink.hidden=false;coreFinished=true;if(guided&&!completeStage(3,guided.id))status.textContent='Latihan selesai. Progress belum tersimpan; periksa penyimpanan browser.';}
      else if(arrived){wrongSince=0;wrongAnnounced=false;guide.announce('Lintasan ke '+track.completed+' selesai di '+(track.completed%2===1?'Marwah':'Safa')+'. Berbalik menuju '+track.destination+'.','arrival-'+track.completed,0,true);targetLabel.textContent='Menuju '+track.destination;status.textContent='Sampai '+(track.completed%2===1?'Marwah':'Safa')+'. Berbalik menuju '+track.destination+'.';if(cameraMode.value!=='free'){orbit=track.direction===-1?0:Math.PI;initializedCamera=false;}}
      else if(Math.abs(z-oldZ)>.001){if((z-oldZ)*track.direction<0){wrongSince+=dt;if(wrongSince>1.2&&!wrongAnnounced){wrongAnnounced=true;guide.announce('Arah berlawanan. Tujuan berikutnya adalah '+track.destination+'.','wrong',10000,true);}}else{if(wrongAnnounced)guide.announce('Arah perjalanan sudah benar.','correct',10000);wrongSince=0;wrongAnnounced=false;}status.textContent=(z-oldZ)*track.direction<0?'Arah berlawanan. Tujuan berikutnya: '+track.destination+'.':'Lintasan '+(track.completed+1)+': menuju '+track.destination+'.';}
    }
    const dist=Math.hypot(x-oldX,z-oldZ);
    if(dist>0.0001){const desired=Math.atan2(x-oldX,z-oldZ);yaw+=wrap(desired-yaw)*Math.min(1,dt*12);walkPhase=(walkPhase+dist/1.42)%1;}
    marker.position.x=x;marker.position.z=z;
    mapPlayer.setAttribute('transform','translate('+(70+x*2.2).toFixed(1)+' '+(70+z*1.16).toFixed(1)+')');
    const viewX=Math.sin(orbit),viewZ=Math.cos(orbit);
    if(cameraMode.value==='first'){
      desiredCamera.set(x,1.61,z);desiredLook.set(x-viewX*8,1.61,z-viewZ*8);
    }else if(cameraMode.value==='follow'){
      desiredCamera.set(x+viewX*5.9,3.4,z+viewZ*5.9);
      desiredLook.set(x-viewX*3,1.4,z-viewZ*3);
    }else{
      desiredCamera.set(x+viewX*5.6,3.2,z+viewZ*5.6);
      desiredLook.set(x-viewX*2,1.45,z-viewZ*2);
    }
    desiredCamera.x=THREE.MathUtils.clamp(desiredCamera.x,-9.4,9.4);desiredCamera.z=THREE.MathUtils.clamp(desiredCamera.z,-46.4,46.4);
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
      const n=npc[i];n.t=(n.t+n.s*dt)%168;const forward=n.t<84;const pz=forward?END-n.t:-END+n.t-84;const px=forward?Math.abs(n.x):-Math.abs(n.x);
      if(Math.hypot(px-x,pz-z)<0.7)continue;
      submit(crowd,1,px,pz,forward?Math.PI:0,n.h,i%7,Clip.WALK,(animationTime*n.s/1.42+i*.13)%1);
    }
    crowd.endFrame();renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.hidden=false;loading.textContent='Konteks grafis terputus. Muat ulang halaman.';});
  loading.hidden=true;requestAnimationFrame(frame);
}
requestAnimationFrame(()=>{try{boot();}catch(e){console.error(e);loading.hidden=false;loading.textContent='Simulasi gagal dimulai. Gunakan browser dengan WebGL 2 lalu muat ulang.';}});
