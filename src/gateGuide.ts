import type {Avatar} from './coreProgress.ts';
/** Character choice controls the guide, independently of Haji/Umroh. */
export function gateGuide(avatar:Avatar){return avatar==='female'?{name:'Bu Salma',slot:'umrah' as const}:{name:'Pak Husen',slot:'hajj' as const};}

export const gateGreeting=(avatar:Avatar)=>avatar==='female'?'Ukhti':'Akhi';

/** A guide may route an existing invoice, never create a new one. */
export function guideLookupAction(lookup:string|undefined,registration:{status:string;access_suspended?:boolean}|null){
 if(lookup==='suspended'||registration?.access_suspended)return 'suspended';
 if(lookup==='review')return 'review';
 if(lookup==='new'&&!registration)return 'queue';
 if(lookup==='verified'&&registration?.status==='approved')return 'enter';
 if(lookup==='verified'&&(registration?.status==='pending'||registration?.status==='reported'))return 'invoice';
 return 'error';
}

/** Short, sequential guide introduction, shown before any identity lookup. */
export function gateIntroduction(avatar:Avatar):readonly string[]{
 const sapaan=gateGreeting(avatar);
 return [
  'Assalamualaikum, '+sapaan+'! Selamat datang di HAJJI.DIGITAL. Di sini kita belajar manasik melalui petualangan 3D, sebagai latihan sebelum berangkat ke Tanah Suci.',
  'Ada dua program. Manasik Haji dengan 12 level dan Manasik Umroh dengan 5 level. Pilih perjalanan yang ingin '+sapaan+' pelajari.',
  'Di setiap perjalanan, ada pemandu, latihan urutan ibadah, doa dan misi interaktif. Jadi bukan sekadar membaca materi, tetapi ikut mempraktikkannya dalam simulasi.',
  'Khusus Haji, kumpulkan 12 bintang untuk membuka Gedung Oleh-Oleh. Ada 23 pajangan hadiah dan benefit, termasuk sertifikat simulasi, piala, medali dan kartu alumni.',
  'Ada juga bekal ibadah seperti buku doa, e-book, audio talbiyah, checklist, planner, serta dua bioskop kelas Animasi Motion dan Stickman. Sebagian materi masih disiapkan.',
  'Alumni yang telah diverifikasi juga bisa membuat link affiliate dan kode kupon sendiri, serta memperoleh komisi dari pendaftaran yang lunas sesuai ketentuan program.',
  'Sekarang saya cek nama, email dan WhatsApp '+sapaan+', ya. Kalau sudah lunas, langsung masuk lewat pintu. Kalau belum lunas, saya tampilkan tagihan. Kalau belum daftar, silakan antre.'
 ];
}
