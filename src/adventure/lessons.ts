export type Npc='Ibu'|'Ayah';
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
  ]
];
export function npcChat(level:1|2,quest:number,npc:Npc):Line[]{
 if(npc==='Ibu')return [{speaker:'Ibu',text:level===1&&quest===0?'Ada yang ingin kamu bicarakan, Nak?':'Semoga persiapanmu lancar, Nak.'},{speaker:'Kamu',text:'Aamiin, Bu.'}];
 return [{speaker:'Ayah',text:'Siapkan perjalanan baik-baik, ya.'},{speaker:'Kamu',text:'Siap, Yah.'}];
}
