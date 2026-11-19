/** Generated environmental sound; no external recordings or musical track. */
export class Ambience{
 private ctx:AudioContext|null=null;
 private gain:GainNode|null=null;
 private noise:AudioBuffer|null=null;
 private room:AudioBufferSourceNode|null=null;
 private timer=0;
 private lastStep=0;
 private enabled=false;
 async start(){
  try{
   this.ctx??=new AudioContext();
   const c=this.ctx;await c.resume();this.enabled=true;
   if(!this.gain){this.gain=c.createGain();this.gain.gain.value=.35;this.gain.connect(c.destination);
    this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const a=this.noise.getChannelData(0);let p=0;for(let i=0;i<a.length;i++){p=(p+.035*(Math.random()*2-1))*.97;a[i]=p*2;}
    this.room=c.createBufferSource();this.room.buffer=this.noise;this.room.loop=true;const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=410;const g=c.createGain();g.gain.value=.18;this.room.connect(low).connect(g).connect(this.gain);this.room.start();
   }
   this.gain.gain.value=.35;if(!this.timer)this.timer=window.setInterval(()=>this.bird(),6200);
   return true;
  }catch{return false;}
 }
 stop(){this.enabled=false;if(this.gain)this.gain.gain.value=0;if(this.timer){clearInterval(this.timer);this.timer=0;}}
 private bird(){if(!this.enabled||document.hidden||!this.ctx||!this.gain)return;const c=this.ctx;for(let i=0;i<3;i++){const t=c.currentTime+i*.16;const o=c.createOscillator();const g=c.createGain();o.type='sine';o.frequency.setValueAtTime(2200+i*240,t);o.frequency.exponentialRampToValueAtTime(1400+i*110,t+.1);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.045,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g).connect(this.gain);o.start(t);o.stop(t+.14);}}
 step(){if(!this.enabled||!this.ctx||!this.gain||!this.noise)return;const c=this.ctx,t=c.currentTime;if(t-this.lastStep<.35)return;this.lastStep=t;const s=c.createBufferSource();s.buffer=this.noise;const filter=c.createBiquadFilter();filter.type='highpass';filter.frequency.value=160;const g=c.createGain();g.gain.setValueAtTime(.19,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);s.connect(filter).connect(g).connect(this.gain);s.start(t,Math.random(),.14);}
 reward(){if(!this.enabled||!this.ctx||!this.gain)return;const c=this.ctx,t=c.currentTime;for(let i=0;i<2;i++){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=920+i*450;g.gain.setValueAtTime(.001,t+i*.09);g.gain.exponentialRampToValueAtTime(.1,t+i*.09+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.09+.16);o.connect(g).connect(this.gain);o.start(t+i*.09);o.stop(t+i*.09+.18);}}
 dispose(){this.stop();this.room?.stop();void this.ctx?.close();}
}
