import {ARAFAH_BEATS,readArafahActivity,storeArafahActivity,arafahDuration,arafahPose,arafahDay,type ArafahActivity} from './arafahActivityModel.ts';
import type {FieldActivity} from './hajjFieldModel.ts';
import type {SiteView} from '../hajjScenes.ts';
interface ArafahHooks {id:string;legacy:FieldActivity;view:SiteView;blocked:()=>boolean;base:(title:string,body:string,kicker?:string)=>void;action:(label:string,fn:()=>void,secondary?:boolean)=>HTMLButtonElement;arrive:(label:string,fn:()=>void)=>void;finish:()=>void}
export function mountArafahActivities(h:ArafahHooks){
 let state=readArafahActivity(h.id,h.legacy),running=false,disposed=false,sinceSave=0;
 const notice=()=>document.getElementById('notice')!;
 function persist(next:ArafahActivity){if(!storeArafahActivity(next,h.legacy)){running=false;h.view.setCampPose(null);notice().textContent='Kegiatan belum tersimpan. Coba lagi setelah penyimpanan tersedia.';return false;}state=next;return true;}
 function next(){const b=ARAFAH_BEATS[state.beat];if(b?.id==='water'&&!h.view.campCare('hydrate')||b?.id==='shade'&&!h.view.campCare('rest')){running=false;h.view.setCampPose(null);buttons();notice().textContent='Kondisi atau bekal belum tersimpan. Coba lagi.';return;}if(persist({...state,beat:state.beat+1,elapsed:0})){running=false;h.view.setCampPose(null);draw();}}
 function start(){if(!h.view.near())return;notice().textContent='';if(!arafahDuration(state.beat)){next();return;}running=true;h.view.setCampPose(arafahPose(state.beat,state.elapsed));buttons();}
 function buttons(){
  document.getElementById('actions')!.replaceChildren();const b=ARAFAH_BEATS[state.beat];
  if(!b){h.action('Simpan kegiatan Arafah',h.finish);return;}
  if(running){h.action('Jeda kegiatan',()=>{running=false;h.view.setCampPose(null);persist(state);buttons();},true);return;}
  if(b.id==='dua'&&h.view.near()&&!state.intention){
   for(const [id,label] of [['self','Doa · ampunan dan kebaikan diri'],['family','Doa · keluarga dan orang tua'],['all','Doa · kebaikan sesama']] as const)h.action(label,()=>{if(persist({...state,intention:id}))start();});
  }else h.arrive(b.action,()=>{if(b.id==='dua'&&!state.intention){buttons();return;}start();});
 }
 function draw(){const b=ARAFAH_BEATS[state.beat];if(!b){h.base('Kegiatan wukuf selesai','Rombongan siap melanjutkan perjalanan setelah matahari terbenam.','ARAFAH · SENJA SELESAI');h.action('Simpan kegiatan Arafah',h.finish);h.finish();return;}h.view.setArafahActivity(state.beat);h.view.setGoal(b.goal[0],b.goal[1]);h.view.setTime(arafahDay(state.beat,state.elapsed));h.base(b.title,b.body,'ARAFAH · KEGIATAN '+(state.beat+1)+'/'+ARAFAH_BEATS.length);buttons();}
 draw();
 return {tick(dt:number){if(disposed||!running||h.blocked()||document.hidden||!h.view.near())return;state={...state,elapsed:Math.min(arafahDuration(state.beat),state.elapsed+Math.max(0,Math.min(.25,dt)))};sinceSave+=dt;h.view.setCampPose(arafahPose(state.beat,state.elapsed));h.view.setTime(arafahDay(state.beat,state.elapsed));if(sinceSave>=2||state.elapsed>=arafahDuration(state.beat)){sinceSave=0;if(!persist(state)){buttons();return;}}if(state.elapsed>=arafahDuration(state.beat))next();},status(){return {beat:state.beat,elapsed:state.elapsed,running,label:(ARAFAH_BEATS[state.beat]?.title??'Kegiatan selesai')+(running?' · '+Math.floor(state.elapsed)+'/'+Math.ceil(arafahDuration(state.beat))+' dtk game':'')};},dispose(){disposed=true;running=false;h.view.setCampPose(null);}};
}
