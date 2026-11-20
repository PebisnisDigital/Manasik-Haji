import type {ReadingId} from './readingModel.ts';
export type VoiceId=ReadingId|'talbiyah_group';
export const VOICE_IDS:VoiceId[]=['talbiyah','talbiyah_group','takbir','rabbana','tawaf','sai','tahmid','tahlil','istighfar'];
export interface VoiceTrack{reading_id:VoiceId;audio_url:string;reciter:string;approved:boolean;published:boolean}
export interface VoiceRecord extends VoiceTrack{rights_note:string;reviewer:string;updated_at?:string}
export function voiceUrl(input:string):string|null{try{const u=new URL(input.trim());if(u.protocol!=='https:'||u.port||u.username||u.password||u.hash)return null;
 if(u.hostname==='www.dropbox.com'||u.hostname==='dropbox.com'){if(!/^\/(s|scl\/fi)\//.test(u.pathname))return null;u.hostname='dl.dropboxusercontent.com';u.searchParams.delete('dl');u.searchParams.delete('raw');}
 if(u.hostname==='dl.dropboxusercontent.com'){if(!/^\/(s|scl\/fi)\//.test(u.pathname))return null;}
 else if(u.hostname==='oitppkpvduriotwjnpow.supabase.co'){if(!u.pathname.startsWith('/storage/v1/object/public/umroh-audio/'))return null;}
 else return null;return u.href.length<=1500?u.href:null;}catch{return null;}}
export function selectVoice(rows:VoiceTrack[],reading:ReadingId|null,group=false):VoiceTrack|null{if(!reading)return null;const wanted=reading==='talbiyah'&&group?'talbiyah_group':reading;return rows.find(r=>r.reading_id===wanted&&r.approved&&r.published&&!!voiceUrl(r.audio_url))??null;}
export const groupAllowed=(reading:ReadingId|null)=>reading==='talbiyah';
