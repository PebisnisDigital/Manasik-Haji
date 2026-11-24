import {chapterSummary,type RouteProgress,type TahallulProgress} from './questProgress.ts';
import type {DistrictSave} from './districtModel.ts';
import type {ErrandSave} from './districtActivities.ts';

export interface JourneyRecords {district:DistrictSave|null;errands:ErrandSave|null;tawaf:RouteProgress|null;sai:RouteProgress|null;tahallul:TahallulProgress|null}
export interface JourneyStop {title:string;detail:string;href:string;done:boolean;available:boolean}
export function journeyProgress(r:JourneyRecords){
  const chapters=chapterSummary(r.tawaf,r.sai,r.tahallul),district=r.district?.stage===5;
  const stops:JourneyStop[]=[
    {title:'Kawasan perjalanan',detail:district?'5/5 tujuan selesai':r.district?`Checkpoint tujuan ${r.district.stage+1}/5`:'Persiapan, rombongan dan perjalanan bus',href:'./district.html',done:district,available:true},
    {title:'Tawaf Qudum',detail:chapters.tawaf?'Selesai bersama pembimbing':r.tawaf?.stage===2?'7/7 putaran · temui pembimbing':r.tawaf?`${r.tawaf.count}/7 putaran · checkpoint ${r.tawaf.gate}`:'Mulai dari titik awal Tawaf',href:'./tawaf-adventure.html',done:chapters.tawaf,available:true},
    {title:'Sa’i Safa–Marwah',detail:chapters.sai?'Selesai bersama pembimbing':!chapters.tawaf?'Selesaikan Tawaf untuk membuka':r.sai?.stage===2?'7/7 lintasan · temui pembimbing':r.sai?`${r.sai.count}/7 lintasan · checkpoint ${r.sai.gate}`:'Lanjutkan dari Safa',href:'./sai-adventure.html',done:chapters.sai,available:chapters.tawaf},
    {title:'Tahallul Umroh',detail:chapters.tahallul?'Potong rambut dan kembali ke rombongan selesai':!chapters.sai?'Selesaikan Sa’i untuk membuka':r.tahallul?`Tahap ${r.tahallul.stage}/4 · ${r.tahallul.cuts}/3 area rambut`:'Temui pembimbing Tahallul',href:'./tahallul-adventure.html',done:chapters.tahallul,available:chapters.sai},
  ];
  const bonusDone=district?Number((r.errands?.stage??0)>=2)+Number(r.errands?.stage===4):0;
  const complete=stops.every(s=>s.done);
  // Preserve an explicitly active errand; existing chapter saves can continue without replaying the new district.
  let next={href:'./district.html',label:'Mulai perjalanan bersama rombongan'};
  if(district&&(r.errands?.stage===1||r.errands?.stage===3))next={href:'./district.html',label:r.errands.stage===1?'Lanjutkan pendampingan Pak Hasan':'Lanjutkan pengantaran paket'};
  else if(chapters.tahallul)next=!district?{href:'./district.html',label:'Jelajahi kawasan perjalanan'}:bonusDone<2?{href:'./district.html',label:'Lanjutkan bantuan jemaah'}:{href:'./tawaf-adventure.html',label:'Main ulang Tawaf'};
  else if(chapters.sai)next={href:'./tahallul-adventure.html',label:'Lanjutkan Tahallul'};
  else if(chapters.tawaf)next={href:'./sai-adventure.html',label:'Lanjutkan Sa’i'};
  else if(r.tawaf||district)next={href:'./tawaf-adventure.html',label:r.tawaf?'Lanjutkan checkpoint Tawaf':'Mulai Tawaf Umroh'};
  else if(r.district)next={href:'./district.html',label:'Lanjutkan checkpoint kawasan'};
  return {stops,next,complete,done:stops.filter(s=>s.done).length,bonusDone};
}
