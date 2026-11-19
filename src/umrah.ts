import { readJourney,writeJourney,newJourney,advance,stageUrl,type Avatar,type Journey,type Stage } from './journey.ts';
import {VoiceGuide} from './audio/VoiceGuide.ts';
import {mountMini,type Demo,type DemoKind} from './miniScenes.ts';
import {showAssessment} from './assessment.ts';
const lesson=document.querySelector<HTMLElement>('#lesson')!;
const track=document.querySelector<HTMLElement>('#track')!;
const saved=document.querySelector<HTMLElement>('#saved')!;
let journey:Journey=readJourney()??newJourney('male');
const stages=['Miqat & ihram','Tawaf','Salat & zamzam','Sa’i','Tahallul'];
const narration=[
'Selamat datang di latihan manasik umrah. Kita mulai dengan mengenal pakaian ihram, batas miqat, niat dan larangan ihram. Pilih model jamaah dan jawab pertanyaan di bawah.',
'Sekarang tahap tawaf. Mulailah dari garis Hajar Aswad dan jaga Ka’bah di sebelah kiri. Lakukan tujuh putaran latihan.',
'Setelah tawaf, pelajari salat sunah dua rakaat dan minum air zamzam. Jangan berdesakan atau mengganggu jamaah lain.',
'Tahap sa’i dimulai di Safa, menuju Marwah. Satu perjalanan adalah satu lintasan. Selesaikan tujuh lintasan dan berakhir di Marwah.',
'Setelah sa’i, pelajari tahallul dengan memotong rambut sesuai tuntunan pembimbing. Pilih jawaban yang tepat.',
'Alhamdulillah, rangkaian pembelajaran telah selesai. Latihan ini tidak menggantikan pelaksanaan ibadah yang sebenarnya.'
];
const guide=new VoiceGuide(narration[journey.stage]);
let demo:Demo|null=null;
function scene(kind:DemoKind,onDone:(action:string)=>void=()=>{}):void{
 const h=document.createElement('div');h.className='mini-scene';const title=lesson.querySelector('h2')!;title.after(h);
 try{demo=mountMini(h,kind,journey.avatar,onDone);}catch{h.textContent='Adegan 3D tidak tersedia di perangkat ini. Materi teks tetap dapat digunakan.';h.classList.add('fallback');}
}
const icon=(female:boolean)=>female?'<svg viewBox="0 0 80 90" aria-hidden="true"><path d="M40 8Q24 8 22 26L15 43L8 85H72L65 43L58 26Q56 8 40 8" fill="#395b4d"/><ellipse cx="40" cy="29" rx="10" ry="13" fill="#d6a881"/><path d="M24 39Q40 53 56 39L62 64H18Z" fill="#577867"/></svg>':'<svg viewBox="0 0 80 90" aria-hidden="true"><circle cx="40" cy="17" r="12" fill="#d5a781"/><path d="M25 31L13 57L20 61L27 44L27 84H53V44L60 61L67 57L55 31" fill="#fffcf3" stroke="#c6c8bc" stroke-width="1.5"/><path d="M25 32L52 56H27L48 31" fill="#ece9df"/><path d="M26 55H54M40 56L49 82" stroke="#bfc3b7" fill="none"/></svg>';
function persist(j:Journey):boolean{
 if(writeJourney(j)){journey=j;return true;}
 saved.textContent='Penyimpanan browser tidak tersedia. Aktifkan penyimpanan lokal untuk perjalanan bertahap.';
 message('Progress belum tersimpan. Periksa izin penyimpanan browser.');return false;
}
function message(text:string,ok=false):void{
 const n=lesson.querySelector<HTMLElement>('.notice');if(n){n.textContent=text;n.classList.toggle('ok',ok);guide.announce(text,'feedback-'+text,1500,true);}
}
function move(expected:Stage):void{
 if(journey.stage!==expected)return;
 if(persist(advance(journey,expected)))render();
}
function drawTrack():void{
 track.innerHTML=stages.map((s,i)=>'<div class="step '+(journey.stage>i?'done':journey.stage===i?'current':'')+'"><span>'+(journey.stage>i?'✓':i+1)+'</span>'+s+'</div>').join('');
 saved.textContent=journey.stage===5?'5 dari 5 tahap pembelajaran selesai.':'Tahap '+(journey.stage+1)+' dari 5 • Progress tersimpan per tahap di browser ini.';
}
function startButton(url:string,label:string):string{return '<a class="action" href="'+url+'">'+label+'</a>';}
function base(stage:string,title:string,body:string):void{lesson.innerHTML='<div class="eyebrow">'+stage+'</div><h2>'+title+'</h2>'+body+'<p class="notice" role="status"></p>';}
function preparation():void{
 base('Tahap 1 / 5','Persiapan miqat dan ihram','<p>Pilih model jamaah untuk latihan. Warna dan bentuk pada gambar hanya ilustrasi.</p><div class="choices"><button class="choice" data-avatar="male" aria-pressed="'+(journey.avatar==='male')+'">'+icon(false)+'Laki-laki</button><button class="choice" data-avatar="female" aria-pressed="'+(journey.avatar==='female')+'">'+icon(true)+'Perempuan</button></div><div class="lesson"><h3>Pakaian ihram</h3><p id="clothing"></p><p class="muted">Miqat adalah batas tempat memulai ihram. Penentuan lokasinya mengikuti rute keberangkatan dan arahan pembimbing.</p></div><div class="lesson"><h3>Niat umrah</h3><p>Niatkan umrah karena Allah ketika memasuki ihram, sebelum melewati miqat. Berikut contoh lafaz niat, bukan pengganti niat di hati.</p><div dir="rtl" class="arabic" lang="ar">لَبَّيْكَ اللَّهُمَّ عُمْرَةً</div><p style="text-align:center">Labbaika Allahumma ‘umratan.</p><p class="muted">Sesudah niat, lanjutkan membaca talbiyah sesuai tuntunan pembimbing.</p></div><h3>Persiapan yang dipahami</h3><label class="check"><input type="checkbox" data-prep> Saya memahami pakaian dan kebersihan sebelum ihram.</label><label class="check"><input type="checkbox" data-prep> Saya memahami batas miqat dan niat umrah.</label><fieldset class="quiz"><legend>Setelah berniat ihram, tindakan mana yang sesuai?</legend><label><input type="radio" name="ihram" value="wrong"> Memakai parfum baru dan memotong kuku.</label><label><input type="radio" name="ihram" value="right"> Menghindari parfum baru, memotong kuku dan mencabut rambut.</label></fieldset><button class="action" id="continue">Mulai latihan tawaf</button>');
 scene('prep');
 const clothing=lesson.querySelector<HTMLElement>('#clothing')!;
 const update=()=>{clothing.textContent=journey.avatar==='male'?'Laki-laki mengenakan dua lembar kain ihram; kepala tidak ditutup saat berihram.':'Perempuan mengenakan pakaian yang menutup aurat sesuai tuntunan, tanpa kewajiban warna tertentu; tidak memakai niqab atau sarung tangan saat ihram.';lesson.querySelectorAll<HTMLButtonElement>('[data-avatar]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.avatar===journey.avatar)));};
 update();
 lesson.querySelectorAll<HTMLButtonElement>('[data-avatar]').forEach(b=>b.onclick=()=>{journey={...journey,avatar:b.dataset.avatar as Avatar};update();demo?.setAvatar(journey.avatar);guide.announce(clothing.textContent??'','clothing-'+journey.avatar,0,true);});
 lesson.querySelector<HTMLButtonElement>('#continue')!.onclick=()=>{
   if(!Array.from(lesson.querySelectorAll<HTMLInputElement>('[data-prep]')).every(c=>c.checked)){message('Pahami dan centang kedua persiapan dulu.');return;}
   if(lesson.querySelector<HTMLInputElement>('input[name=ihram]:checked')?.value!=='right'){message('Belum tepat. Pelajari larangan ihram, lalu pilih jawaban kembali.');return;}
   move(0);
 };
}
function tawaf():void{
 base('Tahap 2 / 5','Tawaf tujuh putaran','<p>Masuk ke area latihan Masjidil Haram. Mulai dari garis Hajar Aswad, bergerak berlawanan arah jarum jam dengan Ka’bah di sebelah kiri, hingga tujuh putaran.</p><div class="lesson"><p>Perhatikan syarat tawaf, aurat, dan kesucian sesuai tuntunan pembimbing. Jangan mendesak jamaah lain untuk menyentuh Hajar Aswad.</p><p class="muted">Gunakan joystick atau mode otomatis. Setelah tujuh putaran, kembali ke perjalanan utama.</p></div>'+startButton(stageUrl('player.html',journey),'Masuk Masjidil Haram'));
}
function post():void{
 base('Tahap 3 / 5','Salat sunah & air zamzam','<p>Setelah tawaf, pelajari dua amalan yang dianjurkan. Keduanya bukan rukun umrah.</p><div class="lesson"><h3>Salat sunah dua rakaat</h3><p>Jika memungkinkan, lakukan di belakang Maqam Ibrahim. Bila padat, carilah tempat lain yang aman di Masjidil Haram tanpa menghalangi orang bertawaf.</p></div><div class="lesson"><h3>Minum air zamzam</h3><p>Minum dari tempat yang tersedia dan berdoa. Tidak perlu berdesakan.</p></div><fieldset class="quiz"><legend>Jika sekitar Maqam Ibrahim sangat padat, apa yang dilakukan?</legend><label><input type="radio" name="post" value="wrong"> Tetap berdiri di jalur tawaf.</label><label><input type="radio" name="post" value="right"> Cari tempat aman yang tidak mengganggu jamaah.</label></fieldset><button class="action" id="continue">Lanjut ke sa’i</button>');
 const controls=document.createElement('div');controls.className='demo-controls';const prayer=document.createElement('button'),water=document.createElement('button');prayer.className=water.className='secondary';prayer.textContent='Peragakan gerakan salat';water.textContent='Peragakan ambil zamzam';controls.append(prayer,water);scene('post',()=>{prayer.disabled=water.disabled=false;message('Peragaan selesai. Pelajari tuntunan lengkap bersama pembimbing.',true);});lesson.querySelector('.mini-scene')!.after(controls);prayer.onclick=()=>{if(!demo)return;prayer.disabled=water.disabled=true;guide.announce('Peragaan ringkas gerakan salat, bukan panduan bacaan atau waktu salat yang lengkap.','prayer-demo',0,true);demo.prayer();};water.onclick=()=>{if(!demo)return;prayer.disabled=water.disabled=true;guide.announce('Ambil air zamzam di tempat yang tersedia tanpa menghalangi jamaah lain.','water-demo',0,true);demo.water();};if(!demo)prayer.disabled=water.disabled=true;
 lesson.querySelector<HTMLButtonElement>('#continue')!.onclick=()=>{if(lesson.querySelector<HTMLInputElement>('input[name=post]:checked')?.value!=='right'){message('Pilih tempat yang aman dan tidak mengganggu jamaah lain.');return;}move(2);};
}
function sai():void{
 base('Tahap 4 / 5','Sa’i tujuh lintasan','<p>Mulai di Safa, berjalan ke Marwah sebagai lintasan pertama. Lanjut bolak-balik hingga tujuh lintasan dan berakhir di Marwah.</p><div class="lesson"><p>Di antara dua tanda hijau, laki-laki dianjurkan berlari kecil jika mampu. Perempuan berjalan biasa. Jangan memaksakan diri jika tidak mampu.</p><p class="muted">Jarak lorong di simulator dipersingkat agar latihan lebih praktis.</p></div>'+startButton(stageUrl('sai.html',journey),'Masuk lorong sa’i'));
}
function tahallul():void{
 const female=journey.avatar==='female';
 base('Tahap 5 / 5','Tahallul','<p>Sesudah menyelesaikan sa’i, tahap berikutnya memotong rambut sesuai ketentuan. Bagi laki-laki, mencukur habis dianjurkan; memendekkan rambut juga diperbolehkan. Perempuan cukup memotong sebagian ujung rambut. Ikuti bimbingan fikih untuk jumlah dan caranya.</p><div class="art" id="hairArt" role="img" aria-label="Ilustrasi potong rambut"><svg viewBox="0 0 280 120"><g fill="none" stroke="#34473b" stroke-width="6" stroke-linecap="round"><path d="M125 18Q145 25 134 70M137 18Q162 39 148 70M150 18Q173 37 162 70"/></g><g class="hair" fill="none" stroke="#34473b" stroke-width="6" stroke-linecap="round"><path d="M134 72l-9 21M148 72l-4 22M162 72l4 21"/></g><path d="M96 71h89" stroke="#7a876c" stroke-dasharray="4 3" stroke-width="2"/><g stroke="#927b49" stroke-width="3" fill="none"><circle cx="196" cy="57" r="10"/><circle cx="196" cy="81" r="10"/><path d="M188 62l-30 21M188 76l-30-21"/></g></svg></div><p class="muted">Ilustrasi pemotongan, bukan ukuran atau prosedur pencukuran sebenarnya.</p><fieldset class="quiz"><legend>Untuk jamaah '+(female?'perempuan':'laki-laki')+', pilihan yang tepat adalah…</legend><label><input type="radio" name="trim" value="right"> '+(female?'Memotong sebagian ujung rambut.':'Mencukur atau memendekkan rambut setelah sa’i.')+'</label><label><input type="radio" name="trim" value="wrong"> '+(female?'Mencukur seluruh kepala sebagai ketentuan wajib.':'Memotong rambut sebelum menyelesaikan sa’i.')+'</label></fieldset><button class="action" id="trim">Simulasikan tahallul</button><button class="secondary" id="finish" hidden>Selesaikan latihan</button>');
 scene('trim');
 const trim=lesson.querySelector<HTMLButtonElement>('#trim')!,finish=lesson.querySelector<HTMLButtonElement>('#finish')!;
 trim.onclick=()=>{if(lesson.querySelector<HTMLInputElement>('input[name=trim]:checked')?.value!=='right'){message('Belum tepat. Tahallul dilakukan setelah sa’i, dengan cara yang sesuai.');return;}demo?.trim();lesson.querySelector('#hairArt')?.classList.add('trimmed');trim.disabled=true;lesson.querySelectorAll<HTMLInputElement>('input[name=trim]').forEach(r=>r.disabled=true);finish.hidden=false;message('Tahallul telah diperagakan dalam latihan.',true);};
 finish.onclick=()=>move(4);
}
function done():void{
 base('Ringkasan perjalanan','Rangkaian latihan selesai','<div class="complete"><div class="symbol">✓</div><h3>Alhamdulillah</h3><p>Kamu telah mempelajari lima tahap simulasi umrah, termasuk tawaf tujuh putaran serta sa’i tujuh lintasan.</p><p class="muted">Ini hanya catatan penyelesaian pembelajaran, bukan sertifikat ibadah atau bukti kelayakan manasik.</p></div><button class="action" id="restart">Mulai perjalanan baru</button>');
 showAssessment(lesson,journey);
 lesson.querySelector<HTMLButtonElement>('#restart')!.onclick=()=>{if(persist(newJourney(journey.avatar)))render();};
}
function render():void{
 demo?.dispose();demo=null;drawTrack();guide.announce(narration[journey.stage],'stage-'+journey.stage,0,true);
 switch(journey.stage){case 0:preparation();break;case 1:tawaf();break;case 2:post();break;case 3:sai();break;case 4:tahallul();break;case 5:done();break;}
 if(journey.stage>0&&journey.stage<5){
  const restart=document.createElement('button');restart.className='secondary';restart.textContent='Ulangi dari awal';
  restart.onclick=()=>{if(confirm('Reset seluruh progress perjalanan umrah?')&&persist(newJourney(journey.avatar)))render();};lesson.append(restart);
 }
}
render();
window.addEventListener('pageshow',e=>{if(e.persisted){journey=readJourney()??newJourney('male');render();}});
