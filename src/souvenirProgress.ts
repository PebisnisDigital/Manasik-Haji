import {playerKey} from './playerCloud.ts';
import {decodeSouvenir,newSouvenir,type SouvenirSave} from './souvenirModel.ts';
export const souvenirKey=(owner:string)=>playerKey('manasik-souvenir-v1:'+owner);
export function readSouvenir(owner:string){try{const key=souvenirKey(owner);return decodeSouvenir(localStorage.getItem(key),owner)??decodeSouvenir(localStorage.getItem(key+'.backup'),owner);}catch{return null;}}
export function storeSouvenir(next:SouvenirSave){try{
 if(!decodeSouvenir(JSON.stringify(next),next.owner))return false;
 const key=souvenirKey(next.owner),raw=localStorage.getItem(key),backup=localStorage.getItem(key+'.backup');
 for(const value of [raw,backup])try{if(JSON.parse(value??'null')?.version>1)return false;}catch{}
 const previous=decodeSouvenir(raw,next.owner)??decodeSouvenir(backup,next.owner);
 if((raw!==null||backup!==null)&&!previous)return false;
 if(previous&&(previous.name!==next.name||previous.certificateId!==next.certificateId||previous.coupon!==next.coupon||previous.received&&!next.received||previous.issuedAt!==next.issuedAt))return false;
 if(decodeSouvenir(raw,next.owner))try{localStorage.setItem(key+'.backup',raw!);}catch{}
 localStorage.setItem(key,JSON.stringify(next));return true;
 }catch{return false;}}
export function ensureSouvenir(owner:string,name:string){const saved=readSouvenir(owner);if(saved)return saved;const next=newSouvenir(owner,name,crypto.randomUUID(),new Date().toISOString());return storeSouvenir(next)?next:null;}
