export const ADMIN_WHATSAPP='62881022445869';
type ManualTicket={id:string;name:string;email?:string|null;phone?:string|null;program:'hajj'|'umrah';amount?:number;discount?:number;coupon?:string|null;status:string;reference?:string|null};
type Bank={bank:string;account:string;holder:string};
export function manualRegistrationMessage(r:ManualTicket,b:Bank){
 const rupiah=(n:number)=>'Rp'+n.toLocaleString('id-ID');
 return ['Assalamualaikum Admin HAJJI.DIGITAL,','Saya sudah mendaftar dan memilih transfer bank.','','*DATA PENDAFTARAN*','ID: '+r.id,'Nama: '+r.name,'Email: '+(r.email||'—'),'WA: '+(r.phone||'—'),'Program: '+(r.program==='hajj'?'Haji Digital (12 level)':'Umroh Digital (5 level)'),'Pembayaran: '+b.bank,'Rekening: '+b.account+' (a.n. '+b.holder+')','Kupon: '+(r.coupon||'—'),'Diskon: '+rupiah(r.discount??0),'*Total bayar: '+rupiah(r.amount??100000)+'*','Status: '+(r.status==='reported'?'Transfer dilaporkan, belum diverifikasi':'Menunggu verifikasi pembayaran'),...(r.reference?['Referensi transfer: '+r.reference]:[]),'','Mohon panduan konfirmasi pembayaran. Bukti transfer akan saya kirim setelah pembayaran.'].join('\n');
}
export function manualWhatsAppUrl(r:ManualTicket,b:Bank){return 'https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent(manualRegistrationMessage(r,b));}

export function manualConfirmationUrl(r:ManualTicket,b:Bank){
 const message=manualRegistrationMessage(r,b).replace('Saya sudah mendaftar dan memilih transfer bank.','Saya ingin mengonfirmasi pembayaran transfer tiket HAJJI.DIGITAL.').replace('Mohon panduan konfirmasi pembayaran. Bukti transfer akan saya kirim setelah pembayaran.','Mohon periksa pembayaran saya. Saya akan melampirkan foto atau screenshot bukti transfer di chat ini.');
 return 'https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent(message);
}
export function registrationSummary(r:ManualTicket){
 const rupiah=(n:number)=>'Rp'+n.toLocaleString('id-ID');
 return [['ID pendaftaran',r.id],['Nama',r.name],['Email',r.email||'—'],['WhatsApp',r.phone||'—'],['Program',r.program==='hajj'?'Haji Digital · 12 level':'Umroh Digital · 5 level'],['Kode kupon',r.coupon||'—'],['Harga tiket',rupiah((r.amount??100000)+(r.discount??0))],['Potongan',rupiah(r.discount??0)]] as const;
}
