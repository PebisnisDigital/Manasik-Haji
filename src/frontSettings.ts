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
export const journeyVolume=()=>{const v=readSetup();return v?(v.volume/100)**2:1;};
export const journeyVoice=()=>readSetup()?.voice??false;
export const journeyAmbience=()=>readSetup()?.ambience??false;
