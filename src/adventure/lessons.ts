export type Npc='Ibu'|'Ayah';
export type Speaker=Npc|'Kamu';
export type Line={speaker:Speaker;text:string};
export type Choice={text:string;correct:boolean};
export type Lesson={title:string;body:string;lines:Line[];npc?:Npc;question?:string;choices?:Choice[]};
export const LESSONS:Lesson[][]=[
 [ 
 {title:'Doa dan restu orang tua',body:'Memohon doa dan restu orang tua adalah adab berbakti serta bentuk menghormati keluarga. Ini bukan rukun atau syarat sah haji dan umroh. Jika orang tua sudah wafat, doakan mereka.',npc:'Ibu',lines:[{speaker:'Kamu',text:'Bu, aku ingin ke Baitullah. Mohon doa dan restunya, ya.'},{speaker:'Ibu',text:'Ibu doakan. Semoga Allah mudahkan perjalananmu, jaga kesehatanmu, dan terima ibadahmu.'},{speaker:'Kamu',text:'Aamiin. Terima kasih, Bu.'}]},
 {title:'Tanggung jawab keluarga',body:'Sebelum berangkat, bicarakan kebutuhan keluarga yang ditinggalkan, pengasuhan, nafkah dan kewajiban lain. Siapkan rencana yang tidak menelantarkan tanggungan.',npc:'Ayah',lines:[{speaker:'Kamu',text:'Yah, apa yang harus aku siapkan sebelum pergi?'},{speaker:'Ayah',text:'Pastikan kebutuhan keluarga dan kewajibanmu tetap terpenuhi selama perjalanan.'},{speaker:'Kamu',text:'Baik, Yah. Aku akan siapkan semuanya.'}]},
 {title:'Perencanaan biaya',body:'Rencanakan biaya perjalanan, perlengkapan, kebutuhan selama di Tanah Suci, dana cadangan, dan kebutuhan keluarga. Jangan sampai mengabaikan kewajiban yang harus dipenuhi.',lines:[],question:'Apa yang perlu masuk rencana biaya?',choices:[{text:'Biaya paket saja',correct:false},{text:'Biaya perjalanan, cadangan, dan kebutuhan keluarga',correct:true},{text:'Oleh-oleh sebanyak mungkin',correct:false}]}
 ],
 [
 {title:'Meluruskan niat',body:'Haji dan umroh dilaksanakan untuk beribadah kepada Allah. Niat persiapan dari rumah berbeda dengan niat masuk ihram yang dipelajari pada tahap miqat sesuai rute.',lines:[],question:'Apa tujuan utama perjalanan ini?',choices:[{text:'Agar terlihat hebat',correct:false},{text:'Beribadah kepada Allah',correct:true},{text:'Sekadar berwisata',correct:false}]},
 {title:'Kesiapan kesehatan',body:'Mulai menjaga kebugaran dan konsultasikan kondisi kesehatan kepada tenaga kesehatan. Pemeriksaan dan persyaratan resmi mengikuti jenis perjalanan dan aturan yang berlaku.',lines:[],question:'Bagaimana mempersiapkan kesehatan?',choices:[{text:'Latihan sesuai kemampuan dan konsultasi kesehatan',correct:true},{text:'Abaikan kondisi kesehatan sampai berangkat',correct:false},{text:'Minum obat orang lain',correct:false}]},
 {title:'Jalur pendaftaran resmi',body:'Umroh melalui PPIU berizin jika menggunakan travel; haji reguler mengikuti jalur resmi pemerintah, sedangkan haji khusus melalui PIHK berizin. Periksa legalitas sebelum membayar.',lines:[],question:'Jalur yang aman untuk mendaftar?',choices:[{text:'Akun promosi tanpa identitas jelas',correct:false},{text:'Siapa pun yang menawarkan harga murah',correct:false},{text:'Jalur pemerintah atau penyelenggara berizin sesuai jenis ibadah',correct:true}]}
 ]
];
export function npcChat(level:1|2,quest:number,npc:Npc):Line[]{
 if(npc==='Ibu')return [{speaker:'Ibu',text:level===1&&quest===0?'Ada yang ingin kamu bicarakan, Nak?':'Semoga persiapanmu lancar, Nak.'},{speaker:'Kamu',text:'Aamiin, Bu.'}];
 return [{speaker:'Ayah',text:'Siapkan perjalanan baik-baik, ya.'},{speaker:'Kamu',text:'Siap, Yah.'}];
}
