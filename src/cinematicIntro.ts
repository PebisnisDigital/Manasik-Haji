import './cinematicIntro.css';
import {INTRO_DURATION,INTRO_KEY,shouldPlayIntro,introRemaining} from './introModel.ts';
type Options={onChange:(playing:boolean)=>void;canReplay:()=>boolean};
export function mountCinematicIntro(o:Options){
 const dialog=document.getElementById('cinematicIntro') as HTMLDialogElement|null;
 const replay=document.getElementById('replayIntro') as HTMLButtonElement|null;
 if(!dialog||!replay||typeof dialog.showModal!=='function')return {playing:()=>false};
 const skip=dialog.querySelector<HTMLButtonElement>('#skipIntro')!,sound=dialog.querySelector<HTMLButtonElement>('#introSound')!,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=false,started=0,timer=0,sessionSeen:string|null=null,fromReplay=false,ctx:AudioContext|null=null,audioBusy=false,audioPlayed=false,generation=0;
 try{sessionSeen=sessionStorage.getItem(INTRO_KEY);}catch{}
 function markSeen(){sessionSeen='seen';try{sessionStorage.setItem(INTRO_KEY,'seen');}catch{}}
 function stopSound(){generation++;audioBusy=false;const current=ctx;ctx=null;if(current)void current.close().catch(()=>{});}
 // A short original filtered air effect, only after an explicit touch/click.
 async function playSound(){if(!active||audioBusy||audioPlayed||document.hidden)return;const remaining=introRemaining(started,performance.now());if(remaining<350)return;audioBusy=true;const ticket=++generation;try{const c=new AudioContext();ctx=c;await c.resume();if(!active||ticket!==generation||c.state!=='running'){if(ctx===c)stopSound();return;}const length=Math.min(1.8,introRemaining(started,performance.now())/1000);if(length<.2){stopSound();return;}
  const b=c.createBuffer(1,Math.ceil(c.sampleRate*length),c.sampleRate),samples=b.getChannelData(0);let smooth=0;for(let i=0;i<samples.length;i++){smooth=.93*smooth+.07*(Math.random()*2-1);samples[i]=smooth;}
  const src=c.createBufferSource(),f=c.createBiquadFilter(),gain=c.createGain();src.buffer=b;f.type='lowpass';f.frequency.value=620;f.Q.value=.15;const t=c.currentTime;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.18,t+Math.min(.3,length*.3));gain.gain.linearRampToValueAtTime(0,t+length);src.connect(f).connect(gain).connect(c.destination);src.start(t);audioPlayed=true;sound.textContent='Suara aktif';sound.disabled=true;src.onended=()=>{if(ctx===c)stopSound();};
 }catch{if(ticket===generation){stopSound();sound.textContent='Suara tidak tersedia';}}finally{if(ticket===generation)audioBusy=false;}}
 function finish(){if(!active)return;clearTimeout(timer);stopSound();active=false;markSeen();dialog.classList.remove('introPlaying','introStill');if(dialog.open)dialog.close();document.documentElement.classList.remove('cinematicPlaying');o.onChange(false);if(fromReplay&&replay.getClientRects().length)replay.focus({preventScroll:true});}
 function open(manual=false){if(active||document.hidden||manual&&!o.canReplay())return;fromReplay=manual;audioPlayed=false;sound.disabled=false;sound.textContent='Aktifkan suara';dialog.classList.remove('introPlaying','introStill');
 try{dialog.showModal();}catch{return;}active=true;started=performance.now();document.documentElement.classList.add('cinematicPlaying');dialog.classList.toggle('introStill',reduced.matches);dialog.classList.add('introPlaying');o.onChange(true);skip.focus({preventScroll:true});timer=window.setTimeout(finish,reduced.matches?850:INTRO_DURATION);}
 skip.onclick=finish;sound.onclick=()=>void playSound();replay.onclick=()=>{const menu=replay.closest('details');if(menu)menu.open=false;open(true);};
 dialog.addEventListener('cancel',e=>{e.preventDefault();finish();});dialog.addEventListener('close',()=>{if(!dialog.open)finish();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});window.addEventListener('pagehide',finish);reduced.addEventListener?.('change',e=>{if(e.matches)finish();});
 if(shouldPlayIntro(sessionSeen,reduced.matches,document.hidden))open();else markSeen();
 return {playing:()=>active};
}
