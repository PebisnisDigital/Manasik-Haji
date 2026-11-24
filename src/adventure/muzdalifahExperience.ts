import {MUZDALIFAH_BEATS,readMuzdalifah,storeMuzdalifah,muzdalifahDuration,muzdalifahGoal,muzdalifahPose,muzdalifahDawn,type MuzdalifahSave} from './muzdalifahModel.ts';
import type {SiteView} from '../hajjScenes.ts';
interface Hooks{id:string;host:HTMLElement;legacyStones:number;practice:boolean;blocked:()=>boolean;needsBus:()=>boolean;bus:()=>void;scene:(kind:'arafah'|'muzdalifah')=>SiteView|null;base:(title:string,body:string,kicker?:string)=>void;action:(label:string,fn:()=>void,secondary?:boolean)=>HTMLButtonElement;arrive:(label:string,fn:()=>void)=>void;finish:()=>void}
export function mountMuzdalifah(h:Hooks){
 let state=readMuzdalifah(h.id,h.legacyStones),view:SiteView|null=null,running=false,last=0,sinceSave=0,raf=0,disposed=false;
 const clock=document.createElement('div');clock.id='fieldClock';clock.className='fieldClock';clock.setAttribute('role','status');h.host.append(clock);document.body.classList.add('hasHajjField');
 const notice=()=>document.getElementById('notice')!;
 function persist(next:MuzdalifahSave){if(!storeMuzdalifah(next,h.legacyStones)){running=false;view?.setCampPose(null);notice().textContent='Kegiatan belum tersimpan. Coba lagi setelah penyimpanan tersedia.';return false;}state=next;return true;}
 function next(){if((state.beat===4||state.beat===9)&&!view?.campCare(state.beat===4?'hydrate':'rest')){running=false;view?.setCampPose(null);buttons();notice().textContent='Kondisi atau bekal belum tersimpan. Coba lagi.';return;}if(persist({...state,beat:state.beat+1,elapsed:0})){running=false;view?.setCampPose(null);draw();}else buttons();}
 function start(){if(!view?.near())return;notice().textContent='';if(!muzdalifahDuration(state.beat)||state.beat===8&&state.stones===7){next();return;}running=true;view.setCampPose(muzdalifahPose(state.beat,state.elapsed));buttons();}
 function buttons(){document.getElementById('actions')!.replaceChildren();
  if(running){h.action('Jeda kegiatan',()=>{running=false;view?.setCampPose(null);persist(state);buttons();},true);return;}
  const b=MUZDALIFAH_BEATS[state.beat];if(!b){h.action('Selesaikan Muzdalifah · lanjut Aqabah',h.finish);return;}
  if(state.beat===7&&view?.near()){h.action('Pilih kerikil kecil',next);h.action('Pilih batu besar',()=>{notice().textContent='Gunakan kerikil kecil untuk lontaran. Batu besar tidak dipilih. Kerikil tidak perlu dicuci.';},true);return;}
  const label=state.beat===8?(state.stones<7?'Ambil kerikil '+(state.stones+1)+'/7':'Tujuh kerikil siap · rapikan bekal'):b.action;
  h.arrive(label,()=>{if(state.beat===7){buttons();return;}start();});
 }
 function draw(){const b=MUZDALIFAH_BEATS[state.beat];if(!view)view=h.scene('muzdalifah');
  if(!b){h.base('Fajar · kegiatan Muzdalifah selesai','Salat, kegiatan malam dan persiapan kerikil telah tersimpan. Rombongan siap menuju Mina untuk Aqabah.','PERFECT · LEVEL 6');buttons();return;}
  const goal=muzdalifahGoal(state.beat,state.stones);view?.setGoal(goal[0],goal[1]);view?.setMuzdalifahActivity(state.beat,state.stones,0,muzdalifahDawn(state.beat,state.elapsed));h.base(b.title,b.body,'MUZDALIFAH · KEGIATAN '+(state.beat+1)+'/'+MUZDALIFAH_BEATS.length);buttons();
 }
 function display(){clock.dataset.kind='muzdalifah';clock.dataset.muzdalifahBeat=String(state.beat);clock.dataset.stones=String(state.stones);clock.dataset.elapsed=state.elapsed.toFixed(2);clock.dataset.running=String(running);clock.textContent=(MUZDALIFAH_BEATS[state.beat]?.title??'Siap menuju Mina')+' · Kerikil '+state.stones+'/7'+(running?' · '+Math.floor(state.elapsed)+'/'+Math.ceil(muzdalifahDuration(state.beat))+' dtk game':'');}
 function frame(now:number){if(disposed)return;const dt=last?Math.min(.25,(now-last)/1000):0;last=now;
  if(running&&!h.blocked()&&!document.hidden&&view?.near()){
   state={...state,elapsed:Math.min(muzdalifahDuration(state.beat),state.elapsed+dt)};sinceSave+=dt;view.setCampPose(muzdalifahPose(state.beat,state.elapsed));view.setMuzdalifahActivity(state.beat,state.stones,state.beat===8?state.elapsed/1.5:0,muzdalifahDawn(state.beat,state.elapsed));
   if(sinceSave>=(state.beat===8?.5:2)||state.elapsed>=muzdalifahDuration(state.beat)){sinceSave=0;if(!persist(state)){buttons();}}
   if(running&&state.elapsed>=muzdalifahDuration(state.beat)){
    if(state.beat===8){if(persist({...state,stones:state.stones+1,elapsed:0})){running=false;view.setCampPose(null);draw();}else buttons();}else next();
   }
  }display();raf=requestAnimationFrame(frame);
 }
 const reset=()=>{last=0;};document.addEventListener('visibilitychange',reset);
 if(!h.practice&&state.beat===0&&state.stones===0&&h.needsBus()){view=h.scene('arafah');view?.setTime(1);view?.setGoal(0,10.6);h.base('Matahari terbenam · Arafah menuju Muzdalifah','Setelah wukuf selesai dan matahari terbenam, temui pembimbing di titik kumpul. Berangkat dengan tenang dan lanjutkan talbiyah.','LEVEL 6 · PERJALANAN MALAM');h.arrive('Temui pembimbing menuju Muzdalifah',()=>{h.base('Bus malam menuju Muzdalifah','Naik bus, ikuti rute dengan tenang, parkir lalu turun. Magrib dan Isya dalam alur ini dilaksanakan setelah tiba di Muzdalifah.','ARAFAH → MUZDALIFAH');h.action('Naik bus Arafah → Muzdalifah',h.bus);});}else draw();
 display();raf=requestAnimationFrame(frame);
 return {dispose(){disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',reset);view?.setCampPose(null);clock.remove();document.body.classList.remove('hasHajjField');}};
}
