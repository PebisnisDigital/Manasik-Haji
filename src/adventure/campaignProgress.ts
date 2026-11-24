import {journeyAvatar} from '../frontSettings.ts';
import {decodeCore,type CoreSave} from '../coreProgress.ts';
import {playerKey} from '../playerCloud.ts';
import {QUEST_KEYS,loadProgress,decodeRoute,decodeTahallul,chapterSummary} from './questProgress.ts';
import {HAJJ_CHAPTERS,fieldKey,validFieldSave,chapterHref,type FieldChapter} from './hajjCampaign.ts';

export function readField(chapter:FieldChapter):CoreSave|null {
 const decode=(raw:string|null)=>{const s=decodeCore(raw);return validFieldSave(s,chapter)?s:null;};
 const save=loadProgress(playerKey(fieldKey(chapter)),decode);return save?{...save,avatar:journeyAvatar(save.avatar)}:null;
}
/** Completion/rewards are derived from saved missions; opening the map never grants progress. */
export function loadCampaign(){
 const old=chapterSummary(loadProgress(QUEST_KEYS.tawaf,r=>decodeRoute(r,'tawaf')),loadProgress(QUEST_KEYS.sai,r=>decodeRoute(r,'sai')),loadProgress(QUEST_KEYS.tahallul,decodeTahallul));
 const chapters=HAJJ_CHAPTERS.map(chapter=>{
  const save='start' in chapter?readField(chapter):null;
  const done='end' in chapter?save?.step===chapter.end:old[chapter.id];
  return {...chapter,done,save,href:chapterHref(chapter),available:false};
 });
 for(let i=0;i<chapters.length;i++){
  // Existing three adventures remain directly accessible for old saves and bookmarks.
  chapters[i].available=chapters[i].done||!!chapters[i].save||i===0||i===2||chapters[i-1]?.done===true;
 }
 const done=chapters.filter(c=>c.done).length,next=chapters.find(c=>!c.done&&c.available)??chapters[11];
 return {chapters,done,complete:done===12,next,reward:old.reward+chapters.filter(c=>c.done&&'start' in c).length*50};
}
