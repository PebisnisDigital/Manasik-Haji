import {playerKey} from './playerCloud.ts';
import {decodeSetup,type JourneySetup} from './frontModel.ts';
import type {Avatar} from './coreProgress.ts';
const key=()=>playerKey('manasik-journey-setup-v1');
export function readSetup():JourneySetup|null{try{return decodeSetup(localStorage.getItem(key()))??decodeSetup(localStorage.getItem(key()+'.backup'));}catch{return null;}}
export function saveSetup(s:JourneySetup):boolean{
 try{const k=key(),raw=localStorage.getItem(k),backup=localStorage.getItem(k+'.backup');for(const r of [raw,backup]){try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}}
  if(!decodeSetup(JSON.stringify(s)))return false;
  const updates:Record<string,string>={[k]:JSON.stringify(s),'umroh-graphics-v1':s.graphics,'manasik-voice-v1':s.voice&&s.volume>0?'on':'off','umroh-digital-ambience-v1':s.ambience&&s.volume>0?'on':'off'};
  if(!s.voice)updates['umroh-human-voice-v1']='off';
  const previous=Object.keys(updates).map(name=>[name,localStorage.getItem(name)] as const);
  if(decodeSetup(raw))try{localStorage.setItem(k+'.backup',raw!);}catch{}
  try{for(const [name,value]of Object.entries(updates))localStorage.setItem(name,value);}catch{for(const [name,value]of previous)try{if(value===null)localStorage.removeItem(name);else localStorage.setItem(name,value);}catch{}return false;}
  return true;
 }catch{return false;}
}
export const journeyAvatar=(fallback:Avatar):Avatar=>readSetup()?.avatar??fallback;
const AUDIO_KEY='hajji-game-audio-v1';
type GameAudio={enabled:boolean;volume:number};
let audioOverride:GameAudio|null=null;
export function gameAudioPreferences():GameAudio{
 if(audioOverride)return {...audioOverride};
 try{const p=JSON.parse(localStorage.getItem(AUDIO_KEY)??'null');if(typeof p?.enabled==='boolean'&&Number.isInteger(p.volume)&&p.volume>=0&&p.volume<=100)return p;}catch{}
 const s=readSetup();return {enabled:s? s.voice||s.ambience:true,volume:s?.volume??70};
}
export function setGameAudioPreferences(p:GameAudio){
 audioOverride={enabled:p.enabled,volume:Math.max(0,Math.min(100,Math.round(p.volume)))};
 try{localStorage.setItem(AUDIO_KEY,JSON.stringify(audioOverride));for(const key of ['manasik-voice-v1','umroh-digital-ambience-v1','umroh-human-voice-v1'])localStorage.setItem(key,p.enabled?'on':'off');}catch{}
 if(!p.enabled||p.volume===0){try{window.speechSynthesis?.cancel();}catch{}}
 window.dispatchEvent(new CustomEvent('hajji-game-audio-change',{detail:{...audioOverride}}));
}
export const journeyVolume=()=>{const p=gameAudioPreferences();return p.enabled?(p.volume/100)**2:0;};
export const journeyVoice=()=>gameAudioPreferences().enabled;
export const journeyAmbience=()=>gameAudioPreferences().enabled;
