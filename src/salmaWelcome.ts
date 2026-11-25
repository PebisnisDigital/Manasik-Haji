import {readSetup} from './frontSettings.ts';
import {gateGuide,gateGreeting} from './gateGuide.ts';
import {mountGateRegistration} from './gateRegistration.ts';
import {slug} from './tenant.ts';
import {localPreview,demoMagicUrl,showMagicLinkPopup} from './magicAccess.ts';
import './travelEntrance.css';

export type GateDialogueAnchor={x:number;y:number;visible:boolean};
type Side='guide'|'player';
type Choice='check'|'register';
type Progress={stage:'welcome'|'form';choice:Choice};
export function openSalmaWelcome(onClose:()=>void,project:(side:Side)=>GateDialogueAnchor,playerName=''){
 const avatar=readSetup()?.avatar??'male',guide=avatar==='female'?'Petugas loket perempuan':'Petugas loket laki-laki',sapaan=gateGreeting(avatar);
 const key='hajji-gate-chat-v2:'+String(slug??'')+':'+avatar;
 let progress:Progress={stage:'welcome',choice:'check'};
 try{const v=JSON.parse(localStorage.getItem(key)??'null');if(v?.stage==='form')progress={stage:'form',choice:v.choice==='register'?'register':'check'};}catch{}
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(progress));}catch{}};
 let closed=false,side:Side='guide',raf=0,timer:ReturnType<typeof setTimeout>|undefined,disposeRegistration:(()=>void)|undefined,disposeDemo:(()=>void)|undefined;
 const root=document.createElement('section');root.className='gateWorldDialogue';root.dataset.guide=guide;root.setAttribute('aria-label','Percakapan pendaftaran');
 const bubble=document.createElement('div');bubble.className='gateWorldBubble';bubble.setAttribute('aria-live','polite');
 const who=document.createElement('strong'),line=document.createElement('p');bubble.append(who,line);
 const panel=document.createElement('section');panel.className='gateWorldPanel';panel.setAttribute('aria-label','Data pendaftaran');
 const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.className='gateWorldClose';closeBtn.textContent='×';closeBtn.setAttribute('aria-label','Tutup percakapan');
 const actions=document.createElement('div');actions.className='travelActions gateWorldActions';
 const check=document.createElement('button'),register=document.createElement('button');for(const b of [check,register])b.type='button';
 check.className='travelPrimary';check.textContent='Cek data saya';register.textContent='Isi data pendaftaran';actions.append(check,register);
 const content=document.createElement('div');content.className='gateConversation gateWorldForm';
 const notice=document.createElement('p');notice.className='gateWorldNotice';notice.setAttribute('role','status');
 panel.append(actions,content,notice);root.append(bubble,panel,closeBtn);document.body.append(root);
 document.documentElement.classList.add('gateDialogueActive');
 function say(s:Side,text:string){side=s;bubble.dataset.side=s;who.textContent=s==='guide'?guide:playerName||'Pemain';line.textContent=text;}
 function layout(){
  if(closed)return;
  const a=project(side),w=window.innerWidth,h=window.innerHeight,bw=bubble.offsetWidth,bh=bubble.offsetHeight;
  const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(v,Math.max(min,max)));
  let x=clamp(a.x-bw/2,12,w-bw-12),y=clamp(a.y-bh-12,78,h-bh-12);
  let detached=!a.visible||Math.abs(y-(a.y-bh-12))>18;
  const p=panel.getBoundingClientRect();
  // Prefer the actual head anchor. If it intersects the data card, use the free side or above the card.
  if(x<p.right&&x+bw>p.left&&y<p.bottom&&y+bh>p.top){
   if(p.left-bw-12>=12)x=p.left-bw-12;
   else if(p.right+bw+12<=w)x=p.right+12;
   else y=clamp(p.top-bh-16,12,h-bh-12);
   detached=true;
  }
  if(!a.visible){x=clamp((w-bw)/2,12,w-bw-12);y=12;detached=true;}
  // In a very short viewport prioritize the actual form over an overlapping detached label.
  const overlaps=x<p.right&&x+bw>p.left&&y<p.bottom&&y+bh>p.top;
  bubble.style.visibility=overlaps?'hidden':'visible';
  bubble.style.left=Math.round(x)+'px';bubble.style.top=Math.round(y)+'px';
  bubble.style.setProperty('--gate-tail',Math.round(clamp(a.x-x,16,bw-16))+'px');bubble.classList.toggle('detached',detached||a.x<x||a.x>x+bw);
  raf=requestAnimationFrame(layout);
 }
 function close(){if(closed)return;closed=true;clearTimeout(timer);cancelAnimationFrame(raf);save();disposeDemo?.();disposeRegistration?.();document.removeEventListener('keydown',escape);root.remove();document.documentElement.classList.remove('gateDialogueActive');onClose();}
 function escape(e:KeyboardEvent){if(e.key==='Escape'&&!document.querySelector('dialog[open]')){e.preventDefault();close();}}
 function welcome(){
  clearTimeout(timer);disposeRegistration?.();disposeRegistration=undefined;progress={stage:'welcome',choice:'check'};save();
  root.dataset.line='welcome';say('guide','Assalamualaikum, '+sapaan+'! Sudah punya tiket atau ingin mendaftar?');
  content.replaceChildren();content.hidden=true;notice.textContent='';actions.hidden=false;check.disabled=false;register.disabled=false;check.focus({preventScroll:true});
 }
 function form(choice:Choice,animate:boolean){
  clearTimeout(timer);disposeRegistration?.();disposeRegistration=undefined;progress={stage:'form',choice};save();
  root.dataset.line='reply';actions.hidden=true;content.hidden=true;notice.textContent='';
  say('player',choice==='check'?'Saya ingin cek tiket saya.':'Saya ingin mendaftar.');
  const reveal=()=>{if(closed)return;root.dataset.line='form';say('guide',choice==='check'?'Baik, '+sapaan+'. Isi data untuk cek tiket, ya.':'Silakan isi data dulu, '+sapaan+'. Saya cek agar tidak ada pendaftaran ganda.');content.hidden=false;disposeRegistration=mountGateRegistration(content,notice,welcome,playerName);};
  if(animate)timer=setTimeout(reveal,1100);else reveal();
 }
 closeBtn.onclick=close;document.addEventListener('keydown',escape);check.onclick=()=>form('check',true);register.onclick=()=>form('register',true);
 if(localPreview()){const demo=document.createElement('button');demo.type='button';demo.className='gateDemoAccess';demo.textContent='Coba akses setelah pembayaran · DEMO';demo.onclick=()=>{disposeDemo?.();disposeDemo=showMagicLinkPopup(demoMagicUrl(),guide,true);};panel.append(demo);}
 if(progress.stage==='form')form(progress.choice,false);else welcome();layout();return close;
}

/** Standing guide conversation. No registration/payment is performed here. */
export function openGateGuide(onClose:(name:string,join:boolean)=>void,project:(side:Side)=>GateDialogueAnchor,initialName=''){
 const avatar=readSetup()?.avatar??'male',guide=gateGuide(avatar).name,sapaan=gateGreeting(avatar),address=avatar==='female'?'Bu':'Pak';
 const key='hajji-guide-intro-v1:'+String(slug??'')+':'+avatar;
 const steps=[
  'HAJJI.DIGITAL adalah latihan manasik haji dan umroh secara digital. Kamu bisa belajar melalui petualangan 3D.',
  'Khusus perjalanan Haji, setelah menyelesaikan 12 level dan mengumpulkan 12 bintang, kamu bisa membuka Gedung Oleh-Oleh.',
  'Pertama, sertifikat Haji Digital sebagai bukti menuntaskan latihan.',
  'Kedua, kupon referral dengan komisi 30% sesuai ketentuan program.',
  'Ketiga, dompet komisi untuk melihat komisi referral yang kamu peroleh.',
  'Keempat, akses kelas Animasi Motion.',
  'Kelima, akses kelas Animasi Stickman.',
  'Untuk pendaftaran, silakan ikut antrean di loket '+(avatar==='female'?'perempuan':'laki-laki')+' bersama peserta lain, ya.'
 ];
 let name=initialName,stage='name',index=0;
 try{const saved=JSON.parse(localStorage.getItem(key)??'null');if(saved&&typeof saved.name==='string'){name=saved.name.slice(0,60);if(saved.stage==='invite'||saved.stage==='info'){stage=saved.stage;index=Math.max(0,Math.min(steps.length-1,Number(saved.index)||0));}}}catch{}
 const save=()=>{try{localStorage.setItem(key,JSON.stringify({name,stage,index}));}catch{}};
 let side:Side='guide',closed=false,raf=0,timer:ReturnType<typeof setTimeout>|undefined;
 const root=document.createElement('section');root.className='gateWorldDialogue gateGuideDialogue';root.dataset.guide=guide;root.setAttribute('aria-label','Percakapan dengan '+guide);
 const bubble=document.createElement('div');bubble.className='gateWorldBubble';bubble.setAttribute('aria-live','polite');
 const who=document.createElement('strong'),line=document.createElement('p');bubble.append(who,line);
 const panel=document.createElement('section');panel.className='gateWorldPanel';const actions=document.createElement('div');actions.className='travelActions gateWorldActions gateGuideActions';panel.append(actions);
 const x=document.createElement('button');x.type='button';x.className='gateWorldClose';x.textContent='×';x.setAttribute('aria-label','Tutup percakapan');
 root.append(bubble,panel,x);document.body.append(root);document.documentElement.classList.add('gateDialogueActive');
 function say(s:Side,t:string){side=s;bubble.dataset.side=s;who.textContent=s==='guide'?guide:name||'Pemain';line.textContent=t;}
 function layout(){
  if(closed)return;const a=project(side),w=innerWidth,h=innerHeight,bw=bubble.offsetWidth,bh=bubble.offsetHeight,p=panel.getBoundingClientRect();
  const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(v,Math.max(lo,hi)));
  let left=clamp(a.x-bw/2,12,w-bw-12),top=clamp(a.y-bh-12,78,h-bh-12);
  let detached=!a.visible||Math.abs(top-(a.y-bh-12))>18;
  if(!a.visible){left=clamp((w-bw)/2,12,w-bw-12);top=78;}
  if(left<p.right&&left+bw>p.left&&top<p.bottom&&top+bh>p.top){top=clamp(p.top-bh-14,12,h-bh-12);detached=true;}
  bubble.style.left=Math.round(left)+'px';bubble.style.top=Math.round(top)+'px';bubble.style.setProperty('--gate-tail',Math.round(clamp(a.x-left,16,bw-16))+'px');
  bubble.classList.toggle('detached',detached||a.x<left||a.x>left+bw);raf=requestAnimationFrame(layout);
 }
 function close(join=false,finished=false){if(closed)return;closed=true;clearTimeout(timer);cancelAnimationFrame(raf);if(finished){stage='invite';index=0;}save();document.removeEventListener('keydown',escape);root.remove();document.documentElement.classList.remove('gateDialogueActive');onClose(name,join);}
 function escape(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();close();}}
 function button(text:string,run:()=>void,primary=false){const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='travelPrimary';b.onclick=run;return b;}
 function reply(text:string,next:()=>void){actions.replaceChildren();panel.hidden=true;say('player',text);clearTimeout(timer);timer=setTimeout(()=>{if(closed)return;panel.hidden=false;next();},1250);}
 function askName(){stage='name';save();say('guide','Assalamualaikum, '+sapaan+'! Boleh tahu namanya siapa?');const form=document.createElement('form');form.className='gateGuideName';const input=document.createElement('input');input.name='guidePlayerName';input.placeholder='Ketik nama kamu';input.setAttribute('aria-label','Nama kamu');input.required=true;input.minLength=2;input.maxLength=60;input.autocomplete='given-name';input.value=name;const send=button('Kirim',()=>{},true);send.type='submit';form.append(input,send);actions.replaceChildren(form);form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(value.length<2){input.setCustomValidity('Masukkan nama minimal 2 huruf.');input.reportValidity();return;}name=value;stage='invite';save();reply('Nama saya '+name+', '+address+'.',invite);};input.oninput=()=>input.setCustomValidity('');input.focus({preventScroll:true});}
 function invite(){stage='invite';save();say('guide','Senang berkenalan, '+name+'! Mau ikut daftar HAJJI.DIGITAL?');actions.replaceChildren(button('Iya mau ikutan',()=>{stage='info';index=0;save();reply('Iya, saya mau ikutan!',info);},true),button('Nanti saja',()=>reply('Nanti saja, '+address+'.',()=>{say('guide','Baik, '+name+'. Silakan lihat-lihat dulu, ya.');actions.replaceChildren(button('Terima kasih',()=>close(false,true),true));})));}
 function info(){stage='info';save();say('guide',steps[index]!);actions.replaceChildren(index===steps.length-1?button('OK siap '+address+', makasih!',()=>reply('OK siap '+address+'. Makasih, saya antre dulu ya!',()=>close(true,true)),true):button('Lanjut',()=>{index++;info();},true));}
 x.onclick=()=>close();document.addEventListener('keydown',escape);if(!name||stage==='name')askName();else if(stage==='info')info();else invite();layout();return ()=>close();
}
