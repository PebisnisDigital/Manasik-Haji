import {mountGateVideotron} from './gateVideotron.ts';
import {humanActor,humanPlayer,updateHumanActors} from './characters/HumanActors.ts';
import * as THREE from 'three';
import {readSetup,saveSetup,journeyVoice,journeyVolume} from './frontSettings.ts';
import {Clip} from './sim/States.ts';
import {defaultSetup} from './frontModel.ts';
import {gateGuide} from './gateGuide.ts';
import {openSalmaWelcome,openGateGuide} from './salmaWelcome.ts';
import {createRegistrationHall} from './registrationHall.ts';
import {mountCinematicIntro} from './cinematicIntro.ts';
import {mountPwa} from './pwa.ts';
import {graphicsTier,graphicsProfile,createRenderBudget,mountGraphics} from './graphicsQuality.ts';
import {ImmersiveSound} from './audio/ImmersiveSound.ts';
const lobbySound=new ImmersiveSound('lobby',document.querySelector('.menu nav'));
import {surfaceDetail} from './env/GraphicsDetail.ts';
import {getProgramSettings} from './adminApi.ts';
import {newSessionAllowed,type ProgramSetting} from './adminModel.ts';
import {accountId,syncRuns} from './playerCloud.ts';
import {newCore,readCore,writeCore,coreUrl,levelNumber,isComplete} from './coreProgress.ts';
import {mountComfort,walkFactor,lookFactor} from './comfortMode.ts';
import {installSmartTutorial} from './smartTutorial.ts';
import {installMissionMap} from './missionMap.ts';
import {bootTenant,slug,tenantUrl} from './tenant.ts';
type Avatar='male'|'female';type Program='hajj'|'umrah';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const btn=(id:string)=>$<HTMLButtonElement>(id);
const gateMode=document.documentElement.classList.contains('ticketMode'),entranceMode=document.documentElement.classList.contains('entranceMode'),guideMode=entranceMode||new URLSearchParams(location.search).has('guide');
if(guideMode)document.documentElement.classList.add('guideMode');
let entranceFramePresented=false;
const touchMode=matchMedia('(pointer: coarse)').matches||(navigator.maxTouchPoints>1&&Math.min(screen.width,screen.height)<=1024);document.documentElement.classList.toggle('touchMode',touchMode);let portraitBlocked=false;
const programs={hajj:{title:'Manasik Haji',desc:'11 level • Haji Tamattu’',levels:['Miqat & niat umroh','Tawaf umroh','Sa’i umroh','Tahallul umroh','Ihram & niat haji','Wukuf Arafah','Mabit Muzdalifah','Jumrah Aqabah & tahallul awal','Tawaf Ifadah & sa’i haji','Mabit Mina & jumrah','Tawaf Wada’']},umrah:{title:'Manasik Umroh',desc:'4 level • Umroh',levels:['Miqat, ihram, niat, talbiyah','Tawaf, salat sunah & Zamzam','Sa’i 7 lintasan','Tahallul']}};
let settings:ProgramSetting[]|null=null;let settingsTicket=0;let starting=false;
async function loadSettings(){const ticket=++settingsTicket;try{const rows=await getProgramSettings();if(ticket===settingsTicket)settings=rows;}catch{/* preview retains last known configuration */}return settings;}
let introPlaying=false;
let chosenProgram:Program='umrah';let avatar:Avatar='male',selected=false,modal=true,encounter=false,target:Program|null=null,dialogueTimer=0,sceneReady=false,paused=false;
type Actor={root:THREE.Group;legs:THREE.Group[];arms:THREE.Group[]};let budget:ReturnType<typeof createRenderBudget>;let r:THREE.WebGLRenderer,s:THREE.Scene,cam:THREE.PerspectiveCamera,hero:Actor;const guides={} as Record<Program,Actor>;const keys=new Set<string>();let joy=new THREE.Vector2(),last=0,walkPhase=0;const start=new THREE.Vector3(0,0,4.1);const placements={hajj:new THREE.Vector3(-2.5,0,-1.8),umrah:new THREE.Vector3(2.5,0,-1.8)};
let registrationHall:ReturnType<typeof createRegistrationHall>|undefined;
let videotron:ReturnType<typeof mountGateVideotron>|undefined;
let closeGateDialogue:(()=>void)|undefined;
let gateEncounter:'guide'|'clerk'|null=null,guideIntroduced=false,guidePlayerName='';
let queueJoining=false,queueStage=0,queueAuthorized=false;
let departure:{href:string;side:number;stage:number;arrived:boolean}|null=null;
function leaveRegistrationQueue(){if(registrationHall&&(queueJoining||queueAuthorized)){registrationHall.leave(avatar==='female');registrationHall.setRegistrationBusy(false);}queueJoining=false;queueStage=0;queueAuthorized=false;stopMotion();}
function registrationAction(){if(!selected||modal||encounter||portraitBlocked||departure)return;if(queueJoining||queueAuthorized){leaveRegistrationQueue();$('instruction').textContent='Keluar dari antrean. Dekati papan MULAI ANTREAN untuk ikut kembali.';return;}if(!sceneReady||!registrationHall){$('instruction').textContent='Arena antrean belum tersedia. Muat ulang halaman.';return;}target=null;stopMotion();queueJoining=true;queueStage=0;registrationHall.join(avatar==='female');dismissGuideCall();$('instruction').textContent='Menuju bagian belakang antrean';}
const guideRings:Partial<Record<Program,THREE.Mesh<THREE.RingGeometry,THREE.MeshBasicMaterial>>>= {};
const guideLines={
 male:['Assalamualaikum, Akhi! Mari ke sini.','Mau tahu tentang HAJJI.DIGITAL?','Silakan datang, saya jelaskan dulu.'],
 female:['Assalamualaikum, Ukhti! Mari ke sini.','Mau tahu tentang HAJJI.DIGITAL?','Silakan datang, saya jelaskan dulu.']
} as const;
let callClock=0,callCycle=-1,callVoiceCount=0,callUtterance:SpeechSynthesisUtterance|null=null;
const CALL_PERIOD=6.8,CALL_SHOW=3.8;
const reduceGuideMotion=matchMedia('(prefers-reduced-motion: reduce)');
function stopGuideVoice(){
 if(!callUtterance)return;
 callUtterance=null;
 try{window.speechSynthesis.cancel();}catch{}
 document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));
}
function speakGuide(line:string){
 if(!journeyVoice()||journeyVolume()<=0||document.hidden||!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)||callVoiceCount>=3)return;
 const engine=window.speechSynthesis;if(engine.speaking||engine.pending)return;
 const voices=engine.getVoices().filter(v=>/^id(?:[-_]|$)/i.test(v.lang));
 if(!voices.length)return;
 const desired=avatar==='female'?/female|perempuan|wanita|gadis|siti|damayanti/i:/male|laki|pria|andika|ardi/i;
 const preferred=voices.find(v=>desired.test(v.name)&&!(avatar==='male'&&/female/i.test(v.name)))??voices[0];
 const u=new SpeechSynthesisUtterance(line);u.lang='id-ID';u.voice=preferred;u.rate=.94;u.pitch=avatar==='female'?1.10:.88;u.volume=Math.min(.85,journeyVolume());
 callUtterance=u;callVoiceCount++;
 const end=()=>{if(callUtterance===u){callUtterance=null;document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));}};
 u.onstart=()=>{if(callUtterance===u)document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:true}));};
 u.onend=end;u.onerror=end;
 try{engine.speak(u);}catch{end();}
}
function resetGuideCall(allowVoice=false){
 stopGuideVoice();callClock=0;callCycle=0;callVoiceCount=0;
 $('bubble').hidden=true;
 if(allowVoice){speakGuide(guideLines[avatar][0]);}
}
function dismissGuideCall(){
 stopGuideVoice();$('bubble').hidden=true;
}

let cameraYaw=Math.PI,cameraPitch=.19,cameraRadius=guideMode?9.65:3.75,heading=Math.PI,lookedAt=-1e8,encounterProgram:Program|null=null;
const velocity=new THREE.Vector2(),cameraFocus=new THREE.Vector3();let cameraInitialized=false;
const deltaAngle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function resetCamera(){cameraYaw=heading;cameraPitch=.19;cameraRadius=guideMode?9.65:3.75;cameraInitialized=false;}
btn('recenter').onclick=()=>{resetCamera();document.querySelector<HTMLDetailsElement>('.menu')!.open=false;};
function resetPosition(preserveOrbit=false){if(sceneReady){hero.root.position.copy(start);heading=Math.PI;hero.root.rotation.y=heading;velocity.set(0,0);if(preserveOrbit){cameraInitialized=false;}else resetCamera();}}
function stopMotion(){keys.clear();joy.set(0,0);velocity.set(0,0);$('knob').style.transform='translate(-50%,-50%)';}

function applyProgramSetting(p:Program){const open=newSessionAllowed(settings,p);btn('startTraining').disabled=!open||starting;if(!open)$('payNotice').textContent='Sesi baru sedang dijeda. Latihan lama tetap bisa dilanjutkan.';}
function openRegistration(p:Program){chosenProgram=p;clearTimeout(dialogueTimer);encounter=false;encounterProgram=null;modal=true;target=null;stopMotion();$('bubble').hidden=true;$('programTitle').textContent=programs[p].title;$('programDesc').textContent=programs[p].desc;$('levelList').replaceChildren(...programs[p].levels.map((v,i)=>{const el=document.createElement('span');el.textContent=String(i+1).padStart(2,'0')+' · '+v;return el;}));$<HTMLFormElement>('registerForm').reset();const previous=readCore(p);btn('resumeTraining').hidden=!previous;btn('resumeTraining').textContent=previous?(isComplete(previous)?'Lihat sertifikat':'Lanjut level '+levelNumber(previous.step)):'Lanjutkan progress';btn('startTraining').textContent=previous?'Mulai ulang':'Mulai manasik';if(previous)$<HTMLInputElement>('fullName').value=previous.name;$('payNotice').textContent=accountId()?'Akses gratis • progress disinkronkan ke akun.':'Akses tamu • progress hanya di perangkat.';$('registerModal').hidden=false;$('instruction').textContent='Mulai manasik';applyProgramSetting(p);void loadSettings().then(()=>{if(chosenProgram===p&&!$('registerModal').hidden)applyProgramSetting(p);});if(!portraitBlocked)btn('closeRegister').focus({preventScroll:true});}
function gateProject(p:Program,clerk:boolean,side:'guide'|'player'){
 const actor=side==='player'?hero.root:clerk?(registrationHall?.clerk(avatar==='female')??guides[p].root):guides[p].root;
 const point=actor.position.clone();point.y+=side==='guide'&&clerk?1.88:2.12;const view=point.clone().applyMatrix4(cam.matrixWorldInverse);point.project(cam);
 const rect=$<HTMLCanvasElement>('world').getBoundingClientRect();return {x:rect.left+(point.x*.5+.5)*rect.width,y:rect.top+(.5-point.y*.5)*rect.height,visible:view.z< -cam.near&&point.z>=-1&&point.z<=1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1};
}
function greet(p:Program){
 if(modal||encounter||!selected||portraitBlocked)return;
 if(guideMode&&p!==gateGuide(avatar).slot){target=null;$('instruction').textContent='Temui '+gateGuide(avatar).name+'.';return;}
 tutorial.event({type:'guide'});encounter=true;encounterProgram=p;target=null;stopMotion();
 if(guideMode){
  dismissGuideCall();
  if(queueAuthorized){
   queueAuthorized=false;gateEncounter='clerk';registrationHall?.setRegistrationBusy(true);
   $('instruction').textContent='Sedang dilayani petugas pendaftaran';
   closeGateDialogue=openSalmaWelcome(()=>{closeGateDialogue=undefined;encounter=false;encounterProgram=null;gateEncounter=null;registrationHall?.leave(avatar==='female');registrationHall?.setRegistrationBusy(false);resetPosition(true);guideIntroduced=true;$('instruction').textContent='Dekati papan MULAI ANTREAN jika ingin melanjutkan pendaftaran';},side=>gateProject(p,true,side),guidePlayerName,href=>{closeGateDialogue=undefined;encounter=false;encounterProgram=null;gateEncounter=null;queueAuthorized=false;target=null;stopMotion();departure={href,side:avatar==='female'?1:-1,stage:0,arrived:false};$('instruction').textContent='Tiket aktif · menuju pintu keberangkatan';});
  }else{
   gateEncounter='guide';$('instruction').textContent='Berbincang dengan '+gateGuide(avatar).name;
   closeGateDialogue=openGateGuide((name,join)=>{guidePlayerName=name;guideIntroduced=true;closeGateDialogue=undefined;encounter=false;encounterProgram=null;gateEncounter=null;$('instruction').textContent='Dekati papan MULAI ANTREAN untuk mendaftar';if(join)registrationAction();},side=>gateProject(p,false,side),guidePlayerName);
  }
  return;
 }
 $('speaker').textContent=p==='hajj'?'Pemandu manasik haji':'Pemandu manasik umroh';$('speech').textContent=p==='hajj'?'Assalamualaikum! Mari belajar manasik haji.':'Assalamualaikum! Mari belajar manasik umroh.';$('bubble').hidden=false;$('instruction').textContent='Temui pemandu';dialogueTimer=window.setTimeout(()=>openRegistration(p),3600);
}
function go(p:Program){if(guideMode){const a=currentGateAction();if(a?.id==='guide'&&p===gateGuide(avatar).slot)a.run();return;}if(!selected||modal||encounter||portraitBlocked||queueJoining)return;if(!sceneReady){greet(p);return;}target=p;$('instruction').textContent=guideMode?'Menuju '+gateGuide(avatar).name:'Menuju '+programs[p].title;}
$<HTMLFormElement>('registerForm').onsubmit=async e=>{e.preventDefault();if(portraitBlocked||starting)return;starting=true;btn('startTraining').disabled=true;const requested=chosenProgram;await loadSettings();if(requested!==chosenProgram||$('registerModal').hidden||portraitBlocked||!newSessionAllowed(settings,requested)){starting=false;applyProgramSetting(chosenProgram);return;}const previous=readCore(chosenProgram);if(previous&&!confirm('Mulai ulang latihan program ini? Progress lama akan diganti.')){starting=false;applyProgramSetting(chosenProgram);return;}const j=newCore(chosenProgram,avatar,$<HTMLInputElement>('fullName').value||'Peserta Demo');if(!writeCore(j)){$('payNotice').textContent='Penyimpanan browser tidak tersedia.';starting=false;applyProgramSetting(chosenProgram);return;}btn('startTraining').disabled=true;if(accountId())await Promise.race([syncRuns(),new Promise(resolve=>setTimeout(resolve,1800))]);location.assign(coreUrl(j));};
btn('resumeTraining').onclick=()=>{const j=readCore(chosenProgram);if(j&&!portraitBlocked)location.assign(coreUrl(j));};
btn('closeRegister').onclick=()=>{$('registerModal').hidden=true;$<HTMLFormElement>('registerForm').reset();modal=false;encounter=false;resetPosition();$('instruction').textContent='Temui pemandu';};
function choose(a:Avatar){if(departure){registrationHall?.leave(avatar==='female');registrationHall?.setRegistrationBusy(false);departure=null;}if(queueJoining||queueAuthorized)leaveRegistrationQueue();guideIntroduced=false;guidePlayerName='';gateEncounter=null;avatar=a;selected=true;modal=false;encounter=false;target=null;$('avatarModal').hidden=true;$('instruction').textContent='Temui pemandu';if(sceneReady){s.remove(hero.root);hero.root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();if(!Array.isArray(o.material))o.material.dispose();}});hero=person(avatar==='female',avatar==='female'?0x64867a:0xf4ead6,true);resetPosition();}tutorial.paint();}
function selectAtGate(a:Avatar){if(guideMode&&!saveSetup({...readSetup()??defaultSetup(),avatar:a})){$('instruction').textContent='Pilihan belum tersimpan. Periksa penyimpanan browser.';return;}choose(a);if(guideMode){resetGuideCall(true);$('instruction').textContent='Dekati '+gateGuide(avatar).name+' untuk berbicara, atau papan antrean untuk mendaftar';}}
btn('male').onclick=()=>selectAtGate('male');btn('female').onclick=()=>selectAtGate('female');btn('goHajj').onclick=()=>go('hajj');btn('goUmrah').onclick=()=>go('umrah');btn('change').onclick=()=>{if(entranceMode&&!entranceFramePresented)return;if(guideMode){closeGateDialogue?.();if(departure){registrationHall?.leave(avatar==='female');registrationHall?.setRegistrationBusy(false);departure=null;}leaveRegistrationQueue();dismissGuideCall();}clearTimeout(dialogueTimer);encounter=false;encounterProgram=null;target=null;modal=true;stopMotion();$('bubble').hidden=true;$('registerModal').hidden=true;$('avatarModal').hidden=false;btn(avatar).focus();};
const mat=(c:number)=>new THREE.MeshStandardMaterial({color:c,roughness:.78});
function mesh(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);}
function ball(rad:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D){return mesh(new THREE.SphereGeometry(rad,24,16),m,x,y,z,parent);}
function person(female:boolean,color:number,isPlayer=false):Actor{const root=isPlayer?humanPlayer(s,female?'female':'male','casual'):humanActor(s,color,female,undefined,undefined,guideMode?{palette:female?9:8,build:1,brightness:1,registration:true}:undefined);if(!isPlayer){const hit=new THREE.Mesh(new THREE.CapsuleGeometry(.28,1.15,4,8),new THREE.MeshBasicMaterial());hit.name='guide-pick-area';hit.position.y=.88;hit.layers.set(1);root.add(hit);}return {root,legs:[new THREE.Group(),new THREE.Group()],arms:[new THREE.Group(),new THREE.Group()]};}
function placa(title:string,sub:string,x:number,z:number){const c=document.createElement('canvas');c.width=768;c.height=220;const g=c.getContext('2d')!;g.fillStyle='#1a4839';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#cfb577';g.lineWidth=7;g.strokeRect(9,9,750,202);g.fillStyle='#f5dda4';g.textAlign='center';g.font='bold 55px sans-serif';g.fillText(title,384,93,715);g.font='28px sans-serif';g.fillStyle='#e4eee3';g.fillText(sub,384,165,710);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;box(3.45,.99,.06,new THREE.MeshBasicMaterial({map:tex}),x,2.95,z,s);}
function build(){const tier=graphicsTier(),profile=graphicsProfile();r=new THREE.WebGLRenderer({canvas:$<HTMLCanvasElement>('world'),antialias:tier!=='low',powerPreference:tier==='low'?'low-power':'high-performance'});budget=createRenderBudget(r);r.shadowMap.enabled=profile.shadows>0;r.shadowMap.type=THREE.PCFSoftShadowMap;r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;s=new THREE.Scene();s.background=new THREE.Color(0xbad5e3);s.fog=new THREE.Fog(0xbad5e3,25,70);cam=new THREE.PerspectiveCamera(51,1,.1,100);s.add(new THREE.HemisphereLight(0xe4f1ff,0xb1a790,1.75));const sun=new THREE.DirectionalLight(0xffefce,2.65);sun.position.set(-7,12,8);sun.castShadow=profile.shadows>0;sun.shadow.mapSize.set(profile.shadows||256,profile.shadows||256);sun.shadow.normalBias=.025;sun.shadow.bias=-.00025;sun.shadow.radius=3;const shadowSpan=guideMode?17:12;sun.shadow.camera.left=-shadowSpan;sun.shadow.camera.right=shadowSpan;sun.shadow.camera.top=shadowSpan;sun.shadow.camera.bottom=-shadowSpan;s.add(sun);const limestone=mat(0xe0d6bc),sand=mat(0xc8bc9c),teal=mat(0x32634f),gold=mat(0xcaa765),dark=mat(0x244639);surfaceDetail(limestone,'stone',2,2);surfaceDetail(sand,'stone',3,3);gold.metalness=.35;gold.roughness=.48;
// A single textured stone surface replaces the checkerboard of individual tiles.
const tile=document.createElement('canvas');tile.width=1024;tile.height=1024;const tg=tile.getContext('2d')!;let seed=8341;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
tg.fillStyle='#afa592';tg.fillRect(0,0,1024,1024);for(let gy=0;gy<4;gy++)for(let gx=0;gx<4;gx++){const v=199+Math.floor(rand()*15);tg.fillStyle='rgb('+v+','+(v-8)+','+(v-22)+')';tg.fillRect(gx*256+2,gy*256+2,252,252);for(let k=0;k<24;k++){const px=gx*256+rand()*256,py=gy*256+rand()*256;tg.strokeStyle='rgba(120,109,88,'+(rand()*.047)+')';tg.lineWidth=rand()*2+.4;tg.beginPath();tg.moveTo(px,py);tg.lineTo(px+rand()*60-30,py+rand()*20-10);tg.stroke();}}for(let i=0;i<15000;i++){tg.fillStyle=rand()>.5?'#fff1d50c':'#544d3e0b';tg.fillRect(rand()*1024,rand()*1024,1+rand()*3,1+rand()*3);}
const stoneTex=new THREE.CanvasTexture(tile);stoneTex.colorSpace=THREE.SRGBColorSpace;stoneTex.wrapS=stoneTex.wrapT=THREE.RepeatWrapping;stoneTex.repeat.set(6,6);stoneTex.anisotropy=Math.min(8,r.capabilities.getMaxAnisotropy());const ground=new THREE.MeshStandardMaterial({map:stoneTex,roughness:.82});box(guideMode?36:24,.20,guideMode?32:24,ground,0,-.105,0,s);

if(guideMode){for(const [x,w] of [[-8.15,1.7],[0,9.5],[8.15,1.7]])box(w!,3.7,.4,sand,x!,1.85,-6.5,s);for(const x of [-6,6])box(2.6,3.4,.15,dark,x,1.7,-8.35,s);}else box(18,3.7,.4,sand,0,1.85,-6.5,s);box(18,.2,.74,limestone,0,3.75,-6.3,s);box(18,.13,.7,gold,0,3.49,-6.24,s);for(const x of [-7.5,-4.5,-1.5,1.5,4.5,7.5]){box(.43,3.3,.5,limestone,x,1.65,-5.85,s);box(.65,.22,.68,gold,x,3.13,-5.85,s);box(.68,.20,.69,limestone,x,.11,-5.85,s);}
for(const x of [-6,-3,0,3,6]){const arc=mesh(new THREE.TorusGeometry(1.24,.15,10,32,Math.PI),limestone,x,1.95,-6.02,s);arc.rotation.z=0;if(!guideMode||Math.abs(x)!==6){box(2.53,1.9,.08,dark,x,.97,-6.10,s);const inner=mesh(new THREE.CircleGeometry(1.22,32,0,Math.PI),dark,x,1.95,-6.09,s);inner.castShadow=false;}}
placa(guideMode?'PUSAT MANASIK':'UMROH.DIGITAL',guideMode?'PENDAFTARAN PESERTA':'',0,-5.67);
for(const p of ['hajj','umrah'] as const){const pos=placements[p];const ring=new THREE.Mesh(new THREE.RingGeometry(.79,.91,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xd4bb83,side:THREE.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));ring.position.set(pos.x,.012,pos.z);s.add(ring);guideRings[p]=ring;const actor=person(p==='umrah',p==='umrah'?0x52796b:0xeae2cc);actor.root.position.copy(pos);actor.root.position.y=0;guides[p]=actor;if(!guideMode)placa(p==='hajj'?'MANASIK HAJI':'MANASIK UMROH','',pos.x,-3.65);}
for(const x of (guideMode?[-8.3,8.3]:[-6.5,6.5]))for(const z of [-2.6,3.5]){mesh(new THREE.CylinderGeometry(.55,.38,.49,12),sand,x,.245,z,s);box(.18,2,.18,mat(0x967c55),x,1.25,z,s);for(let k=0;k<9;k++){const o=ball(.3,teal,x+Math.cos(k*2.4)*.55,2.5+Math.sin(k)*.25,z+Math.sin(k*2.4)*.55,s);o.scale.set(1.4,.55,1.8);}}
if(guideMode){registrationHall=createRegistrationHall(s);videotron=mountGateVideotron($('lobby'),$<HTMLCanvasElement>('world'));}
hero=person(false,0xf4ead6,true);hero.root.position.copy(start);hero.root.rotation.y=Math.PI;heading=Math.PI;sceneReady=true;resize();requestAnimationFrame(frame);}
function resize(){if(!sceneReady)return;const el=$<HTMLCanvasElement>('world');const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);budget.resize(w,h);cam.aspect=w/h;cam.fov=guideMode?(touchMode?65:w/h<.85?69:64):(touchMode?57:w/h<.85?66:60);cam.updateProjectionMatrix();videotron?.resize();}
function syncOrientation(){const was=portraitBlocked;portraitBlocked=!gateMode&&touchMode&&matchMedia('(orientation: portrait)').matches;lobbySound.setPaused(portraitBlocked||introPlaying);const overlay=$('rotateScreen');overlay.hidden=!portraitBlocked;document.documentElement.classList.toggle('portraitBlocked',portraitBlocked);for(const id of ['avatarModal','registerModal'])$(id).inert=portraitBlocked;if(portraitBlocked!==was){if(portraitBlocked&&guideMode)dismissGuideCall();stopMotion();cameraPointer=null;pid=null;cameraInitialized=false;if(portraitBlocked)btn('rotateFullscreen').focus({preventScroll:true});else if(document.activeElement===btn('rotateFullscreen'))btn('fullscreen').focus({preventScroll:true});}resize();}
async function landscapeFullscreen(){if(!touchMode)return;try{if(!document.fullscreenElement){const el=document.documentElement;if(typeof el.requestFullscreen==='function')await el.requestFullscreen();else throw Error('Fullscreen unsupported');}const o=screen.orientation as ScreenOrientation&{lock?:(orientation:'landscape')=>Promise<void>};if(o?.lock)await o.lock('landscape');}catch{if(portraitBlocked)$('rotateHint').textContent='Putar HP secara manual. Aktifkan rotasi otomatis.';}finally{syncOrientation();}}
btn('fullscreen').onclick=()=>{if(document.fullscreenElement){void document.exitFullscreen().catch(()=>{});}else void landscapeFullscreen();};btn('rotateFullscreen').onclick=()=>void landscapeFullscreen();btn('cameraReset').onclick=()=>resetCamera();
window.addEventListener('resize',syncOrientation);window.addEventListener('orientationchange',syncOrientation);document.addEventListener('fullscreenchange',()=>{btn('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Keluar layar penuh':'Layar penuh');syncOrientation();});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();ray.layers.enable(1);const canvas=$<HTMLCanvasElement>('world');let cameraPointer:number|null=null,downX=0,downY=0,prevX=0,prevY=0,dragged=false;
canvas.addEventListener('pointerdown',e=>{if(!sceneReady||modal||(encounter&&!guideMode)||portraitBlocked||cameraPointer!==null||e.button!==0)return;cameraPointer=e.pointerId;downX=prevX=e.clientX;downY=prevY=e.clientY;dragged=false;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==cameraPointer||modal||(encounter&&!guideMode)||portraitBlocked)return;if(Math.hypot(e.clientX-downX,e.clientY-downY)>5)dragged=true;if(dragged){tutorial.event({type:'look',amount:Math.hypot(e.clientX-prevX,e.clientY-prevY)});cameraYaw-=(e.clientX-prevX)*.005*lookFactor();cameraPitch=THREE.MathUtils.clamp(cameraPitch+(e.clientY-prevY)*.0035*lookFactor(),.045,.75);lookedAt=performance.now();}prevX=e.clientX;prevY=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(e.pointerId!==cameraPointer)return;cameraPointer=null;if(dragged||modal||encounter||portraitBlocked)return;const bounds=canvas.getBoundingClientRect();ndc.set((e.clientX-bounds.left)/bounds.width*2-1,1-(e.clientY-bounds.top)/bounds.height*2);ray.setFromCamera(ndc,cam);for(const p of ['hajj','umrah'] as const){if(ray.intersectObject(guides[p].root,true).length){go(p);return;}}});
canvas.addEventListener('pointercancel',e=>{if(e.pointerId===cameraPointer)cameraPointer=null;});canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===cameraPointer)cameraPointer=null;});
canvas.addEventListener('wheel',e=>{if(modal||(encounter&&!guideMode))return;e.preventDefault();cameraRadius=THREE.MathUtils.clamp(cameraRadius+e.deltaY*.003,2.5,guideMode?10.6:5.2);lookedAt=performance.now();},{passive:false});
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(guideMode&&k==='e'&&!e.repeat&&!modal&&!encounter&&!portraitBlocked){e.preventDefault();currentGateAction()?.run();return;}if(!introPlaying&&!modal&&!encounter&&!queueJoining&&!queueAuthorized&&!departure&&!portraitBlocked&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);target=null;}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{stopMotion();cameraPointer=null;});document.addEventListener('visibilitychange',()=>{paused=document.hidden;stopMotion();cameraPointer=null;if(guideMode&&document.hidden)dismissGuideCall();});window.addEventListener('pagehide',stopGuideVoice);
let pid:number|null=null;const j=$('joystick');function jp(e:PointerEvent){const b=j.getBoundingClientRect();joy.set((e.clientX-b.left-b.width/2)/(b.width*.34),(e.clientY-b.top-b.height/2)/(b.height*.34));if(joy.length()>1)joy.normalize();$('knob').style.transform='translate(calc(-50% + '+joy.x*b.width*.28+'px),calc(-50% + '+joy.y*b.height*.28+'px))';target=null;}
j.addEventListener('pointerdown',e=>{if(modal||encounter||portraitBlocked||queueJoining||queueAuthorized||departure||pid!==null)return;pid=e.pointerId;j.setPointerCapture(pid);jp(e);});j.addEventListener('pointermove',e=>{if(e.pointerId===pid)jp(e);});function ju(e:PointerEvent){if(e.pointerId!==pid)return;pid=null;joy.set(0,0);$('knob').style.transform='translate(-50%,-50%)';}j.addEventListener('pointerup',ju);j.addEventListener('pointercancel',ju);j.addEventListener('lostpointercapture',ju);
// One contextual interaction at a time, with the same range checks for touch, mouse and E.
type GateAction={id:'guide'|'queue'|'leave'|'clerk'|'door';title:string;label:string;line:string;point:THREE.Vector3;run:()=>void;secondary?:()=>void};
let gatePrompt:HTMLElement|undefined,gatePromptTitle:HTMLElement|undefined,gatePromptLine:HTMLElement|undefined,gatePromptButton:HTMLButtonElement|undefined,gatePromptCancel:HTMLButtonElement|undefined;
const cameraStick=new THREE.Vector2();let cameraStickPointer:number|null=null;let gateCameraPad:HTMLElement|undefined;
function currentGateAction():GateAction|null{
 if(!guideMode||!sceneReady||!selected||modal||encounter||portraitBlocked||paused||!registrationHall)return null;
 const p=gateGuide(avatar).slot,female=avatar==='female',pos=hero.root.position;
 if(departure){if(!departure.arrived)return null;const point=new THREE.Vector3(departure.side*6,2.1,-5.68);return {id:'door',title:'PINTU KEBERANGKATAN',line:'Tiket aktif. Selamat memulai perjalanan!',label:'MASUK DISTRIK',point,run:()=>{if(departure?.arrived)location.assign(departure.href);}};}
 if(queueAuthorized){const point=registrationHall.clerk(female).position.clone();point.y=1.88;return {id:'clerk',title:'PETUGAS PENDAFTARAN',line:'Silakan, sekarang giliran Anda.',label:'DAFTAR / CEK DATA',point,run:()=>greet(p),secondary:registrationAction};}
 if(queueJoining){const point=pos.clone();point.y=2.12;return {id:'leave',title:'ANTREAN',line:'Tunggu giliran Anda.',label:'KELUAR ANTREAN',point,run:registrationAction};}
 const g=placements[p],q=new THREE.Vector3(female?4.15:-4.15,0,5.34);
 const dg=Math.hypot(pos.x-g.x,pos.z-g.z),dq=Math.hypot(pos.x-q.x,pos.z-q.z);
 if(dg<=2.1&&dg<=dq){const point=g.clone();point.y=2.12;return {id:'guide',title:gateGuide(avatar).name,line:'Assalamualaikum! Mau tahu tentang HAJJI.DIGITAL?',label:'BICARA',point,run:()=>greet(p)};}
 if(dq<=2.35){q.y=2.18;return {id:'queue',title:female?'LOKET PEREMPUAN':'LOKET LAKI-LAKI',line:'Silakan ikut barisan dari sini.',label:'MASUK ANTREAN',point:q,run:registrationAction};}
 return null;
}
function paintGateAction(a:GateAction|null){
 if(!gatePrompt||!gatePromptTitle||!gatePromptLine||!gatePromptButton||!gatePromptCancel)return;
 if(!a){gatePrompt.hidden=true;delete document.documentElement.dataset.gateAction;return;}
 document.documentElement.dataset.gateAction=a.id;
 const pt=a.point.clone(),v=pt.clone().applyMatrix4(cam.matrixWorldInverse);pt.project(cam);
 const offscreen=v.z>=-cam.near||pt.z< -1||pt.z>1||Math.abs(pt.x)>1||Math.abs(pt.y)>1;if(offscreen&&a.id!=='door'&&a.id!=='clerk'&&a.id!=='leave'){gatePrompt.hidden=true;return;}
 if(gatePrompt.dataset.action!==a.id){gatePrompt.dataset.action=a.id;gatePromptTitle.textContent=a.title;gatePromptLine.textContent=a.line;gatePromptButton.textContent=a.label;gatePromptCancel.hidden=!a.secondary;}
 gatePrompt.hidden=false;
 const rect=canvas.getBoundingClientRect(),x=rect.left+(pt.x*.5+.5)*rect.width,y=rect.top+(.5-pt.y*.5)*rect.height,w=gatePrompt.offsetWidth,h=gatePrompt.offsetHeight;
 const left=offscreen?Math.round((innerWidth-w)/2):Math.max(10,Math.min(innerWidth-w-10,x-w/2)),top=offscreen?76:Math.max(68,Math.min(innerHeight-h-12,y-h-12));
 gatePrompt.style.left=Math.round(left)+'px';gatePrompt.style.top=Math.round(top)+'px';gatePrompt.style.setProperty('--gate-tail',Math.round(Math.max(15,Math.min(w-15,x-left)))+'px');
 gatePrompt.classList.toggle('detached',offscreen||Math.abs(top-(y-h-12))>20);
}
function resetCameraStick(){cameraStickPointer=null;cameraStick.set(0,0);const knob=gateCameraPad?.firstElementChild as HTMLElement|undefined;if(knob)knob.style.transform='translate(-50%,-50%)';}
function mountGateControls(){
 const pad=document.createElement('div');pad.className='gateCameraPad joy';pad.setAttribute('aria-label','Joystick kamera');pad.title='Geser untuk memutar kamera';pad.append(document.createElement('div'));document.querySelector('.bottom')!.append(pad);gateCameraPad=pad;
 function move(e:PointerEvent){const b=pad.getBoundingClientRect();cameraStick.set((e.clientX-b.left-b.width/2)/(b.width*.34),(e.clientY-b.top-b.height/2)/(b.height*.34));if(cameraStick.length()>1)cameraStick.normalize();(pad.firstElementChild as HTMLElement).style.transform='translate(calc(-50% + '+cameraStick.x*b.width*.28+'px),calc(-50% + '+cameraStick.y*b.height*.28+'px))';}
 pad.addEventListener('pointerdown',e=>{if(!selected||modal||portraitBlocked||cameraStickPointer!==null||e.button!==0)return;e.preventDefault();cameraStickPointer=e.pointerId;pad.setPointerCapture(e.pointerId);move(e);});
 pad.addEventListener('pointermove',e=>{if(e.pointerId===cameraStickPointer)move(e);});
 const release=(e:PointerEvent)=>{if(e.pointerId===cameraStickPointer)resetCameraStick();};
 pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);pad.addEventListener('lostpointercapture',release);
 window.addEventListener('blur',resetCameraStick);document.addEventListener('visibilitychange',resetCameraStick);window.addEventListener('orientationchange',resetCameraStick);
 const prompt=document.createElement('section');prompt.className='gateContextPrompt';prompt.hidden=true;
 const title=document.createElement('strong'),line=document.createElement('p'),row=document.createElement('div'),action=document.createElement('button'),cancel=document.createElement('button');
 row.className='gateContextActions';action.type='button';cancel.type='button';cancel.textContent='KELUAR';cancel.hidden=true;
 action.onclick=()=>{const a=currentGateAction();if(a&&a.id===prompt.dataset.action)a.run();};
 cancel.onclick=()=>{const a=currentGateAction();if(a&&a.id===prompt.dataset.action)a.secondary?.();};
 row.append(action,cancel);prompt.append(title,line,row);$('lobby').append(prompt);
 gatePrompt=prompt;gatePromptTitle=title;gatePromptLine=line;gatePromptButton=action;gatePromptCancel=cancel;
}
function frame(now:number){
 requestAnimationFrame(frame);const dt=Math.min(.05,last?(now-last)/1000:0);last=now;if(paused||document.hidden||(portraitBlocked&&(!entranceMode||entranceFramePresented))||introPlaying||budget.lost()){videotron?.draw(cam,false);return;}tutorial.paint();
 if(guideMode&&gateCameraPad){gateCameraPad.hidden=!selected||modal||portraitBlocked;if(modal||portraitBlocked)resetCameraStick();if(cameraStick.lengthSq()>.006){cameraYaw-=cameraStick.x*dt*2.15*lookFactor();cameraPitch=THREE.MathUtils.clamp(cameraPitch+cameraStick.y*dt*1.35*lookFactor(),.045,.75);lookedAt=now;tutorial.event({type:'look',amount:cameraStick.length()*dt*90});}}
 const pos=hero.root.position;let dx=0,dz=0;let automatic=false;
 if(selected&&!modal&&!encounter&&!queueAuthorized){
  if(departure){if(!departure.arrived){automatic=true;const points=[new THREE.Vector3(departure.side*5.65,0,-2.77),new THREE.Vector3(departure.side*5.9,0,-4.55),new THREE.Vector3(departure.side*6,0,-6.5)];const dest=points[departure.stage]!;dx=dest.x-pos.x;dz=dest.z-pos.z;if(Math.hypot(dx,dz)<.10){if(departure.stage===0){registrationHall?.leave(avatar==='female');registrationHall?.setRegistrationBusy(false);}if(departure.stage<2)departure.stage++;else{departure.arrived=true;stopMotion();$('instruction').textContent='Pilih MASUK DISTRIK di pintu keberangkatan';}dx=dz=0;}}}
  else if(queueJoining&&registrationHall){automatic=true;const female=avatar==='female',q=registrationHall.playerSlot(female);const side=female?1:-1;const points=[new THREE.Vector3(side*2.25,0,5.35),new THREE.Vector3(q.x,0,5.35),q];const dest=points[Math.min(queueStage,2)]!;dx=dest.x-pos.x;dz=dest.z-pos.z;if(Math.hypot(dx,dz)<.10){if(queueStage<2)queueStage++;else if(registrationHall.ahead(female)===0){queueJoining=false;queueAuthorized=true;registrationHall.setRegistrationBusy(true);$('instruction').textContent='Giliran Anda. Pilih DAFTAR di dekat petugas.';}dx=dz=0;}}
  else if(target){automatic=true;const t=placements[target];dx=t.x-pos.x;dz=t.z+.96-pos.z;if(Math.hypot(dx,dz)<.10){greet(target);dx=dz=0;}}
  else{const side=joy.x+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),forward=-joy.y+Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));dx=-Math.cos(cameraYaw)*side+Math.sin(cameraYaw)*forward;dz=Math.sin(cameraYaw)*side+Math.cos(cameraYaw)*forward;}
 }
 const n=Math.hypot(dx,dz),speed=2.6*walkFactor(automatic);const wish=n>.015?new THREE.Vector2(dx/n,dz/n).multiplyScalar(speed*Math.min(1,automatic?n*3:n)):new THREE.Vector2();velocity.lerp(wish,1-Math.exp(-dt*(n>.015?10:14)));
 if(modal||encounter||queueAuthorized)velocity.set(0,0);
 const moving=velocity.length()>.055;
 if(moving){let nx=THREE.MathUtils.clamp(pos.x+velocity.x*dt,guideMode?-12.35:-5.6,guideMode?12.35:5.6),nz=THREE.MathUtils.clamp(pos.z+velocity.y*dt,departure?-6.6:-3,guideMode?8.1:5.8);
  if(guideMode&&!departure){const allowed=(x:number,z:number)=>Math.abs(x)<=5.6||z>=5.9||Math.abs(x)>=11.8;if(!allowed(nx,nz)){if(allowed(pos.x,nz))nx=pos.x;else if(allowed(nx,pos.z))nz=pos.z;else{nx=pos.x;nz=pos.z;}}}
  const moved=Math.hypot(nx-pos.x,nz-pos.z);lobbySound.walk(moved);tutorial.event({type:'walk',amount:moved});pos.x=nx;pos.z=nz;const desired=Math.atan2(velocity.x,velocity.y);heading+=deltaAngle(heading,desired)*(1-Math.exp(-dt*13));walkPhase+=dt*velocity.length()*3.65;}
 if(!guideMode&&selected&&!modal&&!encounter){for(const p of ['hajj','umrah'] as const){const d=Math.hypot(pos.x-placements[p].x,pos.z-placements[p].z);if(d<1.05){greet(p);break;}}}
 if(encounter&&encounterProgram){const t=gateEncounter==='clerk'?(registrationHall?.clerk(avatar==='female').position??placements[encounterProgram]):placements[encounterProgram];heading+=deltaAngle(heading,Math.atan2(t.x-pos.x,t.z-pos.z))*(1-Math.exp(-dt*9));}
 hero.root.rotation.y=heading;
 hero.legs.forEach((g,i)=>{g.rotation.x=THREE.MathUtils.lerp(g.rotation.x,moving?Math.sin(walkPhase+i*Math.PI)*.43:0,1-Math.exp(-dt*17));});hero.arms.forEach((g,i)=>{g.rotation.x=THREE.MathUtils.lerp(g.rotation.x,moving?Math.sin(walkPhase+i*Math.PI+Math.PI)*.28:0,1-Math.exp(-dt*17));});
 // Registration camera is a manual orbit: auto-walk and conversations must not change its yaw.
 if(!guideMode&&cameraPointer===null&&(encounter||automatic&&now-lookedAt>1800||!moving&&now-lookedAt>3500&&!modal)){cameraYaw+=deltaAngle(cameraYaw,heading)*(1-Math.exp(-dt*(encounter?4:2.6)));}
 const narrow=cam.aspect<.85;const fx=Math.sin(cameraYaw),fz=Math.cos(cameraYaw),rx=-Math.cos(cameraYaw),rz=Math.sin(cameraYaw);const radius=cameraRadius+(narrow?.35:touchMode?.12:0);const pivot=new THREE.Vector3(pos.x,1.32,pos.z);
 const cameraGoal=pivot.clone().add(new THREE.Vector3(-fx*Math.cos(cameraPitch)*radius+rx*.34,Math.sin(cameraPitch)*radius+.12,-fz*Math.cos(cameraPitch)*radius+rz*.34));
 // The rear arcade is solid. Shorten the camera boom rather than letting it cross the wall.
 if(cameraGoal.z< -5.48){const t=(-5.48-pivot.z)/(cameraGoal.z-pivot.z);cameraGoal.copy(pivot.clone().lerp(cameraGoal,Math.max(.12,t)));}cameraGoal.y=Math.max(1.5,cameraGoal.y);
 const plazaView=guideMode?1.25:0;
 const look=pivot.clone().add(new THREE.Vector3(fx*.82+rx*.34,.13+plazaView,fz*.82+rz*.34));
 if(!cameraInitialized){cam.position.copy(cameraGoal);cameraFocus.copy(look);cameraInitialized=true;}else{const ease=1-Math.exp(-dt*11);cam.position.lerp(cameraGoal,ease);cameraFocus.lerp(look,guideMode?ease:1-Math.exp(-dt*12));}
 cam.position.z=Math.max(-5.48,cam.position.z);cam.lookAt(cameraFocus);cam.updateMatrixWorld();
 hero.root.visible=cam.position.distanceTo(pivot)>.85;
 const activeSlot=guideMode&&selected&&!modal&&!encounter&&!queueJoining&&!queueAuthorized&&!departure&&!guideIntroduced?gateGuide(avatar).slot:null;
 if(activeSlot){
  callClock+=dt;
  const cycle=Math.floor(callClock/CALL_PERIOD);
  if(cycle!==callCycle){callCycle=cycle;if(cycle%2===0)speakGuide(guideLines[avatar][cycle%3]);}
 }else if(guideMode){dismissGuideCall();}
 let showCallBubble=false;
 for(const p of ['hajj','umrah'] as const){
  const actor=guides[p],d=Math.hypot(pos.x-placements[p].x,pos.z-placements[p].z),calling=activeSlot===p;
  if(d<3.5||calling){const facing=Math.atan2(pos.x-placements[p].x,pos.z-placements[p].z);actor.root.rotation.y+=deltaAngle(actor.root.rotation.y,facing)*(1-Math.exp(-dt*4));}
  if(guideMode){
   const phase=(callClock%CALL_PERIOD)/CALL_PERIOD;
   if(calling)actor.root.userData.campPose={clip:Clip.GUIDE_WAVE,phase:reduceGuideMotion.matches ? .34 : phase};
   else delete actor.root.userData.campPose;
   const ring=guideRings[p];
   if(ring){
    const pulse=calling&&!reduceGuideMotion.matches?(.5+.5*Math.sin(callClock*3.4)):0;
    ring.material.opacity=calling ? .82+.16*pulse : activeSlot ? .25 : .60;
    ring.material.color.setHex(calling?0xffd36d:0xd4bb83);
    ring.scale.setScalar(calling?1.02+.08*pulse:1);
   }
  }
  const pt=placements[p].clone();pt.y=1.98;pt.project(cam);
  const el=$(p==='hajj'?'hajjLabel':'umrahLabel');
  el.style.left=(pt.x*.5+.5)*100+'%';el.style.top=(.5-pt.y*.5)*100+'%';
  const offscreen=pt.z>1||pt.z< -1||Math.abs(pt.x)>.94||Math.abs(pt.y)>.92;
  el.hidden=offscreen||!!encounterProgram&&encounter;
  if(guideMode){
   el.classList.toggle('guideIsCalling',calling);el.classList.toggle('guideIsPassive',!!activeSlot&&!calling);
   const title=(p==='hajj'?'PAK HUSEN':'BU SALMA')+(calling?' · MARI KE SINI':' · PEMANDU');
   if(el.textContent!==title)el.textContent=title;
   if(calling&&!offscreen&&callClock%CALL_PERIOD<CALL_SHOW){
    const bubble=$('bubble'),line=guideLines[avatar][Math.max(0,callCycle)%3];
    $('speaker').textContent=gateGuide(avatar).name;$('speech').textContent=line;
    const anchor=placements[p].clone();anchor.y=2.30;anchor.project(cam);
    bubble.style.left=THREE.MathUtils.clamp((anchor.x*.5+.5)*100,20,80)+'%';
    bubble.style.top=THREE.MathUtils.clamp((.5-anchor.y*.5)*100,14,73)+'%';
    showCallBubble=true;
   }
  }else if(encounter&&encounterProgram===p){
   const bubble=$('bubble');bubble.style.left=THREE.MathUtils.clamp((pt.x*.5+.5)*100,23,77)+'%';bubble.style.top=THREE.MathUtils.clamp((.5-pt.y*.5)*100,22,69)+'%';
  }
 }

 if(guideMode){const a=currentGateAction();$('bubble').hidden=!showCallBubble||a?.id==='guide';paintGateAction(a);}
 registrationHall?.update(dt);
 if(guideMode){const ahead=registrationHall?.ahead(avatar==='female');if(queueJoining&&ahead!==null&&ahead!==undefined){$('instruction').textContent=ahead===0?'Giliran Anda · menuju loket':'Antrean · '+ahead+' orang di depan';}document.documentElement.dataset.playerQueue=departure?'departing':gateEncounter==='clerk'?'serving':queueAuthorized?'ready':queueJoining?String(ahead):'idle';}
 if(registrationHall){const stats=registrationHall.stats();document.documentElement.dataset.registrationQueue=stats.male+':'+stats.female;document.documentElement.dataset.registrationNpcCycles=String(stats.completed);}
 updateHumanActors(s,dt,!!registrationHall||!modal&&!encounter&&selected,cam);budget.draw(now,s,cam,modal);videotron?.draw(cam,!modal&&!portraitBlocked&&!budget.lost());
 // Present the character picker only after the first rendered registration scene has been painted.
 if(entranceMode&&!entranceFramePresented){entranceFramePresented=true;requestAnimationFrame(()=>{if(!sceneReady||budget.lost()){entranceFramePresented=false;return;}document.documentElement.dataset.gateWorldReady='true';$('avatarModal').hidden=false;$('lobby').inert=false;document.documentElement.classList.remove('gatePreparing');document.documentElement.dataset.guideReady='true';if(portraitBlocked)btn('rotateFullscreen').focus({preventScroll:true});else btn(readSetup()?.avatar??'male').focus({preventScroll:true});});}
}
mountPwa();mountComfort($('comfortIntro'),{intro:true});mountComfort(document.querySelector<HTMLElement>('.menu nav')!);mountGraphics(document.querySelector<HTMLElement>('.menu nav')!);window.addEventListener('umroh-comfort-change',()=>{stopMotion();pid=null;cameraPointer=null;});
const tutorial=installSmartTutorial({kind:'lobby',host:document.querySelector<HTMLElement>('.headerRight')!,blocked:()=>introPlaying||portraitBlocked||modal||encounter,ready:()=>selected&&sceneReady});
if(touchMode)$('movementHint').textContent='';syncOrientation();try{build();}catch(error){if(entranceMode)throw error;sceneReady=false;$('joystick').hidden=true;$('cameraReset').hidden=true;$('hajjLabel').hidden=true;$('umrahLabel').hidden=true;$('movementHint').textContent='Pilih Haji atau Umroh.';}
installMissionMap({host:$('previewMap'),get:()=>({program:chosenProgram,save:readCore(chosenProgram)}),blocked:()=>portraitBlocked,keyboard:false,onChange:open=>{if(open){stopMotion();cameraPointer=null;pid=null;}tutorial.paint();}});
if(slug)$('partner').hidden=false;for(const a of document.querySelectorAll<HTMLAnchorElement>('.menu nav a'))a.href=tenantUrl(a.getAttribute('href')!);bootTenant();void loadSettings();for(const a of document.querySelectorAll<HTMLAnchorElement>('.accountLink')){a.href=tenantUrl('./account.html');if(accountId())a.textContent='Akun saya';}

if(!gateMode&&!guideMode){$('avatarModal').hidden=false;mountCinematicIntro({canReplay:()=>!modal&&!encounter&&!portraitBlocked,onChange:playing=>{introPlaying=playing;stopMotion();cameraPointer=null;pid=null;target=null;lobbySound.setPaused(portraitBlocked||playing);tutorial.paint();if(!playing){syncOrientation();if(portraitBlocked)btn('rotateFullscreen').focus({preventScroll:true});else if(modal)btn('male').focus({preventScroll:true});}}});}

if(gateMode){$('avatarModal').hidden=true;$('cinematicIntro').remove();document.documentElement.dataset.entranceReady='true';}
if(guideMode){
 $('bubble').classList.add('guideCallBubble');
 // Keep projected guide anchors for interaction, but remove their floating nameplates from the registration HUD.
 for(const id of ['hajjLabel','umrahLabel']){const tag=$(id);tag.style.setProperty('opacity','0','important');tag.style.pointerEvents='none';tag.setAttribute('aria-hidden','true');}
 $('movementHint').style.setProperty('display','none','important');
 $('cinematicIntro').remove();$('hajjLabel').textContent='PAK HUSEN · PENDAFTARAN';$('umrahLabel').textContent='BU SALMA · PENDAFTARAN';document.querySelector('#lobby .brand')!.textContent='HAJJI.DIGITAL';
 const npcNotice=document.createElement('small');npcNotice.textContent='Antrean NPC · simulasi';npcNotice.style.cssText='display:block;color:#f0dcad;font-size:11px;margin-top:4px;letter-spacing:.02em';document.querySelector('.menu nav')!.append(npcNotice);
 document.querySelector('.chooser')!.setAttribute('hidden','');mountGateControls();
 const settingsLink=document.createElement('a');settingsLink.className='gateSettings';settingsLink.href=tenantUrl('./index.html?setup=1');settingsLink.textContent='⚙ Perjalanan, suara & grafis';document.querySelector('.menu nav')!.append(settingsLink);
 document.querySelector('#avatarModal h1')!.textContent='Pilih karakter';
 // Keep the entrance character picker minimal. Comfort settings and account access remain in the main menu.
 for(const element of document.querySelectorAll('#avatarModal #comfortIntro, #avatarModal .fine, #avatarModal .pwaInstall, #avatarModal .accountLink'))element.remove();
 if(entranceMode){modal=true;$('avatarModal').hidden=true;$('instruction').textContent='Pilih karakter · antre · daftar · berangkat';}else{selectAtGate(readSetup()?.avatar??'male');document.documentElement.dataset.guideReady='true';}
}
