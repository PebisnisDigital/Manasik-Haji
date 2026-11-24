import {cityArenaLevel,requestArenaExit} from './arenaDoor.ts';
import {districtReturnUrl,districtExitLabel} from './districtReturn.ts';
import {nusukNumber,NUSUK_LEVELS} from './nusukModel.ts';
import {hajjLevelMessage} from './levelMessages.ts';
import {notifySimplePlay} from '../simplePlayHud.ts';
import {AQABAH_BEATS,readAqabah,storeAqabah,aqabahDuration,type AqabahSave} from './aqabahModel.ts';
import {finishHaircut} from '../characters/playerAppearance.ts';
import type {SiteView} from '../hajjScenes.ts';
import {Clip} from '../sim/States.ts';
interface Hooks{level:(number:number,title:string)=>void;id:string;avatar:'male'|'female';host:HTMLElement;legacyThrows:number;after:boolean;practice:boolean;blocked:()=>boolean;needsBus:()=>boolean;bus:()=>void;scene:(kind:'muzdalifah'|'jamarat')=>SiteView|null;base:(title:string,body:string,kicker?:string)=>void;action:(label:string,fn:()=>void,secondary?:boolean)=>HTMLButtonElement;arrive:(label:string,fn:()=>void)=>void;thrown:()=>void;finish:()=>void;takbir:()=>void}
export function mountAqabah(h:Hooks){
 let state=readAqabah(h.id,h.legacyThrows,h.after),view:SiteView|null=null,running=false,inFlight=false,last=0,sinceSave=0,raf=0,disposed=false;
 const clock=document.createElement('div');clock.id='fieldClock';clock.className='fieldClock';clock.setAttribute('role','status');h.host.append(clock);document.body.classList.add('hasHajjField');
 const notice=()=>document.getElementById('notice')!;
 function persist(next:AqabahSave){if(!storeAqabah(next,h.legacyThrows,h.after)){running=false;view?.setCampPose(null);notice().textContent='Kegiatan belum tersimpan atau berubah di tab lain. Muat ulang untuk melanjutkan checkpoint.';return false;}state=next;return true;}
 function applyHair(){return h.practice||finishHaircut(h.avatar,h.avatar==='female'?'trim':'shave','hajj');}
 function next(){if(state.beat===1&&!view?.campCare('hydrate')){notice().textContent='Air dan bekal belum tersimpan. Coba lagi.';return;}if(state.beat===9&&!applyHair()){notice().textContent='Hasil tahallul belum tersimpan. Coba lagi.';return;}const previous=state.beat;if(persist({...state,beat:state.beat+1,elapsed:0})){running=false;view?.setCampPose(null);draw();if(previous===7){const url=districtReturnUrl();if(url){document.getElementById('actions')!.replaceChildren();h.base('Level 8 selesai','Keluar dari gedung untuk menerima bintang dari penjaga.','PERFECT · LEVEL 8');h.action(districtExitLabel('Kembali ke distrik'),()=>requestArenaExit());return;}const message=hajjLevelMessage(8);notifySimplePlay(message.completedTitle+'. '+message.nextLabel);}}else buttons();}
 function start(){if(!view?.near())return;notice().textContent='';if(!aqabahDuration(state.beat)||state.beat===9&&state.cuts===3){next();return;}running=true;if(state.beat===9)view.setCampPose({clip:Clip.TASHAHHUD,phase:.5});buttons();}
 function throwOne(){if(!view?.near()||inFlight||state.throws>=7)return;inFlight=true;h.takbir();buttons();view.throwStone(2,()=>{if(disposed)return;inFlight=false;if(persist({...state,throws:state.throws+1})){notice().textContent='Allahu akbar · '+state.throws+'/7 kerikil masuk area Aqabah.';draw();}else buttons();});}
 function buttons(){document.getElementById('actions')!.replaceChildren();
  if(inFlight){h.action('Lontaran berlangsung',()=>{}).disabled=true;return;}
  if(running){h.action('Jeda kegiatan',()=>{running=false;view?.setCampPose(null);view?.setAqabahActivity(state.beat,state.cuts,0);persist(state);buttons();},true);return;}
  const b=AQABAH_BEATS[state.beat];if(!b){h.action('Selesaikan Level 9 · lanjut Ifadah',h.finish);return;}
  if(state.beat===7&&!h.after&&!h.practice){h.action('Lontaran tersimpan · lanjut panduan dam',h.thrown);return;}
  if((state.beat===4||state.beat===7)&&view?.near()){
   h.action(state.beat===4?'Pilih Aqabah':'Pelajari dam melalui pihak berwenang',next);
   h.action(state.beat===4?'Pilih Ula atau Wustha':'Cukup abaikan dam qiran',()=>{notice().textContent=state.beat===4?'Pada 10 Zulhijah, tujuannya Aqabah saja. Ula dan Wustha dilontar pada hari tasyrik.':'Dam qiran memiliki ketentuan tersendiri; bila tidak mampu ada ketentuan puasa. Konsultasikan kepada pembimbing.';},true);return;
  }
  let label:string=b.action;
  if(state.beat===5)label=state.throws<7?'Lontar kerikil '+(state.throws+1)+'/7 · Allahu akbar':'Tujuh lontaran selesai · ikuti jalur keluar';
  if(state.beat===9)label=state.cuts===3?'Tahallul selesai · simpan hasil':state.cuts===0?b.action:'Lanjut tindakan petugas '+(state.cuts+1)+'/3';
  h.arrive(label,()=>{if(state.beat===4||state.beat===7){buttons();return;}if(state.beat===5&&state.throws<7)throwOne();else start();});
 }
 function draw(){const b=AQABAH_BEATS[state.beat],number=cityArenaLevel()??nusukNumber('aqabah',state.beat);h.level(number,NUSUK_LEVELS[number-1].title);if(!view)view=h.scene('jamarat');
  if(!b){h.base('Aqabah dan tahallul awal selesai','Tujuh lontaran, panduan dam dan tahallul sudah tersimpan. Lanjutkan Tawaf Ifadah. Sa’i haji tidak diulang jika sudah diselesaikan setelah Tawaf Qudum.','PERFECT · LEVEL 9');view?.setAqabahActivity(state.beat,state.cuts,0);buttons();return;}
  view?.setGoal(b.goal[0],b.goal[1]);view?.setAqabahActivity(state.beat,state.cuts,state.beat===9?state.elapsed/2.4:0);
  h.base(b.title,b.body,'LEVEL '+number+' · KEGIATAN '+(state.beat+1)+'/'+AQABAH_BEATS.length);buttons();
 }
 function display(){clock.dataset.kind='aqabah';clock.dataset.aqabahBeat=String(state.beat);clock.dataset.throws=String(state.throws);clock.dataset.cuts=String(state.cuts);clock.dataset.elapsed=state.elapsed.toFixed(2);clock.dataset.running=String(running);clock.textContent=(AQABAH_BEATS[state.beat]?.title??'Siap menuju Ifadah')+' · Lontaran '+state.throws+'/7'+(state.beat>=9?' · Tahallul '+state.cuts+'/3':'')+(running?' · '+Math.floor(state.elapsed)+'/'+Math.ceil(aqabahDuration(state.beat))+' dtk game':'');}
 function frame(now:number){if(disposed)return;const dt=last?Math.min(.25,(now-last)/1000):0;last=now;
  if(running&&!h.blocked()&&!document.hidden&&view?.near()){
   state={...state,elapsed:Math.min(aqabahDuration(state.beat),state.elapsed+dt)};sinceSave+=dt;
   if(state.beat===9)view.setAqabahActivity(state.beat,state.cuts,state.elapsed/2.4,true);
   if(sinceSave>=.5||state.elapsed>=aqabahDuration(state.beat)){sinceSave=0;if(!persist(state))buttons();}
   if(running&&state.elapsed>=aqabahDuration(state.beat)){
    if(state.beat===9){if(persist({...state,cuts:state.cuts+1,elapsed:0})){running=false;view.setCampPose(null);draw();}else buttons();}else next();
   }
  }display();raf=requestAnimationFrame(frame);
 }
 const reset=()=>{last=0;};document.addEventListener('visibilitychange',reset);
 if(!h.practice&&!h.after&&state.beat===0&&state.throws===0&&h.needsBus()){
  view=h.scene('muzdalifah');view?.setMuzdalifahActivity(13,7,0,.9);view?.setGoal(0,10.6);h.base('Fajar · Muzdalifah menuju Mina','Temui pembimbing dan periksa bekal. Rombongan berangkat sebelum matahari terbit; lontaran Aqabah mengikuti waktu dan arahan petugas.','LEVEL 7 · PERJALANAN KE JAMARAT');h.arrive('Temui pembimbing menuju Aqabah',()=>{h.base('Berangkat ke Mina · Aqabah','Kemudikan bus mengikuti rute ilustratif. Setelah parkir, turun dan temui pembimbing untuk menuju Jamarat.','MUZDALIFAH → MINA');h.action('Naik bus Muzdalifah → Mina',h.bus);});
 }else draw();
 display();raf=requestAnimationFrame(frame);
 return {dispose(){disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',reset);view?.setCampPose(null);clock.remove();document.body.classList.remove('hasHajjField');}};
}
