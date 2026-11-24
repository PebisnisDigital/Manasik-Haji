import {readAqabah} from './aqabahModel.ts';
import {loadNusukRoute} from './nusukRoute.ts';
import {nusukNumber,NUSUK_LEVELS} from './nusukModel.ts';
import {readSetup} from '../frontSettings.ts';
import {campaignContext,fieldKey} from './hajjCampaign.ts';
import {loadCampaign,readField} from './campaignProgress.ts';
import {coreUrl,newCore,writeCore,type Avatar} from '../coreProgress.ts';
import {tenantUrl,scopedKey} from '../tenant.ts';
import {playerKey} from '../playerCloud.ts';
import {decodeDistrict} from './districtModel.ts';
import {loadProgress,QUEST_KEYS,decodeTahallul} from './questProgress.ts';
const $=(id:string)=>document.getElementById(id)!;
($('map') as HTMLAnchorElement).href=tenantUrl('./adventure-map.html');
const chapter=campaignContext();
function render(){
 if(!chapter){$('title').textContent='Level tidak ditemukan';$('description').textContent='Pilih level dari peta perjalanan untuk melanjutkan.';return;}
 const campaign=loadCampaign(),state=campaign.chapters[chapter.number-1],save=readField(chapter),avatar=$('avatar') as HTMLSelectElement;
 const segment=new URLSearchParams(location.search).get('segment'),aqBeat=chapter.id==='aqabah'&&save?(save.step>=10?12:readAqabah(save.id,save.step>=9?7:0,save.step>=9).beat):undefined;
 const number=segment==='dam'?8:segment==='hajj-tahallul'?9:nusukNumber(chapter.id,aqBeat),level=NUSUK_LEVELS[number-1];
 $('chapterNumber').textContent='LEVEL '+String(number).padStart(2,'0')+' / 12 · HAJI · JALUR QIRAN';$('title').textContent=level.title;$('description').textContent=level.when+' · '+level.description+(chapter.id==='aqabah'?' Level 7–9 berlangsung berurutan di kawasan yang sama.':'');
 $('checkpoint').textContent=state.done?'Lencana level tersimpan · +50 koin. Buka kembali untuk melihat hasil dan melanjutkan.':save?'Checkpoint ditemukan. Lanjutkan misi yang belum selesai.':'Reward level: 50 koin dan lencana perjalanan.';
 const previous=campaign.chapters.slice(0,chapter.number-1).reverse().find(c=>c.save)?.save;
 const inherited=readSetup()?.avatar??previous?.avatar??loadProgress(QUEST_KEYS.tahallul,decodeTahallul)?.avatar??loadProgress(scopedKey('manasik-district-v1'),decodeDistrict)?.avatar;
 if(save)avatar.value=save.avatar;else if(inherited&&!avatar.dataset.chosen)avatar.value=inherited;
 avatar.onchange=()=>{avatar.dataset.chosen='true';};avatar.disabled=!!save||!!readSetup();
 const start=$('start') as HTMLButtonElement;start.disabled=!loadNusukRoute().chapters[nusukNumber(chapter.id)-1].available;start.textContent=state.done?(chapter.id==='ihram'?'Mainkan kegiatan Mina lagi':chapter.id==='arafah'?'Mainkan kegiatan Arafah lagi':chapter.id==='muzdalifah'?'Mainkan kegiatan Muzdalifah lagi':chapter.id==='aqabah'?'Mainkan kegiatan Aqabah lagi':'Lihat hasil level'):save?'Lanjutkan checkpoint':'Mulai level';
 $('notice').textContent=!start.disabled?'':'Selesaikan level sebelumnya untuk membuka misi ini.';
 start.onclick=()=>{
  if(!chapter||!loadNusukRoute().chapters[nusukNumber(chapter.id)-1].available)return;
  // Recheck on click: a different tab may already have advanced this chapter.
  const current=readField(chapter);
  let raw:string|null;try{raw=localStorage.getItem(playerKey(fieldKey(chapter)));}catch{$('notice').textContent='Penyimpanan browser tidak tersedia. Izinkan penyimpanan lalu coba lagi.';return;}
  try{if(JSON.parse(raw??'null')?.version>1){$('notice').textContent='Save berasal dari versi game yang lebih baru. Perbarui game untuk melanjutkan.';return;}}catch{/* A broken primary may recover from its backup. */}
  const next=current??{...newCore('hajj',avatar.value as Avatar,'Petualang'),step:chapter.start};
  if(!current&&!writeCore(next)){$('notice').textContent='Level belum tersimpan. Periksa kapasitas penyimpanan browser lalu coba lagi.';return;}
  location.assign(coreUrl(next)+((chapter.id==='ihram'||chapter.id==='arafah'||chapter.id==='muzdalifah'||chapter.id==='aqabah')&&next.step===chapter.end?'&replay='+ (chapter.id==='ihram'?'mina':chapter.id):''));
 };
}
render();window.addEventListener('pageshow',render);window.addEventListener('storage',render);
