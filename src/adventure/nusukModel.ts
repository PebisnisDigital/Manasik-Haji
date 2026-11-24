/** Public level order; existing chapter ids and save boundaries remain stable. */
export const NUSUK_LEVELS=[
 {number:1,id:'miqat',title:'Miqat & Ihram Haji',when:'Sebelum memasuki Makkah',description:'Niat haji dan umrah sekaligus pada jalur qiran, pakaian ihram dan talbiyah. Tetap dalam ihram sampai rangkaian hari Nahr.'},
 {number:2,id:'tawaf',title:'Tawaf Qudum',when:'Kedatangan · Masjidil Haram',description:'Ikuti pembimbing ke Ka’bah, temukan rombongan dan titik awal, lalu tawaf kedatangan tujuh putaran serta pelajari salat tawaf.'},
 {number:3,id:'sai',title:'Sa’i Safa–Marwah',when:'Setelah Tawaf Qudum · berakhir di Marwah',description:'Tujuh lintasan Sa’i haji dari Safa. Tetap dalam ihram setelahnya; tidak ada tahallul umrah awal pada jalur ini.'},
 {number:4,id:'ihram',title:'Mina · Hari Tarwiyah',when:'8 Zulhijah → Subuh 9 Zulhijah',description:'Tetap dalam ihram, berangkat ke Mina, salat dan bermalam pada hari Tarwiyah. Tidak mengulang niat masuk ihram.'},
 {number:5,id:'arafah',title:'Wukuf Arafah',when:'9 Zulhijah · hingga matahari terbenam',description:'Dari Mina menuju Arafah, salat jamak, berdoa dan berdzikir. Berangkat ke Muzdalifah setelah terbenam matahari.'},
 {number:6,id:'muzdalifah',title:'Mabit Muzdalifah',when:'Malam 10 Zulhijah → fajar',description:'Magrib–Isya setelah tiba, mabit, persiapan kerikil, Subuh dan dzikir; lalu menuju Mina sebelum matahari terbit.'},
 {number:7,id:'aqabah',title:'Lontar Jumrah Aqabah',when:'10 Zulhijah · Mina',description:'Ikuti jadwal petugas dan lontar Aqabah tujuh kerikil satu per satu dengan takbir, lalu tinggalkan area lontar.'},
 {number:8,id:'dam',title:'Hady / Dam Haji',when:'Setelah Aqabah · contoh urutan hari Nahr',description:'Temui pembimbing untuk mempelajari hady atau dam melalui pihak berwenang. Kegiatan ini tidak melakukan transaksi kurban.'},
 {number:9,id:'hajj-tahallul',title:'Tahallul Awal Haji',when:'Setelah panduan dam · 10 Zulhijah',description:'Petugas mencukur kepala laki-laki atau memotong ujung rambut perempuan. Pahami batas tahallul awal sebelum melanjutkan Ifadah.'},
 {number:10,id:'ifadah',title:'Tawaf Ifadah',when:'Hari Nahr · contoh rute setelah tahallul awal',description:'Tawaf Ifadah tujuh putaran dan salat tawaf. Sa’i haji tidak diulang karena sudah diselesaikan pada Level 3 dalam jalur qiran ini.'},
 {number:11,id:'mina',title:'Mina & Jumrah Hari Tasyrik',when:'11–12 Zulhijah · 13 untuk nafar tsani',description:'Mabit di Mina dan lontar Ula → Wustha → Aqabah, masing-masing tujuh kerikil. Pilih nafar awal atau tsani sesuai ketentuan.'},
 {number:12,id:'wada',title:'Tawaf Wada’',when:'Menjelang meninggalkan Makkah',description:'Setelah rangkaian Mina selesai, tawaf perpisahan tujuh putaran sesuai ketentuan sebelum keberangkatan pulang.'},
] as const;
export function nusukNumber(id:string,beat?:number){if(id==='arrival')return 2;if(id==='tahallul')return 3;if(id==='aqabah'&&beat!==undefined)return beat<7?7:beat<8?8:9;return NUSUK_LEVELS.find(l=>l.id===id)?.number??1;}
export function nusukStep(step:number){return step<=0?1:step<=2?2:step<=4?3:step===5?4:step===6?5:step===7?6:step===8?7:step===9?9:step<=11?10:step<=16?11:12;}
export function nusukCompletion(done:Record<string,boolean>,aqabahStep:number,aqabahBeat:number){return [done.miqat,done.arrival&&done.tawaf,done.sai,done.ihram,done.arafah,done.muzdalifah,aqabahStep>=9,aqabahStep>=10||aqabahStep===9&&aqabahBeat>=8,aqabahStep>=10,done.ifadah,done.mina,done.wada].map(Boolean);}
