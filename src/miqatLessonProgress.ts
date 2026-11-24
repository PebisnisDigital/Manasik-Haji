import {coreStorageKey,readCore,newCore,writeCore,commitCore,type Avatar,type Program} from './coreProgress.ts';
import {readMiqatLesson} from './miqatLessonModel.ts';
import {readStory} from './travelStory.ts';
import {campaignContext,campaignRequested} from './adventure/hajjCampaign.ts';
/** Award existing campaign progress only after every physical lesson objective is saved. */
export function completeMiqatLesson(program:Program,avatar:Avatar):boolean{
 const lesson=readMiqatLesson(program,avatar);if(lesson.stage<5||!lesson.book)return false;
 if(program==='hajj'?campaignContext()?.id!=='miqat':campaignRequested())return false;
 try{const key=coreStorageKey(program);if(!key)return false;for(const k of [key,key+'.backup'])try{if(JSON.parse(localStorage.getItem(k)??'null')?.version>1)return false;}catch{}
  let current=readCore(program);if(current&&current.step>0)return true;
  if(!current){if(localStorage.getItem(key)!==null||localStorage.getItem(key+'.backup')!==null)return false;current=newCore(program,avatar,readStory().name);if(!writeCore(current))return false;}
  return !!commitCore(current,0);
 }catch{return false;}
}
