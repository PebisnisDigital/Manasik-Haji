import {readStory} from './travelStory.ts';
import {readSetup} from './frontSettings.ts';
import {gateGuide} from './gateGuide.ts';
import {mountGateRegistration} from './gateRegistration.ts';
import {tenantUrl} from './tenant.ts';
import {loadCampaign} from './adventure/campaignProgress.ts';
import {readCore} from './coreProgress.ts';
import {localPreview,demoMagicUrl,showMagicLinkPopup} from './magicAccess.ts';
import {loadProgress,QUEST_KEYS,decodeRoute,decodeTahallul} from './adventure/questProgress.ts';
import './travelEntrance.css';
const LINES=[
 {id:'welcome',title:'Selamat datang di HAJJI.DIGITAL.',text:'Saya penjaga gerbang sekaligus pendamping perjalananmu. Sudah siap memulai petualangan manasik? Kalau mau mendaftar, saya bantu ya. Setelah pembayaran terverifikasi, kita bisa mulai perjalanan.',reply:'Saya ingin daftar manasik →'},
 {id:'goals',title:'Satu tujuan, satu langkah.',text:'Ini petualangan Haji atau Umroh. Ikuti tujuan di layar, dekati tokoh atau penanda, lalu tekan E atau tombol Interaksi. Selesaikan misi untuk membuka level berikutnya. Kamu juga bisa menolong jemaah di sepanjang perjalanan.',reply:'Bagaimana cara bergeraknya? →'},
 {id:'controls',title:'Jalan, lihat sekitar, dan berinteraksi.',text:'Di komputer: WASD atau tombol arah untuk jalan, geser layar untuk kamera. Di HP: gunakan posisi landscape, joystick kiri dan tombol Interaksi. Bus bisa kamu kemudikan: W/S maju-mundur, A/D belok, Spasi rem. Di HP gunakan joystick dan Rem.',reply:'Apa saja yang perlu dijaga? →'},
 {id:'care',title:'Jaga diri dan rombongan.',text:'Panas, lelah, lapar, haus, dan debu menjadi tantangan perjalanan. Buka Tas untuk makan atau minum. Gunakan pos istirahat, mandi / bersih diri, dan isi bekal. Checkpoint tersimpan di browser ini. Ini game pembelajaran; ikuti pembimbing saat beribadah sungguhan.',reply:'Bagaimana cara daftarnya? →'},
 {id:'registration',title:'Daftar, bayar, lalu berangkat.',text:'Isi nama, email, WA, metode pembayaran, dan kode kupon jika ada. Tiket aktif setelah pembayaran terverifikasi.',reply:'Buka formulir pendaftaran →'},
] as const;
/** Export retained for existing callers; the speaker follows the character choice. */
export function openSalmaWelcome(onClose:()=>void){
 const avatar=readSetup()?.avatar??'male';
 const guide=gateGuide(avatar).name,sapaan=avatar==='female'?'Ukhti':'Akhi';
 const dialog=document.createElement('dialog');dialog.className='salmaWelcome';dialog.setAttribute('aria-labelledby','salmaWelcomeTitle');dialog.dataset.guide=guide;let index=0,disposeRegistration:(()=>void)|undefined;
 const top=document.createElement('div');top.className='travelKicker';top.textContent=guide.toUpperCase()+' · PENJAGA GERBANG & PENDAMPING';
 const heading=document.createElement('h2');heading.id='salmaWelcomeTitle';const body=document.createElement('p'),count=document.createElement('small'),notice=document.createElement('p');notice.setAttribute('role','status');
 const content=document.createElement('div');content.className='gateConversation';
 const actions=document.createElement('div');actions.className='travelActions';const back=document.createElement('button'),next=document.createElement('button'),later=document.createElement('button');back.textContent='← Sebelumnya';next.className='travelPrimary';later.textContent='Kembali ke gerbang';
 function paint(){disposeRegistration?.();disposeRegistration=undefined;content.replaceChildren();actions.hidden=false;heading.hidden=false;top.hidden=false;body.hidden=false;count.hidden=false;notice.textContent='';const line=LINES[index];dialog.dataset.line=line.id;heading.textContent=line.title;body.textContent=index===0?'Assalamualaikum, '+(sapaan+(readStory().name.trim()?' '+readStory().name.trim():''))+'. Saya '+guide+'. '+line.text:line.text;count.textContent='Obrolan '+(index+1)+' / '+LINES.length;back.hidden=index===0;help.hidden=index!==0;next.textContent=index===0?'DAFTAR SEKARANG →':line.reply;dialog.scrollTop=0;next.focus();}
 let disposeDemo:(()=>void)|undefined;
 function close(){disposeDemo?.();disposeRegistration?.();dialog.close();dialog.remove();onClose();}
 back.onclick=()=>{index=Math.max(0,index-1);paint();};later.onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function register(){dialog.dataset.line='form';heading.hidden=true;body.hidden=true;count.hidden=true;top.hidden=true;actions.hidden=true;disposeRegistration=mountGateRegistration(content,notice,paint);dialog.scrollTop=0;}
 next.onclick=()=>{if(index===0||index===LINES.length-1){register();return;}index++;paint();};const help=document.createElement('button');help.textContent='Panduan bermain';help.onclick=()=>{index=1;paint();};
 actions.append(back,next,help,later);dialog.append(top,heading,body,count,content,notice,actions);
 if(localPreview()){const demo=document.createElement('button');demo.type='button';demo.className='gateDemoAccess';demo.textContent='Coba akses setelah pembayaran · DEMO';demo.onclick=()=>{disposeDemo?.();disposeDemo=showMagicLinkPopup(demoMagicUrl(),guide,true);};dialog.append(demo);}
 // Preserve genuine pre-existing runs; registration never replaces their save records.
 const campaign=loadCampaign(),oldRitual=loadProgress(QUEST_KEYS.tawaf,r=>decodeRoute(r,'tawaf'))||loadProgress(QUEST_KEYS.sai,r=>decodeRoute(r,'sai'))||loadProgress(QUEST_KEYS.tahallul,decodeTahallul);
 if(campaign.chapters.some(c=>c.save)||oldRitual||readCore('umrah')||readCore('hajj')){const resume=document.createElement('a');resume.className='gateResume';resume.href=tenantUrl('./adventure-map.html?journey='+(readSetup()?.program??'hajj'));resume.textContent='Lanjutkan checkpoint yang sudah ada →';dialog.append(resume);}
 document.body.append(dialog);dialog.showModal();paint();
}
