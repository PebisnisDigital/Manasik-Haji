import {hajjLevelMessage} from './adventure/levelMessages.ts';
import {mountSimplePlayHud} from './simplePlayHud.ts';
import {simpleMenuOpen} from './simpleInput.ts';
import * as THREE from 'three';
import {attachWalker,type Obstacle} from './coreWalk.ts';
import {readSetup,saveSetup} from './frontSettings.ts';
import {defaultSetup} from './frontModel.ts';
import {gateGuide} from './gateGuide.ts';
import {tenantUrl,bootTenant} from './tenant.ts';
import {miqatEntryUrl,saveStory} from './travelStory.ts';
import {miqatCards,type MiqatCard} from './adventure/miqat.ts';
import {lifeOpen} from './adventure/lifeWorld.ts';
import {wearIhram} from './characters/playerAppearance.ts';
import {humanActor,updateHumanActors,disposeHumanActors} from './characters/HumanActors.ts';
import {graphicsTier,createRenderBudget} from './graphicsQuality.ts';
import {surfaceDetail,staticShadows,disposeSurface} from './env/GraphicsDetail.ts';
import {installLandscape} from './coreLandscape.ts';
import {MIQAT_GOALS,MIQAT_BOUNDS,MIQAT_OBSTACLES,MIQAT_GATE,readMiqatLesson,storeMiqatLesson,miqatLessonKey} from './miqatLessonModel.ts';
import {completeMiqatLesson} from './miqatLessonProgress.ts';
import {mountArrivalJourney,arrivalResumePoint} from './arrivalJourney.ts';
import {readArrivalJourney,storeArrivalJourney,canEnterArrival,arrivalJourneyKey} from './arrivalJourneyModel.ts';
import {canEnterContinuousTawaf,readTawafTour,continuousTawafResume,TAWAF_BOUNDS,tawafTourKey} from './continuousTawafModel.ts';
import {saiTransferKey,readSaiTransfer,canStartSaiTransfer,SAI_TRANSFER_BOUNDS} from './saiTransferModel.ts';
import {QUEST_KEYS} from './adventure/questProgress.ts';
import './miqatRoom.css';

export function mountMiqatRoom(){
 const setup=readSetup()??defaultSetup();
 if(!readSetup()&&!saveSetup(setup)){document.body.textContent='Pengaturan belum dapat disimpan. Periksa penyimpanan browser lalu muat ulang.';return;}
 const requestedArrival=new URLSearchParams(location.search).has('arrival');
 const requestedSai=new URLSearchParams(location.search).has('sai');
 const requestedTawaf=new URLSearchParams(location.search).has('tawaf');
 const canonical=new URL(miqatEntryUrl(new URLSearchParams(location.search).has('preview'))+(requestedArrival?'&arrival=1':'')+(requestedTawaf?'&tawaf=1':'')+(requestedSai?'&sai=1':''),location.href);
 if(location.search!==canonical.search){location.replace(canonical.href);return;}
 for(const id of ['gameFront','lobby','cinematicIntro'])document.getElementById(id)?.remove();
 document.documentElement.className='miqatRoomMode';bootTenant();document.title='Miqat & Ihram · HAJJI.DIGITAL';
 const guide=gateGuide(setup.avatar),mapUrl=tenantUrl('./adventure-map.html?journey='+setup.program);
 let lesson=readMiqatLesson(setup.program,setup.avatar),failed=false,portrait=()=>false,disposed=false;
 let arrival:ReturnType<typeof mountArrivalJourney>|null=null;
 const resumeTawaf=setup.program==='hajj'&&canEnterContinuousTawaf()&&(requestedTawaf||requestedSai||readTawafTour(setup.avatar).active);
 const resumeArrival=canEnterArrival(setup.program)&&(resumeTawaf||requestedArrival||readArrivalJourney(setup.program,setup.avatar).active);
 const root=document.createElement('main');root.className='miqatRoom';root.innerHTML='<div class="miqatWorld"><canvas aria-label="Arena 3D Miqat dan Ihram"></canvas><div class="miqatGuideTag"></div></div><header class="miqatHeader"><div><b>HAJJI<span>.DIGITAL</span></b><small>LEVEL 1 · MIQAT & IHRAM</small></div><button id="miqatPause" aria-haspopup="dialog">Jeda / bantuan</button></header><section class="miqatObjective" aria-labelledby="miqatGoal"><div class="miqatEyebrow" id="miqatCount"></div><h1 id="miqatGoal"></h1><p id="miqatHint"></p><div class="miqatProgress" aria-label="Progres persiapan"><span></span></div><div class="miqatActions"><button id="miqatWalk">Jalan ke penanda</button><button id="miqatInteract" class="miqatPrimary">Interaksi · E</button></div><p id="miqatNotice" role="status"></p><small>WASD / stik kiri · Geser kamera · E untuk interaksi</small></section>';
 document.body.append(root);
 const $=<T extends HTMLElement>(id:string)=>root.querySelector<T>('#'+id)!;
 const host=root.querySelector<HTMLElement>('.miqatWorld')!,canvas=host.querySelector('canvas')!,tag=host.querySelector<HTMLElement>('.miqatGuideTag')!;
 const viewButton=document.createElement('button');viewButton.id='arrivalLook';viewButton.textContent='Arahkan kamera ke Ka’bah';viewButton.hidden=true;viewButton.onclick=()=>{const tawaf=arrival?.tawaf();if(tawaf?.view().mode==='circling')tawaf.reading();else arrival?.focus();};root.querySelector('.miqatActions')!.prepend(viewButton);
 const dialog=document.createElement('dialog');dialog.className='miqatDialog';dialog.setAttribute('aria-labelledby','miqatDialogTitle');document.body.append(dialog);
 const blocked=()=>simpleMenuOpen()||dialog.open||portrait()||failed;
 // A history restore must rebuild the WebGL resources released on pagehide.
 window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
 function close(){dialog.close();window.dispatchEvent(new Event('blur'));paint();}
 function button(label:string,fn:()=>void,primary=true,id?:string){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=primary?'miqatPrimary':'';if(id)b.id=id;b.onclick=fn;return b;}
 function show(title:string,body:string,actions:{label:string;fn:()=>void;id?:string;primary?:boolean}[],card?:MiqatCard){
  dialog.replaceChildren();const eyebrow=document.createElement('div');eyebrow.className='miqatEyebrow';const number=Number(title.match(/level\s+(\d+)/i)?.[1]??(arrival?.tawaf()?.transferView()?3:arrival?2:1));dialog.dataset.level=String(number);eyebrow.textContent='LEVEL '+number+' · '+guide.name+(arrival?.tawaf()?' · RADIO PEMANDU':'');const heading=document.createElement('h2');heading.id='miqatDialogTitle';heading.textContent=title;const p=document.createElement('p');p.textContent=body;dialog.append(eyebrow,heading,p);
  if(card)for(const field of ['arabic','latin','meaning'] as const)if(card[field]){const line=document.createElement('p');line.className='miqatReading '+field;line.textContent=card[field]!;if(field==='arabic'){line.lang='ar';line.dir='rtl';}dialog.append(line);}
  const status=document.createElement('p');status.id='miqatDialogNotice';status.setAttribute('role','status');dialog.append(status);
  const row=document.createElement('div');row.className='miqatDialogActions';for(const a of actions)row.append(button(a.label,a.fn,a.primary!==false,a.id));row.append(button('Kembali ke arena',close,false,'miqatClose'));dialog.append(row);
  window.dispatchEvent(new Event('blur'));if(!dialog.open)dialog.showModal();dialog.scrollTop=0;row.querySelector('button')?.focus();
 }
 function warning(message='Progres belum tersimpan atau berubah di tab lain. Coba lagi, atau muat ulang untuk melanjutkan checkpoint.'){$('miqatNotice').textContent=message;dialog.querySelector('#miqatDialogNotice')?.replaceChildren(document.createTextNode(message));}
 function save(stage:number,book=lesson.book){const next={version:1 as const,stage,book};if(!storeMiqatLesson(setup.program,setup.avatar,next)){warning();return false;}lesson=next;return true;}
 function advance(stage:number,book=lesson.book){if(!save(stage,book))return;close();setGoal();}
 function card(title:string,data:MiqatCard,next:()=>void,label='Sudah dipelajari'){show(title,data.body,[{label,fn:next,id:'miqatContinue'}],data);}
 function interact(){
  if(arrival){if(!lifeOpen())arrival.interact();return;}
  if(blocked()||lifeOpen()||!walker.near())return;
  walker.face(lesson.stage===0||lesson.stage===5?0:MIQAT_GOALS[lesson.stage].x,lesson.stage===0||lesson.stage===5?3.5:MIQAT_GOALS[lesson.stage].z-.8);
  if(lesson.stage===0)show('Selamat datang, petualang!',`Saya ${guide.name}, pembimbingmu. Kita mulai di sini, di tempat persiapan Miqat & Ihram. Masuk melalui pintu di belakang saya. Siapkan pakaian ihram, ambil buku niat, lalu pelajari talbiyah. Ikuti penanda emas; kamu bisa berjalan sendiri atau memakai tombol bantuan.`,[{label:'Baik, saya masuk ruang persiapan',fn:()=>advance(1),id:'miqatContinue'}]);
  else if(lesson.stage===1)show('Ruang persiapan Miqat', 'Mulai dari ruang ganti di sebelah kiri. Kita belajar mempersiapkan pakaian sebelum melanjutkan niat dan talbiyah.',[{label:'Cari tempat pakaian ihram',fn:()=>advance(2),id:'miqatContinue'}]);
  else if(lesson.stage===2){const clothes=miqatCards(0,setup.avatar,'madinah',setup.program==='hajj'?'qiran':'umrah')[1];card(clothes.title,clothes,()=>{
   if(readMiqatLesson(setup.program,setup.avatar).stage!==2){warning();return;}
   if(!wearIhram()){warning('Pakaian belum dapat disimpan. Periksa penyimpanan browser lalu coba lagi.');return;}
   if(!save(3))return;walker.setWardrobe('ritual');close();setGoal();
  },'Kenakan pakaian ihram');}
  else if(lesson.stage===3)openBook();
  else if(lesson.stage===4)talbiyah(0);
  else if(lesson.stage===5)show('Siap melanjutkan perjalanan?', 'Pakaian ihram sudah siap, buku panduan sudah kamu terima, dan niat serta talbiyah sudah dipelajari. Ini akhir persiapan Level 1. Semoga belajarmu membawa kebaikan dan keberkahan.',[{label:'Selesaikan Level 1',id:'miqatFinish',fn:()=>{if(!completeMiqatLesson(setup.program,setup.avatar)){warning();return;}if(!save(6))return;saveStory({},setup.program==='hajj'?'hajj:miqat':'umrah:1');close();setGoal();finished();}}]);
  else finished();
 }
 function openBook(){
  if(!lesson.book){show('Buku panduan untukmu', 'Simpan buku ini sebagai bekal perjalanan. Di dalamnya ada contoh niat dan bacaan talbiyah. Buku bisa dibuka kembali dari menu bantuan.',[{label:'Ambil buku panduan',id:'miqatTakeBook',fn:()=>{if(save(3,true))openBook();}}]);return;}
  const intention=miqatCards(1,setup.avatar,'madinah',setup.program==='hajj'?'qiran':'umrah')[1];
  card('Buku panduan · Niat', {...intention,body:(setup.program==='hajj'?'Jalur haji qiran ini dimulai dengan niat haji dan umrah sekaligus; tetap dalam ihram sampai hari Nahr. ':'')+intention.body},()=>show('Cek pemahaman · Niat', 'Apa yang dimaksud dengan niat?',[
   {label:'Maksud dalam hati untuk mulai beribadah',id:'miqatAnswer',fn:()=>advance(4)},
   {label:'Harus berteriak agar terdengar semua orang',primary:false,fn:()=>{dialog.querySelector('#miqatDialogNotice')!.textContent='Coba lagi. Niat adalah maksud dalam hati. Membaca contoh di game adalah latihan belajar.';}},
  ]),'Lanjut cek pemahaman');
 }
 function talbiyah(part:number){
  const full=miqatCards(2,setup.avatar,'madinah',setup.program==='hajj'?'qiran':'umrah')[0];
  const pieces=[{arabic:'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ',latin:'Labbaika Allahumma labbaik.',meaning:'Aku memenuhi panggilan-Mu, ya Allah.'},{arabic:'لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ',latin:'Labbaika la syarika laka labbaik.',meaning:'Tiada sekutu bagi-Mu.'},{arabic:'إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',latin:'Innal hamda wan-ni‘mata laka wal-mulk, la syarika lak.',meaning:'Segala puji, nikmat dan kerajaan adalah milik-Mu; tiada sekutu bagi-Mu.'}];
  const data=part<3?{...full,...pieces[part]}:full;
  card(part<3?'Talbiyah · Bagian '+(part+1)+' dari 3':'Talbiyah · Bacaan lengkap',data,()=>part<3?talbiyah(part+1):advance(5),part<3?'Lanjut bacaan':'Sudah dipelajari, temui pembimbing');
 }
 let beginArrival=()=>{};
 function finished(){const message=hajjLevelMessage(1);show(message.completedTitle, message.recap,[{label:setup.program==='hajj'?message.nextLabel:'Lanjut Level 2 · Tawaf',id:'miqatNext',fn:()=>beginArrival()},{label:'Buka peta perjalanan →',id:'miqatMap',primary:false,fn:()=>location.assign(mapUrl)}]);}
 function pause(){if(blocked()||lifeOpen())return;show('Perjalanan dijeda','Gerakkan joystick untuk berjalan dan geser layar untuk melihat. Gunakan Lari untuk bergerak lebih cepat, lalu Aksi di penanda. Di PC: WASD, Shift dan E. Progres tersimpan otomatis.',[
  {label:'Lanjut bermain',fn:close,id:'miqatResume'},
  ...(lesson.book||arrival?[{label:'Buka buku panduan',primary:false,fn:()=>card('Buku panduan · Niat',miqatCards(1,setup.avatar,'madinah',setup.program==='hajj'?'qiran':'umrah')[1],()=>card('Buku panduan · Talbiyah',miqatCards(2,setup.avatar,'madinah',setup.program==='hajj'?'qiran':'umrah')[0],close,'Tutup buku'),'Lihat talbiyah')}]:[]),
  {label:'Kembali ke peta',primary:false,fn:()=>location.assign(mapUrl)},
 ]);}
 let walker:ReturnType<typeof attachWalker>,paintSignature='';
 function paint(){if(!walker){if(failed)for(const id of ['miqatInteract','miqatWalk'])$<HTMLButtonElement>(id).disabled=true;return;}
  const travel=arrival?.tawaf()?.transferView();if(travel){const signature=JSON.stringify([travel,blocked(),lifeOpen(),failed]);if(signature===paintSignature)return;paintSignature=signature;root.dataset.phase='sai-transfer';root.dataset.transferStep=String(travel.step);root.querySelector('.miqatHeader small')!.textContent='LEVEL 3 · MENUJU SA’I';$('miqatCount').textContent='DARI KA’BAH MENUJU SAFA–MARWAH';$('miqatGoal').textContent=travel.title;$('miqatHint').textContent=travel.body;root.querySelector<HTMLElement>('.miqatProgress span')!.style.width=travel.progress*100+'%';const act=$<HTMLButtonElement>('miqatInteract');act.textContent=travel.action+' · E';act.disabled=failed||blocked()||lifeOpen()||!travel.near&&travel.step!==0;const walk=$<HTMLButtonElement>('miqatWalk');walk.hidden=false;walk.textContent=travel.step===0?'Buka perjalanan Level 3':'Jalan menuju penanda';walk.disabled=failed||blocked()||lifeOpen();viewButton.hidden=false;viewButton.textContent='Lihat pintu Safa';viewButton.disabled=blocked()||lifeOpen();return;}
  const tawaf=arrival?.tawaf();if(tawaf){const v=tawaf.view(),signature=JSON.stringify([v.mode,v.poi,v.laps,v.gate,v.near,v.body,v.segment,blocked(),lifeOpen(),failed]);if(signature===paintSignature)return;paintSignature=signature;root.dataset.phase='tawaf';root.dataset.guideMode='voice';root.dataset.tawafMode=v.mode;root.dataset.poi=String(v.poi);root.dataset.laps=String(v.laps);root.dataset.gate=String(v.gate);root.dataset.recover=String(v.recover);root.dataset.segment=String(v.segment);root.querySelector('.miqatHeader small')!.textContent='LEVEL 2 · TAWAF QUDUM';$('miqatCount').textContent=v.mode==='circling'?'PUTARAN '+v.laps+' / 7 · BAGIAN '+(v.gate+1)+' / 8':v.mode==='explore'?'JELAJAH ARENA · TITIK '+(v.poi+1)+' / 4':v.mode==='done'?'LEVEL 2 SELESAI':'PANDUAN TAWAF';$('miqatGoal').textContent=v.title;$('miqatHint').textContent=v.body;root.querySelector<HTMLElement>('.miqatProgress span')!.style.width=v.progress*100+'%';const act=$<HTMLButtonElement>('miqatInteract');act.textContent=v.action+' · E';act.disabled=failed||blocked()||lifeOpen()||!v.near;const walk=$<HTMLButtonElement>('miqatWalk');walk.textContent=v.mode==='circling'?'Ikuti jalur tawaf':v.mode==='explore'?'Butuh petunjuk arah?':'Jalan ke penanda';walk.hidden=v.mode==='report'||v.mode==='done';walk.disabled=failed||blocked()||lifeOpen()||v.mode==='done';viewButton.hidden=v.mode==='done';viewButton.textContent=v.mode==='circling'?'Bacaan tawaf':'Arahkan kamera';viewButton.disabled=blocked()||lifeOpen();return;}
  if(arrival){const v=arrival.view(),signature=JSON.stringify([v.stage,v.near,v.status,v.visible,v.looked,v.leg,blocked(),lifeOpen(),failed]);if(signature===paintSignature)return;paintSignature=signature;root.dataset.phase='arrival';root.dataset.arrivalStage=String(v.stage);root.dataset.guideState=v.status;root.dataset.kaabaVisible=String(v.visible);root.dataset.wardrobe='ritual';root.querySelector('.miqatHeader small')!.textContent='LEVEL 2 · KEDATANGAN & TAWAF';$('miqatCount').textContent=v.stage===5?'KEDATANGAN SELESAI · LANJUT TAWAF':'TUJUAN '+(v.stage+1)+' / 5 · '+v.status;$('miqatGoal').textContent=v.title;$('miqatHint').textContent=v.body;root.querySelector<HTMLElement>('.miqatProgress span')!.style.width=v.stage/5*100+'%';const act=$<HTMLButtonElement>('miqatInteract');act.textContent=v.action+' · E';act.disabled=failed||blocked()||lifeOpen()||!v.near;const walk=$<HTMLButtonElement>('miqatWalk');walk.textContent='Ikuti pembimbing';walk.disabled=failed||blocked()||lifeOpen()||v.stage===5;viewButton.hidden=v.stage!==3;viewButton.disabled=blocked()||lifeOpen();return;}
  const signature=[lesson.stage,lesson.book,failed,blocked(),lifeOpen(),walker.near()].join(':');if(signature===paintSignature)return;paintSignature=signature;const goal=MIQAT_GOALS[lesson.stage];$('miqatCount').textContent=lesson.stage===6?'PERSIAPAN SELESAI':'TUJUAN '+(lesson.stage+1)+' / 6';$('miqatGoal').textContent=goal.title;$('miqatHint').textContent=[`Dekati ${guide.name} di depan pintu.`,`Pintu terbuka. Ikuti penanda emas ke dalam.`,`Ruang ganti ada di sebelah kiri. Rambut tetap mengikuti perjalananmu.`,`Ambil buku di meja, lalu pelajari niat.`,`Ikuti bacaan dan maknanya di sudut talbiyah.`,`Temui ${guide.name} di depan ruangan.`,`Persiapan tersimpan. Pembimbing siap berjalan bersamamu ke pelataran Ka’bah.`][lesson.stage];
  root.querySelector<HTMLElement>('.miqatProgress span')!.style.width=(lesson.stage/6*100)+'%';
  const action=$<HTMLButtonElement>('miqatInteract');action.textContent=goal.action+' · E';action.disabled=failed||blocked()||lifeOpen()||(!walker.near()&&lesson.stage<6);$<HTMLButtonElement>('miqatWalk').disabled=failed||blocked()||lifeOpen()||walker.near()||lesson.stage===6;
  root.dataset.stage=String(lesson.stage);root.dataset.book=String(lesson.book);root.dataset.wardrobe=lesson.stage>=3?'ritual':'casual';
 }
 let gate:THREE.Mesh;
 const bounds:[number,number,number,number]=[...MIQAT_BOUNDS];
 const obstacles:Obstacle[]=MIQAT_OBSTACLES.map(o=>({...o}));if(lesson.stage===0&&!resumeArrival)obstacles.push(MIQAT_GATE);
 function setGoal(){const goal=MIQAT_GOALS[lesson.stage];walker.setGoal(goal.x,goal.z);const i=obstacles.indexOf(MIQAT_GATE);if(lesson.stage>0&&i>=0)obstacles.splice(i,1);gate.visible=lesson.stage===0;$('miqatNotice').textContent='';paint();}
 $('miqatPause').onclick=pause;$('miqatWalk').onclick=()=>arrival?arrival.approach():walker?.approach();$('miqatInteract').onclick=()=>arrival?interact():lesson.stage===6?finished():interact();
 dialog.addEventListener('close',paint);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 const abort=new AbortController();window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&!e.repeat&&!(e.target as HTMLElement)?.closest('input,textarea,select')){e.preventDefault();interact();}},{signal:abort.signal});
 window.addEventListener('storage',e=>{if(arrival&&(e.key===null||e.key===arrivalJourneyKey(setup.program,setup.avatar)||e.key===tawafTourKey(setup.avatar)||e.key===QUEST_KEYS.tawaf||e.key===saiTransferKey(setup.avatar))){location.reload();return;}if(e.key!==null&&e.key!==miqatLessonKey(setup.program,setup.avatar))return;const current=readMiqatLesson(setup.program,setup.avatar);if(current.stage!==lesson.stage||current.book!==lesson.book){lesson=current;if(dialog.open)close();walker?.setWardrobe(lesson.stage>=3?'ritual':'casual');if(walker)setGoal();}},{signal:abort.signal});
 try{
  const renderer=new THREE.WebGLRenderer({canvas,antialias:graphicsTier()!=='low',powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const budget=createRenderBudget(renderer,{maxFps:30}),scene=new THREE.Scene();scene.background=new THREE.Color(0xc7ddd9);scene.fog=new THREE.Fog(0xc7ddd9,26,65);scene.add(new THREE.HemisphereLight(0xfffcf2,0x728d7d,2.5));const sun=new THREE.DirectionalLight(0xffe9be,2.4);sun.position.set(-8,13,6);scene.add(sun);staticShadows(renderer,sun,15);
  const camera=new THREE.PerspectiveCamera(58,1,.08,360),materials:THREE.Material[]=[];
  const mat=(color:number)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.86});materials.push(m);return m;};
  const stone=mat(0xe8ddc4),white=mat(0xfcf8e9),green=mat(0x214e43),gold=mat(0xc4a668),wood=mat(0x896044),floor=mat(0xd7d1bd),fabric=mat(0x769c8b),glass=mat(0x91b9b9);
  surfaceDetail(stone,'stone',3,2);surfaceDetail(floor,'marble',8,10);surfaceDetail(white,'fabric',2,2);
  function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=h>.1;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
  function label(text:string,x:number,y:number,z:number,width=3){const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d')!;ctx.fillStyle='#204d41';ctx.fillRect(0,0,768,160);ctx.strokeStyle='#d7b870';ctx.lineWidth=9;ctx.strokeRect(7,7,754,146);ctx.fillStyle='#fff0c2';ctx.font='bold 41px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,80,710);const tex=new THREE.CanvasTexture(c),m=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});materials.push(m);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4.8),m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
  box(35,.2,35,floor,0,-.12,0);box(13.4,.05,8.4,white,0,-.025,-4.2);
  // A low front balustrade keeps the dressing area visible from the third-person camera.
  for(const [i,o] of MIQAT_OBSTACLES.slice(0,5).entries())box(o.w,i>=3?.9:3.8,o.d,stone,o.x,i>=3?.45:1.9,o.z);
  for(const x of [-6.6,-2.05,2.05,6.6]){box(.32,4,.5,white,x,2,.02);box(.58,.18,.75,gold,x,3.95,.02);box(.58,.18,.65,stone,x,.09,.02);}
  box(14.2,.22,.8,gold,0,4.15,.03);box(14.1,.45,.7,stone,0,4.48,.03);box(3.8,.75,.3,green,0,3.55,.07);label('MIQAT & IHRAM',0,3.55,.25,3.6);
  gate=box(3.8,2.95,.15,fabric,0,1.475,.02);gate.visible=lesson.stage===0;
  for(const x of [-4.8,-2.4,2.4,4.8]){box(1.45,1.5,.05,glass,x,2.15,-8.47);box(.1,1.65,.08,gold,x,2.15,-8.42);box(1.6,.09,.08,white,x,2.9,-8.4);box(1.6,.09,.08,white,x,1.4,-8.4);}
  for(const x of [-6.6,6.6])for(const z of [-2,-5.5])box(.3,3.8,.3,white,x,1.9,z);
  box(1.25,.9,1,wood,-5.35,.45,-4);box(1.4,.08,1.1,gold,-5.35,.94,-4);for(let n=0;n<3;n++)box(.8,.09,.65,white,-5.35,1.03+n*.1,-4);
  const curtainMaterial=fabric.clone();curtainMaterial.transparent=true;materials.push(curtainMaterial);box(.12,2.5,2.8,curtainMaterial,-2.6,1.25,-4.1);box(2.9,.05,2.8,fabric,-4.35,.02,-4.1);label('1 · PAKAIAN IHRAM',-4.5,2.8,-6.05,3.2);
  box(1.8,.95,.7,wood,0,.475,-7.1);box(1.95,.08,.85,gold,0,.99,-7.1);for(const x of [-.5,0,.5]){box(.34,.06,.46,green,x,1.06,-7.1);box(.3,.02,.42,white,x,1.10,-7.1);}label('2 · BUKU & NIAT',0,2.65,-8.37,3.1);
  box(.8,.95,2.6,wood,5,.475,-4.8);box(.95,.08,2.75,gold,5,.99,-4.8);box(2.2,.03,2.8,fabric,3.9,.025,-4.8);label('3 · TALBIYAH',4.4,2.65,-7.45,2.8);
  for(const x of [-5.5,5.5]){box(.7,.7,.7,stone,x,.35,2.3);const crown=new THREE.Mesh(new THREE.SphereGeometry(.7,12,8),green);crown.position.set(x,1.1,2.3);scene.add(crown);}
  for(let z=1;z<9;z+=1.2)box(.12,.012,.65,gold,0,.01,z);
  const npc=humanActor(scene,setup.avatar==='female'?0x355c4e:0xf3ecdb,setup.avatar==='female');npc.position.set(0,0,3.5);npc.rotation.y=0;tag.textContent=guide.name+' · Pembimbing';
  const pilgrim=humanActor(scene,0xece6d5,setup.avatar==='female');pilgrim.position.set(-5.5,0,-7);pilgrim.rotation.y=-Math.PI/2;
  const start=resumeTawaf?continuousTawafResume(setup.avatar):resumeArrival?arrivalResumePoint(readArrivalJourney(setup.program,setup.avatar).stage):lesson.stage===0?[0,7] as const:lesson.stage===1?[0,2] as const:lesson.stage===2?[-3.8,-1.5] as const:lesson.stage===3?[-3.8,-3.5] as const:lesson.stage===4?[0,-5.5] as const:lesson.stage===5?[3.8,-4.8] as const:[0,2.5] as const;
  // Expand before controller construction so a restored Level 2 checkpoint stays inside its bounds.
  if(resumeArrival){bounds[1]=36;bounds[3]=72;}
  if(resumeTawaf)for(let i=0;i<4;i++)bounds[i]=canStartSaiTransfer()&&readSaiTransfer(setup.avatar).active?SAI_TRANSFER_BOUNDS[i]:TAWAF_BOUNDS[i];
  const goal=MIQAT_GOALS[lesson.stage];walker=attachWalker(scene,camera,canvas,host,{avatar:setup.avatar,wardrobe:resumeArrival||lesson.stage>=3?'ritual':'casual',lifeKind:'miqat',blocked,onNear:paint},bounds,obstacles,start,[goal.x,goal.z]);setGoal();
  beginArrival=()=>{if(arrival||!canEnterArrival(setup.program))return;const state=readArrivalJourney(setup.program,setup.avatar);if(!state.active&&!storeArrivalJourney(setup.program,setup.avatar,{version:1,active:true,stage:0})){warning('Perjalanan Level 2 belum dapat disimpan. Progres Level 1 tetap aman.');return;}
   try{close();gate.visible=false;const i=obstacles.indexOf(MIQAT_GATE);if(i>=0)obstacles.splice(i,1);walker.setWardrobe('ritual');scene.fog=new THREE.Fog(0xc7ddd9,100,300);arrival=mountArrivalJourney({scene,renderer,walker,guide:npc,program:setup.program,avatar:setup.avatar,bounds,obstacles,host,blocked:()=>blocked()||lifeOpen(),show,close,notice:warning,changed:()=>{paintSignature='';},resumeTawaf});paintSignature='';paint();document.title=arrival.tawaf()?'Tawaf Qudum · HAJJI.DIGITAL':'Menemukan Ka’bah · HAJJI.DIGITAL';}
   catch{failed=true;warning('Kawasan belum dapat dimuat. Muat ulang untuk melanjutkan checkpoint Level 2.');paint();}
  };
  if(resumeArrival)beginArrival();
  portrait=installLandscape(()=>{window.dispatchEvent(new Event('blur'));if(dialog.open)dialog.close();paint();});
  const resize=()=>{budget.resize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
  let frame=0,last=0;const vector=new THREE.Vector3();
  function draw(now:number){if(disposed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;walker.update(now);arrival?.tick(dt,camera);curtainMaterial.opacity=walker.position.x<-2.6&&walker.position.z<-2.5?.2:1;updateHumanActors(scene,dt,!blocked()&&!document.hidden,camera);paint();vector.copy(arrival?.position??new THREE.Vector3(0,0,3.5));vector.y+=2.15;vector.project(camera);tag.hidden=!npc.visible||vector.z>1||Math.abs(vector.x)>1||Math.abs(vector.y)>1;tag.style.left=(vector.x*.5+.5)*100+'%';tag.style.top=(-vector.y*.5+.5)*100+'%';if(arrival){const view=walker.cameraView();root.dataset.cameraYaw=view.yaw.toFixed(4);root.dataset.cameraPitch=view.pitch.toFixed(4);root.dataset.cameraY=view.cameraY.toFixed(3);root.dataset.lookY=view.lookY.toFixed(3);root.dataset.playerX=walker.position.x.toFixed(2);root.dataset.playerZ=walker.position.z.toFixed(2);root.dataset.guideX=arrival.position.x.toFixed(2);root.dataset.guideZ=arrival.position.z.toFixed(2);}budget.draw(now,scene,camera);frame=requestAnimationFrame(draw);}
  frame=requestAnimationFrame(draw);root.dataset.ready='true';mountSimplePlayHud('miqat');
  canvas.addEventListener('webglcontextlost',()=>{failed=true;warning('Grafis terhenti. Muat ulang untuk melanjutkan tujuan terakhir yang tersimpan.');paint();},{signal:abort.signal});
  window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();abort.abort();walker.dispose();disposeHumanActors(scene);arrival?.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});for(const m of materials){if(m instanceof THREE.MeshBasicMaterial)m.map?.dispose();disposeSurface(m);m.dispose();}budget.dispose();renderer.dispose();},{once:true});
 }catch{failed=true;warning('Grafis 3D belum tersedia. Pilih grafis Rendah dari pengaturan awal, lalu muat ulang. Checkpoint yang selesai tetap tersimpan.');const recovery=document.createElement('a');recovery.href=tenantUrl('./index.html?setup=1');recovery.textContent='Buka pengaturan grafis';$('miqatNotice').append(document.createElement('br'),recovery);paint();}
}
