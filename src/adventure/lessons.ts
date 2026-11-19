import type {PlayableLevel,Campaign} from './state.ts';
export type Npc='Ibu'|'Ayah'|'Resepsionis'|'Konsultan'|'Admin'|'Petugas Paspor'|'Petugas Visa'|'Petugas Berkas';
export type Speaker=Npc|'Kamu';
export type Line={speaker:Speaker;text:string};
export type Lesson={title:string;body:string;points:string[];note?:string;lines:Line[];npc?:Npc};
export const LESSONS:Lesson[][]=[
  [
    {
      "title": "Doa dan restu orang tua",
      "body": "Mintalah doa orang tua dengan lembut sebelum berangkat.",
      "points": [
        "Sampaikan niat perjalanan dan mintalah doa.",
        "Jika orang tua sudah wafat, doakan mereka."
      ],
      "note": "Ini adab berbakti, bukan rukun atau syarat sah haji dan umroh.",
      "npc": "Ibu",
      "lines": [
        {
          "speaker": "Kamu",
          "text": "Bu, aku ingin ke Baitullah. Mohon doa dan restunya, ya."
        },
        {
          "speaker": "Ibu",
          "text": "Ibu doakan. Semoga Allah mudahkan perjalananmu, jaga kesehatanmu, dan terima ibadahmu."
        },
        {
          "speaker": "Kamu",
          "text": "Aamiin. Terima kasih, Bu."
        }
      ]
    },
    {
      "title": "Tanggung jawab keluarga",
      "body": "Siapkan kebutuhan keluarga selama perjalanan.",
      "points": [
        "Atur nafkah, pengasuhan, dan kebutuhan rumah.",
        "Selesaikan kewajiban yang jatuh tempo.",
        "Siapkan kontak darurat dan orang yang dapat membantu."
      ],
      "npc": "Ayah",
      "lines": [
        {
          "speaker": "Kamu",
          "text": "Yah, apa yang harus aku siapkan sebelum pergi?"
        },
        {
          "speaker": "Ayah",
          "text": "Pastikan kebutuhan keluarga dan kewajibanmu tetap terpenuhi selama perjalanan."
        },
        {
          "speaker": "Kamu",
          "text": "Baik, Yah. Aku akan siapkan semuanya."
        }
      ]
    },
    {
      "title": "Rencana biaya perjalanan",
      "body": "Susun anggaran sebelum memilih paket atau mendaftar.",
      "points": [
        "Biaya perjalanan dan layanan.",
        "Perlengkapan dan kebutuhan selama di Tanah Suci.",
        "Dana cadangan serta biaya keluarga di rumah."
      ],
      "note": "Utamakan kewajiban dan kemampuan finansial.",
      "lines": []
    }
  ],
  [
    {
      "title": "Doa persiapan di sajadah",
      "body": "Panjatkan doa dengan tulus dan bahasa yang dipahami.",
      "points": [
        "Ya Allah, mudahkanlah aku untuk beribadah ke Baitullah.",
        "Ya Allah, berikan kesehatan, kemampuan, dan rezeki yang halal.",
        "Ya Allah, bimbinglah aku untuk beribadah dengan benar.",
        "Ya Allah, terimalah ibadahku dan lindungilah keluargaku."
      ],
      "note": "Contoh doa pribadi, bukan bacaan baku atau wajib. Niat ihram dipelajari pada tahap miqat sesuai rute.",
      "lines": []
    },
    {
      "title": "Bekal kesehatan",
      "body": "Persiapkan tubuh sesuai kemampuan sebelum berangkat.",
      "points": [
        "Berjalan kaki dan berlatih bertahap sesuai kondisi.",
        "Cukup istirahat dan cairan.",
        "Konsultasikan kondisi kesehatan serta obat rutin kepada tenaga kesehatan."
      ],
      "note": "Pemeriksaan dan vaksin mengikuti ketentuan perjalanan yang berlaku.",
      "lines": []
    },
    {
      "title": "Jalur pendaftaran resmi",
      "body": "Pilih jalur sesuai jenis ibadah.",
      "points": [
        "Umroh dengan travel: periksa izin PPIU.",
        "Haji reguler: ikuti prosedur resmi pemerintah.",
        "Haji khusus: periksa izin PIHK.",
        "Pastikan identitas penyelenggara dan rincian biaya sebelum membayar."
      ],
      "note": "Simulasi ini bukan pendaftaran nyata.",
      "lines": []
    }
  ],
  [
  {
    "title": "Periksa legalitas travel",
    "body": "Verifikasi penyelenggara melalui kanal resmi sebelum memilih paket.",
    "points": [
      "Cari nama PPIU atau PIHK di layanan resmi Kementerian Haji dan Umrah, misalnya aplikasi Satu Haji.",
      "Cocokkan nama badan usaha, nomor izin, dan status aktif.",
      "Jangan membayar hanya berdasarkan promosi atau logo."
    ],
    "note": "Nama mitra dalam game bukan bukti legalitas. Haji reguler mengikuti jalur pemerintah.",
    "npc": "Resepsionis",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Assalamualaikum, saya mau tahu cara mengecek izin travel."
      },
      {
        "speaker": "Resepsionis",
        "text": "Waalaikumsalam. Cocokkan nama dan status izinnya melalui kanal resmi Kementerian Haji dan Umrah."
      },
      {
        "speaker": "Kamu",
        "text": "Baik, saya akan periksa sebelum membayar."
      }
    ]
  },
  {
    "title": "Konsultasi paket perjalanan",
    "body": "Mintalah informasi tertulis agar jelas layanan yang diterima.",
    "points": [
      "Jadwal, penerbangan, akomodasi dan transportasi.",
      "Konsumsi, pembimbing, perlengkapan dan layanan kesehatan.",
      "Rincian biaya, tambahan, pembatalan dan pengembalian dana."
    ],
    "note": "Tidak ada harga atau paket nyata di simulasi ini.",
    "npc": "Konsultan",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Apa saja yang perlu saya tanyakan tentang paketnya?"
      },
      {
        "speaker": "Konsultan",
        "text": "Periksa jadwal, hotel, transportasi, pembimbing dan rincian biayanya. Minta penjelasan tertulis."
      },
      {
        "speaker": "Kamu",
        "text": "Baik, supaya jelas apa saja yang termasuk."
      }
    ]
  },
  {
    "title": "Simulasi pendaftaran",
    "body": "Pelajari alur pendaftaran tanpa mengirim data pribadi atau uang.",
    "points": [
      "Siapkan identitas dan dokumen sesuai ketentuan resmi.",
      "Periksa kembali syarat, perjanjian layanan dan rekening resmi.",
      "Dalam pendaftaran nyata, minta bukti pembayaran dan konfirmasi pendaftaran."
    ],
    "note": "Contoh jamaah: Jamaah Demo. Status: simulasi, bukan pendaftaran sungguhan.",
    "npc": "Admin",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Bagaimana langkah pendaftarannya?"
      },
      {
        "speaker": "Admin",
        "text": "Kita gunakan data contoh saja. Pada pendaftaran nyata, periksa persyaratan, perjanjian, dan bukti resmi."
      },
      {
        "speaker": "Kamu",
        "text": "Saya paham. Tidak perlu mengirim dokumen atau uang di game."
      }
    ]
  }
],
[
  {
    "title": "Identitas dan paspor",
    "body": "Cocokkan identitas sebelum mengurus atau memperbarui paspor.",
    "points": [
      "Siapkan KTP-el, KK, dan dokumen pendukung seperti akta lahir, buku nikah atau ijazah sesuai ketentuan.",
      "Cek kesesuaian nama, tanggal lahir dan masa berlaku paspor; konfirmasi syarat tambahan haji atau umroh ke kantor imigrasi.",
      "Ikuti prosedur permohonan, pemeriksaan berkas, foto dan wawancara melalui layanan resmi."
    ],
    "note": "Kebutuhan dokumen dan prosedur dapat berbeda menurut kondisi pemohon. Berkas di game hanya ilustrasi.",
    "npc": "Petugas Paspor",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Saya ingin menyiapkan paspor untuk ibadah. Apa yang perlu disiapkan?"
      },
      {
        "speaker": "Petugas Paspor",
        "text": "Cocokkan identitas pada KTP, KK, dan dokumen pendukung. Periksa persyaratan resmi sebelum mengajukan paspor."
      },
      {
        "speaker": "Kamu",
        "text": "Baik, saya juga akan periksa masa berlaku paspor."
      }
    ]
  },
  {
    "title": "Visa dan izin perjalanan",
    "body": "Pastikan visa atau izin perjalanan sesuai jenis ibadah, jadwal, dan rute.",
    "points": [
      "Cocokkan nama serta nomor paspor dengan data visa.",
      "Periksa jenis izin, masa berlaku dan ketentuan masuk Arab Saudi melalui kanal resmi.",
      "Untuk haji, pastikan memiliki izin haji yang sesuai; visa umroh atau wisata saja bukan izin menunaikan haji."
    ],
    "note": "Petugas dalam game hanya memberikan informasi. Visa sebenarnya diterbitkan oleh otoritas yang berwenang.",
    "npc": "Petugas Visa",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Paspor sudah disiapkan. Bagaimana dengan visa?"
      },
      {
        "speaker": "Petugas Visa",
        "text": "Pastikan jenis visa atau izin sesuai ibadah dan data paspor. Ikuti ketentuan resmi sesuai rute."
      },
      {
        "speaker": "Kamu",
        "text": "Saya akan periksa sebelum berangkat."
      }
    ]
  },
  {
    "title": "Arsip dokumen aman",
    "body": "Simpan berkas agar mudah ditemukan tanpa mengabaikan kerahasiaannya.",
    "points": [
      "Siapkan paspor, visa atau izin, tiket, identitas jamaah dan dokumen kesehatan yang diminta.",
      "Simpan salinan secara aman dan pisahkan dari dokumen asli bila memungkinkan.",
      "Catat kontak pembimbing, penyelenggara dan kontak darurat. Jangan bagikan data identitas di kanal publik."
    ],
    "note": "Map berkas demo tidak berisi identitas nyata. Tidak ada unggahan, pembayaran, atau penerbitan dokumen.",
    "npc": "Petugas Berkas",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Bagaimana menyimpan dokumen perjalanan, Bu?"
      },
      {
        "speaker": "Petugas Berkas",
        "text": "Gunakan map yang aman, siapkan salinan, dan catat kontak darurat. Jaga kerahasiaan data pribadi."
      },
      {
        "speaker": "Kamu",
        "text": "Siap. Berkas saya akan lebih teratur."
      }
    ]
  }
]
];
export function npcChat(level:PlayableLevel,quest:number,npc:Npc):Line[]{
 if(level===4)return [{speaker:npc,text:npc==='Petugas Paspor'?'Selamat datang. Mari pelajari persyaratan paspor.':npc==='Petugas Visa'?'Periksa izin perjalanan sesuai ibadah.':'Simpan berkas perjalanan dengan aman.'},{speaker:'Kamu',text:'Terima kasih.'}];
 if(level===3)return [{speaker:npc,text:npc==='Resepsionis'?'Selamat datang di kantor simulasi. Silakan cek informasi izin.':npc==='Konsultan'?'Silakan konsultasikan rencana perjalanan.':'Di sini kita belajar alur pendaftaran.'},{speaker:'Kamu',text:'Terima kasih.'}];
 if(npc==='Ibu')return [{speaker:'Ibu',text:level===1&&quest===0?'Ada yang ingin kamu bicarakan, Nak?':'Semoga persiapanmu lancar, Nak.'},{speaker:'Kamu',text:'Aamiin, Bu.'}];
 return [{speaker:'Ayah',text:'Siapkan perjalanan baik-baik, ya.'},{speaker:'Kamu',text:'Siap, Yah.'}];
}

export function lessonFor(level:PlayableLevel,quest:number,campaign:Campaign):Lesson|undefined{const base=LESSONS[level-1][quest];if(!base||level!==3||campaign!=='hajj')return base;if(quest===0)return {...base,title:'Kenali jalur haji resmi',body:'Haji reguler dikelola pemerintah. Haji khusus melalui PIHK berizin.',points:['Untuk haji reguler, ikuti pendaftaran dan informasi jadwal resmi pemerintah.','Untuk haji khusus, verifikasi badan usaha dan status izin PIHK melalui kanal resmi.','Izin PPIU saja tidak memberi kewenangan menyelenggarakan haji khusus.'],lines:[{speaker:'Kamu',text:'Saya ingin haji. Apa jalur pendaftarannya?'},{speaker:'Resepsionis',text:'Haji reguler melalui pemerintah. Haji khusus melalui PIHK berizin. Pastikan jalurnya benar.'}]};if(quest===1)return {...base,title:'Konsultasi jalur haji',body:'Pahami perbedaan layanan dan jadwal sesuai jalur yang dipilih.',points:['Haji reguler: ikuti informasi resmi pemerintah mengenai kuota, biaya, jadwal dan pembinaan.','Haji khusus: periksa izin PIHK, perjanjian tertulis, layanan dan biaya.','Jangan percaya jaminan keberangkatan tanpa konfirmasi resmi.'],lines:[{speaker:'Kamu',text:'Apa yang perlu saya periksa untuk haji?'},{speaker:'Konsultan',text:'Kenali jalur reguler atau khusus, cek informasi resmi, biaya dan jadwal. Jangan mengandalkan janji promosi.'}]};return {...base,title:'Simulasi pendaftaran haji',points:['Haji reguler: ikuti prosedur pendaftaran melalui jalur pemerintah.','Haji khusus: ikuti proses resmi PIHK berizin dan konfirmasi pencatatan.','Gunakan dokumen sah hanya melalui kanal yang berwenang. Simulasi tidak memerlukan data asli.'],lines:[{speaker:'Kamu',text:'Apakah saya bisa daftar haji di sini?'},{speaker:'Admin',text:'Ini hanya simulasi. Haji reguler melalui jalur pemerintah, haji khusus melalui PIHK berizin. Jangan kirim data atau uang di game.'}]};}
