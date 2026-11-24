import {readSetup,saveSetup} from './frontSettings.ts';
import {defaultSetup} from './frontModel.ts';
import {readCore} from './coreProgress.ts';
import {loadNusukRoute} from './adventure/nusukRoute.ts';
import {readStory,saveStory,miqatEntryUrl} from './travelStory.ts';
import {gateGuide} from './gateGuide.ts';
import {tenantUrl} from './tenant.ts';
import './travelEntrance.css';
export const localPreview=()=>['127.0.0.1','localhost'].includes(location.hostname);
export function demoMagicUrl(){const setup=readSetup()??defaultSetup();return tenantUrl('./index.html?demo=magic&avatar='+setup.avatar+'&program='+setup.program);}
export function showMagicLinkPopup(href:string,guide:string,demo=false){
 const url=new URL(href,location.href);if(url.origin!==location.origin)throw Error('Tautan akses harus berasal dari situs game ini.');
 const dialog=document.createElement('dialog');dialog.className='salmaWelcome magicLinkPopup';dialog.setAttribute('aria-labelledby','magicPopupTitle');
 const kicker=document.createElement('div');kicker.className='travelKicker';kicker.textContent=demo?'DEMO · TANPA TRANSAKSI':'TIKET AKTIF · AKSES PRIBADI';
 const title=document.createElement('h2');title.id='magicPopupTitle';title.textContent=demo?'Anggap pembayaran sudah selesai.':'Magic link kamu sudah siap.';
 const line=document.createElement('p');line.textContent=(demo?'Ini contoh alur setelah pembayaran, bukan pembayaran sungguhan. ':'')+'Klik magic link untuk mulai bermain bersama '+guide+'. Petualangan dimulai dari Miqat & Ihram: temui pembimbing, masuk ruang persiapan, pelajari niat dan talbiyah. Simpan tautan agar bisa masuk lagi tanpa mendaftar ulang.';
 const link=document.createElement('a');link.className='travelPrimary';link.id='openMagicLink';link.href=url.href;link.rel='noreferrer';link.textContent=demo?'BUKA MAGIC LINK DEMO →':'BUKA MAGIC LINK →';
 const actions=document.createElement('div');actions.className='travelActions';const copy=document.createElement('button'),close=document.createElement('button'),notice=document.createElement('p');notice.setAttribute('role','status');copy.textContent='Salin magic link';close.textContent='Tutup';
 copy.onclick=()=>{if(!navigator.clipboard){notice.textContent='Gunakan menu browser untuk menyalin tautan pada tombol Magic Link.';return;}void navigator.clipboard.writeText(url.href).then(()=>notice.textContent='Magic link disalin. Simpan pribadi; jangan bagikan ke orang lain.',()=>notice.textContent='Tautan belum tersalin. Gunakan menu browser pada tombol Magic Link.');};
 const dispose=()=>{dialog.close();dialog.remove();};close.onclick=dispose;dialog.addEventListener('cancel',e=>{e.preventDefault();dispose();});actions.append(copy,close);dialog.append(kicker,title,line,link,notice,actions);document.body.append(dialog);dialog.showModal();link.focus();return dispose;
}
/** Tokens are sent only in the request body and removed from navigation history. */
export function mountMagicAccess(){
 document.documentElement.classList.remove('frontMode');document.documentElement.classList.add('magicAccessMode');for(const id of ['gameFront','lobby','cinematicIntro'])document.getElementById(id)?.remove();
 const section=document.createElement('main');section.className='magicAccessCard';const kicker=document.createElement('div'),title=document.createElement('h1'),notice=document.createElement('p'),retry=document.createElement('button'),back=document.createElement('a');kicker.className='travelKicker';kicker.textContent='HAJJI.DIGITAL · MAGIC LINK';title.textContent='Menyiapkan petualanganmu…';notice.setAttribute('role','status');retry.className='travelPrimary';retry.textContent='Coba lagi';retry.hidden=true;back.href=tenantUrl('./index.html');back.textContent='Kembali ke gerbang';section.append(kicker,title,notice,retry,back);document.body.append(section);
 const params=new URLSearchParams(location.search),demo=params.get('demo')==='magic',token=new URLSearchParams(location.hash.slice(1)).get('token');
 if(!demo)history.replaceState(null,'',location.pathname+location.search);
 let busy=false;async function enter(){if(busy)return;busy=true;retry.hidden=true;notice.textContent=demo?'Mode demo. Tidak ada pembayaran atau perubahan status tiket.':'Memeriksa magic link pribadi…';
  try{
   let program=readSetup()?.program??'hajj',avatar=readSetup()?.avatar??'male',participantName=readStory().name;
   if(demo){if(!localPreview())throw Error('Akses demo hanya tersedia di preview lokal.');if(params.get('avatar')==='female'||params.get('avatar')==='male')avatar=params.get('avatar') as typeof avatar;if(params.get('program')==='umrah'||params.get('program')==='hajj')program=params.get('program') as typeof program;}
   else{const response=await fetch(new URL('./api/registration'+(token?'/redeem':''),location.href),{method:token?'POST':'GET',credentials:'same-origin',cache:'no-store',...(token?{headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}:{}),signal:AbortSignal.timeout(8000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Magic link belum dapat diperiksa.');const r=data.registration;if(r?.status!=='approved'||!['hajj','umrah'].includes(r.program)||!['male','female'].includes(r.avatar))throw Error('Akses belum aktif. Gunakan magic link lengkap dari admin setelah pembayaran terverifikasi.');program=r.program;avatar=r.avatar;if(typeof r.name==='string'&&r.name.trim().length>=2&&r.name.trim().length<=60)participantName=r.name.trim();}
   if(!saveSetup({...readSetup()??defaultSetup(),program,avatar}))throw Error('Persiapan belum tersimpan. Periksa ruang penyimpanan atau versi data browser. Checkpoint lama tetap dipertahankan.');
   const route=program==='hajj'?loadNusukRoute():null,returning=route?route.done>0||route.chapters.some(c=>c.saved):!!readCore('umrah');
   title.textContent=returning?'Selamat datang kembali.':'Perjalananmu siap dimulai.';notice.textContent=returning?'Progresmu tersimpan. Buka peta untuk memilih level yang ingin dilanjutkan.':gateGuide(avatar).name+' menunggumu di tempat persiapan Miqat & Ihram.';
   const welcome=document.createElement('dialog');welcome.className='salmaWelcome magicGameWelcome';welcome.setAttribute('aria-labelledby','welcomeGameTitle');welcome.innerHTML='<div class="travelKicker">PETUALANGAN MANASIK · LEVEL 1</div><h2 id="welcomeGameTitle">Selamat bermain di HAJJI.DIGITAL</h2><p>Semoga perjalanan belajar ini membawa kebaikan, mengantarkan kita menjadi haji yang mabrur, dan penuh keberkahan. Aamiin.</p><p>Mulai dengan menemui pembimbing untuk mempersiapkan ihram, mempelajari niat, dan talbiyah.</p>';
   if(returning){welcome.querySelector('.travelKicker')!.textContent='PETUALANGAN MANASIK · PROGRES TERSIMPAN';welcome.querySelector('p:last-child')!.textContent='Buka peta perjalanan untuk melanjutkan level dari checkpoint atau melihat hasil yang sudah selesai.';}
   if(demo){const label=document.createElement('small');label.textContent='Mode demo · tanpa transaksi pembayaran.';welcome.append(label);}
   const start=document.createElement('button');start.id='startMagicGame';start.className='travelPrimary';start.textContent=returning?'LANJUT MAIN · BUKA PETA':'MULAI MAIN';start.onclick=()=>{if(!saveStory({briefed:true,name:participantName})){notice.textContent='Persiapan belum tersimpan. Periksa penyimpanan browser, lalu coba lagi.';start.textContent='Coba simpan lagi';return;}location.replace(returning?tenantUrl('./adventure-map.html?journey='+program):miqatEntryUrl(demo));};welcome.append(start);document.body.append(welcome);welcome.showModal();start.focus();
   const reopen=document.createElement('button');reopen.className='travelPrimary';reopen.textContent='MULAI MAIN';reopen.onclick=()=>{if(!welcome.open)welcome.showModal();start.focus();};section.insertBefore(reopen,back);
  }catch(error){title.textContent='Belum bisa membuka perjalanan.';notice.textContent=error instanceof Error&&error.name!=='SyntaxError'?error.message:'Layanan akses belum tersambung. Coba lagi setelah koneksi pulih.';retry.hidden=false;retry.focus();}finally{busy=false;}
 }
 retry.onclick=()=>void enter();void enter();
}
