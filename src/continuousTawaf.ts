import {districtReturnUrl} from './adventure/districtReturn.ts';
import {hajjLevelMessage} from './adventure/levelMessages.ts';
import * as THREE from 'three';
import type {attachWalker,Obstacle} from './coreWalk.ts';
import {mountTawafAtmosphere,TAWAF_PANORAMA} from './tawafAtmosphere.ts';
import {TawafRadio} from './audio/TawafRadio.ts';
import type {Avatar} from './coreProgress.ts';
import {TAWAF_RADIUS,TAWAF_PLACES,TAWAF_EXTRA_SOLIDS,TAWAF_BOUNDS,readTawafTour,storeTawafTour,readTawafRoute,storeTawafRoute,tawafGates,tawafPoint,orbitTracker,stepOrbit,nextOrbitSegment} from './continuousTawafModel.ts';
import {tenantUrl} from './tenant.ts';
import {READINGS} from './readingModel.ts';
import {mountSaiTransfer} from './saiTransfer.ts';
import {readSaiTransfer,storeSaiTransfer,canStartSaiTransfer} from './saiTransferModel.ts';
type Action={label:string;fn:()=>void;id?:string;primary?:boolean};
type Options={scene:THREE.Scene;walker:ReturnType<typeof attachWalker>;guide:THREE.Group;avatar:Avatar;bounds:[number,number,number,number];obstacles:Obstacle[];host:HTMLElement;blocked:()=>boolean;show:(title:string,body:string,actions:Action[])=>void;close:()=>void;notice:(text?:string)=>void;changed:()=>void};
export function mountContinuousTawaf(o:Options){
 let transfer:ReturnType<typeof mountSaiTransfer>|null=null;
 const {walker}=o;let tour=readTawafTour(o.avatar),route=readTawafRoute(),tracker=orbitTracker(tawafGates(route)),assisted=false,segment=tracker.gates*4+1,lastRecovery=true;
 for(let i=0;i<4;i++)o.bounds[i]=TAWAF_BOUNDS[i];o.obstacles.push(...TAWAF_EXTRA_SOLIDS);
 const guideWasVisible=o.guide.visible;o.guide.visible=false;walker.setLookRange(-1.12,1.05);
 const atmosphere=mountTawafAtmosphere(o.scene,o.host);
 const radio=new TawafRadio(o.host,o.avatar,()=>walker.lookAt(...TAWAF_PANORAMA));
 let hintUntil=0,lastPosition={x:walker.position.x,z:walker.position.z};
 const props=new THREE.Group();props.name='tawaf-learning-points';o.scene.add(props);const owned:THREE.Material[]=[],textures:THREE.Texture[]=[],placeMarkers:THREE.Object3D[][]=[];
 for(const [i,p]of TAWAF_PLACES.entries()){
  const c=document.createElement('canvas');c.width=640;c.height=110;const ctx=c.getContext('2d')!;ctx.fillStyle='#1e5141';ctx.fillRect(0,0,640,110);ctx.strokeStyle='#e3c47b';ctx.lineWidth=5;ctx.strokeRect(3,3,634,104);ctx.fillStyle='#fff2ca';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((i+1)+' · '+p.title,320,55,610);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;textures.push(map);const material=new THREE.SpriteMaterial({map});owned.push(material);const sprite=new THREE.Sprite(material);sprite.position.set(p.x,2.8,p.z);sprite.scale.set(4.2,.72,1);props.add(sprite);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.58,.7,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x60b593,side:THREE.DoubleSide}));marker.position.set(p.x,.035,p.z);owned.push(marker.material);props.add(marker);placeMarkers.push([sprite,marker]);
 }
 const ring=new THREE.Mesh(new THREE.RingGeometry(TAWAF_RADIUS-.1,TAWAF_RADIUS+.1,160).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x2b9c80,transparent:true,opacity:.45,side:THREE.DoubleSide}));ring.position.set(0,.03,64);owned.push(ring.material);props.add(ring);
 function mode(){return !tour.started?(tour.poi<4?'explore':'ready'):(route?.stage??0)>=3?'done':(route?.stage??0)>=2?'report':'circling';}
 function goal(){const m=mode();return m==='explore'?TAWAF_PLACES[tour.poi]:m==='ready'?tawafPoint(0):m==='report'||m==='done'?{x:28,z:55}:tracker.recover?tawafPoint(tracker.gates):tawafPoint(segment/4);}
 function near(){if(transfer)return transfer.view().near||transfer.view().step===0;const p=goal(),m=mode();return m==='done'||m==='report'||(m!=='circling'&&Math.hypot(walker.position.x-p.x,walker.position.z-p.z)<=1.15);}
 function setWalkerGoal(){const p=goal();walker.setGoal(p.x,p.z);if(assisted&&!o.blocked())walker.approach();}
 function plan(){const m=mode();assisted=false;hintUntil=0;setWalkerGoal();walker.setGoalVisible(m!=='explore');o.changed();
  radio.announce('task:'+m+':'+tour.poi,m==='explore'?TAWAF_PLACES[tour.poi].hint:m==='ready'?'Empat tempat sudah kamu kenali. Cari garis awal sejajar Hajar Aswad untuk mulai tawaf.':m==='circling'?'Mulai berjalan mengitari Ka’bah dengan Ka’bah di sebelah kiri. Saya menemanimu melalui suara.':m==='report'?'Alhamdulillah, tujuh putaran sudah lengkap. Konfirmasikan hasil melalui radio dari tempatmu sekarang.':'Tawaf Qudum selesai. Progresmu sudah tersimpan.');
 }
 function error(){assisted=false;walker.lock(true);walker.lock(false);o.notice('Checkpoint belum tersimpan atau berubah di tab lain. Data lama dipertahankan. Periksa penyimpanan, lalu kembali ke penanda terakhir.');}
 function saveTour(next:typeof tour){if(!storeTawafTour(o.avatar,next)){error();return false;}tour=next;return true;}
 function begin(){if(!near())return;const old=readTawafRoute();if(!old||old.stage===0){if(!storeTawafRoute({version:1,stage:1,count:0,gate:0})){error();return;}}
  if(!saveTour({...tour,started:true}))return;route=readTawafRoute();tracker=orbitTracker(tawafGates(route));segment=tracker.gates*4+1;lastRecovery=true;o.notice('');o.close();plan();
 }
 function startSaiTransfer(){if(transfer||!canStartSaiTransfer())return;const old=readSaiTransfer(o.avatar);if(!old.active&&!storeSaiTransfer(o.avatar,{version:1,active:true,step:0})){o.notice('Perjalanan Sa’i belum dapat disimpan. Hasil tawaf tetap tersimpan.');return;}o.close();walker.lock(true);walker.lock(false);props.visible=false;transfer=mountSaiTransfer({...o,announce:(key,text)=>radio.announce(key,text)});o.changed();document.title='Menuju Safa · Level 3 Sa’i · HAJJI.DIGITAL';}
 function finished(){const message=hajjLevelMessage(2);o.show(message.completedTitle,message.recap,[{label:'Panduan salat tawaf dua rakaat',id:'tawafPrayer',primary:false,fn:()=>o.show('Salat setelah tawaf','Salat dua rakaat setelah tawaf bila memungkinkan, di belakang Maqam Ibrahim tanpa menghalangi jemaah; bila padat, pilih tempat lain yang lapang. Setelahnya, lanjut ke Safa. Ini panduan belajar dalam game.',[{label:'Sudah dipelajari · lanjut',fn:finished}])},{label:message.nextLabel,id:'tawafNext',fn:()=>{const url=districtReturnUrl();if(url)location.assign(url);else startSaiTransfer();}},{label:'Lihat peta perjalanan',id:'tawafMap',primary:false,fn:()=>location.assign(tenantUrl('./adventure-map.html?journey=hajj'))}]);}
 function interact(){if(transfer){if(!o.blocked())transfer.interact();return;}if(o.blocked()||!near())return;const m=mode();
  if(m==='explore'){const p=TAWAF_PLACES[tour.poi];radio.announce('detail:'+p.id,p.body);walker.lookAt(p.look[0],p.look[1],p.look[2]);o.show(p.title,p.body,[{label:'Sudah dikenali · Lanjutkan',id:'tawafPoiContinue',fn:()=>{if(!saveTour({...tour,poi:tour.poi+1}))return;o.notice('');o.close();plan();}}]);}
  else if(m==='ready')o.show('Mulai dari garis awal','Titik-titik arena sudah dikenali. Sekarang ikuti penanda hijau mengitari Ka’bah dengan Ka’bah di sebelah kiri. Setiap putaran melewati delapan bagian berurutan dan kembali ke garis ini. Penjelajahan sebelumnya tidak dihitung. Gunakan WASD/stik atau bantuan mengikuti jalur.',[{label:route&&route.stage>0?'Lanjutkan checkpoint tawaf':'MULAI TAWAF · 7 PUTARAN',id:'tawafStart',fn:begin}]);
  else if(m==='report')o.show('Tujuh putaran sudah lengkap','Kamu sudah kembali ke garis awal tujuh kali melalui semua bagian rute. Konfirmasikan hasil melalui radio pemandu untuk menyimpan kelulusan level.',[{label:'Konfirmasi radio · Selesaikan Level 2',id:'tawafFinish',fn:()=>{if(!storeTawafRoute({version:1,stage:3,count:7,gate:0})){error();return;}route=readTawafRoute();o.notice('');o.close();plan();finished();}}]);
  else if(m==='done')finished();
 }
 const abort=new AbortController();window.addEventListener('keydown',e=>{if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))assisted=false;},{signal:abort.signal});o.host.querySelector('.walkJoy')?.addEventListener('pointerdown',()=>assisted=false,{signal:abort.signal});
 function tick(dt:number){const blocked=o.blocked()||document.hidden,m=mode();const narratedDialog=!!document.querySelector('.miqatDialog[open] #tawafPoiContinue,.miqatDialog[open] #tawafStart,.miqatDialog[open] #tawafFinish,.miqatDialog[open] #saiDepart,.miqatDialog[open] #saiEnter');radio.setPaused(blocked&&!narratedDialog||document.hidden);atmosphere.tick(dt,walker.position,!blocked);
  for(let i=0;i<placeMarkers.length;i++){const p=TAWAF_PLACES[i],distance=Math.hypot(walker.position.x-p.x,walker.position.z-p.z);for(const marker of placeMarkers[i])marker.visible=distance<8||i===tour.poi&&performance.now()<hintUntil;}
  ring.visible=m!=='explore';walker.setGoalVisible(m!=='explore'||performance.now()<hintUntil||near());
  if(blocked){assisted=false;lastPosition={x:walker.position.x,z:walker.position.z};return;}
  radio.walk(Math.hypot(walker.position.x-lastPosition.x,walker.position.z-lastPosition.z));lastPosition={x:walker.position.x,z:walker.position.z};
  if(transfer){transfer.tick();return;}if(m!=='circling')return;
  const next=stepOrbit(tracker,walker.position);if(next.gates!==tracker.gates){const gates=next.gates;if(!storeTawafRoute({version:1,stage:gates===56?2:1,count:Math.floor(gates/8),gate:gates===56?0:gates%8})){error();tracker={...tracker,recover:true,last:{x:walker.position.x,z:walker.position.z},sweep:tracker.gates*Math.PI/4};setWalkerGoal();return;}route=readTawafRoute();o.changed();if(gates%8===0)radio.announce('lap:'+gates,'Putaran '+Math.floor(gates/8)+' dari tujuh selesai. '+(gates===56?'Kamu sudah menyelesaikan tujuh putaran.':'Tetap tenang dan lanjutkan ke putaran berikutnya.'));}
  const advanced=next.gates!==tracker.gates;tracker=next;
  if(tracker.gates===56){assisted=false;walker.lock(true);walker.lock(false);o.notice('Tujuh putaran selesai. Konfirmasikan hasil melalui radio pemandu.');plan();return;}
  if(advanced){segment=Math.max(segment,tracker.gates*4+1);setWalkerGoal();}
  if(lastRecovery!==tracker.recover){lastRecovery=tracker.recover;segment=tracker.gates*4+1;setWalkerGoal();}
  if(!tracker.recover){const p=tawafPoint(segment/4);if(Math.hypot(walker.position.x-p.x,walker.position.z-p.z)<.9){segment++;setWalkerGoal();}}
 }
 plan();if(canStartSaiTransfer()&&((readSaiTransfer(o.avatar).active&&readSaiTransfer(o.avatar).step<4)||new URLSearchParams(location.search).has('sai')))startSaiTransfer();return {tick,interact,near,transferView:()=>transfer?.view()??null,reading(){const r=READINGS.tawaf;o.show(r.title,r.latin+' '+r.meaning+' '+r.note,[{label:'Kembali berjalan',fn:o.close,id:'tawafCloseReading'}]);},approach(){if(transfer){transfer.approach();return;}if(mode()==='explore'){hintUntil=performance.now()+12000;o.notice(TAWAF_PLACES[tour.poi].hint+' Penanda bantuan tampil selama 12 detik.');radio.announce('hint:'+performance.now(),TAWAF_PLACES[tour.poi].hint);return;}assisted=true;if(mode()==='circling'&&!tracker.recover){segment=nextOrbitSegment(tracker);setWalkerGoal();}else walker.approach();},focus(){if(transfer){transfer.focus();return;}const m=mode(),p=m==='explore'?TAWAF_PLACES[tour.poi].look:[0,3.2,64];walker.lookAt(p[0],p[1],p[2]);},
  view(){const m=mode(),laps=route?.count??0,gate=route?.gate??0;return {mode:m,poi:tour.poi,laps,gate,near:near(),title:m==='explore'?TAWAF_PLACES[tour.poi].title:m==='ready'?'Kembali ke garis awal':m==='circling'?'Tawaf · '+laps+' / 7 putaran':m==='report'?'Konfirmasi via radio':'Tawaf Qudum selesai',body:m==='explore'?TAWAF_PLACES[tour.poi].hint:m==='ready'?'Empat titik sudah dikenali. Kembali ke garis awal untuk mulai atau melanjutkan tawaf.':m==='circling'?tracker.recover?'Kembali ke checkpoint terakhir. Perjalanan di luar jalur belum dihitung.':tracker.wrong?'Arah terbalik. Ikuti penanda dengan Ka’bah di sebelah kiri.':'Lewati bagian '+(gate+1)+' / 8. Hitungan bertambah setelah satu putaran lengkap.':m==='report'?'Tujuh putaran tersimpan. Konfirmasikan melalui radio dari tempatmu sekarang.':'Kelulusan dan progres sebelumnya tetap tersimpan.',action:m==='explore'?'Kenali titik ini':m==='ready'?'Siapkan tawaf':m==='report'?'Konfirmasi hasil tawaf':'Lihat hasil Level 2',progress:m==='explore'?tour.poi/20:m==='ready'?.2:m==='circling'?.2+.7*tawafGates(route)/56:m==='report'?.95:1,recover:tracker.recover,segment,guideX:o.guide.position.x,guideZ:o.guide.position.z};},
  dispose(){abort.abort();transfer?.dispose();radio.dispose();atmosphere.dispose();o.guide.visible=guideWasVisible;walker.setLookRange(.07,.7);walker.setGoalVisible(true);props.traverse(p=>{if(p instanceof THREE.Mesh)p.geometry.dispose();});for(const m of owned)m.dispose();for(const t of textures)t.dispose();props.removeFromParent();}
 };
}
