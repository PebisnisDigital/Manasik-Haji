import {VoiceGuide} from '../audio/VoiceGuide.ts';
import {bootTenant,scopedKey} from '../tenant.ts';
import {Ambience} from './ambience.ts';
import {LEVELS,QUESTS,makeSave,decodeSave,finishQuest,route,type AdventureSave,type Avatar,type Campaign} from './state.ts';
import {mountHome,type HomeWorld} from './homeScene.ts';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const btn=(id:string)=>$<HTMLButtonElement>(id);
const KEY=scopedKey('manasik-adventure-v4');
const ambience=new Ambience();let world:HomeWorld|null=null,save:AdventureSave|null=null,near=false,playing=false,paused=false,dialog=false,fallback=false,sound=false,dialogNext:()=>void=()=>{};
let existing:AdventureSave|null=null;
try{existing=decodeSave(localStorage.getItem(KEY));}catch{}
const opening='Selamat datang. Pernahkah kamu membayangkan berdiri di hadapan Baitullah? Perjalanan panjang dimulai dari sebuah impian. Temui keluargamu untuk mulai bercerita.';
const guidance=new VoiceGuide(opening);
const first='Dekati anggota keluarga yang ditandai warna emas. Gunakan joystick atau tombol panah, lalu tekan Interaksi.';
const responses=[
 {tag:'DIALOG KELUARGA',title:'Sebuah harapan',text:'Keluarga: Semoga perjalanan ini membawa kebaikan. Mari kita pelajari persiapannya bersama. Lihat tayangan Baitullah di televisi.'},
 {tag:'MOMEN IMPIAN',title:'Menuju Baitullah',text:'Narator: Melihat Baitullah mengingatkan kita untuk mempersiapkan diri dengan baik. Perjalanan nyata membutuhkan ilmu, kesiapan, dan tuntunan pembimbing.'},
 {tag:'CHECKPOINT TERCAPAI',title:'Langkah pertama selesai',text:'Kamu telah menyelesaikan misi Sebuah Impian. Berikutnya adalah Niat dan Doa. Level dua akan hadir pada pembaruan berikutnya.'}
];
function store(){if(!save)return;try{localStorage.setItem(KEY,JSON.stringify(save));existing=save;$('checkpoint').textContent='Checkpoint tersimpan di perangkat.';}catch{$('checkpoint').textContent='Penyimpanan browser tidak tersedia. Checkpoint tidak akan bertahan setelah halaman ditutup.';}}
function map(c:Campaign){const q=save?.quest??existing?.quest??0;const nums=route(c);$('mapNote').textContent=(c==='umrah'?'Jalur umroh':'Jalur haji tamattu’')+' • '+nums.length+' level dalam rute ini • Level 1 tersedia, level lain direncanakan.';$('levels').replaceChildren(...nums.map(n=>{const box=document.createElement('div');box.className='level'+(n===1?(q===3?' finished':' available'):n===2&&q===3?' next':'');const num=document.createElement('strong');num.textContent=String(n).padStart(2,'0');const label=document.createElement('span');label.textContent=LEVELS[n-1];const st=document.createElement('div');st.className='small';st.textContent=n===1?(q===3?'Selesai':'Tersedia'):n===2&&q===3?'Terbuka · segera hadir':'Terkunci';box.append(num,label,st);return box;}));}
function update(){if(!save)return;const q=save.quest,t=q<3?QUESTS[q]:null;$('questTitle').textContent=t?.title??'Level 01 selesai';$('hint').textContent=t?.hint??'Level 02 terbuka. Konten akan hadir di pembaruan berikutnya.';$('count').textContent=q+' / 3 misi';$('bar').style.width=q/3*100+'%';$('sessionInfo').textContent=(save.avatar==='male'?'Jamaah laki-laki':'Jamaah perempuan')+' • '+(save.campaign==='umrah'?'Umroh':'Haji tamattu’');$('questList').replaceChildren(...QUESTS.map((t,i)=>{const row=document.createElement('div');row.className='quest '+(i<q?'done':i===q?'current':'');const b=document.createElement('b');b.textContent=i<q?'✓':String(i+1);const span=document.createElement('span');span.textContent=t.title;row.append(b,span);return row;}));btn('interact').disabled=!near||dialog||paused||q===3;btn('walk').disabled=dialog||paused||q===3||fallback;btn('access').disabled=dialog||paused||q===3;map(save.campaign);}
function openDialog(tag:string,title:string,text:string,label:string,next:()=>void){dialog=true;near=false;world?.setActive(false);$('cutTag').textContent=tag;$('cutTitle').textContent=title;$('cutText').textContent=text;btn('continue').textContent=label;$('cutscene').hidden=false;dialogNext=next;update();guidance.announce(text,'dialog-'+title,0,true);}
btn('continue').onclick=()=>{if(!dialog)return;dialog=false;$('cutscene').hidden=true;const next=dialogNext;dialogNext=()=>{};next();};
function interact(){if(!save||!playing||paused||dialog||save.quest===3||(!near&&!fallback))return;const q=save.quest;save=finishQuest(save,q);store();const response=responses[q];if(q===1)world?.cinematic(2.3);openDialog(response.tag,response.title,response.text,q===2?'Lihat peta level':'Lanjutkan misi',()=>{if(!save)return;world?.target(save.quest);world?.setActive(save.quest<3);update();if(save.quest<3)guidance.announce(QUESTS[save.quest].hint,'quest-'+save.quest,0,true);else guidance.announce('Level satu selesai. Kamu dapat melihat peta perjalanan atau mengulang latihan.','finish',0,true);});}
async function toggleSound(on:boolean){sound=on;if(on){const ok=await ambience.start();if(!ok)sound=false;}else ambience.stop();btn('ambient').setAttribute('aria-pressed',String(sound));btn('ambient').textContent=sound?'Suasana aktif':'Suasana mati';}
btn('ambient').onclick=()=>{void toggleSound(!sound);};btn('interact').onclick=interact;btn('access').onclick=interact;btn('walk').onclick=()=>world?.walkToTarget();
function endWorld(){world?.dispose();world=null;playing=false;paused=false;dialog=false;near=false;fallback=false;guidance.stop();ambience.stop();sound=false;btn('ambient').textContent='Suasana mati';btn('ambient').setAttribute('aria-pressed','false');}
function intro(){endWorld();$('game').hidden=true;$('intro').hidden=false;btn('resume').hidden=!existing;$('saveHint').textContent=existing?'Checkpoint ditemukan: '+existing.quest+' dari 3 misi selesai.':'Belum ada perjalanan tersimpan.';map(existing?.campaign??'umrah');}
function begin(s:AdventureSave){
 endWorld();save=s;playing=true;$('intro').hidden=true;$('game').hidden=false;$('cutscene').hidden=true;$('fallback').hidden=true;$('controls').hidden=false;btn('pause').textContent='Jeda';store();
 try{world=mountHome($<HTMLCanvasElement>('world'),$('joy'),$('knob'),s.avatar,s.quest,{onNear:current=>{near=current;btn('interact').disabled=!near||paused||dialog||save?.quest===3;},onStep:()=>ambience.step(),onInteract:interact});}catch{fallback=true;$('fallback').hidden=false;$('controls').hidden=true;}
 // Starting or resuming is an explicit gesture to enable Indonesian narrative and ambient sound.
 guidance.reset(s.quest===0?opening:s.quest<3?QUESTS[s.quest].hint:'Level satu telah selesai.');
 if(btn('voiceToggle').getAttribute('aria-pressed')!=='true'&&!btn('voiceToggle').disabled)btn('voiceToggle').click();
 void toggleSound(true);update();
 if(s.quest===3){world?.setActive(false);openDialog('CHECKPOINT TERCAPAI','Level 01 selesai','Level dua, Niat dan Doa, akan hadir pada pembaruan berikutnya.','Lihat peta level',()=>update());return;}
 if(s.quest===0){world?.cinematic(3);openDialog('CHAPTER I','Sebuah Impian',opening,'Masuk ke rumah',()=>{world?.setActive(true);guidance.announce(first,'first',0,true);update();});}
 else{world?.target(s.quest);world?.setActive(true);}
}
$('setup').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target as HTMLFormElement);if(existing&&!confirm('Mulai perjalanan baru dan ganti checkpoint sebelumnya?'))return;begin(makeSave(f.get('avatar') as Avatar,f.get('campaign') as Campaign));});
btn('resume').onclick=()=>{if(existing)begin(existing);};
btn('menu').onclick=intro;btn('reset').onclick=()=>{if(save&&confirm('Ulangi Level 1 dari awal?'))begin(makeSave(save.avatar,save.campaign));};
btn('pause').onclick=()=>{if(!save||dialog||save.quest===3)return;paused=!paused;world?.setActive(!paused);if(paused){guidance.stop();ambience.stop();}else if(sound)void ambience.start();btn('pause').textContent=paused?'Lanjutkan':'Jeda';update();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){ambience.stop();world?.setActive(false);guidance.stop();}else if(playing&&!paused){if(sound)void ambience.start();world?.setActive(!dialog&&save?.quest!==3);}});
window.addEventListener('pagehide',()=>{ambience.stop();world?.setActive(false);});window.addEventListener('pageshow',e=>{if(e.persisted&&playing&&!paused){if(sound)void ambience.start();world?.setActive(!dialog&&save?.quest!==3);}});
$('setup').addEventListener('change',e=>{if((e.target as HTMLInputElement).name==='campaign')map((e.target as HTMLInputElement).value as Campaign);});
bootTenant();intro();
