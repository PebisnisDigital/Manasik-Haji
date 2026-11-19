export type Avatar='male'|'female';
export type Campaign='umrah'|'hajj';
export type Quest=0|1|2|3;
export interface AdventureSave {version:1;avatar:Avatar;campaign:Campaign;quest:Quest}
export const LEVELS=[
 'Sebuah Impian','Niat dan Doa','Menemukan Travel','Persiapan Dokumen','Persiapan Kesehatan','Menyiapkan Koper','Kelas Manasik','Hari Keberangkatan','Bandara','Terbang ke Saudi','Perjalanan dan Miqat','Tiba dan Bersiap','Perjalanan Ihram','Melihat Ka’bah','Tawaf','Salat dan Zamzam','Sa’i','Tahallul','Menanti Hari Haji','Ihram Haji','Tarwiyah','Wukuf Arafah','Muzdalifah','Jumrah Aqabah','Tahallul Awal','Tawaf Ifadah','Sa’i Haji','Mina Hari Pertama','Mina Hari Kedua','Mina Hari Ketiga','Tawaf Wada’','Hari Terakhir','Terbang Pulang','Pelukan Keluarga','Sebuah Perubahan'
] as const;
export const QUESTS:ReadonlyArray<{title:string;label:string;hint:string;x:number;z:number}>=[
 {title:'Temui keluarga',label:'Keluarga',hint:'Dekati anggota keluarga bertanda emas, lalu tekan Interaksi.',x:-3.65,z:0.8},
 {title:'Lihat tayangan Baitullah',label:'Televisi',hint:'Dekati televisi bertanda emas, lalu tekan Interaksi.',x:0,z:-2.65},
 {title:'Mulai persiapan perjalanan',label:'Pintu',hint:'Dekati pintu bertanda emas dan tekan Interaksi.',x:5.35,z:2.6}
] as const;
export function makeSave(avatar:Avatar,campaign:Campaign):AdventureSave{return {version:1,avatar,campaign,quest:0};}
export function decodeSave(raw:string|null):AdventureSave|null{try{const s=JSON.parse(raw??'null');if(!s||s.version!==1||!['male','female'].includes(s.avatar)||!['umrah','hajj'].includes(s.campaign)||!Number.isInteger(s.quest)||s.quest<0||s.quest>3)return null;return {version:1,avatar:s.avatar,campaign:s.campaign,quest:s.quest};}catch{return null;}}
export function finishQuest(s:AdventureSave,expected:Quest):AdventureSave{return s.quest===expected&&expected<3?{...s,quest:(expected+1) as Quest}:s;}
export function route(c:Campaign):number[]{return LEVELS.map((_,i)=>i+1).filter(n=>c==='hajj'||n<=18||n>=32);}
