/** Local browser speech synthesis; text is always available without audio. */
const PREF='manasik-voice-v1';
export class VoiceGuide {
  private readonly toggle=document.querySelector<HTMLButtonElement>('#voiceToggle')!;
  private readonly replay=document.querySelector<HTMLButtonElement>('#voiceReplay')!;
  private readonly caption=document.querySelector<HTMLElement>('#voiceCaption')!;
  private readonly state=document.querySelector<HTMLElement>('#voiceState')!;
  private readonly engine:SpeechSynthesis|null='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window?window.speechSynthesis:null;
  private enabled=false;
  private preferred=false;
  private current='';
  private active:SpeechSynthesisUtterance|null=null;
  private lastSpoken=new Map<string,number>();
  constructor(initial:string){
    this.current=initial;this.caption.textContent=initial;
    try{this.preferred=localStorage.getItem(PREF)==='on';}catch{/* preference optional */}
    if(!this.engine){this.toggle.disabled=true;this.replay.disabled=true;this.state.textContent='Audio tidak didukung. Panduan teks tetap tersedia.';return;}
    this.render();
    this.toggle.addEventListener('click',()=>this.setEnabled(!this.enabled));
    this.replay.addEventListener('click',()=>{if(!this.enabled)this.setEnabled(true);else this.speak();});
    // Browsers often require a new user gesture after navigation.
    const unlock=(e:Event)=>{if(!e.isTrusted||!this.preferred||this.enabled)return;
      if((e.target as Element|null)?.closest('#voiceToggle,#voiceReplay,a'))return;
      this.enabled=true;this.render();this.speak();
    };
    document.addEventListener('click',unlock,true);
    document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key==='Escape')return;unlock(e);},true);
    window.addEventListener('pagehide',()=>this.stop());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
    this.engine.addEventListener('voiceschanged',()=>{if(!this.active)this.render();});
  }
  private setEnabled(on:boolean):void{
    this.enabled=on;this.preferred=on;
    try{localStorage.setItem(PREF,on?'on':'off');}catch{/* local settings optional */}
    this.render();if(on)this.speak();else this.stop();
  }
  private render():void{
    this.toggle.setAttribute('aria-pressed',String(this.enabled));
    this.toggle.textContent=this.enabled?'Matikan suara':'Aktifkan suara';
    this.state.textContent=this.enabled?'Pemandu suara aktif':this.preferred?'Ketuk untuk melanjutkan suara':'Panduan teks • suara opsional';
  }
  stop():void{if(this.active){this.active=null;this.engine?.cancel();document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));}}
  private speak():void{
    if(!this.enabled||!this.engine||!this.current||document.hidden)return;
    this.stop();
    const voices=this.engine.getVoices();
    const idVoice=voices.find(v=>v.lang.toLowerCase().replace('_','-')==='id-id')??voices.find(v=>/^id(?:[-_]|$)/i.test(v.lang));
    if(voices.length&&!idVoice){
      this.enabled=false;this.render();this.state.textContent='Suara Indonesia belum tersedia di perangkat. Panduan teks tetap aktif.';return;
    }
    const u=new SpeechSynthesisUtterance(this.current);
    u.lang='id-ID';u.rate=.9;u.pitch=1;u.volume=1;if(idVoice)u.voice=idVoice;
    this.active=u;
    u.onstart=()=>{if(this.active===u){this.state.textContent='Pemandu sedang berbicara…';document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:true}));}};
    u.onend=()=>{if(this.active===u){this.active=null;document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));this.render();}};
    u.onerror=()=>{if(this.active===u){this.active=null;document.dispatchEvent(new CustomEvent('manasik-voice-active',{detail:false}));this.enabled=false;this.render();this.state.textContent='Audio belum bisa diputar. Ketuk aktifkan suara atau baca panduan.';}};
    try{this.engine.speak(u);}catch{this.active=null;this.enabled=false;this.render();this.state.textContent='Audio tidak tersedia. Panduan teks tetap aktif.';}
  }
  /** Discrete educational events only; never announce every animation frame. */
  announce(text:string,key:string,interval=0,priority=false):void{
    const now=performance.now(),last=this.lastSpoken.get(key);
    if(last!==undefined&&now-last<interval)return;
    this.lastSpoken.set(key,now);this.current=text;this.caption.textContent=text;
    if(!this.active||priority)this.speak();
  }
  reset(text:string):void{
    this.lastSpoken.clear();this.announce(text,'reset',0,true);
  }
}
