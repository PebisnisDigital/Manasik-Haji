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
 function schedule(){clearTimeout(poll);if(watch&&!disposed)poll=setTimeout(()=>void load(false),6000);}
 async function load(force=true){if(busy||disposed){schedule();return;}if(!force&&document.hidden){schedule();return;}busy=true;if(force){status.textContent='Memeriksa pendaftaran…';notice.textContent='';}try{const data=await request();if(!disposed&&(force||lastState!==data.registration?.id+':'+data.registration?.status))paint(data);}catch(error){if(!disposed){message(error);if(force){host.replaceChildren(status);status.textContent='Pendaftaran belum tersedia.';host.append(button('Coba sambungkan lagi',()=>void load(),true),back());}}}finally{busy=false;schedule();}}
 function paint(data:ResponseData){
  host.replaceChildren();notice.textContent='';const r=data.registration,guide=gateGuide(r?.avatar??readSetup()?.avatar??'male').name;lastState=r?.id+':'+r?.status;watch=!!r&&r.status!=='approved';schedule();
  const heading=document.createElement('h3');heading.textContent=r?'Pendaftaran '+r.id:'Formulir pendaftaran';host.append(heading);
  if(['localhost','127.0.0.1'].includes(location.hostname)){const test=document.createElement('p');test.className='gateTestNotice';test.textContent='Pengujian lokal — jangan transfer uang untuk mencoba alur ini.';host.append(test);}
  const price=document.createElement('p');price.textContent='Tiket petualangan · Rp100.000 / peserta. Haji 12 level atau Umroh 5 level, bus, misi, bekal, dan checkpoint.';host.append(price);
  if(!r){
   const form=document.createElement('form');form.className='gateRegistrationForm';form.innerHTML='<label>Nama peserta<input name="name" autocomplete="name" required minlength="2" maxlength="60" placeholder="Nama lengkap"></label><label>Nomor WhatsApp<input name="phone" type="tel" autocomplete="tel" inputmode="tel" pattern="(\\+?62|0)8[0-9]{7,12}" required maxlength="17" placeholder="08… atau +628…"><small>Untuk data pendaftaran. Pengiriman akses WhatsApp belum diaktifkan.</small></label><label>Perjalanan<select name="program"><option value="hajj">Haji · 12 level</option><option value="umrah">Umroh · 5 level</option></select></label><label class="gateConsent"><input name="consent" type="checkbox" required><span>Saya setuju nama dan nomor WhatsApp disimpan untuk mengurus pendaftaran dan verifikasi transfer.</span></label><p>Setelah formulir dikirim, '+guide+' akan memberikan nomor pendaftaran dan petunjuk transfer. QRIS dan kode diskon belum tersedia.</p><button type="submit" class="travelPrimary">Daftar & lihat petunjuk transfer →</button>';
   const program=form.elements.namedItem('program') as HTMLSelectElement;program.value=readSetup()?.program??'hajj';
   form.onsubmit=async e=>{e.preventDefault();if(busy||disposed)return;const input=new FormData(form),setup={...readSetup()??defaultSetup(),program:program.value==='umrah'?'umrah' as const:'hajj' as const};if(!saveSetup(setup)){notice.textContent='Pilihan perjalanan belum tersimpan. Periksa penyimpanan browser.';return;}busy=true;const submit=form.querySelector('button')!;submit.disabled=true;notice.textContent='Mengirim pendaftaran…';try{const next=await request('',{name:String(input.get('name')).trim(),phone:String(input.get('phone')).replace(/[\s-]/g,''),program:setup.program,avatar:setup.avatar,consent:input.get('consent')==='on'});if(!disposed)paint(next);}catch(error){if(!disposed)message(error);}finally{busy=false;submit.disabled=false;}};
   host.append(form,back());form.querySelector('input')?.focus();return;
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
