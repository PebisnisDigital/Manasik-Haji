import {MINA_BEATS,readMinaCamp,storeMinaCamp,minaDuration,minaPose,type MinaCampSave} from './minaCampModel.ts';
import type {SiteView} from '../hajjScenes.ts';
interface CampHooks {
 id:string;view:SiteView;blocked:()=>boolean;
 base:(title:string,body:string,kicker?:string)=>void;
 action:(label:string,fn:()=>void,secondary?:boolean)=>HTMLButtonElement;
 arrive:(label:string,fn:()=>void)=>void;finish:()=>void;
}
export function mountMinaCamp(h:CampHooks){
 let state=readMinaCamp(h.id),running=false,disposed=false,sinceSave=0;
 const notice=()=>document.getElementById('notice')!;
 const persist=(candidate:MinaCampSave)=>{
  if(!storeMinaCamp(candidate)){running=false;h.view.setCampPose(null);notice().textContent='Kegiatan belum tersimpan. Periksa penyimpanan lalu coba lagi.';return false;}
  state=candidate;return true;
 };
 function next(){
  const id=MINA_BEATS[state.beat]?.id;
  if((id==='supplies'||id==='rest')&&!h.view.campCare(id==='supplies'?'refill':'rest')){running=false;h.view.setCampPose(null);buttons();notice().textContent='Bekal atau kondisi belum tersimpan. Coba lagi.';return;}
  if(persist({...state,beat:state.beat+1,elapsed:0})){running=false;h.view.setCampPose(null);draw();}
 }
 function buttons(){
  document.getElementById('actions')!.replaceChildren();
  if(running){h.action('Jeda kegiatan',()=>{running=false;h.view.setCampPose(null);persist(state);buttons();},true);return;}
  const b=MINA_BEATS[state.beat];if(!b){h.action('Simpan kegiatan Mina · lanjut pagi',h.finish);return;}
  h.arrive(b.action,()=>{
   if(!h.view.near())return;
   notice().textContent='';
   if(minaDuration(state.beat)===0){next();return;}
   running=true;h.view.setCampPose(minaPose(state.beat,state.elapsed)??{clip:0,phase:0});buttons();
  });
 }
 function draw(){
  const b=MINA_BEATS[state.beat];
  if(!b){h.view.setCampPose(null);h.base('Kegiatan Tarwiyah selesai','Rombongan telah mengikuti kegiatan Mina hingga pagi. Simpan hasil untuk melanjutkan perjalanan.','MINA · PAGI 9 ZULHIJAH');h.action('Simpan kegiatan Mina · lanjut pagi',h.finish);h.finish();return;}
  h.view.setMinaCamp(state.beat);h.view.setGoal(b.goal[0],b.goal[1]);h.view.setTime(b.time);
  const ritual='rakaat' in b?' Gerakan salat dipadatkan untuk belajar urutan; durasi game bukan durasi ibadah nyata.':'';
  h.base(b.title,b.body+ritual,'MINA · KEGIATAN '+(state.beat+1)+'/'+MINA_BEATS.length);buttons();
 }
 draw();
 return {
  tick(dt:number){
   if(disposed||!running||h.blocked()||document.hidden||!h.view.near())return;
   const duration=minaDuration(state.beat),elapsed=Math.min(duration,state.elapsed+Math.max(0,Math.min(.25,dt)));
   state={...state,elapsed};sinceSave+=dt;
   h.view.setCampPose(minaPose(state.beat,elapsed)??{clip:0,phase:0});
   if(sinceSave>=2||elapsed>=duration){sinceSave=0;if(!persist(state)){buttons();return;}}
   if(elapsed>=duration)next();
  },
  status(){return {beat:state.beat,elapsed:state.elapsed,running,label:(MINA_BEATS[state.beat]?.title??'Kegiatan Mina selesai')+(running?' · '+Math.floor(state.elapsed)+'/'+Math.ceil(minaDuration(state.beat))+' dtk game':'')};},
  dispose(){disposed=true;running=false;h.view.setCampPose(null);},
 };
}
