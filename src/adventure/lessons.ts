import type {PlayableLevel,Campaign} from './state.ts';
export type Npc='Ibu'|'Ayah'|'Resepsionis'|'Konsultan'|'Admin'|'Petugas Paspor'|'Petugas Visa'|'Petugas Berkas'|'Dokter'|'Perawat'|'Apoteker'|'Pembimbing'|'Asisten Manasik'|'Ketua Rombongan';
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
],
[
  {
    "title": "Pemeriksaan kesiapan kesehatan",
    "body": "Lakukan konsultasi dan pemeriksaan kesehatan sebelum berangkat.",
    "points": [
      "Sampaikan riwayat penyakit, alergi, obat dan keluhan kepada dokter.",
      "Ikuti pemeriksaan yang ditentukan tenaga kesehatan, termasuk tekanan darah dan penilaian kemampuan fisik bila diperlukan.",
      "Untuk haji, ikuti pemeriksaan dan penetapan istitaah kesehatan oleh petugas berwenang."
    ],
    "note": "Hasil pemeriksaan dalam game tidak menentukan kelayakan kesehatan sebenarnya.",
    "npc": "Dokter",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Dok, saya ingin mempersiapkan kesehatan sebelum ibadah."
      },
      {
        "speaker": "Dokter",
        "text": "Mulailah dengan konsultasi. Sampaikan kondisi kesehatan, obat rutin dan kemampuan fisikmu."
      },
      {
        "speaker": "Kamu",
        "text": "Baik, Dok. Saya akan mengikuti pemeriksaan sesuai arahan."
      }
    ]
  },
  {
    "title": "Vaksinasi dan bukti kesehatan",
    "body": "Cek syarat kesehatan Arab Saudi sesuai jenis ibadah dan jadwal perjalanan.",
    "points": [
      "Tanyakan vaksin meningokokus ACWY dan vaksin lain yang diwajibkan atau dianjurkan sesuai ketentuan terbaru.",
      "Lakukan vaksinasi di fasilitas berwenang, dengan penilaian kondisi dan waktu pemberian oleh tenaga kesehatan.",
      "Simpan bukti vaksinasi atau sertifikat yang dipersyaratkan, dan periksa masa berlakunya."
    ],
    "note": "Ketentuan bisa berubah menurut musim, asal perjalanan, usia dan kondisi kesehatan. Tidak ada tindakan vaksinasi nyata di game.",
    "npc": "Perawat",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Bu, bagaimana mempersiapkan vaksinasi sebelum berangkat?"
      },
      {
        "speaker": "Perawat",
        "text": "Periksa syarat terbaru untuk haji atau umroh. Kami akan membantu menjelaskan vaksin, jadwal, dan bukti yang diperlukan."
      },
      {
        "speaker": "Kamu",
        "text": "Baik, saya akan berkonsultasi sebelum vaksinasi."
      }
    ]
  },
  {
    "title": "Kebugaran dan obat pribadi",
    "body": "Siapkan stamina dan obat rutin sesuai anjuran tenaga kesehatan.",
    "points": [
      "Latih jalan kaki secara bertahap sesuai kondisi; cukup istirahat dan minum sesuai kebutuhan kesehatan.",
      "Siapkan obat resep dalam kemasan berlabel, daftar obat, serta resep atau surat dokter bila diperlukan.",
      "Jangan menghentikan atau mengubah dosis obat sendiri. Tanyakan aturan membawa obat ke negara tujuan."
    ],
    "note": "Bila muncul nyeri dada, sesak berat, atau pingsan, cari pertolongan medis segera. Game bukan konsultasi medis.",
    "npc": "Apoteker",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Apa bekal kesehatan yang harus dibawa?"
      },
      {
        "speaker": "Apoteker",
        "text": "Bawa obat rutin sesuai resep dan daftar obat. Untuk latihan fisik, sesuaikan dengan kemampuan dan arahan dokter."
      },
      {
        "speaker": "Kamu",
        "text": "Siap. Saya tidak akan mengubah obat tanpa arahan dokter."
      }
    ]
  }
],
[
  {
    "title": "Pakaian dan perlengkapan ibadah",
    "body": "Kemas pakaian sesuai kebutuhan, cuaca, dan ketentuan ihram.",
    "points": [
      "Laki-laki: siapkan dua helai kain ihram; perempuan: pakaian yang sesuai ketentuan menutup aurat.",
      "Bawa pakaian ganti dan perlengkapan salat secukupnya.",
      "Siapkan pakaian ihram agar mudah dijangkau sebelum miqat bila diperlukan."
    ],
    "note": "Tidak ada warna khusus pakaian ihram perempuan yang wajib. Pelajari ketentuan ihram bersama pembimbing.",
    "lines": []
  },
  {
    "title": "Kebutuhan pribadi",
    "body": "Bawa perlengkapan yang praktis dan sesuai kemampuan membawa bagasi.",
    "points": [
      "Siapkan alas kaki yang nyaman dan sesuai ketentuan ihram.",
      "Kemas kebutuhan kebersihan; perhatikan larangan wewangian selama ihram.",
      "Bawa handuk kecil dan perlengkapan pribadi secukupnya."
    ],
    "note": "Periksa aturan cairan, aerosol, dan barang yang dibatasi oleh maskapai.",
    "lines": []
  },
  {
    "title": "Tas kabin dan bagasi aman",
    "body": "Pisahkan barang yang diperlukan sepanjang perjalanan.",
    "points": [
      "Simpan paspor, izin, tiket, identitas, dan kontak darurat dalam tas yang mudah dijangkau.",
      "Bawa obat rutin dalam kemasan berlabel sesuai resep serta aturan perjalanan.",
      "Beri tanda pengenal pada koper, kunci dengan aman, dan cek berat serta aturan bagasi maskapai."
    ],
    "note": "Power bank dan baterai cadangan mengikuti aturan kabin maskapai; jangan asal memasukkannya ke bagasi tercatat. Tidak ada dokumen atau obat nyata di game.",
    "lines": []
  }
],
[
  {
    "title": "Urutan ibadah umroh",
    "body": "Pelajari urutan ibadah sebelum berangkat bersama pembimbing.",
    "points": [
      "Masuk ihram dengan niat umroh di miqat sebelum melintasinya.",
      "Tawaf tujuh putaran, kemudian sa’i tujuh lintasan dari Safa ke Marwah.",
      "Tahallul dengan mencukur atau memotong rambut sesuai ketentuan. Ikuti urutan dan tuntunan pembimbing."
    ],
    "note": "Kelas ini adalah pengenalan, bukan pelaksanaan ibadah atau pengganti manasik resmi.",
    "npc": "Pembimbing",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Ustaz, bagaimana urutan ibadah umroh?"
      },
      {
        "speaker": "Pembimbing",
        "text": "Mulai dari ihram di miqat, kemudian tawaf, sa’i, dan tahallul. Pelajari tata caranya sebelum berangkat."
      },
      {
        "speaker": "Kamu",
        "text": "Baik, Ustaz. Saya akan mempelajari setiap tahap."
      }
    ]
  },
  {
    "title": "Ihram dan larangannya",
    "body": "Ihram adalah keadaan ibadah yang dimulai dengan niat, bukan sekadar pakaian.",
    "points": [
      "Siapkan pakaian sesuai ketentuan ihram laki-laki dan perempuan. Niat masuk ihram dilakukan sebelum melewati miqat.",
      "Selama ihram, hindari memakai wewangian, memotong kuku atau rambut, dan hubungan suami istri; pelajari larangan lainnya.",
      "Laki-laki tidak mengenakan pakaian yang membentuk anggota tubuh seperti pakaian biasa atau menutup kepala; perempuan mengikuti ketentuan aurat, wajah dan sarung tangan."
    ],
    "note": "Rincian larangan, pengecualian, uzur, dan dam perlu dipelajari sesuai bimbingan fikih. Jangan menyamakan pakaian persiapan dengan niat ihram.",
    "npc": "Asisten Manasik",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Apakah memakai kain ihram berarti sudah masuk ihram?"
      },
      {
        "speaker": "Asisten Manasik",
        "text": "Belum tentu. Ihram dimulai dengan niat ibadah. Pelajari batas miqat dan larangannya sebelum perjalanan."
      },
      {
        "speaker": "Kamu",
        "text": "Saya paham. Pakaian dan niat itu berbeda."
      }
    ]
  },
  {
    "title": "Arah tawaf dan hitungan sa’i",
    "body": "Ingat arah dan cara menghitung rangkaian ibadah.",
    "points": [
      "Tawaf: mulai dari garis sejajar Hajar Aswad, Ka’bah di sebelah kiri, berlawanan arah jarum jam, tujuh putaran di luar Hijr Ismail dan batas bangunan Ka’bah.",
      "Sa’i dilakukan setelah tawaf yang sesuai: Safa ke Marwah dihitung satu, Marwah ke Safa dihitung dua, sampai tujuh lintasan dan berakhir di Marwah.",
      "Ikuti arahan pembimbing, jangan berdesakan, dan gunakan bantuan yang sesuai kemampuan."
    ],
    "note": "Miniatur dan diagram hanya peragaan hitungan, bukan ukuran atau rekonstruksi Masjidil Haram yang akurat. Poin bukan pahala atau penilaian sahnya ibadah.",
    "lines": []
  }
],
[
  {
    "title": "Pemeriksaan akhir keberangkatan",
    "body": "Pastikan barang penting siap sebelum meninggalkan rumah.",
    "points": [
      "Periksa paspor, visa atau izin, tiket dan identitas jamaah. Simpan di tas yang mudah dijangkau.",
      "Periksa obat rutin, kebutuhan pribadi, dan perlengkapan ibadah sesuai rute.",
      "Cek label koper, berat bagasi, serta barang yang harus dibawa di kabin. Ikuti aturan maskapai."
    ],
    "note": "Jangan masukkan dokumen penting ke bagasi tercatat. Daftar dalam game merupakan latihan, bukan verifikasi berkas nyata.",
    "lines": []
  },
  {
    "title": "Berpamitan dan doa perjalanan",
    "body": "Pamiti keluarga, mohon doa, lalu berangkat dengan tenang.",
    "points": [
      "Pastikan keluarga mengetahui jadwal, kontak pembimbing, dan kebutuhan rumah telah disiapkan.",
      "Contoh doa pribadi: Ya Allah, lindungilah kami sepanjang perjalanan, mudahkan ibadah kami, dan jagalah keluarga yang kami tinggalkan.",
      "Doa naik kendaraan (penggalan QS Az-Zukhruf 43:13–14): Subhanalladzi sakhkhara lana hadza wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun.",
      "Makna: Mahasuci Allah yang menundukkan kendaraan ini untuk kami, padahal kami tidak mampu menguasainya, dan kepada Tuhan kami akan kembali."
    ],
    "note": "Doa pribadi boleh menggunakan bahasa yang dipahami. Doa naik kendaraan dipanjatkan saat naik kendaraan; bukan syarat sah haji atau umroh.",
    "npc": "Ibu",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Bu, waktunya berangkat. Mohon doa, ya."
      },
      {
        "speaker": "Ibu",
        "text": "Semoga Allah menjaga perjalananmu, memudahkan ibadahmu, dan mempertemukan kita kembali dalam keadaan sehat."
      },
      {
        "speaker": "Kamu",
        "text": "Aamiin. Aku pamit, Bu. Assalamualaikum."
      },
      {
        "speaker": "Ibu",
        "text": "Waalaikumsalam. Hati-hati, Nak."
      }
    ]
  },
  {
    "title": "Bergabung dengan rombongan",
    "body": "Ikuti arahan ketua rombongan sebelum bus berangkat.",
    "points": [
      "Datang tepat waktu dan cocokkan nama dengan daftar rombongan serta nomor bus.",
      "Serahkan koper kepada petugas sesuai arahan; simpan tas kabin dan dokumen penting bersama diri.",
      "Kenali pembimbing, titik kumpul, dan kontak darurat. Jangan berpindah bus tanpa konfirmasi."
    ],
    "note": "Bus dan daftar jamaah dalam game adalah simulasi. Tidak ada perjalanan atau pemesanan nyata.",
    "npc": "Ketua Rombongan",
    "lines": [
      {
        "speaker": "Kamu",
        "text": "Assalamualaikum, saya sudah siap berangkat."
      },
      {
        "speaker": "Ketua Rombongan",
        "text": "Waalaikumsalam. Cocokkan kelompok dan nomor bus terlebih dahulu. Koper besar masuk bagasi, tas dokumen tetap kamu bawa."
      },
      {
        "speaker": "Kamu",
        "text": "Siap. Saya tetap bersama rombongan."
      }
    ]
  }
]
];
export function npcChat(level:PlayableLevel,quest:number,npc:Npc):Line[]{
 if(level===8)return [{speaker:npc,text:npc==='Ketua Rombongan'?'Selamat datang. Ikuti arahan rombongan sebelum berangkat.':'Hati-hati di perjalanan. Semoga Allah menjagamu.'},{speaker:'Kamu',text:'Aamiin. Terima kasih.'}];
 if(level===7)return [{speaker:npc,text:npc==='Pembimbing'?'Silakan pelajari urutan ibadah sesuai jenis perjalanan.':'Mari kenali ihram dan latihan manasik.'},{speaker:'Kamu',text:'Terima kasih.'}];
 if(level===6)return [{speaker:npc,text:npc==='Ibu'?'Siapkan barang secukupnya, Nak. Jangan lupa dokumen.':'Periksa aturan bagasi sebelum berangkat, ya.'},{speaker:'Kamu',text:'Siap.'}];
 if(level===5)return [{speaker:npc,text:npc==='Dokter'?'Silakan pelajari kesiapan kesehatan sebelum berangkat.':npc==='Perawat'?'Mari kenali persyaratan vaksinasi.':'Mari siapkan obat rutin secara aman.'},{speaker:'Kamu',text:'Terima kasih.'}];
 if(level===4)return [{speaker:npc,text:npc==='Petugas Paspor'?'Selamat datang. Mari pelajari persyaratan paspor.':npc==='Petugas Visa'?'Periksa izin perjalanan sesuai ibadah.':'Simpan berkas perjalanan dengan aman.'},{speaker:'Kamu',text:'Terima kasih.'}];
 if(level===3)return [{speaker:npc,text:npc==='Resepsionis'?'Selamat datang di kantor simulasi. Silakan cek informasi izin.':npc==='Konsultan'?'Silakan konsultasikan rencana perjalanan.':'Di sini kita belajar alur pendaftaran.'},{speaker:'Kamu',text:'Terima kasih.'}];
 if(npc==='Ibu')return [{speaker:'Ibu',text:level===1&&quest===0?'Ada yang ingin kamu bicarakan, Nak?':'Semoga persiapanmu lancar, Nak.'},{speaker:'Kamu',text:'Aamiin, Bu.'}];
 return [{speaker:'Ayah',text:'Siapkan perjalanan baik-baik, ya.'},{speaker:'Kamu',text:'Siap, Yah.'}];
}

export function lessonFor(level:PlayableLevel,quest:number,campaign:Campaign):Lesson|undefined{const base=LESSONS[level-1][quest];if(base&&level===7&&quest===0&&campaign==='hajj')return {...base,title:'Urutan haji tamattu’',body:'Pada haji tamattu’, umroh diselesaikan terlebih dahulu, kemudian masuk ihram haji pada waktunya.',points:['Selesaikan umroh: ihram, tawaf, sa’i, dan tahallul.','Masuk ihram haji pada waktunya; ikuti tahapan Arafah, Muzdalifah dan Mina bersama pembimbing.','Laksanakan tawaf ifadah, sa’i haji, tahallul dan tahapan lain sesuai ketentuan. Pelajari dam tamattu’ dan tawaf wada’ beserta pengecualiannya.'],lines:[{speaker:'Kamu',text:'Ustaz, bagaimana urutan haji tamattu’?'},{speaker:'Pembimbing',text:'Umroh dahulu sampai tahallul, lalu masuk ihram haji pada waktunya. Kita akan belajar rangkaian haji tahap demi tahap.'}]};if(!base||level!==3||campaign!=='hajj')return base;if(quest===0)return {...base,title:'Kenali jalur haji resmi',body:'Haji reguler dikelola pemerintah. Haji khusus melalui PIHK berizin.',points:['Untuk haji reguler, ikuti pendaftaran dan informasi jadwal resmi pemerintah.','Untuk haji khusus, verifikasi badan usaha dan status izin PIHK melalui kanal resmi.','Izin PPIU saja tidak memberi kewenangan menyelenggarakan haji khusus.'],lines:[{speaker:'Kamu',text:'Saya ingin haji. Apa jalur pendaftarannya?'},{speaker:'Resepsionis',text:'Haji reguler melalui pemerintah. Haji khusus melalui PIHK berizin. Pastikan jalurnya benar.'}]};if(quest===1)return {...base,title:'Konsultasi jalur haji',body:'Pahami perbedaan layanan dan jadwal sesuai jalur yang dipilih.',points:['Haji reguler: ikuti informasi resmi pemerintah mengenai kuota, biaya, jadwal dan pembinaan.','Haji khusus: periksa izin PIHK, perjanjian tertulis, layanan dan biaya.','Jangan percaya jaminan keberangkatan tanpa konfirmasi resmi.'],lines:[{speaker:'Kamu',text:'Apa yang perlu saya periksa untuk haji?'},{speaker:'Konsultan',text:'Kenali jalur reguler atau khusus, cek informasi resmi, biaya dan jadwal. Jangan mengandalkan janji promosi.'}]};return {...base,title:'Simulasi pendaftaran haji',points:['Haji reguler: ikuti prosedur pendaftaran melalui jalur pemerintah.','Haji khusus: ikuti proses resmi PIHK berizin dan konfirmasi pencatatan.','Gunakan dokumen sah hanya melalui kanal yang berwenang. Simulasi tidak memerlukan data asli.'],lines:[{speaker:'Kamu',text:'Apakah saya bisa daftar haji di sini?'},{speaker:'Admin',text:'Ini hanya simulasi. Haji reguler melalui jalur pemerintah, haji khusus melalui PIHK berizin. Jangan kirim data atau uang di game.'}]};}
