import {readSetup} from '../frontSettings.ts';
import {loadProgress,QUEST_KEYS,decodeRoute} from './questProgress.ts';
/** One authored Hajj route: qiran, staying in ihram until the Day of Nahr. */
export function nusukHajjActive(){const p=new URLSearchParams(typeof location==='undefined'?'':location.search);if(p.get('program')==='umrah'||p.get('journey')==='umrah')return false;if(p.get('program')==='hajj'||p.get('campaign')==='hajj'||p.get('journey')==='hajj')return true;return readSetup()?.program!=='umrah';}
export function earlierHajjSaiDone(){return loadProgress(QUEST_KEYS.sai,r=>decodeRoute(r,'sai'))?.stage===3;}
