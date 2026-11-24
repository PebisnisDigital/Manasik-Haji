import type {Avatar,Program,CoreSave} from './coreProgress.ts';
import type {GraphicsMode} from './graphicsModel.ts';
export interface JourneySetup{version:1;program:Program;avatar:Avatar;graphics:GraphicsMode;voice:boolean;ambience:boolean;volume:number}
export const defaultSetup=():JourneySetup=>({version:1,program:'hajj',avatar:'male',graphics:'auto',voice:true,ambience:true,volume:70});
export function decodeSetup(raw:string|null):JourneySetup|null{try{const s=JSON.parse(raw??'null');return s?.version===1&&['hajj','umrah'].includes(s.program)&&['male','female'].includes(s.avatar)&&['auto','low','medium','high'].includes(s.graphics)&&typeof s.voice==='boolean'&&typeof s.ambience==='boolean'&&Number.isInteger(s.volume)&&s.volume>=0&&s.volume<=100?{version:1,program:s.program,avatar:s.avatar,graphics:s.graphics,voice:s.voice,ambience:s.ambience,volume:s.volume}:null;}catch{return null;}}
export const UMRAH_LEVELS=[
 {title:'Miqat & Ihram',description:'Temui pemandu, siapkan ihram, niat dan talbiyah.'},
 {title:'Tawaf',description:'Tuntaskan tujuh putaran mengelilingi Ka’bah.'},
 {title:'Salat & Zamzam',description:'Ikuti peragaan salat dan minum Zamzam dengan tertib.'},
 {title:'Sa’i Safa–Marwah',description:'Jalani tujuh lintasan dari Safa menuju Marwah.'},
 {title:'Tahallul',description:'Selesaikan peragaan sesuai karakter, lalu tuntaskan perjalanan.'},
] as const;
export function umrahLevels(save:CoreSave|null){const step=save?.program==='umrah'?save.step:0;return UMRAH_LEVELS.map((level,index)=>({...level,number:index+1,done:step>index,available:step===index,step:index}));}
