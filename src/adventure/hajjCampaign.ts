import type {CoreSave,CoreStep} from '../coreProgress.ts';

export const HAJJ_CHAPTERS=[
 {id:'miqat',number:1,title:'Miqat & Ihram Haji',description:'Temui pembimbing, siapkan ihram, pelajari niat haji qiran dan talbiyah.',start:0,end:1},
 {id:'arrival',number:2,title:'Menemukan Ka’bah',description:'Ikuti rombongan, kenali Ka’bah dan temukan titik awal tawaf.',start:0,end:1},
 {id:'tawaf',number:3,title:'Tawaf Qudum',description:'Jelajahi arena dan tuntaskan tujuh putaran.',href:'./tawaf-adventure.html'},
 {id:'sai',number:4,title:'Sa’i Safa–Marwah',description:'Jalani tujuh lintasan sampai Marwah.',href:'./sai-adventure.html'},
 {id:'tahallul',number:5,title:'Tahallul Umroh',description:'Pelajari ketentuan dan tahap tahallul.',href:'./tahallul-adventure.html'},
 {id:'ihram',number:6,title:'Mina · Hari Tarwiyah',description:'Tetap dalam ihram, perjalanan ke Mina, tenda dan bekal, bantu jemaah, salat Tarwiyah dan bermalam hingga Subuh.',start:5,end:6},
 {id:'arafah',number:7,title:'Wukuf Arafah',description:'Berangkat dari Mina, kenali area Arafah, siapkan air, salat jamak qasar, bantu jemaah, serta berdoa hingga matahari terbenam.',start:6,end:7},
 {id:'muzdalifah',number:8,title:'Mabit Muzdalifah',description:'Perjalanan malam, salat Magrib–Isya, bantuan jemaah, tujuh kerikil, mabit dan Subuh sebelum menuju Aqabah.',start:7,end:8},
 {id:'aqabah',number:9,title:'Jumrah Aqabah',description:'Perjalanan ke Mina, jalur Jamarat, tujuh lontaran Aqabah, panduan dam dan tahallul dibantu petugas.',start:8,end:10},
 {id:'ifadah',number:10,title:'Tawaf Ifadah',description:'Tujuh putaran Ifadah dan salat tawaf; Sa’i tidak diulang bila sudah dituntaskan setelah Qudum.',start:10,end:12},
 {id:'mina',number:11,title:'Mina & Hari Tasyrik',description:'Mabit, tiga jumrah setiap hari dan pilihan nafar awal atau tsani.',start:12,end:17},
 {id:'wada',number:12,title:'Tawaf Wada’',description:'Tuntaskan tujuh putaran penutup dan kembali ke peta perjalanan.',start:17,end:18},
] as const;
export type HajjChapter=typeof HAJJ_CHAPTERS[number];
export type FieldChapter=Extract<HajjChapter,{start:number}>;
export function fieldChapter(id:string|null):FieldChapter|null {
 return HAJJ_CHAPTERS.find((c):c is FieldChapter=>'start' in c&&c.id===id)??null;
}
/** Missing context is the original training mode. An invalid campaign never falls back to it. */
export function campaignRequested(search=typeof location==='undefined'?'':location.search):boolean{return new URLSearchParams(search).has('campaign');}
export function campaignContext(search=typeof location==='undefined'?'':location.search):FieldChapter|null {
 const p=new URLSearchParams(search);return p.get('campaign')==='hajj'?fieldChapter(p.get('chapter')):null;
}
export function fieldKey(chapter:FieldChapter,checkpoint=false):string{return 'manasik-hajj-'+chapter.id+(checkpoint?'-checkpoint':'')+'-v1';}
export function validFieldSave(save:CoreSave|null,chapter:FieldChapter):save is CoreSave {
 return !!save&&save.program==='hajj'&&save.step>=chapter.start&&save.step<=chapter.end;
}
export function fieldCap(step:CoreStep,chapter:FieldChapter|null):number|null{return chapter?.id==='arrival'&&step===0?3:null;}
export function chapterHref(chapter:HajjChapter):string{return 'href' in chapter?chapter.href:'./hajj-adventure.html?campaign=hajj&chapter='+chapter.id;}
export function nextChapter(chapter:HajjChapter):HajjChapter|null{return (HAJJ_CHAPTERS as readonly HajjChapter[])[chapter.number]??null;}
