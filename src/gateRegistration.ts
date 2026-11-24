import {readSetup,saveSetup} from './frontSettings.ts';
import {defaultSetup} from './frontModel.ts';
import {gateGuide} from './gateGuide.ts';
import {showMagicLinkPopup} from './magicAccess.ts';
type Registration={id:string;name:string;avatar:'male'|'female';program:'hajj'|'umrah';status:'pending'|'reported'|'approved';reference:string|null};
type ResponseData={ticket:{amount:number;bank:string;account:string;holder:string};registration:Registration|null;href?:string};
async function request(action='',body?:unknown):Promise<ResponseData>{
 const response=await fetch(new URL('./api/registration'+action,location.href),{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Layanan belum tersedia.');
 if(data?.ticket?.amount!==100000||typeof data.ticket.account!=='string'||data.registration&&!['pending','reported','approved'].includes(data.registration.status))throw Error('Respons pendaftaran tidak valid.');return data;
}
/** Approval always comes from the server; browser storage cannot approve a transfer. */
export function mountGateRegistration(host:HTMLElement,notice:HTMLElement,onBack:()=>void){
 let disposed=false,busy=false,poll:ReturnType<typeof setTimeout>|undefined,lastState='',watch=false,disposePopup:(()=>void)|undefined;
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
 function schedule(){clearTimeout(poll);if(watch&&!disposed)poll=setTimeout(()=>void load(false),6000);}
 async function load(force=true){if(busy||disposed){schedule();return;}if(!force&&document.hidden){schedule();return;}busy=true;if(force){status.textContent='Memeriksa pendaftaran…';notice.textContent='';}try{const data=await request();if(!disposed&&(force||lastState!==data.registration?.id+':'+data.registration?.status))paint(data);}catch(error){if(!disposed){message(error);if(force){host.replaceChildren(status);status.textContent='Pendaftaran belum tersedia.';host.append(button('Coba sambungkan lagi',()=>void load(),true),button('Coba formulir preview',preview),back());if(!['localhost','127.0.0.1'].includes(location.hostname))preview();}}}finally{busy=false;schedule();}}
 function paint(data:ResponseData){
  host.replaceChildren();notice.textContent='';const r=data.registration,guide=gateGuide(r?.avatar??readSetup()?.avatar??'male').name;lastState=r?.id+':'+r?.status;watch=!!r&&r.status!=='approved';schedule();
  const heading=document.createElement('h3');heading.textContent=r?'Pendaftaran '+r.id:'Formulir pendaftaran';host.append(heading);
  if(['localhost','127.0.0.1'].includes(location.hostname)){const test=document.createElement('p');test.className='gateTestNotice';test.textContent='Pengujian lokal — jangan transfer uang untuk mencoba alur ini.';host.append(test);}
  const price=document.createElement('p');price.textContent='Tiket petualangan · Rp100.000 / peserta. Haji 12 level atau Umroh 5 level, bus, misi, bekal, dan checkpoint.';host.append(price);
  if(!r){
   const form=document.createElement('form');form.className='gateRegistrationForm';form.innerHTML='<label>Nama peserta<input name="name" autocomplete="name" required minlength="2" maxlength="60" placeholder="Nama lengkap"></label><label>Nomor WhatsApp<input name="phone" type="tel" autocomplete="tel" inputmode="tel" pattern="(\\+?62|0)8[0-9]{7,12}" required maxlength="17" placeholder="08… atau +628…"><small>Untuk data pendaftaran. Pengiriman akses WhatsApp belum diaktifkan.</small></label><label>Perjalanan<select name="program"><option value="hajj">Haji · 12 level</option><option value="umrah">Umroh · 5 level</option></select></label><label class="gateConsent"><input name="consent" type="checkbox" required><span>Saya setuju nama dan nomor WhatsApp disimpan untuk mengurus pendaftaran dan verifikasi transfer.</span></label><p>Setelah formulir dikirim, '+guide+' akan memberikan nomor pendaftaran dan petunjuk transfer. QRIS dan kode diskon belum tersedia.</p><button type="submit" class="travelPrimary">Daftar & lihat petunjuk transfer →</button>';
   const program=form.elements.namedItem('program') as HTMLSelectElement;program.value=readSetup()?.program??'hajj';
   form.onsubmit=async e=>{e.preventDefault();if(busy||disposed)return;const input=new FormData(form),setup={...readSetup()??defaultSetup(),program:program.value==='umrah'?'umrah' as const:'hajj' as const};if(!saveSetup(setup)){notice.textContent='Pilihan perjalanan belum tersimpan. Periksa penyimpanan browser.';return;}busy=true;const submit=form.querySelector('button')!;submit.disabled=true;notice.textContent='Mengirim pendaftaran…';try{const next=await request('',{name:String(input.get('name')).trim(),phone:String(input.get('phone')).replace(/[\s-]/g,''),program:setup.program,avatar:setup.avatar,consent:input.get('consent')==='on'});if(!disposed)paint(next);}catch(error){if(!disposed)message(error);}finally{busy=false;submit.disabled=false;}};
   host.append(form,button('Coba formulir preview',preview),back());form.querySelector('input')?.focus();return;
  }
  const state=document.createElement('p');state.id='registrationStatus';state.dataset.status=r.status;state.setAttribute('role','status');state.className='gateStatus';state.textContent=r.status==='approved'?'✓ Transfer telah diverifikasi admin. Tiket aktif.':r.status==='reported'?'Transfer dilaporkan · menunggu pemeriksaan admin.':'Terdaftar · menunggu transfer.';host.append(state);
  if(r.status==='approved'){
   const open=button('Tampilkan MAGIC LINK →',()=>void access(),true);let href:string|undefined;
   async function access(){if(disposed)return;open.disabled=true;try{if(!href){const latest=await request('/magic-link',{});if(disposed)return;if(!latest.href)throw Error('Magic link belum tersedia.');href=latest.href;}disposePopup?.();disposePopup=showMagicLinkPopup(href,guide);}catch(error){if(!disposed)message(error);}finally{open.disabled=false;}}
   host.append(open,back());void access();return;
  }
  const bank=document.createElement('div');bank.className='gateBank';const label=document.createElement('span');label.textContent='Transfer manual · '+data.ticket.bank;const account=document.createElement('strong');account.textContent=data.ticket.account;const holder=document.createElement('p');holder.textContent='a.n. '+data.ticket.holder+' · Rp100.000';const copy=button('Salin nomor rekening',()=>{if(!navigator.clipboard){notice.textContent='Pilih dan salin nomor rekening di atas.';return;}void navigator.clipboard.writeText(data.ticket.account).then(()=>{notice.textContent='Nomor rekening disalin.';},()=>{notice.textContent='Pilih dan salin nomor rekening di atas.';});});bank.append(label,account,holder,copy);host.append(bank);
  const help=document.createElement('p');help.textContent='Konfirmasikan transfer ke admin dengan nomor '+r.id+', nama pengirim, nominal, waktu / referensi. Admin memeriksa mutasi lalu mengirim MAGIC LINK pribadi. Melapor transfer belum berarti pembayaran berhasil. Pengiriman WhatsApp otomatis belum aktif.';host.append(help);
  if(r.status==='pending'){
   const form=document.createElement('form');form.className='gateRegistrationForm';form.innerHTML='<label>Nama pengirim & waktu / referensi transfer<input name="reference" required minlength="4" maxlength="120" placeholder="Contoh: nama pengirim, tanggal dan jam"></label><button type="submit" class="travelPrimary">Saya sudah transfer · laporkan ke admin</button>';
   form.onsubmit=async e=>{e.preventDefault();if(busy||disposed)return;busy=true;const b=form.querySelector('button')!;b.disabled=true;notice.textContent='Mengirim laporan…';try{const next=await request('/report',{reference:new FormData(form).get('reference')});if(!disposed)paint(next);}catch(error){if(!disposed)message(error);}finally{busy=false;b.disabled=false;}};host.append(form);
  }
  host.append(button('Periksa status pembayaran',()=>void load()),back());
 }
 void load();return ()=>{disposed=true;clearTimeout(poll);disposePopup?.();};
}
