import {levelNumber,isComplete,checkpointCap,type CoreSave,type Program,type CoreStep} from './coreProgress.ts';
export type Place='miqat'|'haram'|'mina'|'muzdalifah'|'arafah';
export interface Mission{level:number;title:string;place:Place;detail:string}
export const placeNames:Record<Place,string>={miqat:'Miqat',haram:'Makkah · Masjidil Haram',mina:'Mina',muzdalifah:'Muzdalifah',arafah:'Arafah'};
const first:Mission[]=[
 {level:1,title:'Miqat & ihram',place:'miqat',detail:'Persiapan, niat umroh dan talbiyah.'},
 {level:2,title:'Tawaf umroh',place:'haram',detail:'Tujuh putaran, salat sunah dan Zamzam.'},
 {level:3,title:'Sa’i umroh',place:'haram',detail:'Tujuh lintasan Safa–Marwah.'},
 {level:4,title:'Tahallul umroh',place:'haram',detail:'Peragaan memotong rambut sesuai tuntunan.'}
];
const hajj:Mission[]=[...first,
 {level:5,title:'Ihram haji',place:'haram',detail:'Masuk ihram haji dari tempat tinggal di Makkah.'},
 {level:6,title:'Wukuf',place:'arafah',detail:'Berada di Arafah pada waktu wukuf.'},
 {level:7,title:'Mabit Muzdalifah',place:'muzdalifah',detail:'Mabit sesuai ketentuan dan persiapan kerikil.'},
 {level:8,title:'Aqabah & tahallul awal',place:'mina',detail:'Tujuh lontaran Aqabah, peragaan tahallul dan panduan dam.'},
 {level:9,title:'Ifadah & sa’i haji',place:'haram',detail:'Tawaf Ifadah dan tujuh lintasan sa’i haji.'},
 {level:10,title:'Mina & jumrah',place:'mina',detail:'Mabit dan tiga jumrah setiap hari; pilihan nafar awal atau tsani.'},
 {level:11,title:'Tawaf Wada’',place:'haram',detail:'Tawaf perpisahan sesuai ketentuan.'}
];
export const missions=(program:Program):readonly Mission[]=>program==='hajj'?hajj:first;
export type MissionStatus='done'|'current'|'locked'|'preview';
export function missionState(program:Program,save:CoreSave|null){const list=missions(program);const valid=save?.program===program?save:null,finished=!!valid&&isComplete(valid),current=valid?(finished?list.length:levelNumber(valid.step)):1;const completed=finished?list.length:valid?current-1:0;return {list,finished,current,completed,total:list.length,states:list.map(m=>(!valid?'preview':finished||m.level<current?'done':m.level===current?'current':'locked') as MissionStatus)};}
const sub:Partial<Record<CoreStep,string>>={0:'Persiapan ihram',1:'Tawaf umroh',2:'Salat sunah & Zamzam',3:'Sa’i umroh',4:'Tahallul umroh',5:'Ihram haji',6:'Wukuf Arafah',7:'Persiapan kerikil Muzdalifah',8:'Jumrah Aqabah',9:'Tahallul awal & dam',10:'Tawaf Ifadah',11:'Sa’i haji',12:'Mabit Mina',13:'Jumrah 11 Zulhijah',14:'Jumrah 12 Zulhijah',15:'Pilihan nafar',16:'Jumrah 13 Zulhijah',17:'Tawaf Wada’'};
export function currentDetail(save:CoreSave,count:number){if(isComplete(save))return 'Seluruh level selesai.';const cap=checkpointCap(save.step);return (sub[save.step]??'Latihan')+(cap?' · '+Math.min(cap,Math.max(0,count))+'/'+cap+' '+(save.step===1||save.step===10||save.step===17?'putaran':save.step===3||save.step===11?'lintasan':'kerikil'):'');}
export function placeRoute(program:Program):Place[]{return missions(program).map(m=>m.place).filter((p,i,a)=>i===0||p!==a[i-1]);}
