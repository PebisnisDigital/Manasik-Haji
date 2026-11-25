import {ADMIN_WHATSAPP,manualWhatsAppUrl,manualConfirmationUrl,registrationSummary} from './registrationHandoff.ts';
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
export function mountGateRegistration(host:HTMLElement,notice:HTMLElement,onBack:()=>void,playerName='',onReady?:(href:string)=>void,onDialogue?:(message:string)=>void){
 let checked=false;let identity={name:playerName.trim().slice(0,60),email:'',phone:''};const sapaan=gateGreeting(readSetup()?.avatar??'male');let qrisPending=false;let disposed=false,busy=false,poll:ReturnType<typeof setTimeout>|undefined,lastState='',watch=false,disposePopup:(()=>void)|undefined;
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
 function checkIdentity(data:ResponseData){
  watch=false;clearTimeout(poll);host.replaceChildren();notice.textContent='';
  const title=document.createElement('h3');title.textContent='Boleh saya minta datanya dulu?' ;
  const intro=document.createElement('p');intro.textContent='Isi nama, email, dan WA. Jika sudah pernah mendaftar, gunakan data yang sama.';
  const form=document.createElement('form');form.className='gateRegistrationForm compactCheckout';form.innerHTML='<label>Nama<input name="name" required minlength="2" maxlength="60" autocomplete="name" placeholder="Nama lengkap"></label><label>Email<input name="email" required type="email" maxlength="150" autocomplete="email" placeholder="contoh@email.com"></label><label>WA<input name="phone" required type="tel" maxlength="24" autocomplete="tel" placeholder="08xxxxxxxxxx"></label><button type="submit" class="travelPrimary">CEK DATA SAYA →</button>';
  const field=(n:string)=>form.elements.namedItem(n) as HTMLInputElement;
  field('name').value=identity.name||data.registration?.name||'';field('email').value=identity.email||data.registration?.email||'';field('phone').value=identity.phone||data.registration?.phone||'';
  const recover=()=>{const a=document.createElement('a');a.className='travelPrimary gateEnterDistrict';a.href='https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent('Assalamualaikum, Admin HAJJI.DIGITAL. Mohon bantu cek atau pulihkan tiket saya.\nNama: '+identity.name+'\nEmail: '+identity.email+'\nWA: '+identity.phone+'\nSaya siap verifikasi melalui kontak yang terdaftar.');a.target='_blank';a.rel='noopener noreferrer';a.textContent='BANTU CEK TIKET';return a;};
  form.onsubmit=async e=>{e.preventDefault();if(busy||disposed)return;identity={name:field('name').value.trim(),email:field('email').value.trim().toLowerCase(),phone:field('phone').value.replace(/[\s()-]/g,'')};const btn=form.querySelector('button')!;btn.disabled=true;busy=true;notice.textContent='Sebentar, saya cek datanya…';onDialogue?.('Sebentar, saya cek data di sistem dulu, ya.');try{const next=await request('/lookup',identity);if(disposed)return;if(next.lookup==='review'){host.replaceChildren(title);const p=document.createElement('p');p.textContent='Sepertinya data perlu dicek lagi, '+sapaan+'. Bisa jadi sudah pernah daftar atau ada salah ketik. Biar tidak bayar dua kali, saya bantu hubungkan ke admin. Siapkan akses WA/email terdaftar atau bukti pembayaran, ya.';host.append(p,recover(),button('Perbaiki data',()=>checkIdentity(data)),back());notice.textContent='';return;}if(next.lookup!=='new'&&next.lookup!=='verified')throw Error('Data belum bisa diperiksa. Coba lagi, ya.');checked=true;paint(next);}catch(err){if(!disposed)message(err);}finally{busy=false;btn.disabled=false;schedule();}};
  host.append(title,intro,form,back());field('name').focus();
 }
 function paint(data:ResponseData){
  if(!checked){checkIdentity(data);return;}
  host.replaceChildren();notice.textContent='';const r=data.registration,guide=gateGuide(r?.avatar??readSetup()?.avatar??'male').name;lastState=stateKey(data);qrisPending=data.qris?.status==='pending';watch=!!r&&r.status!=='approved';schedule();
  const heading=document.createElement('h3');heading.textContent=r?'Pendaftaran '+r.id:'Formulir pendaftaran';host.append(heading);
  if(['localhost','127.0.0.1'].includes(location.hostname)){const test=document.createElement('p');test.className='gateTestNotice';test.textContent='Pengujian lokal — jangan transfer uang untuk mencoba alur ini.';host.append(test);}
  const price=document.createElement('p');price.textContent=r?'Tagihan Rp'+(r.amount??100000).toLocaleString('id-ID')+(r.discount?' · Diskon Rp'+r.discount.toLocaleString('id-ID'):''):'Tiket petualangan · Rp100.000';host.append(price);
  if(!r&&data.ticket.enabled===false){host.append('Pendaftaran berbayar belum dibuka. Silakan kembali setelah admin membuka metode pembayaran.',button('Periksa kembali',()=>void load()),back());return;}
  if(!r){
   onDialogue?.('Data belum terdaftar. Silakan lengkapi pendaftaran dan pilih cara bayar. Kalau punya kupon, boleh digunakan.');
   heading.textContent='Siapkan tiket perjalanan';price.textContent='Baik, '+sapaan+'! Ada '+((readSetup()?.program??'hajj')==='hajj'?'12 misi dan hadiah di Gedung OLEH-OLEH':'5 misi perjalanan Umroh')+'. Tiket Rp100.000. Pilih cara bayar, dan pakai kupon kalau ada, ya.';
   const form=document.createElement('form');form.className='gateRegistrationForm compactCheckout';
   form.innerHTML='<label>Nama<input name="name" autocomplete="name" required minlength="2" maxlength="60" placeholder="Nama lengkap"></label><label>Email<input name="email" type="email" autocomplete="email" required maxlength="150" placeholder="contoh@email.com"></label><label>WA<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required maxlength="17" placeholder="08xxxxxxxxxx"></label><label>Pilih cara bayarnya<select name="method" required><option value="" disabled selected>-- Pilih Metode Pembayaran --</option></select></label><div class="checkoutTotal"><div><small>TIKET PERJALANAN</small><span>Tiket Haji Digital · 12 level</span></div><strong id="checkoutPrice">Rp100.000</strong></div><label>Kode kupon <small>(opsional)</small><div class="checkoutCoupon"><input name="coupon" maxlength="30" placeholder="CONTOH: HJ-XXXXXXXXXXXX" autocomplete="off"><button type="button" id="applyCoupon">PAKAI</button></div></label><p id="couponStatus" aria-live="polite"></p><button type="submit" class="travelPrimary">YA, DAFTAR AJA!</button>';
   for(const key of ['name','email','phone'] as const){const field=form.elements.namedItem(key) as HTMLInputElement;field.value=identity[key];field.readOnly=true;}
   const method=form.elements.namedItem('method') as HTMLSelectElement,code=form.elements.namedItem('coupon') as HTMLInputElement,apply=form.querySelector<HTMLButtonElement>('#applyCoupon')!,total=form.querySelector<HTMLElement>('#checkoutPrice')!,couponNotice=form.querySelector<HTMLElement>('#couponStatus')!;
   const banks=data.ticket.bank_options??(data.ticket.manual_enabled!==false&&data.ticket.account?[{id:'primary',bank:data.ticket.bank,account:data.ticket.account,holder:data.ticket.holder}]:[]);
   if(banks.length){const group=document.createElement('optgroup');group.label='Bank Transfer';for(const bank of banks)group.append(new Option(bank.bank+' — '+bank.account+' ('+bank.holder+')','bank:'+bank.id));method.append(group);}
   if(data.ticket.qris_enabled){const group=document.createElement('optgroup');group.label='QRIS';group.append(new Option(data.ticket.qris_test?'QRIS Otomatis · Sandbox':'QRIS Otomatis','qris'));method.append(group);}
   if(method.options.length===1){notice.textContent='Belum ada metode pembayaran yang aktif. Hubungi admin.';form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled=true;}
   const setup=readSetup()??defaultSetup();form.querySelector<HTMLElement>('.checkoutTotal span')!.textContent=setup.program==='umrah'?'Tiket Umroh Digital · 5 level':'Tiket Haji Digital · 12 level';
   let quote:Quote|null=null,quoting=false;const fmt=(n:number)=>'Rp'+n.toLocaleString('id-ID');code.value=new URLSearchParams(location.search).get('ref')?.slice(0,30)??'';if(!code.value){try{code.value=sessionStorage.getItem('hajji-referral-code')??'';}catch{}}
   code.oninput=()=>{quote=null;total.textContent=fmt(100000);couponNotice.textContent='';};
   async function applyCode(){if(quoting||disposed)return false;const v=code.value.trim().toUpperCase();if(!v){quote=null;total.textContent=fmt(100000);couponNotice.textContent='';return true;}quoting=true;apply.disabled=true;try{const d=await request('/coupon',{code:v});if(!d.coupon||code.value.trim().toUpperCase()!==v)return false;quote=d.coupon;total.textContent=fmt(quote.amount);couponNotice.textContent='Potongan '+fmt(quote.discount)+' · kupon terpasang.';return true;}catch(e){quote=null;total.textContent=fmt(100000);couponNotice.textContent=e instanceof Error?e.message:'Kupon belum dapat diperiksa.';return false;}finally{quoting=false;apply.disabled=false;}}
   apply.onclick=()=>void applyCode();if(code.value)void applyCode();
   form.onsubmit=async e=>{e.preventDefault();if(busy||disposed||quoting)return;const manual=method.value.startsWith('bank:');const consent=window.confirm('Setuju menggunakan data untuk pendaftaran, pembayaran, dan referral?'+(manual?' Data pendaftaran akan diteruskan ke admin melalui WhatsApp.':''));if(!consent)return;const submit=form.querySelector<HTMLButtonElement>('button[type=submit]')!;submit.disabled=true;busy=true;let wa:Window|null=null;if(manual){try{wa=window.open('about:blank','_blank');if(wa)wa.opener=null;}catch{wa=null;}}
    try{if(code.value.trim()&&!(await applyCode()))return;const input=new FormData(form);if(!saveSetup(setup))throw Error('Persiapan belum tersimpan.');notice.textContent='Mengirim pendaftaran…';const next=await request('',{name:String(input.get('name')).trim(),email:String(input.get('email')).trim(),phone:String(input.get('phone')).replace(/[\\s-]/g,''),program:setup.program,avatar:setup.avatar,consent,method:method.value.startsWith('bank:')?'transfer':method.value,bank_id:method.value.startsWith('bank:')?method.value.slice(5):undefined,coupon:quote?.code??'',expected_amount:quote?.amount??100000});if(disposed)return;try{sessionStorage.removeItem('hajji-referral-code');}catch{}paint(next);if(manual&&next.registration?.payment_method==='transfer'&&next.registration.status!=='approved'&&wa&&!wa.closed){try{wa.location.replace(manualWhatsAppUrl(next.registration,next.ticket));wa=null;}catch{notice.textContent='Klik tombol WhatsApp untuk melanjutkan.';}}if(next.registration?.status==='pending'&&next.registration.payment_method==='qris'){try{const payment=await request('/qris-create',{});if(!disposed)paint(payment);}catch(err){if(!disposed)message(err);}}}catch(err){if(!disposed)message(err);}finally{if(wa&&!wa.closed)wa.close();busy=false;submit.disabled=false;schedule();}};
   host.append(form);method.focus();return;
  }
  const state=document.createElement('p');state.id='registrationStatus';state.dataset.status=r.status;state.setAttribute('role','status');state.className='gateStatus';state.textContent=r.status==='approved'?'Alhamdulillah, '+sapaan+'! Tiket sudah aktif. Yuk, kita berangkat.':r.status==='reported'?'Bukti transfer sudah dilaporkan. Saya tunggu hasil cek admin, ya.':'Ternyata sudah terdaftar, '+sapaan+'. Tinggal selesaikan tagihan ini, ya.';host.append(state);
  if(r.access_suspended){onDialogue?.('Maaf, akses tiket ini sedang dinonaktifkan. Silakan hubungi admin.');state.textContent='Akses member dinonaktifkan oleh admin. Hubungi admin untuk mengaktifkan kembali.';host.append(back());return;}
  if(r.status==='approved'){
   onDialogue?.('Wah, alhamdulillah, '+sapaan+'! Tiket sudah aktif. Silakan masuk melalui pintu keberangkatan ini, ya.');
   const open=button('Tampilkan MAGIC LINK →',()=>void access());const enter=document.createElement('a');enter.className='travelPrimary gateEnterDistrict';enter.textContent='MASUK DISTRIK →';enter.hidden=true;enter.rel='noreferrer';let href:string|undefined;
   async function access(){if(disposed)return;open.disabled=true;try{if(!href){const latest=await request('/magic-link',{});if(disposed)return;if(!latest.href)throw Error('Magic link belum tersedia.');const url=new URL(latest.href,location.href);if(url.origin!==location.origin||url.searchParams.get('access')!=='1'||!/^#token=[a-f0-9]{64}$/.test(url.hash))throw Error('Magic Link tidak valid.');href=url.href;enter.href=href;enter.hidden=false;}if(onReady){onReady(href);return;}disposePopup?.();disposePopup=showMagicLinkPopup(href,guide);}catch(error){if(!disposed)message(error);}finally{open.disabled=false;}}
   const affiliate=document.createElement('a');affiliate.href='./affiliate.html';affiliate.textContent='Kode referral & komisi saya';if(onReady){open.textContent='LANJUT KE PINTU';host.append(open);void access();}else{host.append(enter,open,affiliate,back());void access();}return;
  }
  onDialogue?.(r.status==='reported'?'Pembayaran masih diperiksa admin. Setelah aktif, tiket bisa digunakan.':'Data sudah terdaftar, tetapi tiket belum lunas. Silakan selesaikan pembayaran.');
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
 void load();return ()=>{disposed=true;clearTimeout(poll);disposePopup?.();};
}
