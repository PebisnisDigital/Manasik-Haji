import {ADMIN_WHATSAPP} from './registrationHandoff.ts';
type Withdrawal={id:string;amount:number;status:string;created_at:string;reference:string|null;note:string|null};
type Wallet={earned:number;paid:number;reserved:number;available:number;shortfall:number};
type Buyer={id:string;name:string;program:string;status:string;amount:number;commission:number;created:string};
type Referral={coupon_code?:string;member_id?:string;member_name?:string;buyers?:Buyer[];wallet?:Wallet;payout_enabled?:boolean;payout_minimum?:number;can_withdraw?:boolean;withdrawals?:Withdrawal[];code:string;requested:boolean;eligible:boolean;enabled:boolean;discount:number;commission_percent:number;referrals:number;paid_referrals:number;earned:number};
const $=(id:string)=>document.getElementById(id)!;const money=(n:number)=>'Rp'+n.toLocaleString('id-ID');
const notice=$('affiliateNotice'),form=$('editAffiliate') as HTMLFormElement,field=$('customCode') as HTMLInputElement,requestButton=$('requestAffiliate') as HTMLButtonElement,copyCode=$('copyCode') as HTMLButtonElement,copyLink=$('copyLink') as HTMLButtonElement;
const couponForm=$('editCoupon') as HTMLFormElement,couponField=$('customCoupon') as HTMLInputElement,wa=$('withdrawWhatsApp') as HTMLAnchorElement;
const withdrawForm=$('withdrawForm') as HTMLFormElement;let requestId:string|null=null;let requestPayload='';
const statusLabel:Record<string,string>={pending:'Menunggu admin',processing:'Sedang diproses',paid:'Dibayar',rejected:'Ditolak'};
async function api(op='affiliate',data:object={}){const res=await fetch('/api/registration/'+op,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await res.json();if(!res.ok||!d.affiliate)throw Error(d.error||'Buka Magic Link tiket aktif Anda terlebih dahulu.');return d.affiliate as Referral;}
async function copy(s:string){try{await navigator.clipboard.writeText(s);notice.textContent='Disalin.';}catch{notice.textContent='Salin secara manual: '+s;}}
function render(a:Referral){
 const active=a.eligible&&a.enabled,custom=!a.code.startsWith('HJ-');$('affiliateData').hidden=false;
 notice.textContent=active?'Program affiliate aktif.':a.eligible?'Program referral sedang dinonaktifkan admin.':'Affiliate belum aktif. Hubungi admin jika tiket sudah lunas.';
 $('affiliateEligibility').textContent=a.eligible?'Tiket lunas. Affiliate aktif tanpa syarat level.':'Akses affiliate belum aktif.';
 requestButton.hidden=true;form.hidden=couponForm.hidden=!active;field.value=custom?a.code:'';const coupon=a.coupon_code??a.code;couponField.value=coupon.startsWith('HJ-')?'':coupon;$('couponCode').textContent=a.eligible?coupon:'Belum aktif';
 const url=new URL(custom?'/'+a.code.toLowerCase():'/index.html?ref='+encodeURIComponent(a.code),'https://hajji.digital');
 $('affiliateCode').textContent=a.eligible?a.code:'Belum aktif';$('affiliateLink').textContent=a.eligible?url.href:'';
 copyCode.disabled=copyLink.disabled=!active;copyCode.onclick=()=>void copy(coupon);copyLink.onclick=()=>void copy(url.href);
 $('affiliateTerms').textContent='Potongan '+money(a.discount)+' · komisi '+a.commission_percent+'% dari harga tiket setelah diskon.';
 $('affiliateCount').textContent=a.referrals+' pendaftar · '+a.paid_referrals+' lunas';$('affiliateEarned').textContent=money(a.earned);
 const w=a.wallet??{earned:a.earned,paid:0,reserved:0,available:0,shortfall:0},min=a.payout_minimum??50000;
 $('walletAvailable').textContent='Saldo tersedia: '+money(w.available);
 $('walletReserved').textContent='Dalam proses: '+money(w.reserved);
 $('walletPaid').textContent='Sudah dicairkan: '+money(w.paid);
 $('walletPolicy').textContent=(a.payout_enabled?'Minimum pencairan '+money(min):'Pencairan sedang ditutup.')+' · Transfer manual oleh admin.';
 const canContact=Boolean(a.eligible&&a.payout_enabled&&w.available>0);wa.setAttribute('aria-disabled',String(!canContact));if(canContact){wa.href='https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent('Assalamualaikum Admin HAJJI.DIGITAL, saya ingin mengajukan pencairan komisi.\nNama: '+(a.member_name??'—')+'\nID: '+(a.member_id??'—')+'\nKode affiliate: '+a.code+'\nSaldo tersedia: '+money(w.available)+'\nMohon verifikasi saldo dan panduan pencairan.');}else wa.removeAttribute('href');
 const buyers=$('affiliateBuyers');buyers.replaceChildren();for(const b of a.buyers??[]){const row=document.createElement('article');row.className='affiliateBuyer';const name=document.createElement('strong');name.textContent=b.name;const detail=document.createElement('p');detail.textContent=(b.status==='approved'?'Lunas':'Belum bayar')+' · '+money(b.amount)+' · Komisi '+money(b.commission);row.append(name,detail);buyers.append(row);}if(!a.buyers?.length)buyers.textContent='Belum ada pembeli.';
 withdrawForm.hidden=!(a.can_withdraw&&a.payout_enabled&&w.available>=min);
 const amount=withdrawForm.elements.namedItem('amount') as HTMLInputElement;amount.min=String(min);amount.max=String(w.available);
 const history=$('withdrawHistory');history.replaceChildren();for(const item of a.withdrawals??[]){const p=document.createElement('p');p.textContent=money(item.amount)+' · '+(statusLabel[item.status]??item.status)+' · '+new Date(item.created_at).toLocaleDateString('id-ID')+(item.reference?' · Ref: '+item.reference:'')+(item.note?' · '+item.note:'');history.append(p);}if(!a.withdrawals?.length)history.textContent='Belum ada pencairan.';

}
async function run(op='affiliate',data:object={}){requestButton.disabled=true;const submit=form.querySelector('button')!;submit.disabled=true;const couponSubmit=couponForm.querySelector('button')!;couponSubmit.disabled=true;try{render(await api(op,data));}catch(e){notice.textContent=e instanceof Error?e.message:'Akses belum tersedia.';}finally{requestButton.disabled=false;submit.disabled=false;couponSubmit.disabled=false;}}
requestButton.onclick=()=>void run('affiliate-request');
form.onsubmit=e=>{e.preventDefault();const code=field.value.trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9-]{2,29}$/.test(code)){notice.textContent='Kode 3–30 karakter: huruf, angka, atau tanda hubung.';return;}void run('affiliate-save',{code,kind:'affiliate'});};
couponForm.onsubmit=e=>{e.preventDefault();const code=couponField.value.trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9-]{2,29}$/.test(code)){notice.textContent='Kode 3–30 karakter: huruf, angka, atau tanda hubung.';return;}void run('affiliate-save',{code,kind:'coupon'});};
withdrawForm.onsubmit=async e=>{e.preventDefault();const f=new FormData(withdrawForm);const payload={amount:Number(f.get('amount')),bank:String(f.get('bank')).trim(),holder:String(f.get('holder')).trim(),account:String(f.get('account')).trim()};if(!confirm('Ajukan pencairan '+money(payload.amount)+' ke rekening yang diisi?'))return;const serialized=JSON.stringify(payload);if(requestPayload!==serialized||!requestId){requestId=crypto.randomUUID();requestPayload=serialized;}const submit=withdrawForm.querySelector('button')!;submit.disabled=true;try{const result=await api('affiliate-withdraw',{...payload,request_id:requestId});requestId=null;requestPayload='';withdrawForm.reset();render(result);notice.textContent='Pengajuan pencairan tercatat.';}catch(e){notice.textContent=e instanceof Error?e.message:'Pengajuan belum terkonfirmasi. Coba lagi dengan data yang sama.';}finally{submit.disabled=false;}};
async function bootAffiliate(){
 if(new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window){document.body.classList.add('affiliateEmbedded');}
 const hash=new URLSearchParams(location.hash.slice(1)),token=hash.get('token');
 if(location.hash){history.replaceState(null,'',location.pathname+location.search);}
 if(token!==null||new URLSearchParams(location.search).get('access')==='1'){
  if(!token||!/^[a-f0-9]{64}$/.test(token)){notice.textContent='Magic Link affiliate tidak valid. Gunakan tautan lengkap dari admin.';return;}
  try{const res=await fetch('/api/registration/redeem',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),signal:AbortSignal.timeout(8000)});const data=await res.json();if(!res.ok||data.registration?.status!=='approved'||data.registration.access_suspended)throw Error(data.error||'Magic Link affiliate belum aktif.');history.replaceState(null,'',location.pathname);}
  catch(e){notice.textContent=e instanceof Error?e.message:'Akses affiliate gagal. Buka kembali Magic Link dari admin.';return;}
 }
 await run();
}
void bootAffiliate();
