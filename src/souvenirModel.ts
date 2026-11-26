export const TICKET_PRICE=100000,COMMISSION_PERCENT=30;
export const GIFTS = [
 {
  "id": "guide",
  "title": "Pemandu",
  "x": 0,
  "z": 2,
  "zone": "lobi",
  "kind": "guide",
  "hint": "Temui pembimbing untuk menerima oleh-oleh."
 },
 {
  "id": "certificate",
  "title": "Sertifikat Haji Digital",
  "x": -12,
  "z": -6,
  "zone": "prestasi",
  "kind": "certificate",
  "hint": "Lihat dan unduh sertifikat kelulusan."
 },
 {
  "id": "medal",
  "title": "Medali Emas",
  "x": -8,
  "z": -6,
  "zone": "prestasi",
  "kind": "medal",
  "hint": "Lihat medali pencapaian 12 level."
 },
 {
  "id": "trophy",
  "title": "Piala Kelulusan",
  "x": -4,
  "z": -6,
  "zone": "prestasi",
  "kind": "trophy",
  "hint": "Lihat trofi perjalanan manasik."
 },
 {
  "id": "badge",
  "title": "Badge 12 Bintang",
  "x": -12,
  "z": -1,
  "zone": "prestasi",
  "kind": "badge",
  "hint": "Lihat emblem 12 bintang."
 },
 {
  "id": "alumni",
  "title": "Kartu Alumni",
  "x": -8,
  "z": -1,
  "zone": "prestasi",
  "kind": "card",
  "hint": "Lihat kartu alumni pribadi."
 },
 {
  "id": "graduates",
  "title": "Dinding Lulusan",
  "x": -4,
  "z": -1,
  "zone": "prestasi",
  "kind": "wall",
  "hint": "Lihat penghargaan kelulusan pribadi."
 },
 {
  "id": "photo",
  "title": "Foto Kenangan Virtual",
  "x": -12,
  "z": 4,
  "zone": "kenangan",
  "kind": "photo",
  "hint": "Kunjungi sudut foto kenangan."
 },
 {
  "id": "congrats",
  "title": "Video Ucapan Kelulusan",
  "x": -8,
  "z": 4,
  "zone": "kenangan",
  "kind": "screen",
  "hint": "Lihat ucapan selamat."
 },
 {
  "id": "replay",
  "title": "Akses Ulang Manasik",
  "x": -4,
  "z": 4,
  "zone": "kenangan",
  "kind": "card",
  "hint": "Lihat informasi akses ulang."
 },
 {
  "id": "prayers",
  "title": "Buku Saku Doa",
  "x": 4,
  "z": -6,
  "zone": "edukasi",
  "kind": "book",
  "hint": "Bacaan doa haji dan umroh."
 },
 {
  "id": "ebook",
  "title": "E-book Panduan Manasik",
  "x": 8,
  "z": -6,
  "zone": "edukasi",
  "kind": "book",
  "hint": "Panduan perjalanan manasik."
 },
 {
  "id": "checklist",
  "title": "Checklist Perlengkapan",
  "x": 12,
  "z": -6,
  "zone": "edukasi",
  "kind": "book",
  "hint": "Daftar persiapan perjalanan."
 },
 {
  "id": "planner",
  "title": "Planner Tabungan Baitullah",
  "x": 4,
  "z": -1,
  "zone": "edukasi",
  "kind": "book",
  "hint": "Rencanakan tabungan perjalanan."
 },
 {
  "id": "audio",
  "title": "Audio Doa & Talbiyah",
  "x": 8,
  "z": -1,
  "zone": "edukasi",
  "kind": "audio",
  "hint": "Dengarkan latihan bacaan."
 },
 {
  "id": "tasbih",
  "title": "Tasbih Digital",
  "x": 12,
  "z": -1,
  "zone": "edukasi",
  "kind": "tasbih",
  "hint": "Buka penghitung zikir."
 },
 {
  "id": "wallpaper",
  "title": "Wallpaper Baitullah",
  "x": 4,
  "z": 4,
  "zone": "edukasi",
  "kind": "photo",
  "hint": "Koleksi latar HP dan komputer."
 },
 {
  "id": "stickers",
  "title": "Stiker WhatsApp Islami",
  "x": 8,
  "z": 4,
  "zone": "edukasi",
  "kind": "book",
  "hint": "Koleksi stiker digital."
 },
 {
  "id": "coupon",
  "title": "Kupon & komisi 30%",
  "x": -12,
  "z": 9,
  "zone": "bisnis",
  "kind": "card",
  "hint": "Buka referral pribadi."
 },
 {
  "id": "commission",
  "title": "Komisi Affiliate 30%",
  "x": -8,
  "z": 9,
  "zone": "bisnis",
  "kind": "coins",
  "hint": "Pelajari komisi pembayaran terverifikasi."
 },
 {
  "id": "wallet",
  "title": "Dompet komisi",
  "x": 8,
  "z": 9,
  "zone": "bisnis",
  "kind": "wallet",
  "hint": "Buka dashboard affiliate."
 },
 {
  "id": "mystery",
  "title": "Mystery Gift Box",
  "x": 12,
  "z": 9,
  "zone": "bisnis",
  "kind": "gift",
  "hint": "Lihat bonus kejutan."
 },
 {
  "id": "motion",
  "title": "Bioskop Motion",
  "x": -8,
  "z": -14,
  "zone": "bioskop",
  "kind": "cinema",
  "hint": "Masuk dan tonton kelas animasi Motion."
 },
 {
  "id": "stickman",
  "title": "Bioskop Stickman",
  "x": 8,
  "z": -14,
  "zone": "bioskop",
  "kind": "cinema",
  "hint": "Masuk dan tonton kelas animasi Stickman."
 }
] as const;
export type GiftId=typeof GIFTS[number]['id'];
export const SOUVENIR_BOUNDS=[-15,15,-17,11] as const;
export function souvenirObstacles(){
 const items:{x:number;z:number;w:number;d:number}[]=GIFTS.filter(g=>g.kind!=='guide'&&g.kind!=='cinema').map(g=>({x:g.x,z:g.z-1.35,w:2.65,d:1.1}));
 // Rear theater partitions, two open doors and unobstructed central aisles.
 for(const x of [-8,8]){
  for(const dx of [-4.25,4.25])items.push({x:x+dx,z:-9.65,w:5.5,d:.35});
  for(const dx of [-6.95,6.95])items.push({x:x+dx,z:-13.85,w:.3,d:8.3});
  for(const dz of [-11.4,-12.9])for(const dx of [-3.3,3.3])items.push({x:x+dx,z:dz,w:4.3,d:.8});
 }
 return items;
}
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
