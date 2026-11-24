import type {Avatar} from './coreProgress.ts';
/** Character choice controls the guide, independently of Haji/Umroh. */
export function gateGuide(avatar:Avatar){return avatar==='female'?{name:'Bu Salma',slot:'umrah' as const}:{name:'Pak Husen',slot:'hajj' as const};}
