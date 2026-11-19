export type Speaker='Ibu'|'Ayah'|'Kamu'|'Pemandu';
export type Line={speaker:Speaker;text:string};
export type Lesson={title:string;body:string;lines:Line[]};
export const LESSONS:Lesson[][]=[
 [
 {title:'Impian ke Baitullah',body:'Awali perjalanan dengan niat yang baik, dukungan keluarga, dan persiapan yang matang.',lines:[{speaker:'Ibu',text:'Kamu lagi kepikiran apa, Nak?'},{speaker:'Kamu',text:'Aku pengin sekali ke Baitullah, Bu.'},{speaker:'Ibu',text:'Masya Allah. Yuk, kita belajar dan persiapkan pelan-pelan.'}]},
 {title:'Mengenal Baitullah',body:'Ka’bah di Masjidil Haram adalah kiblat umat Islam. Tawaf dilakukan dengan mengelilingi Ka’bah sesuai tuntunan.',lines:[{speaker:'Kamu',text:'Itu Ka’bah ya, Yah?'},{speaker:'Ayah',text:'Iya. Nanti kita belajar cara tawaf yang benar bersama pembimbing.'}]},
 {title:'Siapkan perjalanan',body:'Sebelum berangkat, pelajari manasik, siapkan kesehatan dan dokumen, serta pilih jalur perjalanan yang resmi.',lines:[{speaker:'Ayah',text:'Kalau mau berangkat, jangan terburu-buru. Persiapkan semuanya dulu.'},{speaker:'Kamu',text:'Baik, Yah. Aku siap belajar.'}]}
 ],
 [
 {title:'Niat dan doa',body:'Persiapkan hati untuk beribadah kepada Allah. Niat ihram umroh atau haji dipelajari pada tahap miqat sesuai perjalanan.',lines:[{speaker:'Kamu',text:'Ya Allah, mudahkanlah persiapanku dan bimbing aku dalam beribadah.'},{speaker:'Pemandu',text:'Mulailah belajar dengan niat yang baik dan doa.'}]},
 {title:'Bekal ilmu',body:'Pahami urutan ibadah, jaga kesehatan, dan ikuti arahan pembimbing. Bertanyalah bila ada yang belum dipahami.',lines:[{speaker:'Kamu',text:'Ternyata banyak hal yang harus aku pelajari.'},{speaker:'Pemandu',text:'Betul. Catat hal penting dan tanyakan kepada pembimbing manasik.'}]},
 {title:'Siap melangkah',body:'Cari informasi dari penyelenggara yang resmi dan sesuai jenis perjalanan. Pendaftaran nyata tidak diperlukan untuk bermain.',lines:[{speaker:'Kamu',text:'Bu, Yah, aku sudah siap belajar lebih jauh.'},{speaker:'Ibu',text:'Alhamdulillah. Semoga persiapanmu dimudahkan.'},{speaker:'Ayah',text:'Selanjutnya kita kenali cara memilih penyelenggara perjalanan.'}]}
 ]
];

export type Npc='Ibu'|'Ayah';
/** Casual encounters are independent of the active coin. They do not award points. */
export function npcChat(level:1|2,quest:number,npc:Npc):Line[]{
 if(npc==='Ibu'){
  if(level===1&&quest===0)return [{speaker:'Ibu',text:'Kamu lagi kepikiran apa, Nak?'},{speaker:'Kamu',text:'Aku pengin sekali ke Baitullah, Bu.'},{speaker:'Ibu',text:'Masya Allah. Kita persiapkan pelan-pelan, ya.'}];
  if(level===1)return [{speaker:'Ibu',text:'Sudah lihat tayangan Baitullah tadi?'},{speaker:'Kamu',text:'Iya, Bu. Aku jadi makin ingin belajar.'},{speaker:'Ibu',text:'Semoga Allah mudahkan persiapanmu.'}];
  return [{speaker:'Ibu',text:'Sudah siap belajar manasik, Nak?'},{speaker:'Kamu',text:'Insya Allah, Bu. Aku mau belajar dulu.'},{speaker:'Ibu',text:'Bagus. Jangan lupa berdoa dan jaga kesehatan, ya.'}];
 }
 if(level===1)return [{speaker:'Ayah',text:'Kalau ingin berangkat, kita siapkan ilmu dan dokumennya dulu.'},{speaker:'Kamu',text:'Siap, Yah. Aku mau belajar tahap demi tahap.'},{speaker:'Ayah',text:'Nah, begitu. Pelan-pelan saja.'}];
 return [{speaker:'Ayah',text:'Ada yang belum kamu pahami soal persiapan?'},{speaker:'Kamu',text:'Nanti aku tanya pembimbing manasik, Yah.'},{speaker:'Ayah',text:'Bagus. Cari penyelenggara resmi dan belajar dengan baik.'}];
}
