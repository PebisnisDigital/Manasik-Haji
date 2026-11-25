export const ADMIN_WHATSAPP='62881022445869';
type ManualTicket={id:string;name:string;email?:string|null;phone?:string|null;program:'hajj'|'umrah';amount?:number;discount?:number;coupon?:string|null;status:string;reference?:string|null};
type Bank={bank:string;account:string;holder:string};
export function manualRegistrationMessage(r:ManualTicket,b:Bank){
 const rupiah=(n:number)=>'Rp'+n.toLocaleString('id-ID');
 return ['Assalamualaikum Admin HAJJI.DIGITAL,','Saya sudah mendaftar dan memilih transfer bank.','','*DATA PENDAFTARAN*','ID: '+r.id,'Nama: '+r.name,'Email: '+(r.email||'—'),'WA: '+(r.phone||'—'),'Program: '+(r.program==='hajj'?'Haji Digital (12 level)':'Umroh Digital (5 level)'),'Pembayaran: '+b.bank,'Rekening: '+b.account+' (a.n. '+b.holder+')','Kupon: '+(r.coupon||'—'),'Diskon: '+rupiah(r.discount??0),'*Total bayar: '+rupiah(r.amount??100000)+'*','Status: '+(r.status==='reported'?'Transfer dilaporkan, belum diverifikasi':'Menunggu verifikasi pembayaran'),...(r.reference?['Referensi transfer: '+r.reference]:[]),'','Mohon panduan konfirmasi pembayaran. Bukti transfer akan saya kirim setelah pembayaran.'].join('\n');
}
export function manualWhatsAppUrl(r:ManualTicket,b:Bank){return 'https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent(manualRegistrationMessage(r,b));}
