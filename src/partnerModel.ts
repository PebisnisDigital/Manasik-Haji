import {levelNumber,type CoreStep} from './coreProgress.ts';
export interface PartnerRow{alias:string;umrah_step:CoreStep|null;hajj_step:CoreStep|null;last_sync:string|null}
export interface PartnerReport{participants:number;started:number;umrah_done:number;hajj_done:number;total:number;rows:PartnerRow[]}
export const reservedSlug=(s:string)=>s==='direct'||s==='demo-travel';
export function displayProgress(step:CoreStep|null,program:'hajj'|'umrah'):string{if(step===null)return 'Belum mulai';const total=program==='hajj'?11:4;return step===(program==='hajj'?18:5)?'Selesai '+total+'/'+total:'Level '+levelNumber(step)+'/'+total;}
export function partnerLink(slug:string,base:string){const u=new URL('./index.html',base);u.searchParams.set('mitra',slug);return u.href;}
