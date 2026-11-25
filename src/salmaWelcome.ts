import {readSetup} from './frontSettings.ts';
import {gateGuide,gateGreeting} from './gateGuide.ts';
import {mountGateRegistration} from './gateRegistration.ts';
import {slug} from './tenant.ts';
import {localPreview,demoMagicUrl,showMagicLinkPopup} from './magicAccess.ts';
import './travelEntrance.css';

type ChatProgress={stage:'welcome'|'form';startedAt:number;replyAt?:number};
function readChat(key:string):ChatProgress{
 try{const v=JSON.parse(localStorage.getItem(key)??'null');if(v&&(v.stage==='welcome'||v.stage==='form')&&Number.isFinite(v.startedAt))return {stage:v.stage,startedAt:v.startedAt,replyAt:Number.isFinite(v.replyAt)?v.replyAt:undefined};}catch{}
 return {stage:'welcome',startedAt:Date.now()};
}
function saveChat(key:string,value:ChatProgress){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Storage can be unavailable. Server registration remains authoritative. */}}
function chatBubble(side:'guide'|'player',message:string,at:number){
 const row=document.createElement('div');row.className='gateChatRow '+side;
 const bubble=document.createElement('div');bubble.className='gateChatBubble';bubble.textContent=message;
 const stamp=document.createElement('time');stamp.dateTime=new Date(at).toISOString();stamp.textContent=new Date(at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
 if(side==='player'){const tick=document.createElement('span');tick.className='gateChatTick';tick.textContent=' ✓';tick.setAttribute('aria-label','Tersimpan di obrolan');stamp.append(tick);}
 bubble.append(stamp);row.append(bubble);return row;
}
/** Existing ticket lookup and checkout are mounted inside the chat, never simulated by saved UI state. */
export function openSalmaWelcome(onClose:()=>void){
 const avatar=readSetup()?.avatar??'male',guide=gateGuide(avatar).name,sapaan=gateGreeting(avatar);
 const key='hajji-gate-chat-v2:'+String(slug??'')+':'+avatar;let progress=readChat(key),closed=false;
 let disposeRegistration:(()=>void)|undefined,disposeDemo:(()=>void)|undefined,timer:ReturnType<typeof setTimeout>|undefined;
 const dialog=document.createElement('dialog');dialog.className='salmaWelcome gateChatDialog';dialog.dataset.guide=guide;dialog.setAttribute('aria-labelledby','salmaWelcomeTitle');
 const header=document.createElement('header');header.className='gateChatHeader';
 const icon=document.createElement('div');icon.className='gateChatAvatar';icon.textContent=avatar==='female'?'BS':'PH';icon.setAttribute('aria-hidden','true');
 const names=document.createElement('div');names.className='gateChatNames';const title=document.createElement('strong');title.id='salmaWelcomeTitle';title.textContent=guide;
 const subtitle=document.createElement('small');subtitle.textContent='Petugas pendaftaran';names.append(title,subtitle);
 const x=document.createElement('button');x.type='button';x.className='gateChatClose';x.textContent='×';x.setAttribute('aria-label','Tutup obrolan');header.append(icon,names,x);
 const thread=document.createElement('section');thread.className='gateChatThread';thread.setAttribute('aria-label','Riwayat obrolan');
 const messages=document.createElement('div');messages.className='gateChatMessages';messages.setAttribute('aria-live','polite');
 const content=document.createElement('div');content.className='gateConversation gateChatForm';
 const notice=document.createElement('p');notice.className='gateChatNotice';notice.setAttribute('role','status');
 const actions=document.createElement('div');actions.className='travelActions gateChatActions';const next=document.createElement('button');next.type='button';next.className='travelPrimary';next.textContent='Cek data saya';actions.append(next);
 thread.append(messages,content,notice);dialog.append(header,thread,actions);
 function scrollEnd(){thread.scrollTop=thread.scrollHeight;}
 function opening(){
  messages.replaceChildren(chatBubble('guide','Assalamualaikum, '+sapaan+'! Saya '+guide+'.',progress.startedAt),chatBubble('guide','Sudah siap menuju Baitullah? Saya bantu cek tiket dulu, ya. Kalau sudah punya tiket, tidak perlu bayar lagi.',progress.startedAt));
 }
 function close(){if(closed)return;closed=true;clearTimeout(timer);saveChat(key,progress);disposeDemo?.();disposeRegistration?.();dialog.close();dialog.remove();onClose();}
 function welcome(){
  clearTimeout(timer);disposeRegistration?.();disposeRegistration=undefined;progress={stage:'welcome',startedAt:progress.startedAt};saveChat(key,progress);
  dialog.dataset.line='welcome';opening();content.replaceChildren();content.hidden=true;notice.textContent='';actions.hidden=false;subtitle.textContent='Petugas pendaftaran';next.disabled=false;next.focus();scrollEnd();
 }
 function register(animate=false){
  clearTimeout(timer);disposeRegistration?.();disposeRegistration=undefined;progress={stage:'form',startedAt:progress.startedAt,replyAt:progress.replyAt??Date.now()};saveChat(key,progress);
  dialog.dataset.line='form';opening();messages.append(chatBubble('player','Baik, cek data saya dulu.',progress.replyAt!));actions.hidden=true;content.hidden=true;notice.textContent='';
  const reveal=()=>{if(closed)return;subtitle.textContent='Petugas pendaftaran';messages.append(chatBubble('guide','Baik, '+sapaan+'. Kita cek data pendaftaran dulu, ya.',progress.replyAt!));content.hidden=false;disposeRegistration=mountGateRegistration(content,notice,welcome);scrollEnd();};
  if(animate){subtitle.textContent='sedang mengetik…';const typing=document.createElement('div');typing.className='gateChatTyping';typing.setAttribute('role','status');typing.textContent='•••';messages.append(typing);scrollEnd();timer=setTimeout(()=>{typing.remove();reveal();},550);}else reveal();
 }
 x.onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});next.onclick=()=>{next.disabled=true;register(true);};
 if(localPreview()){const demo=document.createElement('button');demo.type='button';demo.className='gateDemoAccess';demo.textContent='Coba akses setelah pembayaran · DEMO';demo.onclick=()=>{disposeDemo?.();disposeDemo=showMagicLinkPopup(demoMagicUrl(),guide,true);};thread.append(demo);}
 document.body.append(dialog);dialog.showModal();if(progress.stage==='form')register();else welcome();
}
