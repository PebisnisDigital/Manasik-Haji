/** All effects are original filtered noise, not recordings, music, prayer or simulated sacred recitation. */
export type SoundScene='lobby'|'prep'|'post'|'trim'|'tawaf'|'sai'|'arafah'|'muzdalifah'|'mina'|'jamarat'|'complete';
type Profile={air:number;airHz:number;crowd:number;crowdHz:number;floor:'hard'|'sand'};
const profiles:Record<SoundScene,Profile>={
 lobby:{air:.17,airHz:450,crowd:.035,crowdHz:780,floor:'hard'},
 prep:{air:.08,airHz:270,crowd:.015,crowdHz:520,floor:'hard'},
 post:{air:.11,airHz:380,crowd:.075,crowdHz:720,floor:'hard'},
 trim:{air:.06,airHz:260,crowd:.015,crowdHz:520,floor:'hard'},
 tawaf:{air:.14,airHz:550,crowd:.16,crowdHz:950,floor:'hard'},
 sai:{air:.09,airHz:240,crowd:.13,crowdHz:800,floor:'hard'},
 arafah:{air:.23,airHz:680,crowd:.07,crowdHz:680,floor:'sand'},
 muzdalifah:{air:.16,airHz:420,crowd:.035,crowdHz:550,floor:'sand'},
 mina:{air:.19,airHz:530,crowd:.095,crowdHz:760,floor:'sand'},
 jamarat:{air:.10,airHz:290,crowd:.125,crowdHz:900,floor:'hard'},
 complete:{air:0,airHz:350,crowd:0,crowdHz:550,floor:'hard'}
};
const PREF='umroh-digital-ambience-v1';
export class ImmersiveSound{
 private ctx:AudioContext|null=null;private master:GainNode|null=null;private air:GainNode|null=null;private crowd:GainNode|null=null;
 private airFilter:BiquadFilterNode|null=null;private crowdFilter:BiquadFilterNode|null=null;private buffer:AudioBuffer|null=null;
 private sources:AudioBufferSourceNode[]=[];private scene:SoundScene;private preferred=false;private active=false;private pending=false;private paused=false;private ducked=false;private disposed=false;private generation=0;private distance=0;private lastStep=-1;
 private readonly abort=new AbortController();private readonly button:HTMLButtonElement;
 constructor(scene:SoundScene,host:HTMLElement|null){
  this.scene=scene;try{this.preferred=localStorage.getItem(PREF)==='on';}catch{}
  this.button=document.createElement('button');this.button.type='button';this.button.className='ambienceToggle';host?.append(this.button);this.render();
  const signal=this.abort.signal;
  this.button.addEventListener('click',()=>{if(this.active||this.pending){this.preferred=false;this.active=false;this.generation++;this.pending=false;this.save();this.mix();this.render();}else{this.preferred=true;this.save();void this.unlock();}},{signal});
  const resume=(e:Event)=>{if(!e.isTrusted||!this.preferred||this.active||this.pending||document.hidden||this.paused||(e.target instanceof Element&&e.target.closest('.ambienceToggle,a,#voiceToggle,#voiceReplay')))return;void this.unlock();};
  document.addEventListener('click',resume,{capture:true,signal});document.addEventListener('keydown',resume,{capture:true,signal});
  document.addEventListener('visibilitychange',()=>this.mix(),{signal});
  document.addEventListener('manasik-voice-active',e=>{this.ducked=!!(e as CustomEvent<boolean>).detail;this.mix();},{signal});
  window.addEventListener('pagehide',()=>this.suspend(),{signal});window.addEventListener('pageshow',e=>{if(e.persisted){this.active=false;this.mix();this.render();}},{signal});
 }
 private save(){try{localStorage.setItem(PREF,this.preferred?'on':'off');}catch{}}
 private render(){this.button.textContent=this.active?'Ambience: on':this.pending?'Audio…':this.preferred?'Aktifkan ambience':'Ambience: off';this.button.setAttribute('aria-pressed',String(this.active));this.button.title='Suara lingkungan dan efek gerakan, tanpa musik';}
 private init(){const c=this.ctx!;this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
  this.buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate);const a=this.buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;
  const layer=(frequency:number,offset:number)=>{const src=c.createBufferSource();src.buffer=this.buffer;src.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=frequency;f.Q.value=.24;const g=c.createGain();g.gain.value=0;src.connect(f).connect(g).connect(this.master!);src.start(0,offset);this.sources.push(src);return {f,g};};
  const a1=layer(380,0),a2=layer(780,1.7);this.air=a1.g;this.crowd=a2.g;this.airFilter=a1.f;this.crowdFilter=a2.f;
 }
 private async unlock(){if(this.disposed||this.pending)return;this.pending=true;const ticket=++this.generation;this.render();try{
  this.ctx??=new AudioContext();const c=this.ctx;if(!this.master)this.init();await c.resume();
  if(this.disposed||ticket!==this.generation)return;if(!this.preferred)return;this.active=c.state==='running';if(!this.active)this.button.title='Ketuk lagi untuk menyalakan audio';
 }catch{if(ticket===this.generation){this.active=false;this.preferred=false;this.save();}}finally{if(ticket===this.generation&&!this.disposed){this.pending=false;this.mix();this.render();}}}
 private mix(){const c=this.ctx;if(!c||!this.master)return;const t=c.currentTime,p=profiles[this.scene],audible=this.active&&!this.paused&&!document.hidden&&!this.disposed;
  this.master.gain.setTargetAtTime(audible?(this.ducked?.15:.40):0,t,.05);
  this.air?.gain.setTargetAtTime(p.air,t,.2);this.crowd?.gain.setTargetAtTime(p.crowd,t,.2);this.airFilter?.frequency.setTargetAtTime(p.airHz,t,.2);this.crowdFilter?.frequency.setTargetAtTime(p.crowdHz,t,.2);
 }
 private suspend(){this.generation++;this.pending=false;this.active=false;this.mix();this.render();if(this.ctx)void this.ctx.suspend().catch(()=>{});}
 setScene(scene:SoundScene){if(scene===this.scene)return;this.scene=scene;this.distance=0;this.mix();}
 setPaused(value:boolean){if(this.paused===value)return;this.paused=value;this.distance=0;this.mix();}
 private audible(){return !!this.ctx&&this.ctx.state==='running'&&!!this.master&&!!this.buffer&&this.active&&!this.paused&&!document.hidden&&!this.disposed;}
 private effect(hz:number,peak:number,duration:number,delay=0,type:BiquadFilterType='bandpass'){
  if(!this.audible())return;const c=this.ctx!,t=c.currentTime+delay,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.buffer;
  f.type=type;f.frequency.value=hz;f.Q.value=.7;g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(peak,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+duration);
  s.connect(f).connect(g).connect(this.master!);s.start(t,Math.random()*2,duration+.02);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};
 }
 walk(metres:number){if(!this.audible()||!Number.isFinite(metres)||metres<=0)return;this.distance+=Math.min(metres,.25);const t=this.ctx!.currentTime;if(this.distance<.66||t-this.lastStep<.18)return;this.distance%=.66;this.lastStep=t;const sand=profiles[this.scene].floor==='sand';
  this.effect(sand?440:220,sand?.32:.38,.105);this.effect(sand?1650:1050,.12,.07,.025);
 }
 impact(){this.effect(1450,.32,.07);this.effect(520,.26,.14,.018);}
 pickup(){this.effect(830,.15,.10);}
 water(){this.effect(1250,.16,.24,0,'lowpass');this.effect(2200,.10,.16,.12);}
 dispose(){if(this.disposed)return;this.disposed=true;this.abort.abort();this.generation++;this.button.remove();for(const s of this.sources){try{s.stop();}catch{}s.disconnect();}if(this.ctx)void this.ctx.close().catch(()=>{});}
}
