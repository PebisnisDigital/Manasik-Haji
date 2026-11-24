import {playerKey} from '../playerCloud.ts';
export const AQABAH_BEATS=[
 {id:'group',title:'Pagi 10 Zulhijah · rombongan Mina',body:'Temui pembimbing setelah tiba dari Muzdalifah. Tujuh kerikil yang disiapkan dibawa untuk Aqabah. Ikuti jadwal dan jalur petugas.',action:'Periksa rombongan & tujuh kerikil',goal:[0,9],seconds:0},
 {id:'water',title:'Siapkan tenaga sebelum berjalan',body:'Datangi pos air. Minum dan isi bekal sebelum memasuki jalur Jamarat yang ramai.',action:'Isi air & minum sebelum Jamarat',goal:[-11,9],seconds:0},
 {id:'route',title:'Ikuti jalur menuju Jamarat',body:'Berjalan di koridor yang ditandai, beri ruang untuk jemaah lain. Untuk hari ini tujuannya hanya Aqabah, bukan ketiga jumrah.',action:'Lewati koridor Jamarat',goal:[-3,5.3],seconds:0},
 {id:'officer',title:'Tunggu arahan petugas',body:'Petugas mengatur arus jemaah. Tunggu hingga jalur siap, lalu berjalan tanpa mendorong. Waktu tunggu ini adalah tantangan game, bukan ketentuan durasi ibadah.',action:'Tunggu jalur dibuka petugas',goal:[3,8],seconds:5},
 {id:'identify',title:'Temukan jumrah Aqabah',body:'Baca papan Ula, Wustha dan Aqabah. Pada 10 Zulhijah, lontar tujuh kerikil satu per satu pada Aqabah. Talbiyah dihentikan saat mulai melontar; setiap lontaran disertai takbir.',action:'Tentukan jumrah untuk hari ini',goal:[6,6],seconds:0},
 {id:'throw',title:'Lontar Aqabah · tujuh kerikil',body:'Dekati penanda di depan Aqabah. Tekan untuk melontar satu kerikil sambil bertakbir. Kerikil masuk ke area penampung; tidak harus mengenai dinding. Tunggu satu lontaran selesai sebelum berikutnya.',action:'Lontar kerikil',goal:[8,4.5],seconds:0},
 {id:'exit',title:'Beri ruang · ikuti jalur keluar',body:'Tujuh lontaran selesai. Tinggalkan area lontar melalui koridor keluar agar jemaah berikutnya mendapat ruang.',action:'Keluar dari area lontar',goal:[11,12],seconds:0},
 {id:'dam',title:'Temui pembimbing · panduan dam haji qiran',body:'Dalam contoh urutan ini: Aqabah, hady atau dam, kemudian cukur. Dam qiran dilaksanakan melalui pihak berwenang; bila tidak mampu ada ketentuan puasa. Pilihan di game hanya belajar, tidak memesan atau membayar kurban.',action:'Pelajari pelaksanaan dam',goal:[3,14],seconds:0},
 {id:'salon',title:'Menuju tempat tahallul haji',body:'Ikuti jalur ke petugas cukur. Laki-laki pada fase ini memilih cukur seluruh kepala; perempuan memotong sedikit ujung rambut dengan petugas perempuan di tempat tertutup.',action:'Temui petugas tahallul',goal:[-8,13],seconds:0},
 {id:'haircut',title:'Tahallul · dibantu petugas',body:'Duduk di kursi. Petugas melakukan tiga bagian tindakan hingga selesai. Model tubuh dan wajah tetap sama; hasil cukur tersimpan saat meninggalkan tempat ini.',action:'Duduk & mulai tahallul',goal:[-8,16],seconds:2.4},
 {id:'limits',title:'Pahami tahallul awal',body:'Setelah Aqabah dan cukur atau potong rambut pada alur ini, tahallul awal tercapai. Hubungan suami istri masih dilarang hingga tahallul akhir. Tawaf Ifadah masih harus dituntaskan. Sa’i tidak diulang jika sudah dilakukan setelah Tawaf Qudum.',action:'Pahami tahallul awal',goal:[-4,14],seconds:0},
 {id:'departure',title:'Berkumpul menuju Tawaf Ifadah',body:'Temui kembali pembimbing di titik kumpul. Lontaran, tahallul dan progres perjalanan sudah siap disimpan sebelum melanjutkan ke Makkah.',action:'Rombongan siap menuju Ifadah',goal:[0,20],seconds:0},
] as const;
export interface AqabahSave{version:1;id:string;beat:number;elapsed:number;throws:number;cuts:number}
export const aqabahKey=(id:string)=>playerKey('manasik-aqabah-activities-v1:'+id);
export const aqabahDuration=(beat:number)=>AQABAH_BEATS[beat]?.seconds??0;
export function initialAqabah(id:string,legacy=0,after=false):AqabahSave{return {version:1,id,beat:after?7:0,elapsed:0,throws:after?7:Math.min(7,Math.max(0,Math.floor(legacy))),cuts:0};}
export function decodeAqabah(raw:string|null,id:string):AqabahSave|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&s.id===id&&Number.isInteger(s.beat)&&s.beat>=0&&s.beat<=AQABAH_BEATS.length&&Number.isInteger(s.throws)&&s.throws>=0&&s.throws<=7&&(s.beat<=5||s.throws===7)&&Number.isInteger(s.cuts)&&s.cuts>=0&&s.cuts<=3&&(s.beat>=9||s.cuts===0)&&(s.beat<=9||s.cuts===3)&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&s.elapsed<=aqabahDuration(s.beat)+.001?{version:1,id,beat:s.beat,elapsed:s.elapsed,throws:s.throws,cuts:s.cuts}:null;}catch{return null;}}
export function readAqabah(id:string,legacy=0,after=false):AqabahSave{try{const k=aqabahKey(id);return decodeAqabah(localStorage.getItem(k),id)??decodeAqabah(localStorage.getItem(k+'.backup'),id)??initialAqabah(id,legacy,after);}catch{return initialAqabah(id,legacy,after);}}
export function storeAqabah(next:AqabahSave,legacy=0,after=false){try{const k=aqabahKey(next.id),raw=localStorage.getItem(k),bak=localStorage.getItem(k+'.backup');if(!decodeAqabah(JSON.stringify(next),next.id))return false;
 for(const r of [raw,bak])try{if(JSON.parse(r??'null')?.version>1)return false;}catch{}
 const saved=decodeAqabah(raw,next.id)??decodeAqabah(bak,next.id);if(!saved&&(raw!==null||bak!==null))return false;const old=saved??initialAqabah(next.id,legacy,after);
 const throwing=old.beat===5&&next.beat===5&&next.throws===old.throws+1&&next.cuts===old.cuts;
 const cutting=old.beat===9&&next.beat===9&&next.cuts===old.cuts+1&&next.throws===old.throws&&old.elapsed+.001>=aqabahDuration(9)&&next.elapsed===0;
 if(next.beat<old.beat||next.beat>old.beat+1||!throwing&&next.throws!==old.throws||!cutting&&next.cuts!==old.cuts||next.beat===old.beat&&!cutting&&next.elapsed<old.elapsed)return false;
 if(next.beat===old.beat+1&&(old.beat===5?old.throws!==7:old.beat===9?old.cuts!==3:old.elapsed+.001<aqabahDuration(old.beat)))return false;
 if(decodeAqabah(raw,next.id))try{localStorage.setItem(k+'.backup',raw!);}catch{}localStorage.setItem(k,JSON.stringify(next));return true;
 }catch{return false;}}
