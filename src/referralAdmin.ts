import {rest} from './commercialApi.ts';
type Wallet={earned:number;paid:number;reserved:number;available:number;shortfall:number};
type Member={id:string;name:string;email:string|null;phone:string|null;code:string|null;active:boolean;requested_at:string;referrals:number;paid_referrals:number;earned:number;wallet:Wallet};
type Withdrawal={id:string;registration_id:string;name:string;amount:number;bank:string;holder:string;account:string;status:string;created_at:string;reference:string|null;note:string|null;mine:boolean};
type Config={members?:Member[];withdrawals?:Withdrawal[];enabled:boolean;discount:number;commission_percent:number;paid_referrals:number;earned:number;payout_enabled?:boolean;payout_minimum?:number};
const rpc=(op:string,data:object={})=>rest<Config>('rpc/hajji_referral_admin',{auth:true,method:'POST',body:{op,data}});
const money=(v:number)=>'Rp'+v.toLocaleString('id-ID');
const status:Record<string,string>={pending:'Menunggu',processing:'Diproses',paid:'Dibayar',rejected:'Ditolak'};
function node<K extends keyof HTMLElementTagNameMap>(tag:K,text=''){const el=document.createElement(tag);el.textContent=text;return el;}
export function mountReferralAdmin(){
 const f=document.getElementById('referralSettings') as HTMLFormElement,n=document.getElementById('referralNotice')!,t=document.getElementById('referralTotals')!;
 const settings=document.createElement('fieldset');settings.innerHTML='<legend>Pengaturan pencairan</legend><label><input type="checkbox" name="payout_enabled"> Buka pengajuan pencairan</label><label>Minimum pencairan (Rp)<input type="number" name="payout_minimum" min="1000" max="100000000" step="1" required value="50000"></label><p class="muted">Transfer manual. Saldo pengajuan dicadangkan hingga selesai atau ditolak.</p>';f.insertBefore(settings,f.querySelector('button'));
 const list=node('div'),payout=node('div');list.className=payout.className='panel';f.after(list,payout);
 let active=false,epoch=0;const field=(name:string)=>f.elements.namedItem(name) as HTMLInputElement;
 function action(label:string,op:string,data:()=>object|null){const b=node('button',label);b.type='button';b.onclick=async()=>{if(!active)return;const value=data();if(!value)return;const ep=epoch;b.disabled=true;try{const next=await rpc(op,value);if(active&&ep===epoch)render(next);}catch(e){if(active&&ep===epoch)n.textContent=e instanceof Error?e.message:'Gagal menyimpan.';b.disabled=false;}};return b;}
 function render(c:Config){
  list.replaceChildren(node('h3','Data affiliate alumni'));payout.replaceChildren(node('h3','Pencairan komisi'));
  const members=c.members??[],withdrawals=c.withdrawals??[];
  list.append(node('p',members.length+' affiliate · '+members.filter(m=>m.active).length+' aktif'));
  for(const m of members){
   const row=node('div');row.style.cssText='padding:12px 0;border-bottom:1px solid #aaa5';
   row.append(node('strong',m.name+' · '+(m.code??m.id)),node('p',[m.email,m.phone].filter(Boolean).join(' · ')),node('p',(m.active?'Aktif':'Belum aktif / menunggu verifikasi')+' · '+(m.referrals??0)+' referral · '+m.paid_referrals+' lunas'));
   if(m.wallet){row.append(node('p','Komisi '+money(m.wallet.earned)+' · Tersedia '+money(m.wallet.available)+' · Ditahan '+money(m.wallet.reserved)+' · Dibayar '+money(m.wallet.paid)));if(m.wallet.shortfall>0)row.append(node('p','Perlu rekonsiliasi '+money(m.wallet.shortfall)));}
   row.append(action(m.active?'Nonaktifkan':'Verifikasi & aktifkan',m.active?'disable':'approve',()=>confirm(m.active?'Nonaktifkan affiliate ini?':'Pastikan peserta telah lulus 12 level sebelum mengaktifkan affiliate. Lanjut?')?{id:m.id}:null));list.append(row);
  }
  if(!members.length)list.append(node('p','Belum ada pengajuan alumni.'));
  const reserved=withdrawals.filter(w=>w.status==='pending'||w.status==='processing').reduce((s,w)=>s+w.amount,0),paid=withdrawals.filter(w=>w.status==='paid').reduce((s,w)=>s+w.amount,0);
  payout.append(node('p','Menunggu / diproses: '+money(reserved)+' · Sudah dibayar: '+money(paid)));
  for(const w of withdrawals){
   const row=node('div');row.style.cssText='padding:12px 0;border-bottom:1px solid #aaa5';
   row.append(node('strong',w.name+' · '+money(w.amount)),node('p',(status[w.status]??w.status)+' · '+new Date(w.created_at).toLocaleString('id-ID')),node('p',w.bank+' · '+w.holder+' · '+w.account));
   if(w.reference)row.append(node('p','Referensi: '+w.reference));if(w.note)row.append(node('p','Catatan: '+w.note));
   if(w.status==='pending')row.append(action('Mulai proses','payout-process',()=>confirm('Ambil pengajuan ini untuk diproses? Belum ada transfer otomatis.')?{id:w.id}:null));
   if(w.status==='processing'&&w.mine)row.append(action('Tandai sudah dibayar','payout-paid',()=>{const reference=prompt('Masukkan referensi transfer yang sudah berhasil (bukan rencana transfer).');return reference&&confirm('Konfirmasi: '+money(w.amount)+' benar-benar telah ditransfer ke rekening ini?')?{id:w.id,reference}:null;}));
   if(w.status==='pending'||(w.status==='processing'&&w.mine))row.append(action('Tolak pengajuan','payout-reject',()=>{const note=prompt('Alasan penolakan. Pastikan belum ada transfer uang.');return note&&confirm('Tolak dan kembalikan saldo yang dicadangkan?')?{id:w.id,note}:null;}));
   if(w.status==='processing'&&!w.mine)row.append(node('p','Sedang ditangani admin lain.'));
   payout.append(row);
  }
  if(!withdrawals.length)payout.append(node('p','Belum ada permintaan pencairan.'));
  field('enabled').checked=c.enabled;field('discount').value=String(c.discount);field('commission_percent').value=String(c.commission_percent);field('payout_enabled').checked=!!c.payout_enabled;field('payout_minimum').value=String(c.payout_minimum??50000);
  n.textContent=c.enabled?'Kupon referral aktif.':'Kupon belum aktif. Tentukan potongan dan komisi, lalu aktifkan.';t.textContent=c.paid_referrals+' referral lunas · '+money(c.earned)+' komisi tercatat.';
 }
 f.onsubmit=async e=>{e.preventDefault();if(!active)return;const ep=epoch,b=f.querySelector('button')!;b.disabled=true;try{const c=await rpc('save',{enabled:field('enabled').checked,discount:Number(field('discount').value),commission_percent:Number(field('commission_percent').value),payout_enabled:field('payout_enabled').checked,payout_minimum:Number(field('payout_minimum').value)});if(active&&ep===epoch)render(c);}catch(e){if(active&&ep===epoch)n.textContent=e instanceof Error?e.message:'Gagal menyimpan.';}finally{b.disabled=false;}};
 return {async start(){active=true;const ep=++epoch;try{const c=await rpc('get');if(active&&ep===epoch)render(c);}catch{if(active&&ep===epoch)n.textContent='Pengaturan referral belum tersedia.';}},stop(){active=false;epoch++;f.reset();list.replaceChildren();payout.replaceChildren();n.textContent=t.textContent='';}};
}
