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
