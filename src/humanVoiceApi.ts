import {rest,configured} from './commercialApi.ts';import type {VoiceTrack,VoiceRecord,VoiceId} from './humanVoiceModel.ts';
export const listPublicVoices=()=>configured?rest<VoiceTrack[]>('umroh_voice_library?select=reading_id,audio_url,reciter,approved,published'):Promise.resolve([]);
export const listAdminVoices=()=>rest<VoiceRecord[]>('umroh_voice_library?select=*&order=reading_id',{auth:true});
export const saveVoice=(row:VoiceRecord)=>rest<VoiceRecord[]>('umroh_voice_library?on_conflict=reading_id',{auth:true,method:'POST',body:row,prefer:'resolution=merge-duplicates,return=representation'});
export const unpublishVoice=(id:VoiceId)=>rest<VoiceRecord[]>('umroh_voice_library?reading_id=eq.'+id,{auth:true,method:'PATCH',body:{published:false},prefer:'return=representation'});
