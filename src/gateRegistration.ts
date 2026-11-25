import {ADMIN_WHATSAPP,manualConfirmationUrl,registrationSummary} from './registrationHandoff.ts';
import {readSetup,saveSetup} from './frontSettings.ts';
import {defaultSetup} from './frontModel.ts';
import {gateGuide,gateGreeting} from './gateGuide.ts';
import {showMagicLinkPopup} from './magicAccess.ts';
type Registration={id:string;name:string;email?:string|null;phone?:string|null;avatar:'male'|'female';program:'hajj'|'umrah';status:'pending'|'reported'|'approved';reference:string|null;amount?:number;discount?:number;coupon?:string|null;payment_method?:'qris'|'transfer'|null;access_suspended?:boolean};
type Qris={status:string;is_test:boolean;amount:number;total_amount:number|null;qr_url:string|null;qr_image?:string|null;can_retry?:boolean;create_error?:string|null;payment_url:string|null;expires_at:string|null;transaction_id:string|null};
type Quote={code:string;amount:number;discount:number;commission:number};
type BankOption={id:string;bank:string;account:string;holder:string};
type ResponseData={ticket:{amount:number;bank:string;account:string;holder:string;enabled?:boolean;manual_enabled?:boolean;bank_options?:BankOption[];qris_enabled?:boolean;qris_test?:boolean};qris?:Qris|null;coupon?:Quote;registration:Registration|null;href?:string;lookup?:'verified'|'review'|'new'};
async function request(action='',body?:unknown):Promise<ResponseData>{
 const response=await fetch(new URL('./api/registration'+action,location.href),{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(action.startsWith('/qris')?30000:8000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Layanan belum tersedia.');
 if(data?.ticket?.amount!==100000||typeof data.ticket.account!=='string'||data.registration&&!['pending','reported','approved'].includes(data.registration.status))throw Error('Respons pendaftaran tidak valid.');return data;
}
/** Approval always comes from the server; browser storage cannot approve a transfer. */
export function mountGateRegistration(host:HTMLElement,notice:HTMLElement,onBack:()=>void,playerName='',onReady?:(href:string)=>void,onDialogue?:(message:string)=>void,onPlayer?:(message:string)=>void){
 let checked=false;let identity={name:playerName.trim().slice(0,60),email:'',phone:''};const sapaan=gateGreeting(readSetup()?.avatar??'male');let qrisPending=false;let disposed=false,busy=false,poll:ReturnType<typeof setTimeout>|undefined,lastState='',watch=false,disposePopup:(()=>void)|undefined;
 let replyTimer:ReturnType<typeof setTimeout>|undefined;
 const status=document.createElement('p');status.setAttribute('role','status');host.replaceChildren(status);
 function message(error:unknown){notice.textContent=error instanceof Error&&error.name!=='SyntaxError'?error.message:'Layanan pendaftaran belum tersambung. Data belum dikirim. Coba lagi atau kembali ke gerbang.';}
 function button(text:string,run:()=>void,primary=false){const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='travelPrimary';b.onclick=run;return b;}
 const back=()=>button('← Kembali ke obrolan',onBack);

 /** Frontend-only rehearsal. No network, storage, payment credentials or access token. */
 function preview(){
  if(disposed)return;
  watch=false;clearTimeout(poll);notice.textContent='';
  host.replaceChildren();
  const title=document.createElement('h3');title.textContent='Formulir pendaftaran perjalanan';
  const warning=document.createElement('p');warning.className='gateTestNotice';warning.textContent='PREVIEW · Gunakan data contoh. Pendaftaran belum tersambung ke database. Jangan melakukan pembayaran.';
  const form=document.createElement('form');form.className='gateRegistrationForm';
  form.innerHTML='<label>Nama lengkap<input name="name" required minlength="2" maxlength="60" value="Peserta Demo" autocomplete="off"></label><label>Email aktif<input name="email" type="email" required maxlength="150" value="peserta@example.com" autocomplete="off"><small>Untuk magic link saat sistem sudah aktif.</small></label><label>Nomor WhatsApp<input name="phone" type="tel" required inputmode="tel" pattern="[0-9+]{10,16}" value="081234567890" autocomplete="off"></label><label>Pilih perjalanan<select name="program"><option value="hajj">Haji · 12 level + bonus</option><option value="umrah">Umroh · 5 level</option></select></label><label class="gateConsent"><input type="checkbox" name="consent" required><span>Saya memahami ini hanya simulasi pendaftaran dan bukan perjalanan haji nyata.</span></label><button type="submit" class="travelPrimary">Lanjut pembayaran →</button>';
  const program=form.elements.namedItem('program') as HTMLSelectElement;program.value=readSetup()?.program??'hajj';
  const price=document.createElement('p');price.textContent='Contoh biaya akses: Rp100.000 / peserta.';
  const original=()=>{host.replaceChildren(title,warning,price,form,button('Coba layanan asli',()=>void load()),back());form.querySelector('input')?.focus();};
  form.onsubmit=e=>{
   e.preventDefault();if(disposed)return;
   const data=new FormData(form),selected=String(data.get('program'))==='umrah'?'Umroh':'Haji';
   const checkout=document.createElement('form');checkout.className='gateRegistrationForm';
   checkout.innerHTML='<label>Metode pembayaran<select name="method" required><option value="transfer">Transfer bank manual</option><option value="qris">QRIS</option></select></label><div class="gateBank" id="previewPaymentDetail" aria-live="polite"></div><button class="travelPrimary" type="submit">Lihat tiket perjalanan →</button>';
   const method=checkout.elements.namedItem('method') as HTMLSelectElement,detail=checkout.querySelector<HTMLElement>('#previewPaymentDetail')!;
   const update=()=>{detail.textContent=method.value==='qris'?'QRIS akan muncul setelah payment gateway terhubung. Belum ada kode yang dapat dipindai.':'Nomor rekening dan konfirmasi transfer akan tersedia setelah layanan pembayaran terhubung. Jangan transfer sekarang.';};
   method.onchange=update;update();
   const heading=document.createElement('h3');heading.textContent='Pembayaran tiket · '+selected;
   const summary=document.createElement('p');summary.textContent='Peserta: '+String(data.get('name'))+' · Rp100.000 (contoh)';
   checkout.onsubmit=event=>{
    event.preventDefault();if(disposed)return;
    const ticket=document.createElement('div');ticket.className='gateBank';
    const kicker=document.createElement('span');kicker.textContent='HAJJI.DIGITAL · BOARDING PASS DEMO';
    const passenger=document.createElement('strong');passenger.textContent=String(data.get('name'));
    const route=document.createElement('p');route.textContent=selected+' · '+(method.value==='qris'?'QRIS':'Transfer manual');
    const locked=document.createElement('p');locked.className='gateStatus';locked.textContent='Menunggu verifikasi · Magic link belum aktif.';
    const next=document.createElement('p');next.textContent='Setelah pembayaran sungguhan diverifikasi, tiket akses akan membuka pemberangkatan, level perjalanan, dan bonus sesuai program.';
    ticket.append(kicker,passenger,route,locked,next);
    host.replaceChildren(warning,ticket,button('← Kembali ke pembayaran',()=>{host.replaceChildren(heading,warning,summary,checkout,button('← Ubah data',original),back());method.focus();}),button('Ulangi pendaftaran',original),back());
   };
   host.replaceChildren(heading,warning,summary,checkout,button('← Ubah data',original),back());method.focus();
  };
  original();
 }
 function stateKey(d:ResponseData){return [d.registration?.id,d.registration?.status,d.qris?.status,d.qris?.transaction_id,d.ticket.qris_enabled].join(':');}
 function schedule(){clearTimeout(poll);if(watch&&!disposed)poll=setTimeout(()=>void load(false),22000);}
 async function load(force=true){if(busy||disposed){schedule();return;}if(!force&&document.hidden){schedule();return;}busy=true;if(force){status.textContent='Memeriksa pendaftaran…';notice.textContent='';}try{const data=await request(!force&&qrisPending?'/qris-check':'',!force&&qrisPending?{}:undefined);if(!disposed&&(force||lastState!==stateKey(data)))paint(data);}catch(error){if(!disposed){message(error);if(force){host.replaceChildren(status);status.textContent='Pendaftaran belum tersedia.';host.append(button('Coba sambungkan lagi',()=>void load(),true),button('Coba formulir preview',preview),back());}}}finally{busy=false;schedule();}}
 const fmt=(n:number)=>'Rp'+n.toLocaleString('id-ID');
 function mode(value:'form'|'bill'){const root=host.closest<HTMLElement>('.gateWorldDialogue');if(root)root.dataset.line=value;}
 function ask(text:string){onDialogue?.(text);notice.textContent='';host.replaceChildren();mode('form');}
 function reply(text:string,next:()=>void){host.replaceChildren();onPlayer?.(text);clearTimeout(replyTimer);replyTimer=setTimeout(()=>{if(!disposed)next();},1150);}
 function choices(items:{label:string;run:()=>void}[]){const row=document.createElement('div');row.className='gateAnswerChoices';for(const item of items)row.append(button(item.label,item.run,true));host.append(row);}
 function inputAnswer(question:string,placeholder:string,type:string,value:string,validate:(v:string)=>boolean,next:(v:string)=>void,max=150){
  ask(question);const form=document.createElement('form');form.className='gateAnswerInput';const input=document.createElement('input');input.type=type;input.placeholder=placeholder;input.setAttribute('aria-label',placeholder);input.required=true;input.maxLength=max;input.value=value;input.autocomplete=type==='email'?'email':type==='tel'?'tel':placeholder==='Nama lengkap'?'name':'off';
  const send=document.createElement('button');send.type='submit';send.className='travelPrimary';send.textContent='KIRIM';form.append(input,send);host.append(form);
  input.oninput=()=>input.setCustomValidity('');
  form.onsubmit=e=>{e.preventDefault();if(disposed||busy)return;const v=input.value.trim();if(!validate(v)){input.setCustomValidity('Periksa kembali isian ini, ya.');input.reportValidity();return;}next(v);};input.focus({preventScroll:true});
 }
 function checkIdentity(_data:ResponseData){
  watch=false;clearTimeout(poll);mode('form');
  const recover=()=>{const a=document.createElement('a');a.className='travelPrimary gateEnterDistrict';a.href='https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent('Assalamualaikum, Admin HAJJI.DIGITAL. Mohon bantu cek atau pulihkan tiket saya. Saya siap verifikasi melalui kontak terdaftar.');a.target='_blank';a.rel='noopener noreferrer';a.textContent='BANTU CEK TIKET';return a;};
  async function lookup(){
   if(disposed||busy)return;busy=true;ask('Siap, terima kasih ya, '+sapaan+'. Saya bantu proses daftarnya dulu. Mohon ditunggu, ya.');notice.textContent='Memeriksa data…';
   try{const next=await request('/lookup',identity);if(disposed)return;if(next.lookup==='review'){ask('Data perlu diperiksa lagi agar tidak bayar dua kali. Silakan hubungi admin atau perbaiki data.');host.append(recover(),button('Perbaiki data',nameStep));return;}if(next.lookup!=='new'&&next.lookup!=='verified')throw Error('Data belum bisa diperiksa.');checked=true;paint(next);}
   catch(err){if(!disposed){message(err);choices([{label:'Coba lagi',run:()=>void lookup()},{label:'Perbaiki data',run:nameStep}]);}}finally{busy=false;schedule();}
  }
  function phoneStep(){inputAnswer('Nomor WhatsApp-nya berapa, '+sapaan+'?','Nomor WhatsApp','tel',identity.phone,v=>/^\+?[0-9]{10,16}$/.test(v.replace(/[\s()-]/g,'')),v=>{identity.phone=v.replace(/[\s()-]/g,'');reply('Nomor WA sudah saya isi.',()=>void lookup());},24);}
  function emailStep(){inputAnswer('Emailnya apa?','Alamat email','email',identity.email,v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),v=>{identity.email=v.toLowerCase();reply('Email sudah saya isi.',phoneStep);});}
  function nameStep(){inputAnswer('Namanya siapa, '+sapaan+'?','Nama lengkap','text',identity.name,v=>v.length>=2,v=>{identity.name=v;reply('Nama saya '+v+'.',emailStep);},60);}
  // Do not expose existing session identity before the participant enters their own data.
  nameStep();
 }
 function conversationalCheckout(data:ResponseData){
  let quote:Quote|null=null;let method='';const setup=readSetup()??defaultSetup();
  const banks=data.ticket.bank_options??(data.ticket.manual_enabled!==false&&data.ticket.account?[{id:'primary',bank:data.ticket.bank,account:data.ticket.account,holder:data.ticket.holder}]:[]);
  function payment(){ask('Totalnya '+fmt(quote?.amount??100000)+'. '+sapaan+' mau bayar lewat bank mana atau QRIS?');const items=banks.map(bank=>({label:bank.bank,run:()=>{method='bank:'+bank.id;reply('Saya pilih '+bank.bank+'.',confirmPayment);}}));if(data.ticket.qris_enabled)items.push({label:data.ticket.qris_test?'QRIS (Sandbox)':'QRIS',run:()=>{method='qris';reply('Saya pilih QRIS.',confirmPayment);}});if(!items.length){notice.textContent='Belum ada metode pembayaran aktif. Hubungi admin.';host.append(button('Periksa kembali',()=>void load()));return;}choices(items);}
  function confirmPayment(){const bank=banks.find(b=>'bank:'+b.id===method),total=fmt(quote?.amount??100000);ask('Baik, silakan '+(bank?'transfer ke '+bank.bank:'bayar melalui QRIS')+' sebesar '+total+'. Saya siapkan tagihannya, ya.');const info=document.createElement('p');info.className='gateAnswerConsent';info.textContent='Dengan mendaftar, Anda menyetujui penggunaan data untuk pendaftaran, pembayaran dan referral.'+(bank?' Data dikirim ke admin saat konfirmasi melalui WA.':'');host.append(info);choices([{label:'YA, DAFTAR AJA!',run:()=>void create()},{label:'Ganti metode',run:payment}]);}
  async function create(){if(disposed||busy)return;busy=true;for(const b of host.querySelectorAll('button'))b.disabled=true;notice.textContent='Menyiapkan tagihan…';try{if(!saveSetup(setup))throw Error('Persiapan belum tersimpan.');const next=await request('',{...identity,program:setup.program,avatar:setup.avatar,consent:true,method:method.startsWith('bank:')?'transfer':method,bank_id:method.startsWith('bank:')?method.slice(5):undefined,coupon:quote?.code??'',expected_amount:quote?.amount??100000});if(disposed)return;try{sessionStorage.removeItem('hajji-referral-code');}catch{}paint(next);if(next.registration?.status==='pending'&&next.registration.payment_method==='qris'){try{const paid=await request('/qris-create',{});if(!disposed)paint(paid);}catch(err){if(!disposed)message(err);}}}catch(err){if(!disposed){message(err);for(const b of host.querySelectorAll('button'))b.disabled=false;}}finally{busy=false;schedule();}}
  function coupon(){let pref=new URLSearchParams(location.search).get('ref')?.slice(0,30)??'';if(!pref)try{pref=sessionStorage.getItem('hajji-referral-code')??'';}catch{}inputAnswer('Boleh sebutkan kode kuponnya?','Kode kupon','text',pref,v=>v.length>0,v=>{reply('Ini kode kupon saya: '+v.toUpperCase()+'.',()=>void verifyCoupon(v));},30);}
  async function verifyCoupon(value:string){if(disposed||busy)return;busy=true;ask('Sebentar, saya periksa kuponnya dulu.');try{const d=await request('/coupon',{code:value.trim().toUpperCase()});if(disposed)return;if(!d.coupon)throw Error('Kupon belum dapat digunakan.');quote=d.coupon;ask('Alhamdulillah, kupon berhasil! Potongan '+fmt(quote.discount)+'. Jadi totalnya '+fmt(quote.amount)+'.');choices([{label:'Lanjut pembayaran',run:payment}]);}catch(err){if(disposed)return;quote=null;ask('Kupon belum dapat digunakan. Harga normalnya Rp100.000.');message(err);choices([{label:'Bayar Rp100.000',run:payment},{label:'Coba kode lain',run:coupon}]);}finally{busy=false;}}
  ask('Data belum terdaftar. Biaya pendaftaran Rp100.000. Sudah punya kode kupon, '+sapaan+'?');choices([{label:'Punya kupon',run:()=>reply('Saya punya kode kupon.',coupon)},{label:'Tidak punya',run:()=>reply('Saya tidak punya kupon.',payment)}]);
 }
 function paint(data:ResponseData){
  if(!checked){checkIdentity(data);return;}
  host.replaceChildren();notice.textContent='';const r=data.registration;mode(r&&r.status!=='approved'?'bill':'form');const guide=gateGuide(r?.avatar??readSetup()?.avatar??'male').name;lastState=stateKey(data);qrisPending=data.qris?.status==='pending';watch=!!r&&r.status!=='approved';schedule();
  const heading=document.createElement('h3');heading.textContent=r?'Pendaftaran '+r.id:'Formulir pendaftaran';host.append(heading);
  if(['localhost','127.0.0.1'].includes(location.hostname)){const test=document.createElement('p');test.className='gateTestNotice';test.textContent='Pengujian lokal — jangan transfer uang untuk mencoba alur ini.';host.append(test);}
  const price=document.createElement('p');price.textContent=r?'Tagihan Rp'+(r.amount??100000).toLocaleString('id-ID')+(r.discount?' · Diskon Rp'+r.discount.toLocaleString('id-ID'):''):'Tiket petualangan · Rp100.000';host.append(price);
  if(!r&&data.ticket.enabled===false){host.append('Pendaftaran berbayar belum dibuka. Silakan kembali setelah admin membuka metode pembayaran.',button('Periksa kembali',()=>void load()),back());return;}
  if(!r){conversationalCheckout(data);return;}
  const state=document.createElement('p');state.id='registrationStatus';state.dataset.status=r.status;state.setAttribute('role','status');state.className='gateStatus';state.textContent=r.status==='approved'?'Alhamdulillah, '+sapaan+'! Tiket sudah aktif. Yuk, kita berangkat.':r.status==='reported'?'Bukti transfer sudah dilaporkan. Saya tunggu hasil cek admin, ya.':'Ternyata sudah terdaftar, '+sapaan+'. Tinggal selesaikan tagihan ini, ya.';host.append(state);
  if(r.access_suspended){onDialogue?.('Maaf, akses tiket ini sedang dinonaktifkan. Silakan hubungi admin.');state.textContent='Akses member dinonaktifkan oleh admin. Hubungi admin untuk mengaktifkan kembali.';host.append(back());return;}
  if(r.status==='approved'){
   onDialogue?.('Wah, alhamdulillah, '+sapaan+'! Tiket sudah aktif. Silakan masuk melalui pintu keberangkatan ini, ya.');
   const open=button('Tampilkan MAGIC LINK →',()=>void access());const enter=document.createElement('a');enter.className='travelPrimary gateEnterDistrict';enter.textContent='MASUK DISTRIK →';enter.hidden=true;enter.rel='noreferrer';let href:string|undefined;
   async function access(){if(disposed)return;open.disabled=true;try{if(!href){const latest=await request('/magic-link',{});if(disposed)return;if(!latest.href)throw Error('Magic link belum tersedia.');const url=new URL(latest.href,location.href);if(url.origin!==location.origin||url.searchParams.get('access')!=='1'||!/^#token=[a-f0-9]{64}$/.test(url.hash))throw Error('Magic Link tidak valid.');href=url.href;enter.href=href;enter.hidden=false;}if(onReady){onReady(href);return;}disposePopup?.();disposePopup=showMagicLinkPopup(href,guide);}catch(error){if(!disposed)message(error);}finally{open.disabled=false;}}
   const affiliate=document.createElement('a');affiliate.href='./affiliate.html';affiliate.textContent='Kode referral & komisi saya';if(onReady){open.textContent='LANJUT KE PINTU';host.append(open);void access();}else{host.append(enter,open,affiliate,back());void access();}return;
  }
  onDialogue?.(r.status==='reported'?'Pembayaran masih diperiksa admin. Setelah aktif, tiket bisa digunakan.':'Data sudah terdaftar, tetapi tiket belum lunas. Silakan '+(r.payment_method==='qris'?'bayar melalui QRIS':'transfer ke '+data.ticket.bank)+' sebesar '+fmt(r.amount??100000)+'.');
  if(r.status==='pending'&&r.payment_method!=='transfer'&&(data.ticket.qris_enabled||data.qris)){
   const q=data.qris,box=document.createElement('div');box.className='gateBank';const title=document.createElement('strong');title.textContent='QRIS · BuatQRIS';box.append(title);
   const msg=document.createElement('p');msg.textContent=(q?.is_test??data.ticket.qris_test)?'SANDBOX · Tidak menggunakan uang asli dan tidak membuka tiket berbayar.':'Scan QRIS dengan aplikasi bank atau dompet digital. Tiket aktif otomatis setelah pembayaran terverifikasi.';box.append(msg);
   if(q?.status==='pending'){const amt=document.createElement('strong');amt.textContent='Total bayar: Rp'+(q.total_amount??q.amount).toLocaleString('id-ID');box.append(amt);if(q.qr_url||q.qr_image){const img=document.createElement('img');img.src=q.qr_url??q.qr_image!;img.referrerPolicy='no-referrer';img.onerror=()=>{if(q.qr_image&&img.getAttribute('src')!==q.qr_image){img.src=q.qr_image;return;}img.onerror=null;img.hidden=true;const warning=document.createElement('p');warning.textContent=q.payment_url?'Gambar QR tidak termuat. Gunakan halaman pembayaran BuatQRIS.':'Gambar QR belum tersedia. Hubungi admin; jangan membuat pembayaran ganda.';box.append(warning);};img.alt='QRIS pembayaran tiket';img.style.cssText='width:min(240px,100%);display:block;margin:12px auto;background:white;padding:10px;border-radius:8px';box.append(img);}if(!q.qr_url&&!q.qr_image&&!q.payment_url){const warning=document.createElement('p');warning.textContent='Transaksi sudah tercatat, tetapi gambar QR belum tersedia. Hubungi admin sebelum membuat pembayaran lain.';box.append(warning);}if(q.payment_url){const a=document.createElement('a');a.href=q.payment_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Buka halaman pembayaran';box.append(a);}if(q.expires_at){const p=document.createElement('p');p.textContent='Berlaku hingga '+new Date(q.expires_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB';box.append(p);}}
   async function pay(action:string){if(disposed||busy)return;busy=true;notice.textContent='Memeriksa QRIS…';try{const next=await request(action,{});if(!disposed)paint(next);}catch(e){if(!disposed)message(e);}finally{busy=false;schedule();}}
   if(q?.status==='pending')box.append(button('CEK PEMBAYARAN',()=>void pay('/qris-check'),true));
   else if(q?.status==='creating'){box.append(q.is_test?'QRIS sandbox sedang disiapkan. Jika tertahan, gunakan tombol coba lagi.':'QRIS sedang diproses. Jika tertahan hubungi admin, jangan bayar ulang.',button('Periksa kembali',()=>void load()));if(q.is_test)box.append(button('COBA QRIS SANDBOX LAGI',()=>void pay('/qris-create'),true));}
   else if(q?.status==='success'&&q.is_test)box.append('Uji pembayaran berhasil. Tiket berbayar belum aktif.',button('Buat QRIS baru',()=>void pay('/qris-create')));
   else if(data.ticket.qris_enabled){if(q?.create_error)box.append(q.create_error==='rate_limited'?'Permintaan dibatasi. Tunggu sebelum mencoba kembali.':'Pembuatan QR sebelumnya gagal. Periksa konfigurasi BuatQRIS bila masalah berulang.');box.append(button(q?.status==='failed'?'COBA BUAT QRIS LAGI':'BAYAR VIA QRIS',()=>void pay('/qris-create'),true));}
   host.append(box);
   if(q?.status==='pending'||q?.status==='creating'||(data.ticket.manual_enabled===false||r.payment_method==='qris')){host.append(back());return;}
  }
  if(data.ticket.manual_enabled===false||r.payment_method==='qris'){host.append(button('Periksa kembali',()=>void load()),back());return;}
  heading.textContent='Ringkasan pendaftaran '+sapaan;
  price.remove();
  const summary=document.createElement('section');summary.className='gateReceipt';summary.setAttribute('aria-label','Ringkasan pendaftaran');const summaryTitle=document.createElement('h4');summaryTitle.textContent='RINGKASAN PENDAFTARAN';const details=document.createElement('dl');
  for(const [key,value] of registrationSummary(r)){const term=document.createElement('dt'),detail=document.createElement('dd');term.textContent=key;detail.textContent=value;details.append(term,detail);}
  const total=document.createElement('div');total.className='gateReceiptTotal';const totalLabel=document.createElement('span'),totalValue=document.createElement('strong');totalLabel.textContent='TOTAL BAYAR';totalValue.textContent='Rp'+(r.amount??100000).toLocaleString('id-ID');total.append(totalLabel,totalValue);summary.append(summaryTitle,details,total);host.append(summary);
  const bank=document.createElement('div');bank.className='gateBank gateReceiptBank';const label=document.createElement('span');label.textContent='Transfer manual · '+data.ticket.bank;const account=document.createElement('strong');account.textContent=data.ticket.account;const holder=document.createElement('p');holder.textContent='a.n. '+data.ticket.holder+' · Rp'+(r.amount??100000).toLocaleString('id-ID');const copy=button('Salin nomor rekening',()=>{if(!navigator.clipboard){notice.textContent='Pilih dan salin nomor rekening di atas.';return;}void navigator.clipboard.writeText(data.ticket.account).then(()=>{notice.textContent='Nomor rekening disalin.';},()=>{notice.textContent='Pilih dan salin nomor rekening di atas.';});});bank.append(label,account,holder,copy);host.append(bank);
  const help=document.createElement('p');help.className='gateReceiptInstruction';help.textContent='Jika sudah transfer, kirimkan foto atau screenshot bukti transfer dengan klik tombol KONFIRMASI TRANSFER di bawah. Admin akan memeriksa pembayaran dan mengirim Magic Link.';
  const confirmation=document.createElement('a');confirmation.className='travelPrimary gateEnterDistrict';confirmation.href=manualConfirmationUrl(r,data.ticket);confirmation.target='_blank';confirmation.rel='noopener noreferrer';confirmation.textContent='KONFIRMASI TRANSFER →';confirmation.id='confirmTransferWhatsApp';
  host.append(help,confirmation);
 }
 void load();return ()=>{disposed=true;clearTimeout(poll);clearTimeout(replyTimer);disposePopup?.();};
}
