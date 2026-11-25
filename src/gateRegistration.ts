import {readSetup,saveSetup} from './frontSettings.ts';
import {defaultSetup} from './frontModel.ts';
import {gateGuide} from './gateGuide.ts';
import {showMagicLinkPopup} from './magicAccess.ts';
type Registration={id:string;name:string;avatar:'male'|'female';program:'hajj'|'umrah';status:'pending'|'reported'|'approved';reference:string|null;amount?:number;discount?:number;coupon?:string|null;payment_method?:'qris'|'transfer'|null;access_suspended?:boolean};
type Qris={status:string;is_test:boolean;amount:number;total_amount:number|null;qr_url:string|null;payment_url:string|null;expires_at:string|null;transaction_id:string|null};
type Quote={code:string;amount:number;discount:number;commission:number};
type ResponseData={ticket:{amount:number;bank:string;account:string;holder:string;enabled?:boolean;manual_enabled?:boolean;qris_enabled?:boolean;qris_test?:boolean};qris?:Qris|null;coupon?:Quote;registration:Registration|null;href?:string};
async function request(action='',body?:unknown):Promise<ResponseData>{
 const response=await fetch(new URL('./api/registration'+action,location.href),{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(action.startsWith('/qris')?30000:8000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Layanan belum tersedia.');
 if(data?.ticket?.amount!==100000||typeof data.ticket.account!=='string'||data.registration&&!['pending','reported','approved'].includes(data.registration.status))throw Error('Respons pendaftaran tidak valid.');return data;
}
/** Approval always comes from the server; browser storage cannot approve a transfer. */
export function mountGateRegistration(host:HTMLElement,notice:HTMLElement,onBack:()=>void){
 let qrisPending=false;let disposed=false,busy=false,poll:ReturnType<typeof setTimeout>|undefined,lastState='',watch=false,disposePopup:(()=>void)|undefined;
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
 function paint(data:ResponseData){
  host.replaceChildren();notice.textContent='';const r=data.registration,guide=gateGuide(r?.avatar??readSetup()?.avatar??'male').name;lastState=stateKey(data);qrisPending=data.qris?.status==='pending';watch=!!r&&r.status!=='approved';schedule();
  const heading=document.createElement('h3');heading.textContent=r?'Pendaftaran '+r.id:'Formulir pendaftaran';host.append(heading);
  if(['localhost','127.0.0.1'].includes(location.hostname)){const test=document.createElement('p');test.className='gateTestNotice';test.textContent='Pengujian lokal — jangan transfer uang untuk mencoba alur ini.';host.append(test);}
  const price=document.createElement('p');price.textContent=r?'Tagihan Rp'+(r.amount??100000).toLocaleString('id-ID')+(r.discount?' · Diskon Rp'+r.discount.toLocaleString('id-ID'):''):'Tiket petualangan · Rp100.000';host.append(price);
  if(!r&&data.ticket.enabled===false){host.append('Pendaftaran berbayar belum dibuka. Silakan kembali setelah admin membuka metode pembayaran.',button('Periksa kembali',()=>void load()),back());return;}
  if(!r){
   heading.textContent='Daftar HAJJI.DIGITAL';price.textContent='Isi data untuk melanjutkan pendaftaran.';
   const form=document.createElement('form');form.className='gateRegistrationForm compactCheckout';
   form.innerHTML='<label>Nama<input name="name" autocomplete="name" required minlength="2" maxlength="60" placeholder="Nama lengkap"></label><label>Email<input name="email" type="email" autocomplete="email" required maxlength="150" placeholder="contoh@email.com"></label><label>WA<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required maxlength="17" placeholder="08xxxxxxxxxx"></label><label>Pilih cara bayarnya<select name="method" required><option value="" disabled selected>-- Pilih Metode Pembayaran --</option></select></label><div class="checkoutTotal"><div><small>TIKET PERJALANAN</small><span>Tiket Haji Digital · 12 level</span></div><strong id="checkoutPrice">Rp100.000</strong></div><p class="checkoutTrust">Pembayaran terverifikasi · Akses setelah lunas</p><label>Kode kupon <small>(opsional)</small><div class="checkoutCoupon"><input name="coupon" maxlength="30" placeholder="CONTOH: HJ-XXXXXXXXXXXX" autocomplete="off"><button type="button" id="applyCoupon">PAKAI</button></div></label><p id="couponStatus" aria-live="polite"></p><label class="gateConsent"><input name="consent" type="checkbox" required><span>Saya setuju data digunakan untuk pendaftaran, pembayaran dan referral.</span></label><button type="submit" class="travelPrimary">DAFTAR SEKARANG →</button>';
   const method=form.elements.namedItem('method') as HTMLSelectElement,code=form.elements.namedItem('coupon') as HTMLInputElement,apply=form.querySelector<HTMLButtonElement>('#applyCoupon')!,total=form.querySelector<HTMLElement>('#checkoutPrice')!,couponNotice=form.querySelector<HTMLElement>('#couponStatus')!;
   if(data.ticket.qris_enabled)method.add(new Option(data.ticket.qris_test?'QRIS · Sandbox':'QRIS · BuatQRIS','qris'));if(data.ticket.manual_enabled!==false)method.add(new Option('Transfer bank','transfer'));
   const setup=readSetup()??defaultSetup();form.querySelector<HTMLElement>('.checkoutTotal span')!.textContent=setup.program==='umrah'?'Tiket Umroh Digital · 5 level':'Tiket Haji Digital · 12 level';
   let quote:Quote|null=null,quoting=false;const fmt=(n:number)=>'Rp'+n.toLocaleString('id-ID');code.value=new URLSearchParams(location.search).get('ref')?.slice(0,30)??'';
   code.oninput=()=>{quote=null;total.textContent=fmt(100000);couponNotice.textContent='';};
   async function applyCode(){if(quoting||disposed)return false;const v=code.value.trim().toUpperCase();if(!v){quote=null;total.textContent=fmt(100000);couponNotice.textContent='';return true;}quoting=true;apply.disabled=true;try{const d=await request('/coupon',{code:v});if(!d.coupon||code.value.trim().toUpperCase()!==v)return false;quote=d.coupon;total.textContent=fmt(quote.amount);couponNotice.textContent='Potongan '+fmt(quote.discount)+' · kupon terpasang.';return true;}catch(e){quote=null;total.textContent=fmt(100000);couponNotice.textContent=e instanceof Error?e.message:'Kupon belum dapat diperiksa.';return false;}finally{quoting=false;apply.disabled=false;}}
   apply.onclick=()=>void applyCode();if(code.value)void applyCode();
   form.onsubmit=async e=>{e.preventDefault();if(busy||disposed||quoting)return;const submit=form.querySelector<HTMLButtonElement>('button[type=submit]')!;submit.disabled=true;busy=true;
    try{if(code.value.trim()&&!(await applyCode()))return;const input=new FormData(form);if(!saveSetup(setup))throw Error('Persiapan belum tersimpan.');notice.textContent='Mengirim pendaftaran…';const next=await request('',{name:String(input.get('name')).trim(),email:String(input.get('email')).trim(),phone:String(input.get('phone')).replace(/[\\s-]/g,''),program:setup.program,avatar:setup.avatar,consent:input.get('consent')==='on',method:method.value,coupon:quote?.code??'',expected_amount:quote?.amount??100000});if(disposed)return;paint(next);if(next.registration?.status==='pending'&&next.registration.payment_method==='qris'){try{const payment=await request('/qris-create',{});if(!disposed)paint(payment);}catch(err){if(!disposed)message(err);}}}catch(err){if(!disposed)message(err);}finally{busy=false;submit.disabled=false;schedule();}};
   host.append(form,back());form.querySelector('input')?.focus();return;
  }
  const state=document.createElement('p');state.id='registrationStatus';state.dataset.status=r.status;state.setAttribute('role','status');state.className='gateStatus';state.textContent=r.status==='approved'?'✓ Pembayaran terverifikasi. Tiket aktif.':r.status==='reported'?'Transfer dilaporkan · menunggu pemeriksaan admin.':'Terdaftar · menunggu pembayaran.';host.append(state);
  if(r.access_suspended){state.textContent='Akses member dinonaktifkan oleh admin. Hubungi admin untuk mengaktifkan kembali.';host.append(back());return;}
  if(r.status==='approved'){
   const open=button('Tampilkan MAGIC LINK →',()=>void access(),true);let href:string|undefined;
   async function access(){if(disposed)return;open.disabled=true;try{if(!href){const latest=await request('/magic-link',{});if(disposed)return;if(!latest.href)throw Error('Magic link belum tersedia.');href=latest.href;}disposePopup?.();disposePopup=showMagicLinkPopup(href,guide);}catch(error){if(!disposed)message(error);}finally{open.disabled=false;}}
   const affiliate=document.createElement('a');affiliate.href='./affiliate.html';affiliate.textContent='Kode referral & komisi saya';host.append(open,affiliate,back());void access();return;
  }
  if(r.status==='pending'&&r.payment_method!=='transfer'&&(data.ticket.qris_enabled||data.qris)){
   const q=data.qris,box=document.createElement('div');box.className='gateBank';const title=document.createElement('strong');title.textContent='QRIS · BuatQRIS';box.append(title);
   const msg=document.createElement('p');msg.textContent=(q?.is_test??data.ticket.qris_test)?'SANDBOX · Tidak menggunakan uang asli dan tidak membuka tiket berbayar.':'Scan QRIS dengan aplikasi bank atau dompet digital. Tiket aktif otomatis setelah pembayaran terverifikasi.';box.append(msg);
   if(q?.status==='pending'){const amt=document.createElement('strong');amt.textContent='Total bayar: Rp'+(q.total_amount??q.amount).toLocaleString('id-ID');box.append(amt);if(q.qr_url){const img=document.createElement('img');img.src=q.qr_url;img.alt='QRIS pembayaran tiket';img.style.cssText='width:min(240px,100%);display:block;margin:12px auto;background:white;padding:10px;border-radius:8px';box.append(img);}if(q.payment_url){const a=document.createElement('a');a.href=q.payment_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Buka halaman pembayaran';box.append(a);}if(q.expires_at){const p=document.createElement('p');p.textContent='Berlaku hingga '+new Date(q.expires_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB';box.append(p);}}
   async function pay(action:string){if(disposed||busy)return;busy=true;notice.textContent='Memeriksa QRIS…';try{const next=await request(action,{});if(!disposed)paint(next);}catch(e){if(!disposed)message(e);}finally{busy=false;schedule();}}
   if(q?.status==='pending')box.append(button('CEK PEMBAYARAN',()=>void pay('/qris-check'),true));
   else if(q?.status==='creating')box.append('QRIS sedang diproses. Jika terus tertunda hubungi admin, jangan bayar ulang.',button('Periksa kembali',()=>void load()));
   else if(q?.status==='success'&&q.is_test)box.append('Uji pembayaran berhasil. Tiket berbayar belum aktif.',button('Buat QRIS baru',()=>void pay('/qris-create')));
   else if(data.ticket.qris_enabled)box.append(button('BAYAR VIA QRIS',()=>void pay('/qris-create'),true));
   host.append(box);
   if(q?.status==='pending'||q?.status==='creating'||(data.ticket.manual_enabled===false||r.payment_method==='qris')){host.append(back());return;}
  }
  if(data.ticket.manual_enabled===false||r.payment_method==='qris'){host.append(button('Periksa kembali',()=>void load()),back());return;}
  const bank=document.createElement('div');bank.className='gateBank';const label=document.createElement('span');label.textContent='Transfer manual · '+data.ticket.bank;const account=document.createElement('strong');account.textContent=data.ticket.account;const holder=document.createElement('p');holder.textContent='a.n. '+data.ticket.holder+' · Rp'+(r.amount??100000).toLocaleString('id-ID');const copy=button('Salin nomor rekening',()=>{if(!navigator.clipboard){notice.textContent='Pilih dan salin nomor rekening di atas.';return;}void navigator.clipboard.writeText(data.ticket.account).then(()=>{notice.textContent='Nomor rekening disalin.';},()=>{notice.textContent='Pilih dan salin nomor rekening di atas.';});});bank.append(label,account,holder,copy);host.append(bank);
  const help=document.createElement('p');help.textContent='Konfirmasikan transfer ke admin dengan nomor '+r.id+', nama pengirim, nominal, waktu / referensi. Admin memeriksa mutasi lalu mengirim MAGIC LINK pribadi. Melapor transfer belum berarti pembayaran berhasil. Pengiriman WhatsApp otomatis belum aktif.';host.append(help);
  if(r.status==='pending'){
   const form=document.createElement('form');form.className='gateRegistrationForm';form.innerHTML='<label>Nama pengirim & waktu / referensi transfer<input name="reference" required minlength="4" maxlength="120" placeholder="Contoh: nama pengirim, tanggal dan jam"></label><button type="submit" class="travelPrimary">Saya sudah transfer · laporkan ke admin</button>';
   form.onsubmit=async e=>{e.preventDefault();if(busy||disposed)return;busy=true;const b=form.querySelector('button')!;b.disabled=true;notice.textContent='Mengirim laporan…';try{const next=await request('/report',{reference:new FormData(form).get('reference')});if(!disposed)paint(next);}catch(error){if(!disposed)message(error);}finally{busy=false;b.disabled=false;}};host.append(form);
  }
  host.append(button('Periksa status pembayaran',()=>void load()),back());
 }
 void load();return ()=>{disposed=true;clearTimeout(poll);disposePopup?.();};
}
