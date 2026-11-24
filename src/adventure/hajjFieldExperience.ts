import {cityArenaLevel} from './arenaDoor.ts';
import {wearIhram} from '../characters/playerAppearance.ts';
import {readFieldActivity,storeFieldActivity,fieldDuration,wukufDayProgress,type FieldKind,type FieldActivity} from './hajjFieldModel.ts';
import type {SiteView} from '../hajjScenes.ts';
import {mountMinaCamp} from './minaCampExperience.ts';
import {mountArafahActivities} from './arafahExperience.ts';
import {readArafahActivity} from './arafahActivityModel.ts';
interface Hooks{
 id:string;host:HTMLElement;blocked:()=>boolean;
 base:(title:string,body:string,kicker?:string)=>void;
 action:(label:string,fn:()=>void,secondary?:boolean)=>HTMLButtonElement;
 prep:(label:string,fn:()=>void)=>void;
 scene:(kind:'prep'|'mina'|'arafah')=>SiteView|null;
 arrive:(label:string,fn:()=>void)=>void;
 finish:()=>void;bus:()=>void;needsMinaBus:()=>boolean;dress:()=>void;practice?:boolean;needsArafahBus:()=>boolean;arafahBus:()=>void;
}
export function mountHajjField(kind:FieldKind,h:Hooks){
 let state=readFieldActivity(kind,h.id),view:SiteView|null=null,raf=0,last=0,disposed=false;
 let camp:ReturnType<typeof mountMinaCamp>|null=null;
 let wukuf:ReturnType<typeof mountArafahActivities>|null=null;
 document.body.classList.add('hasHajjField');
 const clock=document.createElement('div');clock.id='fieldClock';clock.className='fieldClock';clock.setAttribute('role','status');h.host.append(clock);
 function save(phase:number,elapsed=0){const next:FieldActivity={version:1,id:h.id,phase,elapsed};if(!storeFieldActivity(kind,next)){document.getElementById('notice')!.textContent='Checkpoint belum tersimpan. Coba lagi setelah penyimpanan tersedia.';return false;}state=next;return true;}
 function next(){if(save(state.phase+1)){view?.setPrayer(false);draw();}}
 function at(label:string,fn:()=>void){h.arrive(label,fn);}
 function display(){
  clock.dataset.kind=kind;clock.dataset.phase=String(state.phase);clock.dataset.elapsed=state.elapsed.toFixed(2);clock.dataset.running='false';
  if(camp&&state.phase===4){const c=camp.status();clock.dataset.campBeat=String(c.beat);clock.dataset.elapsed=c.elapsed.toFixed(2);clock.dataset.running=String(c.running);clock.textContent=c.label;return;}
  delete clock.dataset.campBeat;
  if(wukuf&&state.phase<4){const c=wukuf.status();clock.dataset.arafahBeat=String(c.beat);clock.dataset.elapsed=c.elapsed.toFixed(2);clock.dataset.running=String(c.running);clock.textContent=c.label;return;}
  delete clock.dataset.arafahBeat;
  const time=kind==='mina'?['Persiapan ihram haji','Bus menuju Mina','Tiba di Mina','Tenda rombongan','Malam · istirahat','Pagi · 9 Zulhijah'][state.phase]:['Tiba di Arafah','Zuhur · mulai wukuf','Asar · doa & dzikir','Senja · tetap di Arafah','Matahari terbenam · Magrib'][state.phase];
  clock.textContent=time+((kind==='mina'&&state.phase===4||kind==='arafah'&&state.phase>0&&state.phase<4)?' · '+Math.floor(state.elapsed)+'/'+fieldDuration(kind)+' dtk waktu game':'');
  view?.setTime(kind==='arafah'?wukufDayProgress(state.phase,state.elapsed):state.phase===4?.86:state.phase===5?.08:.28);
 }
 function draw(){
  if(disposed)return;
  if(kind==='mina'){
   if(state.phase===0&&cityArenaLevel()===4){if(!view)view=h.scene('mina');view?.setGoal(0,-3);h.base('Selamat datang di Mina','Tetap dalam ihram sejak miqat. Temui pembimbing dan periksa bekal sebelum berkemah.','LEVEL 4 · MINA');h.arrive('Bekal siap · mulai kegiatan Mina',()=>{if(!wearIhram())return;if(save(1))draw();});}
   else if(state.phase===0){view=h.scene('prep');h.base('Tetap dalam ihram · bersiap menuju Mina','Pada jalur qiran, ihram sejak miqat masih berlangsung. Tidak ada tahallul umrah awal dan tidak perlu mengulang niat. Periksa pakaian serta bekal sebelum menuju Mina pada 8 Zulhijah.','LEVEL 4 · 8 ZULHIJAH');const el=document.getElementById('arabic')!;el.hidden=true;h.prep('Bekal siap · menuju bus Mina',()=>{if(!wearIhram())return;h.dress();if(save(1))draw();});}
   else if(state.phase===1&&h.needsMinaBus()){view=h.scene('prep');h.dress();h.base('Bus rombongan menuju Mina','Rombongan tetap dalam ihram sejak miqat. Naik bus bersama pembimbing, ikuti rute, lalu turun di terminal untuk mencari tenda rombongan.','LEVEL 4 · BERANGKAT KE MINA');h.action('Naik bus menuju Mina',h.bus);}
   else if(state.phase===1){if(save(2))draw();return;}
   else{
    if(!view)view=h.scene('mina');
    if(state.phase===2){view?.setGoal(0,-3);h.base('Temui rombongan di Mina','Jalan di antara perkemahan dan temui pembimbing. Jaga rombongan serta ingat lokasi tenda.','LEVEL 4 · MINA');at('Temui pembimbing di Mina',next);}
    if(state.phase===3){view?.setGoal(-4.3,-1);h.base('Temukan tenda dan periksa bekal','Datangi penanda tenda rombongan di sisi jalur. Kenali tempat istirahat, siapkan air minum dan perlengkapan untuk Arafah.','MINA · TENDA ROMBONGAN');at('Tenda ditemukan · bekal siap',next);}
    if(state.phase===4&&view&&!camp){camp=mountMinaCamp({...h,view,finish:()=>{if(save(4,fieldDuration('mina'))&&save(5)){camp?.dispose();camp=null;draw();}}});}
    if(state.phase===5){h.base('Pagi · siap menuju Arafah','Persiapan Mina selesai. Tetap bersama pembimbing dan lanjutkan perjalanan menuju Padang Arafah.','LEVEL 4 · MINA SELESAI');h.action('Selesaikan Mina · lanjut Arafah',h.finish);}
   }
  }else{
   if(state.phase===0&&!h.practice&&h.needsArafahBus()&&readArafahActivity(h.id,state).beat===0){
    if(!view)view=h.scene('mina');view?.setGoal(0,-3);
    h.base('Pagi · Mina menuju Arafah','Setelah Subuh dan matahari terbit pada 9 Zulhijah, temui pembimbing keberangkatan. Periksa rombongan dan bekal, lalu naik bus. Talbiyah menyertai perjalanan.','LEVEL 5 · BERANGKAT DARI MINA');
    at('Temui pembimbing keberangkatan',()=>{h.base('Rombongan siap berangkat','Tetap memakai ihram dan jaga bekal air. Kemudikan bus mengikuti rute, parkir, turun dan temui pembimbing di terminal Arafah.','MINA → ARAFAH');h.action('Naik bus Mina → Arafah',h.arafahBus);});
   }else if(state.phase<4){
    if(!view)view=h.scene('arafah');
    if(view&&!wukuf)wukuf=mountArafahActivities({...h,view,legacy:state,finish:()=>{
     while(state.phase<4){if(state.phase>0&&!save(state.phase,fieldDuration('arafah')))return;if(!save(state.phase+1))return;}
     wukuf?.dispose();wukuf=null;draw();
    }});
   }else{view?.setPrayer(false);if(!view)view=h.scene('arafah');h.base('Matahari terbenam · wukuf selesai','Kegiatan Arafah telah mencapai matahari terbenam dan rombongan siap berangkat. Lanjutkan perjalanan menuju Muzdalifah.','PERFECT · LEVEL 5');h.action('Selesaikan Arafah · lanjut Muzdalifah',h.finish);}
  }
  display();
 }
 function frame(now:number){if(disposed)return;const dt=last?Math.min(.25,(now-last)/1000):0;last=now;camp?.tick(dt);wukuf?.tick(dt);display();raf=requestAnimationFrame(frame);}
 const resetClock=()=>{last=0;};document.addEventListener('visibilitychange',resetClock);
 if(h.practice&&kind==='mina'&&state.phase===0){if(save(1))save(2);}
 draw();raf=requestAnimationFrame(frame);
 return {dispose(){disposed=true;camp?.dispose();wukuf?.dispose();cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',resetClock);view?.setPrayer(false);clock.remove();document.body.classList.remove('hasHajjField');}};
}
