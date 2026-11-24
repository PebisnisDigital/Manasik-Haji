export const TICKET_PRICE=100000,COMMISSION_PERCENT=30;
export type GiftId='guide'|'certificate'|'coupon'|'wallet'|'motion'|'stickman';
export const GIFTS:readonly {id:GiftId;title:string;x:number;z:number;hint:string}[]=[
 {id:'guide',title:'Pemandu',x:0,z:2,hint:'Temui pembimbing untuk menerima oleh-oleh.'},
 {id:'certificate',title:'Sertifikat Haji Digital',x:-7,z:-1,hint:'Dekati bingkai sertifikat untuk membuka dan mengunduhnya.'},
 {id:'coupon',title:'Kupon & komisi 30%',x:-7,z:5,hint:'Ambil kode referral pribadimu dan lihat cara membagikannya.'},
 {id:'wallet',title:'Dompet komisi',x:7,z:5,hint:'Lihat komisi, data rekening dan alur penarikan melalui admin.'},
 {id:'motion',title:'Tas kelas Motion',x:-5,z:-6,hint:'Buka tas berisi CD kelas Belajar Animasi Motion.'},
 {id:'stickman',title:'Tas kelas Stickman',x:5,z:-6,hint:'Buka tas berisi CD kelas Belajar Animasi Stickman.'},
];
export interface BankDraft{bank:string;holder:string;account:string}
export interface SouvenirSave{version:1;owner:string;name:string;certificateId:string;coupon:string;issuedAt:string;received:boolean;bank:BankDraft|null}
const clean=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max&&!/[\u0000-\u001f\u007f]/.test(s);
export const validCoupon=(s:string)=>/^HD-[A-Z0-9]{3,12}-[A-F0-9]{8}$/.test(s);
export function bankDraft(value:unknown):BankDraft|null{const v=value as BankDraft|null;return v&&clean(v.bank,40)&&clean(v.holder,60)&&/^\d{5,30}$/.test(v.account)?{bank:v.bank.trim(),holder:v.holder.trim(),account:v.account}:null;}
export function decodeSouvenir(raw:string|null,owner:string):SouvenirSave|null{
 try{const v=JSON.parse(raw??'null');return v?.version===1&&v.owner===owner&&clean(v.name,60)&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v.certificateId)&&validCoupon(v.coupon)&&typeof v.received==='boolean'&&typeof v.issuedAt==='string'&&Number.isFinite(Date.parse(v.issuedAt))&&(v.bank===null||bankDraft(v.bank))?{version:1,owner,name:v.name,certificateId:v.certificateId,coupon:v.coupon,issuedAt:v.issuedAt,received:v.received,bank:bankDraft(v.bank)}:null;}catch{return null;}
}
export function newSouvenir(owner:string,name:string,uuid:string,issuedAt:string):SouvenirSave{
 const normalized=name.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,60)||'Petualang';
 const stem=normalized.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,12).padEnd(3,'X');
 return {version:1,owner,name:normalized,certificateId:uuid,coupon:'HD-'+stem+'-'+uuid.replaceAll('-','').slice(0,8).toUpperCase(),issuedAt,received:false,bank:null};
}
/** Integer rupiah; no browser record is authoritative for a real payout. */
export function commissionFor(paid:number){if(!Number.isSafeInteger(paid)||paid<0)throw new RangeError('Pembayaran tidak valid');return Number(BigInt(paid)*BigInt(COMMISSION_PERCENT)/100n);}
export interface DemoReferral{name:string;paid:number;status:'pending'|'verified'}
export const DEMO_REFERRALS:readonly DemoReferral[]=[{name:'Peserta contoh A',paid:100000,status:'verified'},{name:'Peserta contoh B',paid:100000,status:'verified'},{name:'Peserta contoh C',paid:100000,status:'verified'},{name:'Peserta contoh D',paid:100000,status:'pending'}];
export function demoWallet(pending=0){const earned=DEMO_REFERRALS.filter(r=>r.status==='verified').reduce((n,r)=>n+commissionFor(r.paid),0),paid=30000;if(!Number.isSafeInteger(pending)||pending<0||pending>earned-paid)throw new RangeError('Penarikan tidak valid');return {earned,paid,pending,available:earned-paid-pending};}
export const validWithdrawal=(amount:number,available:number)=>Number.isSafeInteger(amount)&&amount>0&&amount<=available;
export function courseUrl(value:string|null):string|null{if(!value)return null;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
