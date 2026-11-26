import type {GiftId} from './souvenirModel.ts';
// Isi URL HTTPS video YouTube atau video langsung setelah materi siap.
export const SOUVENIR_COURSES:{motion:string|null;stickman:string|null}={motion:null,stickman:null};
// Hadiah belum siap tetap dipajang tanpa link palsu.
export const SOUVENIR_ASSETS:Partial<Record<GiftId,string|null>>={prayers:null,ebook:null,checklist:null,planner:null,audio:null,wallpaper:null,stickers:null,photo:null,congrats:null,mystery:null};
