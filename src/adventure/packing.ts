import type {Avatar} from './state.ts';
export interface PackItem{label:string;hint:string;color:number}
export function packingItems(quest:number,avatar:Avatar):PackItem[]{
 if(quest===0)return [
 {label:avatar==='male'?'Kain ihram':'Pakaian ibadah yang menutup aurat',hint:avatar==='male'?'Siapkan dua helai kain ihram untuk laki-laki.':'Tidak ada warna khusus yang wajib bagi perempuan.',color:0xf3eee4},
 {label:'Pakaian ganti',hint:'Pilih pakaian nyaman sesuai cuaca dan kebutuhan.',color:0x6c9b97},
 {label:avatar==='female'?'Mukena / perlengkapan salat':'Perlengkapan salat',hint:'Sesuaikan dengan kebutuhan pribadi.',color:0xbda7c3}];
 if(quest===1)return [
 {label:'Perlengkapan kebersihan',hint:'Siapkan produk sesuai kebutuhan dan ketentuan saat ihram.',color:0x79a9c0},
 {label:'Alas kaki yang sesuai',hint:'Pilih yang nyaman; perhatikan aturan alas kaki saat ihram.',color:0xad8459},
 {label:'Perlengkapan pribadi',hint:'Handuk kecil dan kebutuhan pribadi secukupnya.',color:0x96aa78}];
 if(quest===2)return [
 {label:'Map dokumen',hint:'Paspor, izin, tiket, dan identitas tetap mudah dijangkau.',color:0x477b65},
 {label:'Obat rutin',hint:'Simpan obat berlabel sesuai resep dan aturan maskapai.',color:0xe4e5db},
 {label:'Label dan kontak darurat',hint:'Pasang identitas koper yang aman; simpan kontak pembimbing.',color:0xe6b75b}];
 return [];
}
export function addPacked(previous:readonly number[],index:number,count:number):number[]{if(!Number.isInteger(index)||index<0||index>=count||previous.includes(index))return [...previous];return [...previous,index];}
