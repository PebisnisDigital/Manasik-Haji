import type {Avatar} from './coreProgress.ts';
/** Character choice controls the guide, independently of Haji/Umroh. */
export function gateGuide(avatar:Avatar){return avatar==='female'?{name:'Bu Salma',slot:'umrah' as const}:{name:'Pak Husen',slot:'hajj' as const};}

export const gateGreeting=(avatar:Avatar)=>avatar==='female'?'Ukhti':'Akhi';

/** A guide may route an existing invoice, never create a new one. */
export function guideLookupAction(lookup:string|undefined,registration:{status:string;access_suspended?:boolean}|null){
 if(lookup==='suspended'||registration?.access_suspended)return 'suspended';
 if(lookup==='review')return 'review';
 if(lookup==='new'&&!registration)return 'queue';
 if(lookup==='verified'&&registration?.status==='approved')return 'enter';
 if(lookup==='verified'&&(registration?.status==='pending'||registration?.status==='reported'))return 'invoice';
 return 'error';
}
