import {loadNusukRoute} from './nusukRoute.ts';
import {withTransfer,umrahDeparture,readStory,miqatEntryUrl} from '../travelStory.ts';
import {mountJourney} from './journeyView.ts';
import {tenantUrl} from '../tenant.ts';
import {readSetup} from '../frontSettings.ts';
import {umrahLevels} from '../frontModel.ts';
import {readCore,newCore,writeCore,coreUrl,gamePage,coreStorageKey} from '../coreProgress.ts';
import {getProgramSettings} from '../adminApi.ts';
import {newSessionAllowed} from '../adminModel.ts';
import './campaignMap.css';
const element=(id:string)=>document.getElementById(id)!;
const umrah=new URLSearchParams(location.search).get('journey')==='umrah';
let launching=false;
if(!umrah)mountJourney(element('journeyPanel'));else element('oldJourney').hidden=true;
type Node={id:string;number:number;title:string;description:string;done:boolean;available:boolean;href:string;saved:boolean;field:boolean;when?:string};
function render(){
 const setup=readSetup(),saved=umrah?readCore('umrah'):null,campaign=loadNusukRoute();
 const chapters:Node[]=umrah?umrahLevels(saved).map(c=>({...c,id:'umrah-'+c.number,available:c.available||c.done,href:'#',saved:!!saved&&c.available,field:true})):campaign.chapters;
 element('nusukGuide').hidden=umrah;
 const total=chapters.length,done=chapters.filter(c=>c.done).length,next=chapters.find(c=>!c.done&&c.available)??chapters[total-1];
 element('total').textContent=done+'/'+total;element('meterFill').style.width=done/total*100+'%';
 element('mapKicker').textContent=umrah?'PERJALANAN UMROH':'PERJALANAN HAJI · JALUR QIRAN';element('mapCountLabel').textContent=umrah?'LEVEL SELESAI':'LEVEL SELESAI';
 element('mapDescription').textContent=umrah?'Lima tahap menuju akhir perjalanan Umroh. Jaga bekal, atur tenaga, dan tuntaskan setiap misi.':'12 langkah mengikuti urutan Nusuk, dimainkan melalui jalur qiran. Perjalanan dan pencarian rombongan tetap ada di dalam level. Tidak ada tahallul umrah awal.';
 element('mapSetup').textContent=setup?(setup.avatar==='female'?'Perempuan':'Laki-laki')+' · '+(umrah?'Umroh':'Haji'):'Siapkan karakter di menu utama';
 element('statusText').textContent=(done===total?'Perjalanan selesai!':'Berikutnya: '+next.title)+(umrah?' · Checkpoint tersimpan':' ◆ '+campaign.reward+' koin petualangan');
 const launchUmrah=async(e:Event)=>{e.preventDefault();if(launching)return;const chosen=readSetup();if(!chosen){location.assign(tenantUrl('./index.html?program=umrah'));return;}launching=true;
  try{let run=readCore('umrah');if(!run){let settings:Awaited<ReturnType<typeof getProgramSettings>>=[];try{settings=await getProgramSettings();}catch{}if(!newSessionAllowed(settings,'umrah')){element('statusText').textContent='Sesi baru Umroh sedang dijeda. Checkpoint lama tetap bisa dilanjutkan.';return;}
   run=readCore('umrah');if(!run){const k=coreStorageKey('umrah');if(!k||localStorage.getItem(k)!==null){element('statusText').textContent='Checkpoint belum dapat dibaca. Data lama tetap dilindungi; periksa versi game atau penyimpanan.';return;}run=newCore('umrah',chosen.avatar,'Petualang');if(!writeCore(run)){element('statusText').textContent='Perjalanan belum tersimpan. Periksa penyimpanan browser dan coba lagi.';return;}}
  }location.assign(run.step===0?miqatEntryUrl():umrahDeparture(run.step,coreUrl(run,gamePage(run.step)??'manasik.html')));}catch{element('statusText').textContent='Penyimpanan perjalanan belum tersedia. Coba lagi.';}finally{launching=false;}
 };
 const quick=element('quickPlay') as HTMLAnchorElement;quick.href=tenantUrl(done===total?(umrah?'./district.html':'./oleh-oleh.html'):umrah?'#':withTransfer(next.href));quick.textContent=done===total?(umrah?'✦ Kembali menjelajah kawasan':'✦ Buka ruang oleh-oleh pribadi'):'▶ '+(next.saved?'Lanjut':'Mulai')+' Level '+String(next.number).padStart(2,'0');quick.onclick=umrah&&done!==total?launchUmrah:null;
 const grid=element('levels');grid.replaceChildren();const groups=umrah?[[0,5,'MIQAT → TAHALLUL']] as const:[[0,3,'MAKKAH · IHRAM → TAWAF QUDUM → SA’I'],[3,6,'8–10 ZULHIJAH · MINA → ARAFAH → MUZDALIFAH'],[6,9,'10 ZULHIJAH · AQABAH → DAM → TAHALLUL'],[9,12,'IFADAH → MINA TASYRIK → WADA’']] as const;
 for(let index=0;index<groups.length;index++){const [start,end,worldName]=groups[index];const world=document.createElement('section');world.className='mapWorld';const heading=document.createElement('div');heading.className='worldLabel';heading.textContent=(umrah?'JALUR UMROH':('KAWASAN 0'+(index+1)))+' / '+worldName;world.append(heading);
  const row=document.createElement('div');row.className='worldNodes';if(end-start===5)row.classList.add('fiveNodes');if(end-start===3)row.classList.add('threeNodes');
  const path=document.createElementNS('http://www.w3.org/2000/svg','svg');path.classList.add('worldPath');path.setAttribute('viewBox','0 0 1000 160');path.setAttribute('preserveAspectRatio','none');path.setAttribute('aria-hidden','true');path.innerHTML='<path d="M80 48 C230 48 210 114 350 114 S490 48 650 48 S780 114 920 114"/>';row.append(path);
  for(const c of chapters.slice(start,end)){const item=document.createElement('article');item.className='level '+(c.done?'done':c.available?'active':'locked');item.dataset.chapter=c.id;
   const state=document.createElement('span');state.className='levelState';state.textContent=c.done?'✓ SELESAI':c.available?'MISI TERBUKA':'TERKUNCI';
   const number=document.createElement(c.available?'a':'span');number.className='levelNumber';number.textContent=String(c.number).padStart(2,'0');
   const title=document.createElement('strong');title.textContent=c.title;const description=document.createElement('p');description.textContent=c.description;
   const action=document.createElement(c.available?'a':'span');action.className='levelAction';action.textContent=c.done?(umrah||c.field?'Lihat perjalanan':'Main ulang'):c.saved?'Lanjut checkpoint →':c.available?'Mulai misi →':'Selesaikan misi sebelumnya';
   if(action instanceof HTMLAnchorElement){action.href=umrah?'#':tenantUrl(withTransfer(c.href));action.setAttribute('aria-label',c.title+' · '+action.textContent);if(umrah)action.onclick=launchUmrah;}
   if(number instanceof HTMLAnchorElement){number.href=umrah?'#':tenantUrl(withTransfer(c.href));number.setAttribute('aria-label','Buka '+c.title);if(umrah)number.onclick=launchUmrah;}const when=document.createElement('small');when.className='levelWhen';when.textContent=c.when??'';item.append(state,number,title,when,description,action);row.append(item);
  }world.append(row);grid.append(world);
 }
 element('levels').dataset.ready='true';
 document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a=>{if(a.getAttribute('href')!=='#')a.href=tenantUrl(a.getAttribute('href')!);});
}
render();window.addEventListener('pageshow',render);window.addEventListener('storage',render);
if(umrah&&new URLSearchParams(location.search).get('arrived')==='1'&&readStory().arrivals.includes('umrah:'+Math.min((readCore('umrah')?.step??0)+1,5))){history.replaceState(null,'',tenantUrl('./adventure-map.html?journey=umrah'));element('quickPlay').click();}
