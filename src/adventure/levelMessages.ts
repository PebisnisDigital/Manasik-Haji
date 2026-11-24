import {NUSUK_LEVELS} from './nusukModel.ts';

// Presentation only: public levels share several legacy save records.
const recaps = [
 'Pakaian ihram, niat dan talbiyah sudah dipelajari. Ikuti pembimbing menuju kawasan Ka’bah.',
 'Tujuh putaran Tawaf Qudum tersimpan. Pelajari salat tawaf, lalu berjalan menuju Safa.',
 'Tujuh lintasan selesai di Marwah. Tetap dalam ihram dan bersiap menuju Mina.',
 'Kegiatan Tarwiyah di Mina tersimpan. Berikutnya berangkat bersama rombongan menuju Arafah.',
 'Wukuf dan kegiatan Arafah selesai hingga matahari terbenam. Berikutnya perjalanan malam ke Muzdalifah.',
 'Kegiatan malam, Subuh dan persiapan kerikil tersimpan. Berikutnya menuju Mina untuk Aqabah.',
 'Tujuh lontaran Aqabah tersimpan. Keluar dari jalur lontar, lalu temui pembimbing untuk panduan dam.',
 'Panduan hady atau dam sudah dipelajari. Berikutnya menuju petugas tahallul.',
 'Tahallul awal dibantu petugas sudah tersimpan. Berikutnya kembali ke Makkah untuk Tawaf Ifadah.',
 'Tawaf Ifadah, salat tawaf dan Zamzam tersimpan. Berikutnya kembali ke Mina untuk hari Tasyrik.',
 'Kegiatan Mina, jumrah hari Tasyrik dan pilihan nafar tersimpan. Berikutnya Tawaf Wada’ sebelum meninggalkan Makkah.',
 'Tawaf Wada’ tersimpan. Buka peta untuk melihat hasil perjalanan atau melengkapi level yang belum selesai.',
] as const;

export function hajjLevelMessage(number:number){
 const level=NUSUK_LEVELS[number-1];
 if(!level)throw new RangeError('Nomor level haji tidak tersedia');
 const next=NUSUK_LEVELS[number];
 return {number,label:'Level '+number+' · '+level.title,completedTitle:'PERFECT · Level '+number+' selesai',recap:recaps[number-1],nextLabel:next?'Lanjut Level '+next.number+' · '+next.title:'Lihat hasil perjalanan',nextNumber:next?.number??null};
}
