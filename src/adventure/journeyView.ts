import {nusukHajjActive} from './nusukMode.ts';
import {scopedKey,tenantUrl} from '../tenant.ts';
import {QUEST_KEYS,loadProgress,decodeRoute,decodeTahallul} from './questProgress.ts';
import {decodeDistrict} from './districtModel.ts';
import {decodeErrands} from './districtActivities.ts';
import {journeyProgress,type JourneyRecords} from './journeyProgress.ts';
import './journeyView.css';

/** Derived view only: never migrate, reset, complete or write a chapter from the map. */
export function loadJourney(){
  const records:JourneyRecords={district:loadProgress(scopedKey('manasik-district-v1'),decodeDistrict),errands:loadProgress(scopedKey('manasik-district-errands-v1'),decodeErrands),
    tawaf:loadProgress(QUEST_KEYS.tawaf,r=>decodeRoute(r,'tawaf')),sai:loadProgress(QUEST_KEYS.sai,r=>decodeRoute(r,'sai')),tahallul:loadProgress(QUEST_KEYS.tahallul,decodeTahallul)};
  return journeyProgress(records);
}
export function mountJourney(host:HTMLElement){
  const heading=document.createElement('div');heading.className='journeyHeading';
  const title=document.createElement('h2');title.textContent='Rangkaian pembuka & bantuan';const status=document.createElement('span');heading.append(title,status);
  const list=document.createElement('ol');list.className='journeyStops';
  const action=document.createElement('a');action.className='journeyContinue';action.id='journeyContinue';
  const note=document.createElement('p');note.className='journeyNote';
  host.append(heading,list,action,note);
  function render(){const progress=loadJourney();status.textContent=progress.done+'/4 bagian selesai · '+progress.bonusDone+'/2 bantuan';list.replaceChildren();
    for(const stop of progress.stops.filter(s=>!nusukHajjActive()||s.title!=='Tahallul Umroh')){const item=document.createElement('li');item.className=stop.done?'journeyDone':stop.available?'journeyAvailable':'journeyLocked';
      const name=stop.available?document.createElement('a'):document.createElement('span');name.textContent=(stop.done?'✓ ':stop.available?'● ':'🔒 ')+stop.title;if(name instanceof HTMLAnchorElement)name.href=tenantUrl(stop.href);
      const detail=document.createElement('small');detail.textContent=stop.detail;item.append(name,detail);list.append(item);}
    action.href=tenantUrl(nusukHajjActive()&&progress.stops[2].done?'./hajj-adventure.html?campaign=hajj&chapter=ihram':progress.next.href);action.textContent='▶ '+(nusukHajjActive()&&progress.stops[2].done?'Lanjut Mina · tetap dalam ihram':progress.next.label);
    note.textContent=progress.complete?'Rangkaian pembuka selesai. Lanjutkan level Haji pada peta 12 level. Bantuan jemaah dan main ulang tetap tersedia.':'Progres dibaca dari checkpoint yang sudah ada. Level manasik tetap bisa diakses langsung melalui daftar level di bawah.';
  }
  render();const update=()=>render();window.addEventListener('pageshow',update);window.addEventListener('storage',update);
  return {dispose(){window.removeEventListener('pageshow',update);window.removeEventListener('storage',update);host.replaceChildren();}};
}
