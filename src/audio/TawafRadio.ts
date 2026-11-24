import {journeyVoice,journeyVolume} from '../frontSettings.ts';
import {ImmersiveSound} from './ImmersiveSound.ts';
import {gateGuide} from '../gateGuide.ts';
import type {Avatar} from '../coreProgress.ts';
/** Voice-only companion with persistent captions, user-gesture unlock and local audio settings. */
export class TawafRadio {
 private panel=document.createElement('aside');private caption=document.createElement('p');private state=document.createElement('small');private toggle=document.createElement('button');private replay=document.createElement('button');
 private engine:SpeechSynthesis|null='speechSynthesis'in window&&'SpeechSynthesisUtterance'in window?speechSynthesis:null;
 private abort=new AbortController();private sound:ImmersiveSound;private enabled=journeyVoice();private unlocked=false;private paused=false;private pending=false;private key='';private message='';private active:SpeechSynthesisUtterance|null=null;
 constructor(host:HTMLElement,private readonly avatar:Avatar,panorama:()=>void){
  try{const p=localStorage.getItem('manasik-voice-v1');if(p!==null)this.enabled=p==='on';}catch{}
  this.panel.className='tawafRadio';this.panel.setAttribute('aria-label','Pemandu suara');const title=document.createElement('b');title.textContent=gateGuide(avatar).name+' · Radio pemandu';this.caption.id='tawafCaption';this.caption.setAttribute('aria-live','polite');this.state.id='tawafVoiceState';
  const actions=document.createElement('div');actions.className='tawafRadioActions';this.toggle.id='tawafVoice';this.replay.id='tawafReplay';this.replay.textContent='Ulangi petunjuk';for(const b of [this.toggle,this.replay])b.type='button';actions.append(this.toggle,this.replay);
  const look=document.createElement('button');look.id='tawafPanorama';look.textContent='Lihat menara & langit';look.onclick=panorama;look.type='button';this.panel.append(title,this.caption,this.state,actions,look);host.append(this.panel);this.sound=new ImmersiveSound('tawaf',actions);
  const signal=this.abort.signal;
  this.toggle.onclick=()=>{if(this.enabled&&this.unlocked){this.enabled=false;this.stop();}else{this.enabled=true;this.unlocked=true;}this.save();this.render();this.speak();};
  this.replay.onclick=()=>{this.enabled=true;this.unlocked=true;this.save();this.render();this.speak();};
  const unlock=(e:Event)=>{if(!e.isTrusted||!this.enabled||this.unlocked||this.paused||(e.target as Element|null)?.closest('#tawafVoice,#tawafReplay,a'))return;this.unlocked=true;this.speak();this.render();};
  document.addEventListener('click',unlock,{capture:true,signal});document.addEventListener('keydown',unlock,{capture:true,signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();},{signal});
  this.render();
 }
 private save(){try{localStorage.setItem('manasik-voice-v1',this.enabled?'on':'off');}catch{}}
 private render(){this.toggle.textContent=this.enabled&&this.unlocked?'Matikan suara':'Aktifkan suara';this.toggle.setAttribute('aria-pressed',String(this.enabled&&this.unlocked));this.toggle.disabled=this.replay.disabled=!this.engine;this.state.textContent=!this.engine?'Suara tidak didukung; petunjuk teks tetap tersedia.':journeyVolume()===0?'Volume pengaturan awal 0; petunjuk teks tetap tersedia.':this.enabled&&this.unlocked?'Pemandu melalui suara · Geser layar untuk melihat sekeliling':'Petunjuk teks aktif · Suara dapat diaktifkan';}
 private stop(){if(this.active){this.active=null;this.engine?.cancel();document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));}}
 private speak(){
  if(this.paused){this.pending=this.enabled&&this.unlocked;return;}this.pending=false;
  if(!this.engine||!this.enabled||!this.unlocked||this.paused||document.hidden||!this.message||journeyVolume()===0)return;
  this.stop();const voices=this.engine.getVoices(),indonesian=voices.filter(v=>/^id(?:[-_]|$)/i.test(v.lang));
  if(voices.length&&!indonesian.length){this.state.textContent='Suara Indonesia belum tersedia di perangkat. Petunjuk teks tetap aktif.';return;}
  const u=new SpeechSynthesisUtterance(this.message);u.lang='id-ID';u.rate=.92;u.volume=journeyVolume();if(indonesian.length)u.voice=indonesian.find(v=>(this.avatar==='female'?/female|wanita|gadis/i:/\bmale\b|pria|ardi/i).test(v.name))??indonesian[0];this.active=u;
  u.onstart=()=>{if(this.active===u)document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:true}));};
  u.onend=()=>{if(this.active===u){this.active=null;document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));}};
  u.onerror=()=>{if(this.active===u){this.active=null;document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));this.state.textContent='Suara belum bisa diputar. Coba Ulangi petunjuk; teks tetap tersedia.';}};
  try{this.engine.speak(u);}catch{this.stop();this.state.textContent='Audio belum tersedia. Petunjuk teks tetap aktif.';}
 }
 announce(key:string,text:string){if(key===this.key)return;this.key=key;this.message=text;this.caption.textContent=text;this.speak();}
 setPaused(value:boolean){this.sound.setPaused(value);if(value!==this.paused){this.paused=value;if(value)this.stop();else if(this.pending)this.speak();}}
 walk(metres:number){this.sound.walk(metres);}
 dispose(){this.stop();this.abort.abort();this.sound.dispose();this.panel.remove();}
}
