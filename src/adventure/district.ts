import {mountCityMinimap} from './cityMinimap.ts';
import {mountSimplePlayHud} from '../simplePlayHud.ts';
import {simpleSprinting,clearSimpleInput} from '../simpleInput.ts';
import {gateGuide} from '../gateGuide.ts';
import {PlayerRenderer} from '../characters/PlayerRenderer.ts';
import {journeyAvatar,journeyAmbience,readSetup} from '../frontSettings.ts';
import {resolveStop,saveStory} from '../travelStory.ts';
import {TRANSFER_ROUTE,decodeTransfer,transferBus,nextTransferGate,transferCue,transferExit,type TransferSave} from './transferRoute.ts';
import {installLife} from './lifeWorld.ts';
import * as THREE from 'three';
import {CrowdRenderer} from '../characters/CrowdRenderer.ts';
import {resolveFrames} from '../characters/CrowdView.ts';
import {Clip} from '../sim/States.ts';
import {graphicsTier,createRenderBudget,mountGraphics} from '../graphicsQuality.ts';
import {scopedKey,tenantUrl} from '../tenant.ts';
import {attachAdventureControls,cameraMove} from './adventureControls.ts';
import {ThirdPersonCamera,followAlpha} from './thirdPersonCamera.ts';
import {createDistrictWorld} from './districtWorld.ts';
import {DistrictLocomotion,DistrictCameraPresentation,wheelTravel} from './districtPresentation.ts';
import {districtDialogue,districtText,type DistrictSpeaker,type DialogueCommand} from './districtDialogue.ts';
import {createMissionCity,type CityVehicle,CITY_BUILDINGS} from './missionCity.ts';
import {BUILDINGS,STATIONS,DISTRICT_STEPS,advanceDistrict,decodeDistrict,storeDistrict,districtSpawn,districtReward,busSpawn,stepBus,insideBus,canStand,exitPoint,atTerminal,type DistrictEvent,type DistrictSave,type Point} from './districtModel.ts';
import {loadProgress,decodeRoute,decodeTahallul,QUEST_KEYS,chapterSummary,npcWaiting} from './questProgress.ts';
import {Ambience} from './ambience.ts';
import {loadJourney} from './journeyView.ts';
import {NEW_ERRANDS,ERRAND_STATIONS,ESCORT_PATH,TERMINAL_ROUTE,decodeErrands,storeErrands,advanceErrand,errandReward,errandSpawn,companionSpawn,stepCompanion,routeCue,walkingRoute,type ErrandSave} from './districtActivities.ts';

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const requestedTransfer=new URLSearchParams(location.search).get('transfer');
const transfer=requestedTransfer?resolveStop(requestedTransfer):null;
const minaToArafah=transfer?.id==='hajj:arafah',arafahToMuzdalifah=transfer?.id==='hajj:muzdalifah',muzdalifahToMina=transfer?.id==='hajj:aqabah';
const boarding=new URLSearchParams(location.search).get('boarding'),magicBoarding=!!transfer&&(boarding==='magic'||boarding==='demo'),demoBoarding=magicBoarding&&boarding==='demo';
const key=scopedKey(transfer?(demoBoarding?'manasik-demo-transfer-':'manasik-transfer-')+transfer.id+'-v1':'manasik-district-v1');
const errandsKey=scopedKey('manasik-district-errands-v1');
const intro=el<HTMLDialogElement>('districtIntro'),dialog=el<HTMLDialogElement>('districtDialog');
document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a=>a.href=tenantUrl(a.getAttribute('href')!));
let save:DistrictSave=transfer?(loadProgress(key,decodeTransfer)??{version:1,stage:2,avatar:'male',gate:1} as TransferSave):(loadProgress(key,decodeDistrict)??{version:1,stage:0,avatar:'male'});
save={...save,avatar:journeyAvatar(save.avatar)};
const transferGuide=gateGuide(save.avatar).name,arrivalGuide=transfer?transferGuide:'Bu Salma';
let errands:ErrandSave=loadProgress(errandsKey,decodeErrands)??{...NEW_ERRANDS};
function saveStatus(stored:boolean){
  el('checkpointStatus').textContent=stored?'Checkpoint kawasan tersimpan di perangkat ini':'Checkpoint belum tersimpan · penyimpanan browser tidak tersedia / versi berbeda';
  el('checkpointStatus').classList.toggle('failed',!stored);
}
function persist(){
  let stored=false;try{if(transfer){for(const k of [key,key+'.backup']){try{if(JSON.parse(localStorage.getItem(k)??'null')?.version>1){saveStatus(false);return;}}catch{}}}stored=storeDistrict(localStorage,key,save);}catch{/* Disabled storage. */}
  saveStatus(stored);
}
function persistErrands(){let stored=false;try{stored=storeErrands(localStorage,errandsKey,errands);}catch{}saveStatus(stored);}
function boot(hub?:{access:import('./districtBoard.ts').DistrictBoardAccess;module:typeof import('./districtBoard.ts')}){
  const canvas=el<HTMLCanvasElement>('districtWorld');canvas.tabIndex=0;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:graphicsTier()!=='low',powerPreference:'high-performance'});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  const budget=createRenderBudget(renderer),world=createDistrictWorld(renderer,arafahToMuzdalifah),camera=new THREE.PerspectiveCamera(61,1,.1,230);
  camera.far=hub?320:230;camera.updateProjectionMatrix();
  const rig=new ThirdPersonCamera(camera,[...BUILDINGS,...(hub?CITY_BUILDINGS.slice(0,hub.access.program==='hajj'?12:5):[])].map(b=>new THREE.Box3(new THREE.Vector3(b.x-b.w/2,0,b.z-b.d/2),new THREE.Vector3(b.x+b.w/2,b.height,b.z+b.d/2))));
  const journeyBus=()=>transfer?transferBus(save as TransferSave):busSpawn(save);
  const journeySpawn=()=>hub?hub.module.BOARD_SPAWN:transfer?(transferExit(journeyBus(),save.stage>=4?STATIONS.arrival:STATIONS.luggage)??districtSpawn(save)):(save.stage===5?errandSpawn(errands):null)??districtSpawn(save);
  const spawn=journeySpawn(),hero=new THREE.Vector3(spawn.x,0,spawn.z);
  let hasan=companionSpawn(errands);
  let bus=journeyBus(),heading=hub?Math.PI:1.3,cameraYaw=hub?Math.PI:1.3,driving=false,started=false,lastLook=0,clock=0,fast=false,sound=journeyAmbience(),wheelAngle=0;
  const playerMotion=new DistrictLocomotion(),hasanMotion=new DistrictLocomotion(),cameraPresentation=new DistrictCameraPresentation();
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const keys=new Set<string>(),joy={x:0,y:0},audio=new Ambience();
  const graphicsControl=mountGraphics(document.createElement('div'));
  const quality={lod0Budget:8,lod1Budget:16,lod0Distance:20,lod1Distance:60,blobShadows:true};
  let player: PlayerRenderer;
  function makePlayer(){
    if(player){world.scene.remove(player.group);player.dispose();}
    player=new PlayerRenderer(1,quality,save.avatar,'journey');world.scene.add(player.group);
  }
  makePlayer();
  const crowd=new CrowdRenderer(16,quality),salma=new CrowdRenderer(1,quality,transfer&&save.avatar==='male'?{robeLength:.19,coverHead:false,pilgrimStyle:'male'}:{robeLength:.065,coverHead:true,pilgrimStyle:'female'});
  world.scene.add(crowd.group,salma.group);
  const routes=[[-28,14,-14,14,-14,19,-28,19],[-3,-16,3,-16,3,-3,-3,-3],[30,14,32,14,32,-2,30,-2],[-45,-12,-45,10,-48,10,-48,-12]];
  const npcs=Array.from({length:graphicsTier()==='low'?6:12},(_,i)=>{const route=routes[i%routes.length],index=i%4;return {x:route[index*2],z:route[index*2+1],route,index:(index+1)%4,yaw:0,motion:new DistrictLocomotion(i*.13),palette:i%8,waiting:false};});
  let toastTimer=0;
  const city=hub?createMissionCity(world.scene,hub.access.program,hub.module.BOARD_SOLID):null;
  const cityMinimap=city&&hub?mountCityMinimap(city.places,city.solids,hub.module.BOARD_SOLID):null;
  let cityVehicle:CityVehicle|null=null,targetLevel=1,queuedBuilding:number|null=null,queueStage=0,queueAuthorized:number|null=null;
  const journeyBoard=hub?.module.createWorldJourneyBoard(world.scene,hub.access,toast,n=>{targetLevel=n;toast('Tujuan: Gedung '+n+' · ikuti penanda pada peta.');});
  if(journeyBoard)targetLevel=journeyBoard.next();
  const boardPoint=hub?.module.BOARD_POINT;
  const walkAllowed=(x:number,z:number)=>city?city.walk({x,z}):canStand(x,z)&&(!hub||Math.abs(x-hub.module.BOARD_SOLID.x)>=hub.module.BOARD_SOLID.w/2+.4||Math.abs(z-hub.module.BOARD_SOLID.z)>=hub.module.BOARD_SOLID.d/2+.4);
  function toast(text:string){el('notification').textContent=text;el('notification').hidden=false;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el('notification').hidden=true,3500);}
  function advance(event:DistrictEvent){const next=advanceDistrict(save,event);if(next===save)return;save=next;persist();audio.reward();toast(transfer?(save.stage===4?'Bus tiba · rem, turun, lalu temui '+transferGuide:save.stage===5?'Siap memulai misi':'Ikuti rute bersama rombongan'):'+20 poin · '+(save.stage===5?'Misi kawasan selesai':DISTRICT_STEPS[save.stage].title));}
  function advanceBonus(event:Parameters<typeof advanceErrand>[1]){const next=advanceErrand(errands,event);if(next===errands)return;const points=errandReward(next)-errandReward(errands);errands=next;persistErrands();if(points){audio.reward();toast('+'+points+' poin · '+(event==='finishEscort'?'Pak Hasan tiba di halte':'Paket sampai ke pembimbing'));}}
  function closeDialog(){dialog.hidden=true;dialog.close();delete dialog.dataset.speaker;delete dialog.dataset.node;controls.clear();fast=false;el('fastButton').setAttribute('aria-pressed','false');if(sound)void audio.start();canvas.focus();}
  type Action={text:string;run?:()=>void;href?:string;secondary?:boolean;keepOpen?:boolean;id?:string};
  function showDialog(title:string,text:string,actions:Action[],eyebrow='PERCAKAPAN'){
    delete dialog.dataset.speaker;delete dialog.dataset.node;
    controls.clear();audio.stop();el('dialogTitle').textContent=title;el('dialogText').textContent=text;el('dialogEyebrow').textContent=eyebrow;
    el('dialogActions').replaceChildren();el('graphicsOptions').replaceChildren();
    for(const a of actions){const item=document.createElement(a.href?'a':'button');item.className=a.secondary?'secondary':'primary';item.textContent=a.text;
      if(a.id)item.dataset.choice=a.id;
      if(a.href)(item as HTMLAnchorElement).href=tenantUrl(a.href);else item.onclick=()=>{if(!a.keepOpen)closeDialog();a.run?.();};el('dialogActions').append(item);}
    dialog.hidden=false;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
    el('dialogActions').querySelector<HTMLElement>('button,a')?.focus({preventScroll:true});
  }
  function conversation(speaker:DistrictSpeaker,node='root'){
    if(transfer){
      if(speaker==='salma'&&save.stage>=4){
        showDialog(transferGuide+' · '+transfer.title,'Alhamdulillah, kita sudah tiba. Turun dan tenangkan diri sebelum memulai. Tujuanmu: '+transfer.title+'. Saya tetap menemanimu lewat panduan di layar.',[{text:'Mulai Level '+String(transfer.number).padStart(2,'0')+' · '+transfer.title,run:()=>{if(!saveStory({},transfer.id)){toast('Kedatangan belum tersimpan. Periksa penyimpanan browser, lalu bicara lagi dengan '+transferGuide+'.');return;}if(save.stage===4)advance('arrivalBriefing');location.assign(tenantUrl(transfer.href));}},{text:'Saya mau periksa bekal dulu',secondary:true}], 'TIBA DI LEVEL '+transfer.number);
      }else showDialog(transferGuide,'Bus rombongan sudah siap. Naik dari sisi bus, ikuti garis rute mengelilingi kawasan, lalu rem hingga berhenti di terminal. Kamu boleh berhenti kapan saja. Setelah tiba, temui saya di pelataran terminal.',[{text:'Baik, saya siap'}],'PERJALANAN MENUJU '+transfer.title.toUpperCase());
      return;
    }
    const progress=chapterSummary(loadProgress(QUEST_KEYS.tawaf,r=>decodeRoute(r,'tawaf')),loadProgress(QUEST_KEYS.sai,r=>decodeRoute(r,'sai')),loadProgress(QUEST_KEYS.tahallul,decodeTahallul));
    const graph=districtDialogue(speaker,{main:save,errands,companion:hasan,chapters:progress}),screen=graph.nodes[node];
    function command(command:DialogueCommand){
      if(command==='briefing')advance(command);
      else if(command==='arrivalBriefing'){advance(command);conversation('salma');}
      else advanceBonus(command);
    }
    const actions:Action[]=screen.choices.map(choice=>({id:choice.id,text:districtText(choice.text),secondary:choice.secondary,
      ...('to'in choice?{keepOpen:true,run:()=>conversation(speaker,choice.to)}:'href'in choice?{href:choice.href}:'command'in choice?{run:()=>command(choice.command)}:{})}));
    showDialog(districtText(graph.speaker),districtText(screen.line),actions,districtText(screen.label??'label.conversation'));
    dialog.dataset.speaker=speaker;dialog.dataset.node=node;
  }
  function missionBook(){
    if(transfer){showDialog('Perjalanan bersama '+transferGuide,'Tujuan: '+transfer.title+'.\n1. Naik bus.\n2. Ikuti garis rute dan petunjuk belokan.\n3. Parkir di terminal, rem, lalu turun.\n4. Temui '+transferGuide+' untuk mulai misi.\n\nW/S: maju atau mundur · A/D: kemudi · Spasi: rem · AKSI: naik/turun. Di HP gunakan joystick, Rem dan Interaksi.',[{text:'Lanjut perjalanan'},{text:'Peta perjalanan',href:'./adventure-map.html?journey='+transfer.program,secondary:true}],'RUTE ROMBONGAN');return;}
    const main=save.stage===5,escort=errands.stage>=2,parcel=errands.stage===4;
    const journey=loadJourney(),chapterText=journey.stops.slice(1).map(s=>s.title+': '+s.detail).join('\n');
    const escortStatus=escort?'selesai · 30 poin':main?errands.stage===1?'sedang didampingi':'tersedia di pelataran':'terbuka setelah perjalanan utama';
    const parcelStatus=parcel?'selesai · 40 poin':errands.stage===3?'paket sedang dibawa':escort?'tersedia di kedai':'terbuka setelah Pak Hasan tiba';
    const actions:Action[]=[{text:'Kembali bermain'},{text:'Peta level',href:'./adventure-map.html',secondary:true}];
    if(journey.next.href!=='./district.html')actions.push({text:journey.next.label,href:journey.next.href,secondary:true});
    showDialog('Buku perjalanan',`Perjalanan utama: ${save.stage}/5 tujuan · ${districtReward(save)} poin.\nDampingi Pak Hasan ke halte: ${escortStatus}.\nAntar paket dari Pak Rizal ke Bu Salma: ${parcelStatus}.\n\n${chapterText}\n\n${main?'Misi tambahan bersifat opsional. Ikuti penanda emas dan gunakan Interaksi di dekat tokoh.':'Selesaikan perjalanan ke terminal untuk membuka misi tambahan.'}`,actions,'MISI UTAMA & TAMBAHAN');
  }
  function frameCamera(cut=false){cameraPresentation.transition(driving,cut||reducedMotion.matches);if(cut||reducedMotion.matches)rig.reset();playerMotion.reset();lastLook=performance.now();}
  function exitBus(){const p=transfer?transferExit(bus):exitPoint(bus);if(!p){toast('Berhenti dahulu dan pastikan sisi bus bebas.');return;}clearSimpleInput();hero.set(p.x,0,p.z);heading=bus.yaw;cameraYaw=heading;driving=false;bus.speed=0;frameCamera();controls.clear();}
  function boardBus(){clearSimpleInput();driving=true;bus.speed=0;cameraYaw=bus.yaw;frameCamera();controls.clear();advance('board');toast('Joystick untuk gas dan kemudi · Rem untuk berhenti · Aksi untuk turun');}
  function cityEnter(){if(!city||!journeyBoard||cityVehicle||queueAuthorized===null)return;const building=city.places.find(b=>b.number===queueAuthorized);if(!building)return;queueAuthorized=null;
    const number=building.number,initial=journeyBoard.check(number),title=building.guardName+' · Gedung '+number;
    const check=()=>{const result=journeyBoard.check(number);const eyebrow='PEMERIKSAAN PROGRES · LEVEL '+number;
      if(!result.allowed){showDialog(title,'Maaf, checkpoint Level '+(number-1)+' · '+result.previousTitle+' belum selesai. Silakan tuntaskan level tersebut dahulu.',[{text:'Kembali ke perjalanan',id:'guardDenied'},{text:'Lihat peta level',secondary:true,run:()=>journeyBoard.open()}],eyebrow);return;}
      showDialog(title,(number===1?'Tiket kawasan sudah diperiksa saat masuk.':'Checkpoint Level '+(number-1)+' telah selesai.')+' '+(result.preview?'Ini simulasi pemeriksaan pada pratinjau.':'Alhamdulillah, silakan masuk dan mulai misi.'),[{text:result.preview?'Lihat simulasi izin masuk':'Silakan masuk · Level '+number,id:'guardEnter',run:()=>{if(Math.hypot(hero.x-building.door.x,hero.z-building.door.z)>5){toast('Dekati pintu gedung kembali.');return;}journeyBoard.launch(number);}},{text:'Nanti dulu',secondary:true}],eyebrow);
    };
    showDialog(title,number===1?'Assalamualaikum! Selamat datang di Gedung 1 · '+initial.title+'. Boleh saya periksa akses perjalanan Anda?':'Assalamualaikum! Apakah Anda sudah menyelesaikan Level '+(number-1)+' · '+initial.previousTitle+'? Izinkan saya memeriksa progres Anda.',[{text:'Periksa progres saya',id:'guardCheck',run:check},{text:'Kembali',secondary:true}], 'POS KEAMANAN · GEDUNG '+number);
  }
  function interact(){
    if(!controls.playable())return;
    if(city){if(queuedBuilding!==null){city.leaveQueue(queuedBuilding);queuedBuilding=null;queueStage=0;controls.clear();toast('Keluar antrean. Tekan AKSI untuk ikut kembali.');return;}if(cityVehicle){const p=city.leave(cityVehicle);if(!p){toast('Rem sampai berhenti, lalu cari sisi yang kosong.');return;}hero.set(p.x,0,p.z);heading=cityVehicle.yaw;cameraYaw=heading;cityVehicle=null;driving=false;bus={...city.bus()};frameCamera(true);controls.clear();return;}
      const building=city.queueNear(hero)??city.entrance(hero)?.number;if(building!==undefined&&building!==null){if(city.joinQueue(building)){queuedBuilding=building;queueStage=0;controls.clear();toast('Ikut antrean Gedung '+building);}return;}const v=city.near(hero);if(v){cityVehicle=city.take(v.kind);bus=cityVehicle;driving=true;cameraYaw=v.yaw;wheelAngle=0;frameCamera(true);controls.clear();toast('Naik '+city.label(v.kind)+' · Rem lalu AKSI untuk turun');return;}journeyBoard?.open();return;}
    if(driving){exitBus();return;}
    const distance=(p:{x:number;z:number})=>Math.hypot(hero.x-p.x,hero.z-p.z);
    if(save.stage===5&&distance(hasan)<2.8){
      conversation('hasan');return;
    }
    if(save.stage===5&&distance(ERRAND_STATIONS.rizal)<2.8){
      conversation('rizal');return;
    }
    if(distance(STATIONS.briefing)<2.8){
      conversation('farid');return;
    }
    if(save.stage===1&&distance(STATIONS.luggage)<2.2){showDialog('Koper perjalanan','Koper siap dibawa. Dekati bus rombongan di tepi jalan, lalu pilih Naik bus.',[{text:'Bawa koper',run:()=>advance('luggage')}],'INTERAKSI LINGKUNGAN');return;}
    if(insideBus(hero,bus,2.2)){boardBus();return;}
    if(distance(STATIONS.arrival)<2.8){
      conversation('salma');return;
    }
    if(npcs.some(n=>distance(n)<2))conversation('pilgrim');
  }
  function pause(){if(!started)return;showDialog('Jeda perjalanan','Checkpoint misi tersimpan setiap tujuan selesai. Kamu dapat kembali ke checkpoint kawasan atau melanjutkan berjalan.',[
    {text:'Lanjutkan'},
    {text:'Buku misi',secondary:true,run:hub?()=>journeyBoard?.open():missionBook},
    {text:'Kembali ke checkpoint',secondary:true,run:()=>{const p=journeySpawn();hero.set(p.x,0,p.z);hasan=companionSpawn(errands);hasanMotion.reset();driving=false;cityVehicle=null;if(queuedBuilding!==null)city?.leaveQueue(queuedBuilding);queuedBuilding=null;queueAuthorized=null;queueStage=0;city?.reset();bus=journeyBus();wheelAngle=0;frameCamera(true);}},
    {text:'Suara lingkungan: '+(sound?'aktif':'mati'),secondary:true,run:()=>{sound=!sound;if(sound)void audio.start();else audio.stop();}},
    hub?{text:'Peta perjalanan',secondary:true,run:()=>journeyBoard?.open()}:{text:'Peta level',href:'./adventure-map.html',secondary:true},
  ],'MENU KAWASAN');el('graphicsOptions').append(graphicsControl);}
  const controls=attachAdventureControls({canvas,keys,joy,active:()=>started&&!budget.lost(),look:(dx,dy)=>{cameraYaw-=dx*.004;rig.orbitPitch(dy);lastLook=performance.now();},interact,pause,extraKeys:['Space']});
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});intro.addEventListener('cancel',e=>e.preventDefault());
  el('pauseButton').onclick=pause;el('interactButton').onclick=interact;
  el('missionButton').onclick=hub?()=>journeyBoard?.open():missionBook;
  if(hub){let tap:{x:number;y:number;id:number}|null=null;canvas.addEventListener('pointerdown',e=>{if(e.button===0&&controls.playable())tap={x:e.clientX,y:e.clientY,id:e.pointerId};});canvas.addEventListener('pointerup',e=>{const t=tap;tap=null;if(t&&t.id===e.pointerId&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<8&&controls.playable()&&boardPoint&&Math.hypot(hero.x-boardPoint.x,hero.z-boardPoint.z)<22)journeyBoard?.tap(e.clientX,e.clientY,camera,canvas);});canvas.addEventListener('pointercancel',()=>{tap=null;});}
  el('cameraButton').onclick=()=>{cameraYaw=driving?bus.yaw:heading;lastLook=0;rig.reset();};
  el('fastButton').onclick=()=>{fast=!fast;el('fastButton').setAttribute('aria-pressed',String(fast));};
  const life=installLife(world.scene,{chapter:'district',station:{x:-7,z:18},bag:{x:-18,z:14},active:()=>controls.playable()&&!driving});
  const brake=el('brakeButton');brake.addEventListener('pointerdown',e=>{if(controls.playable()){e.preventDefault();keys.add('Space');brake.setPointerCapture(e.pointerId);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,()=>keys.delete('Space'));
  window.addEventListener('blur',()=>{fast=false;el('fastButton').setAttribute('aria-pressed','false');audio.stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.stop();});
  const avatar=el<HTMLSelectElement>('districtAvatar');avatar.value=save.avatar;avatar.disabled=!!readSetup();
  if(transfer){const article=intro.querySelector('article')!;article.querySelector('h1,h2')!.textContent='Bersama '+transferGuide+' menuju '+transfer.title;const description=article.querySelector('p');if(description)description.textContent='Naik bus, kemudikan mengikuti rute kota, lalu temui '+transferGuide+' di terminal. Setelah perjalanan ini, kamu langsung memulai misi '+transfer.title+'.';el('npcFarid').innerHTML='PETUGAS ROMBONGAN';el('npcSalma').textContent=transferGuide.toUpperCase()+' · PENDAMPING';el('districtCoins').closest('.rewardCard')?.setAttribute('hidden','');}
  el<HTMLButtonElement>('startDistrict').disabled=false;el('startDistrict').textContent=save.stage?'Lanjutkan perjalanan':'Mulai jelajahi kawasan';
  if(minaToArafah){const article=intro.querySelector('article')!;article.querySelector('h1,h2')!.textContent='Mina → Arafah · pagi 9 Zulhijah';const p=article.querySelector('p');if(p)p.textContent='Setelah Subuh dan matahari terbit, berangkat bersama '+transferGuide+' dari Mina menuju Arafah. Naik bus, ikuti rute ilustratif perjalanan, parkir dan turun. Talbiyah menemani perjalanan; kegiatan Arafah dimulai setelah bertemu pembimbing di terminal.';}
  if(muzdalifahToMina){const article=intro.querySelector('article')!;article.querySelector('h1,h2')!.textContent='Muzdalifah → Mina · pagi Aqabah';const p=article.querySelector('p');if(p)p.textContent='Setelah fajar terang, rombongan berangkat menuju Mina. Kemudikan bus pada rute ilustratif, parkir dan temui '+transferGuide+'. Di Jamarat, ikuti jadwal petugas untuk melontar Aqabah.';}
  if(arafahToMuzdalifah){const article=intro.querySelector('article')!;article.querySelector('h1,h2')!.textContent='Arafah → Muzdalifah · perjalanan malam';const p=article.querySelector('p');if(p)p.textContent='Matahari telah terbenam. Bersama '+transferGuide+', kemudikan bus dengan tenang menuju Muzdalifah pada rute ilustratif kawasan. Setelah parkir dan turun, temui pembimbing. Magrib dan Isya dilaksanakan setelah tiba.';}
  if(transfer)el('startDistrict').textContent=save.stage>=4?'Temui '+transferGuide+' di terminal':magicBoarding?'Naik bus bersama '+transferGuide+' →':'Ayo naik bus →';
  if(magicBoarding){const article=intro.querySelector('article')!,description=article.querySelector('p');if(description)description.textContent=(demoBoarding?'DEMO · Tidak ada transaksi pembayaran. ':'')+'Assalamualaikum, saya '+transferGuide+'. Bus sudah siap. Mari naik bersama, kemudian kamu bisa mengemudikan bus menuju '+transfer!.title+'. Gunakan W/S untuk maju-mundur, A/D untuk belok, dan Spasi untuk rem. Di HP gunakan joystick dan Rem.';}
  el('startDistrict').onclick=()=>{const chosen=avatar.value==='female'?'female':'male';if(save.avatar!==chosen){save={...save,avatar:chosen};makePlayer();}persist();intro.hidden=true;intro.close();started=true;controls.clear();if(magicBoarding&&save.stage<4)boardBus();if(sound)void audio.start();canvas.focus();};
  if(hub){intro.hidden=true;started=true;document.documentElement.classList.add('districtHubMode');document.title='Distrik Perjalanan — HAJJI.DIGITAL';el('objectiveNumber').parentElement!.firstChild!.textContent='HAJJI.DIGITAL ';el('districtCoins').closest('.rewardCard')?.setAttribute('hidden','');el('actionHint').textContent='Pilih gedung · naik kendaraan · masuk pintu';el('missionButton').setAttribute('aria-label','Baca peta perjalanan');canvas.focus();}else{intro.hidden=false;intro.showModal();}
  function resize(){budget.resize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  window.addEventListener('resize',resize);resize();frameCamera(true);
  const f={f0:0,f1:0,frac:0,frameB:0,blend:0},projected=new THREE.Vector3();
  function submit(r:Pick<CrowdRenderer,'submit'>,x:number,z:number,yaw:number,phase:number,moving:boolean,palette=0,motion?:DistrictLocomotion){if(!motion){resolveFrames(moving?Clip.WALK:Clip.IDLE,phase,f);f.frameB=f.f0;}const pose=motion?.pose??f;const distance=Math.hypot(x-camera.position.x,z-camera.position.z);r.submit(distance<20?0:distance<60?1:2,x,.1,z,yaw,1.74,1,pose.f0,pose.f1,pose.frac,pose.frameB,pose.blend,palette,1);}
  function label(id:string,p:{x:number;z:number}){const item=el(id);projected.set(p.x,2.5,p.z).project(camera);item.hidden=!started||projected.z>1||projected.z< -1||Math.hypot(hero.x-p.x,hero.z-p.z)>28;item.style.left=(projected.x*.5+.5)*innerWidth+'px';item.style.top=(-projected.y*.5+.5)*innerHeight+'px';}
  const cache=new Map<string,string>();
  const busGuide=document.createElement('aside');busGuide.className='busGuide';busGuide.setAttribute('aria-live','polite');busGuide.hidden=true;const busGuideName=document.createElement('strong'),busGuideLine=document.createElement('span');busGuideName.textContent=transferGuide.toUpperCase()+' · RADIO ROMBONGAN';busGuide.append(busGuideName,busGuideLine);if(transfer)document.body.append(busGuide);
  let walkingPath:Point[]=[],navigationTime=-Infinity,navigationStage=-1;
  el('mapRoute').setAttribute('points',TERMINAL_ROUTE.map(p=>`${p.x+70},${p.z+57}`).join(' '));
  function text(id:string,value:string){if(cache.get(id)!==value){el(id).textContent=value;cache.set(id,value);}}
  let previous=performance.now(),frame=0;
  function tick(now:number){
    frame=requestAnimationFrame(tick);const dt=Math.min(.06,(now-previous)/1000);previous=now;const active=controls.playable(),step=active?dt:0;clock+=step*1000;
    const beforeX=hero.x,beforeZ=hero.z;
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-joy.y;
    const right=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joy.x;
    if(city&&cityVehicle){if(active){const before=cityVehicle;cityVehicle=city.drive(cityVehicle,forward,right,(simpleSprinting()||keys.has('Space')),step);city.update(cityVehicle);wheelAngle=(wheelAngle+wheelTravel(before,cityVehicle))%(Math.PI*2);bus=cityVehicle;if(now-lastLook>1500)cameraYaw+=Math.atan2(Math.sin(bus.yaw-cameraYaw),Math.cos(bus.yaw-cameraYaw))*followAlpha(3,step);}hero.set(cityVehicle.x,0,cityVehicle.z);}
    else if(driving){
      if(active){const previousBus=bus;bus=stepBus(bus,forward,right,simpleSprinting()||keys.has('Space'),step);wheelAngle=(wheelAngle+wheelTravel(previousBus,bus))%(Math.PI*2);if(now-lastLook>1800){const delta=Math.atan2(Math.sin(bus.yaw-cameraYaw),Math.cos(bus.yaw-cameraYaw));cameraYaw+=delta*followAlpha(2,step);}
        if(transfer&&save.stage===3){const gate=nextTransferGate(bus,(save as TransferSave).gate);if(gate!==(save as TransferSave).gate){save={...save,gate} as TransferSave;persist();}if(bus.speed>7.5)bus.speed=7.5;}
        if(save.stage===3&&atTerminal(bus)&&(!transfer||(save as TransferSave).gate===TRANSFER_ROUTE.length))advance('arrive');}
      hero.set(bus.x,0,bus.z);
    }else if(active&&city&&queuedBuilding!==null){
      const q=city.queueApproach(queuedBuilding,queueStage);if(q){const dx=q.x-hero.x,dz=q.z-hero.z,d=Math.hypot(dx,dz);if(d>.08){const move=Math.min(d,2.8*step);hero.x+=dx/d*move;hero.z+=dz/d*move;heading+=Math.atan2(Math.sin(Math.atan2(dx,dz)-heading),Math.cos(Math.atan2(dx,dz)-heading))*followAlpha(14,step);audio.step();}else if(queueStage<2)queueStage++;else if(city.queueAhead(queuedBuilding)===0){const number=queuedBuilding;city.leaveQueue(number);queuedBuilding=null;queueAuthorized=number;cityEnter();}}
    }else if(active){
      const m=cameraMove(forward,right,cameraYaw),speed=((simpleSprinting()||fast||keys.has('ShiftLeft')||keys.has('ShiftRight'))&&life.canSprint()?4.4:2.8)*life.factor(hero);
      const nextX=hero.x+m.x*speed*step,nextZ=hero.z+m.z*speed*step;
      if(walkAllowed(nextX,hero.z)&&(city||!insideBus({x:nextX,z:hero.z},bus)))hero.x=nextX;
      if(walkAllowed(hero.x,nextZ)&&(city||!insideBus({x:hero.x,z:nextZ},bus)))hero.z=nextZ;
      if(Math.hypot(hero.x-beforeX,hero.z-beforeZ)>.001){const desired=Math.atan2(m.x,m.z);heading+=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading))*followAlpha(14,step);audio.step();}
    }
    if(city){document.documentElement.dataset.playerQueue=queuedBuilding===null?'idle':String(city.queueAhead(queuedBuilding));}
    if(!hub)life.tick(step,hero,active,simpleSprinting()||fast||keys.has('ShiftLeft')||keys.has('ShiftRight'),driving);
    playerMotion.update(driving?0:Math.hypot(hero.x-beforeX,hero.z-beforeZ),step,active&&!driving);
    let companionTravel=0;
    if(!hub&&!transfer&&save.stage===5&&errands.stage===1&&active){const next=stepCompanion(hasan,hero,step,driving,bus);companionTravel=Math.hypot(next.x-hasan.x,next.z-hasan.z);
      if(next.gate!==hasan.gate){errands={...errands,escortGate:next.gate};persistErrands();}hasan=next;}
    hasanMotion.update(companionTravel,step,active);
    let bonusGoal:Point|null=errands.stage===0?hasan:errands.stage===1?hasan.waiting==='distance'||Math.hypot(hero.x-hasan.x,hero.z-hasan.z)>6.5?hasan:ESCORT_PATH[Math.min(3,hasan.gate+1)]:errands.stage===2?ERRAND_STATIONS.rizal:errands.stage===3?ERRAND_STATIONS.delivery:null;
    const walkingNavigation=!hub&&!transfer&&save.stage===5&&!driving&&(errands.stage===0||errands.stage===2||errands.stage===3);
    if(walkingNavigation&&bonusGoal){if(now-navigationTime>300||navigationStage!==errands.stage){walkingPath=walkingRoute(hero,bonusGoal);navigationTime=now;navigationStage=errands.stage;}bonusGoal=walkingPath.find((p,i)=>i>0&&Math.hypot(p.x-hero.x,p.z-hero.z)>1)??bonusGoal;}
    world.update(clock,city?city.bus():bus,save.stage,save.stage===2,hero,heading,hub?{target:null,parcel:false}:transfer?{target:save.stage>=4?STATIONS.arrival:save.stage===3?transferCue(bus,(save as TransferSave).gate).target:bus,parcel:false}:save.stage===5?{target:bonusGoal,parcel:errands.stage===3&&!driving}:undefined,wheelAngle);
    if(hub)world.luggage.visible=false;
    if(city&&journeyBoard)city.render(cityVehicle,wheelAngle,journeyBoard.available(),targetLevel);
    player.beginFrame();if(!driving)submit(player,hero.x,hero.z,heading,0,false,save.avatar==='female'?8:0,playerMotion);player.endFrame();
    crowd.beginFrame();submit(crowd,STATIONS.briefing.x,STATIONS.briefing.z,Math.atan2(hero.x+12,hero.z-17),clock*.00015,false,9);
    for(const n of npcs){
      n.waiting=npcWaiting(Math.hypot(n.x-hero.x,n.z-hero.z),n.waiting)||insideBus(n,bus,.9);let travel=0;
      if(active&&!n.waiting){const tx=n.route[n.index*2],tz=n.route[n.index*2+1],d=Math.hypot(tx-n.x,tz-n.z);if(d<.15)n.index=(n.index+1)%4;else{const direction=Math.atan2(tx-n.x,tz-n.z);travel=Math.min(d,step*.75);n.x+=Math.sin(direction)*travel;n.z+=Math.cos(direction)*travel;}}
      n.motion.update(travel,step,active);
      if(active){const desired=n.waiting?Math.atan2(hero.x-n.x,hero.z-n.z):Math.atan2(n.route[n.index*2]-n.x,n.route[n.index*2+1]-n.z);n.yaw+=Math.atan2(Math.sin(desired-n.yaw),Math.cos(desired-n.yaw))*followAlpha(8,step);}
      submit(crowd,n.x,n.z,n.yaw,0,false,n.palette,n.motion);
    }
    if(save.stage===5){submit(crowd,hasan.x,hasan.z,hasanMotion.moving?hasan.yaw:Math.atan2(hero.x-hasan.x,hero.z-hasan.z),0,false,5,hasanMotion);submit(crowd,ERRAND_STATIONS.rizal.x,ERRAND_STATIONS.rizal.z,Math.atan2(hero.x-ERRAND_STATIONS.rizal.x,hero.z-ERRAND_STATIONS.rizal.z),clock*.00015,false,9);}
    crowd.endFrame();
    const guidePoint=magicBoarding&&save.stage<4?{x:bus.x-3,z:bus.z+1.5}:STATIONS.arrival;
    salma.beginFrame();if(!magicBoarding||!driving||save.stage>=4)submit(salma,guidePoint.x,guidePoint.z,Math.atan2(hero.x-guidePoint.x,hero.z-guidePoint.z),clock*.00016,false,transfer&&save.avatar==='male'?0:8);salma.endFrame();
    cameraPresentation.update(hero,cameraYaw,step);rig.framing=cameraPresentation.framing;
    rig.update(cameraPresentation.focus.x,cameraPresentation.focus.z,cameraPresentation.focus.yaw,dt);
    const targetFov=driving&&!reducedMotion.matches?61+Math.abs(bus.speed)*.45:61;
    if(Math.abs(camera.fov-targetFov)>.02){camera.fov+=(targetFov-camera.fov)*followAlpha(3,step);camera.updateProjectionMatrix();}
    const goal=city?.places.find(b=>b.number===targetLevel)?.door??boardPoint??(transfer?(save.stage>=4?STATIONS.arrival:save.stage===3?transferCue(bus,(save as TransferSave).gate).target:bus):save.stage===5?(bonusGoal??STATIONS.arrival):save.stage===2?bus:DISTRICT_STEPS[save.stage].target);
    if(cityMinimap)cityMinimap.update(hero,driving?bus.yaw:heading,targetLevel,now);
    else{el('mapPlayer').setAttribute('transform',`translate(${hero.x+70} ${hero.z+57}) rotate(${180-(driving?bus.yaw:heading)*180/Math.PI})`);el('mapGoal').setAttribute('cx',String(goal.x+70));el('mapGoal').setAttribute('cy',String(goal.z+57));}
    const bonusTitles=['Opsional: temui Pak Hasan','Dampingi Pak Hasan ke halte','Opsional: temui petugas kedai','Antar paket ke Bu Salma','Semua bantuan selesai'];
    const escortHint=hasan.waiting==='distance'?'Pak Hasan menunggu. Kembali mendekat; jaga jarak maksimal 7 m.':hasan.waiting==='vehicle'?'Turun dari kendaraan untuk berjalan bersama Pak Hasan.':hasan.waiting==='bus'?'Bus menghalangi jalur Pak Hasan. Pindahkan kendaraan dahulu.':hasan.gate===3?'Pak Hasan sudah di halte. Bicara dengannya untuk menerima reward.':'Berjalan bersama di jalur menuju halte. Pak Hasan menunggu bila kamu menjauh.';
    const bonusDetails=['Ada jemaah yang membutuhkan teman berjalan. Ikuti penanda emas di pelataran.',escortHint,'Pak Rizal berada di deretan kedai sebelah utara penginapan.','Bawa paket ke pelataran terminal, lalu serahkan melalui Interaksi.','Dua misi tambahan selesai. Lanjutkan manasik atau jelajahi kawasan.'];
    text('missionTitle',save.stage===5?bonusTitles[errands.stage]:DISTRICT_STEPS[save.stage].title);text('missionDetail',save.stage===5?bonusDetails[errands.stage]:DISTRICT_STEPS[save.stage].detail);text('objectiveNumber',save.stage<5?`MISI ${save.stage+1} / 5`:errands.stage===4?'2/2 BANTUAN SELESAI':'MISI TAMBAHAN · '+(errands.stage<2?'1/2':'2/2'));el('missionFill').style.width=(save.stage===5?[0,25,50,75,100][errands.stage]:save.stage*20)+'%';text('districtCoins',String(districtReward(save)+(save.stage===5?errandReward(errands):0)));
    if(transfer){const gate=(save as TransferSave).gate;text('missionTitle',save.stage<3?(muzdalifahToMina?'Naik bus Muzdalifah → Mina':minaToArafah?'Naik bus Mina → Arafah':arafahToMuzdalifah?'Naik bus malam ke Muzdalifah':'Naik bus rombongan'):save.stage===3?(muzdalifahToMina?'Muzdalifah → Mina · Aqabah':minaToArafah?'Mina → Arafah · bersama rombongan':arafahToMuzdalifah?'Arafah → Muzdalifah · malam':'Menuju '+transfer.title):'Temui '+transferGuide+' di terminal');text('missionDetail',save.stage<3?'Dekati bus dan tekan AKSI. '+transferGuide+' menunggu rombongan siap berangkat.':save.stage===3?'Ikuti garis rute. Pelan di tikungan, lalu rem di terminal.':'Parkir dan turun dari bus, lalu dekati '+transferGuide+' untuk memulai misi.');text('objectiveNumber','PERJALANAN KE LEVEL '+transfer.number);el('missionFill').style.width=(save.stage>=4?100:Math.round(gate/TRANSFER_ROUTE.length*85))+'%';}
    if(hub&&journeyBoard){const p=journeyBoard.progress();text('missionTitle','Tujuan · Gedung '+targetLevel);text('missionDetail',queuedBuilding!==null?'Tetap di barisan sampai giliran Anda. AKSI untuk keluar.':cityVehicle?'Kemudikan '+(city?.label(cityVehicle.kind)??'kendaraan')+' menuju gedung tujuan.':'Pilih tujuan di papan. Naik kendaraan atau berjalan ke pintu gedung.');text('objectiveNumber',p.done+' / '+p.total+' LEVEL SELESAI');el('missionFill').style.width=(p.done/p.total*100)+'%';}
    if(transfer){busGuide.hidden=!driving||!active;const gate=(save as TransferSave).gate;const line=save.stage>=4?'Kita sudah sampai. Tekan AKSI untuk turun, lalu temui saya di pelataran terminal.':gate<8?(muzdalifahToMina?'Kita menuju Mina pada 10 Zulhijah. Bawa tujuh kerikil dan ikuti petugas di Jamarat.':minaToArafah?'Kita berangkat dari Mina menuju Arafah pada pagi 9 Zulhijah. Ikuti rute dengan tenang dan lanjutkan talbiyah.':arafahToMuzdalifah?'Kita meninggalkan Arafah setelah matahari terbenam. Lanjutkan talbiyah dan kemudikan bus dengan tenang menuju Muzdalifah.':'Ikuti garis rute ke kiri, lalu kelilingi kawasan. Tidak perlu mengebut; saya menemanimu lewat radio.'):gate<16?'Lihat bangunan di sepanjang jalan. Pelankan bus di tikungan dan jaga rombongan tetap nyaman.':gate<21?'Sebentar lagi tiba di lokasi '+transfer.title+'. Persiapanmu dan bekal akan terbawa ke misi.':'Terminal ada di depan. Tahan Rem sampai bus berhenti, lalu turun untuk bertemu saya.';if(busGuideLine.textContent!==line)busGuideLine.textContent=line;}
    const navigation=!city&&driving&&save.stage===3;if(!city)el('mapRoute').toggleAttribute('hidden',!navigation&&!walkingNavigation);el('routeCue').hidden=!navigation&&!walkingNavigation;
    if(navigation){el('mapRoute').setAttribute('points',(transfer?TRANSFER_ROUTE:TERMINAL_ROUTE).map(p=>`${p.x+70},${p.z+57}`).join(' '));const cue=transfer?transferCue(bus,(save as TransferSave).gate):routeCue(bus);text('routeCue',cue.text+' · '+cue.remaining+' m');}
    else if(walkingNavigation){el('mapRoute').setAttribute('points',walkingPath.map(p=>`${p.x+70},${p.z+57}`).join(' '));text('routeCue',errands.stage===0?'Ikuti rute jalan kaki ke Pak Hasan':errands.stage===2?'Ikuti rute jalan kaki ke kedai':'Ikuti rute jalan kaki ke pembimbing');}
    if(!city){text('targetDistance',Math.round(Math.hypot(hero.x-goal.x,hero.z-goal.z))+' m');text('locationName',hero.x>28?'TERMINAL & JALAN TIMUR':Math.abs(hero.z)>20?'JALAN ROMBONGAN':'PELATARAN PENGINAPAN');}
    text('speed',String(Math.round(Math.abs(bus.speed)*3.6)));el('vehicleInfo').hidden=!driving;el('brakeButton').hidden=!driving;el('fastButton').hidden=driving;text('movementLabel',driving?'W/S · MAJU / MUNDUR':'WASD · JALAN');if(cityVehicle)el('vehicleInfo').querySelector('small')!.textContent=city?.label(cityVehicle.kind).toUpperCase()??'';
    let prompt='';
    if(driving)prompt=Math.abs(bus.speed)<=.5?'Turun dari bus':'Berhenti untuk turun';
    else if(Math.hypot(hero.x+12,hero.z-17)<2.8)prompt='Bicara dengan Pak Farid';
    else if(save.stage===1&&Math.hypot(hero.x+5,hero.z-15)<2.2)prompt='Ambil koper';
    else if(insideBus(hero,bus,2.2))prompt='Naik bus';
    else if(Math.hypot(hero.x-30,hero.z+12)<2.8)prompt='Bicara dengan '+arrivalGuide;
    if(!transfer&&!driving&&save.stage===5&&Math.hypot(hero.x-hasan.x,hero.z-hasan.z)<2.8)prompt='Bicara dengan Pak Hasan';
    else if(!transfer&&!driving&&save.stage===5&&Math.hypot(hero.x-ERRAND_STATIONS.rizal.x,hero.z-ERRAND_STATIONS.rizal.z)<2.8)prompt='Bicara dengan Pak Rizal';
    else if(!prompt&&npcs.some(n=>Math.hypot(hero.x-n.x,hero.z-n.z)<2))prompt='Sapa jemaah';
    if(city){const entry=city.entrance(hero),v=city.near(hero),tail=city.queueNear(hero);prompt=queuedBuilding!==null?'Keluar antrean':cityVehicle?(Math.abs(cityVehicle.speed)<=.5?'Turun dari '+city.label(cityVehicle.kind):'Rem dahulu'):tail!==null||entry?'Ikut antrean':v?'Naik '+city.label(v.kind):boardPoint&&Math.hypot(hero.x-boardPoint.x,hero.z-boardPoint.z)<12?'Baca peta perjalanan':'';}
    el('interactButton').hidden=!prompt;el<HTMLButtonElement>('interactButton').disabled=driving&&Math.abs(bus.speed)>.5;text('interactButton','AKSI');el('interactButton').setAttribute('aria-label','AKSI · '+prompt);el('actionHint').textContent=queuedBuilding!==null?'Antrean Gedung '+queuedBuilding+' · '+(city?.queueAhead(queuedBuilding)??0)+' orang di depan · AKSI untuk keluar':prompt||'Dekati antrean, kendaraan, atau papan perjalanan';
    label('npcFarid',STATIONS.briefing);label('npcSalma',guidePoint);if(magicBoarding&&driving&&save.stage<4)el('npcSalma').hidden=true;label('npcHasan',hasan);label('npcRizal',ERRAND_STATIONS.rizal);if(save.stage!==5){el('npcHasan').hidden=true;el('npcRizal').hidden=true;}city?.updateGuards(hero,step,camera,active);if(hub){for(const id of ['npcFarid','npcSalma','npcHasan','npcRizal'])el(id).hidden=true;}budget.draw(now,world.scene,camera,!active);
  }
  if(!hub)mountSimplePlayHud('district');
  if(import.meta.env.DEV){
    const lights:string[]=[],colorMapsNotSRGB:string[]=[];let casters=0;
    world.scene.traverse(o=>{if(o instanceof THREE.Light)lights.push(o.type+':'+o.intensity);if(o instanceof THREE.Mesh){if(o.castShadow)casters++;for(const m of Array.isArray(o.material)?o.material:[o.material])if('map'in m&&m.map instanceof THREE.Texture&&m.map.colorSpace!==THREE.SRGBColorSpace)colorMapsNotSRGB.push(m.type);}});
    Object.defineProperty(window,'__districtDebug',{configurable:true,value:Object.freeze({snapshot:()=>({stage:save.stage,transfer:transfer?{id:transfer.id,gate:(save as TransferSave).gate}:null,avatar:save.avatar,life:life.snapshot(),driving,x:hero.x,z:hero.z,heading,cameraYaw,bus:{...bus},errands:{...errands},hasan:{...hasan},calls:renderer.info.render.calls,npcs:npcs.length,waiting:npcs.filter(n=>n.waiting).length,playable:controls.playable(),presentation:{focus:{...cameraPresentation.focus},framing:{...rig.framing},camera:camera.position.toArray(),fov:camera.fov,locomotion:{moving:playerMotion.moving,phase:playerMotion.phase,...playerMotion.pose},wheels:world.wheels.map(w=>({front:w.front,steer:w.steering.rotation.y,roll:w.rolling.rotation.x}))},lighting:{lights:[...lights],casters,environment:!!world.scene.environment,shadowMap:renderer.shadowMap.enabled,toneMapping:renderer.toneMapping,colorMapsNotSRGB:[...colorMapsNotSRGB]}})})});
  }
  frame=requestAnimationFrame(tick);
  window.addEventListener('pagehide',e=>{controls.clear();audio.stop();if(e.persisted)return;cancelAnimationFrame(frame);journeyBoard?.dispose();city?.dispose();life.dispose();controls.dispose();audio.dispose();player.dispose();crowd.dispose();salma.dispose();budget.dispose();world.dispose();renderer.dispose();},{once:true});
}
if(new URLSearchParams(location.search).has('board')){document.documentElement.classList.add('districtHubLoading');void import('./districtBoard.ts').then(async m=>{const access=await m.verifyDistrictBoard();save={...save,stage:0,avatar:journeyAvatar(save.avatar)};document.documentElement.classList.remove('districtHubLoading');boot({access,module:m});}).catch(error=>{document.documentElement.classList.remove('districtHubLoading');el('districtError').hidden=false;el('districtError').querySelector('h2')!.textContent='AKSES BELUM AKTIF';el('errorMessage').textContent=error instanceof Error?error.message:'Buka kembali magic link pribadi.';const panel=el('districtError');panel.querySelectorAll('a').forEach(a=>a.remove());const a=document.createElement('a');a.className='primary';a.href=tenantUrl('./index.html');a.textContent='Kembali ke gerbang';panel.append(a);});}else if(requestedTransfer&&!transfer){location.replace(tenantUrl('./adventure-map.html?journey='+readSetup()?.program));}else try{boot();}catch(error){intro.hidden=true;if(intro.open)intro.close();el('districtError').hidden=false;el('errorMessage').textContent='Kawasan membutuhkan WebGL. '+(error instanceof Error?error.message:'Coba muat ulang browser.');console.error(error);}
