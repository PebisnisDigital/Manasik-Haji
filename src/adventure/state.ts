export type Avatar='male'|'female';
export type Campaign='umrah'|'hajj';
export type Quest=0|1|2|3;
export type PlayableLevel=1|2|3|4|5;
export const MAX_PLAYABLE=5;
export interface AdventureSave {version:1;avatar:Avatar;campaign:Campaign;quest:Quest;level:PlayableLevel}
export const LEVELS=[
 'Niat dan Restu Keluarga','Bekal Sebelum Berangkat','Menemukan Travel','Persiapan Dokumen','Persiapan Kesehatan','Menyiapkan Koper','Kelas Manasik','Hari Keberangkatan','Bandara','Terbang ke Saudi','Perjalanan dan Miqat','Tiba dan Bersiap','Perjalanan Ihram','Melihat Ka’bah','Tawaf','Salat dan Zamzam','Sa’i','Tahallul','Menanti Hari Haji','Ihram Haji','Tarwiyah','Wukuf Arafah','Muzdalifah','Jumrah Aqabah','Tahallul Awal','Tawaf Ifadah','Sa’i Haji','Mina Hari Pertama','Mina Hari Kedua','Mina Hari Ketiga','Tawaf Wada’','Hari Terakhir','Terbang Pulang','Pelukan Keluarga','Sebuah Perubahan'
] as const;
export const QUESTS:ReadonlyArray<{title:string;label:string;hint:string;x:number;z:number}>=[
 {title:'Mohon doa orang tua',label:'Ibu',hint:'Datangi ibu untuk memohon doa dan restu.',x:-3.65,z:0.8},
 {title:'Bahas kesiapan keluarga',label:'Ayah',hint:'Temui ayah dan bicarakan tanggung jawab keluarga.',x:-5,z:2.5},
 {title:'Rencanakan biaya perjalanan',label:'Catatan',hint:'Datangi meja untuk melihat panduan rencana biaya.',x:-1.75,z:2.6}
] as const;
export function makeSave(avatar:Avatar,campaign:Campaign):AdventureSave{return {version:1,avatar,campaign,quest:0,level:1};}
export function decodeSave(raw:string|null):AdventureSave|null{try{const s=JSON.parse(raw??'null');if(!s||(s.level!==undefined&&s.level!==1&&s.level!==2&&s.level!==3&&s.level!==4&&s.level!==5)||s.version!==1||!['male','female'].includes(s.avatar)||!['umrah','hajj'].includes(s.campaign)||!Number.isInteger(s.quest)||s.quest<0||s.quest>3)return null;return {version:1,avatar:s.avatar,campaign:s.campaign,quest:s.quest,level:s.level===5?5:s.level===4?4:s.level===3?3:s.level===2?2:1};}catch{return null;}}
export function finishQuest(s:AdventureSave,expected:Quest):AdventureSave{return s.quest===expected&&expected<3?{...s,quest:(expected+1) as Quest}:s;}
export function route(c:Campaign):number[]{return LEVELS.map((_,i)=>i+1).filter(n=>c==='hajj'||n<=18||n>=32);}

export const PRAYER_QUESTS:typeof QUESTS=[
 {title:'Berdoa dan luruskan niat',label:'Sajadah',hint:'Datangi sajadah untuk membaca panduan doa persiapan.',x:3.5,z:-2.5},
 {title:'Kenali kesiapan kesehatan',label:'Catatan',hint:'Datangi meja untuk mempelajari bekal kesehatan.',x:-1.75,z:2.6},
 {title:'Kenali jalur ibadah resmi',label:'Panduan',hint:'Datangi layar panduan untuk mengenali jalur pendaftaran.',x:0,z:-2.65}
];
export const TRAVEL_QUESTS:typeof QUESTS=[{title:'Periksa legalitas penyelenggara',label:'Resepsionis',hint:'Datangi resepsionis untuk mempelajari cara memeriksa izin penyelenggara.',x:-4,z:-1.5},{title:'Konsultasikan perjalanan',label:'Konsultan',hint:'Datangi konsultan untuk mengetahui rincian layanan dan biaya perjalanan.',x:3.5,z:-1.5},{title:'Simulasikan pendaftaran',label:'Admin',hint:'Datangi admin pendaftaran untuk mempelajari alur pendaftaran resmi.',x:4.5,z:2.5}];
export const DOCUMENT_QUESTS:typeof QUESTS=[
 {title:'Siapkan identitas dan paspor',label:'Petugas Paspor',hint:'Datangi loket dokumen untuk mempelajari pemeriksaan identitas dan pengurusan paspor.',x:-4,z:-1.5},
 {title:'Periksa visa perjalanan',label:'Petugas Visa',hint:'Temui petugas informasi visa untuk mempelajari izin perjalanan yang sesuai.',x:3.5,z:-1.5},
 {title:'Simpan berkas perjalanan',label:'Petugas Berkas',hint:'Datangi meja berkas untuk mempelajari cara menyimpan dokumen dengan aman.',x:4.5,z:2.5}
];
export const HEALTH_QUESTS:typeof QUESTS=[
 {title:'Periksa kesiapan kesehatan',label:'Dokter',hint:'Datangi dokter untuk mempelajari pemeriksaan kesehatan sebelum perjalanan ibadah.',x:-4,z:-1.5},
 {title:'Persiapkan vaksinasi',label:'Perawat',hint:'Temui perawat untuk mengetahui vaksinasi dan bukti kesehatan sesuai ketentuan perjalanan.',x:3.5,z:-1.5},
 {title:'Siapkan kebugaran dan obat',label:'Apoteker',hint:'Temui apoteker untuk mempelajari persiapan obat rutin dan kebugaran.',x:4.5,z:2.5}
];
export function missions(level:PlayableLevel){return level===5?HEALTH_QUESTS:level===4?DOCUMENT_QUESTS:level===3?TRAVEL_QUESTS:level===2?PRAYER_QUESTS:QUESTS;}
export function coins(s:AdventureSave){return ((s.level-1)*3+s.quest)*10;}
export function unlockNext(s:AdventureSave):AdventureSave{return s.level<MAX_PLAYABLE&&s.quest===3?{...s,level:(s.level+1) as PlayableLevel,quest:0}:s;}
