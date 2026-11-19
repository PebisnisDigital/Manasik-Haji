import {configured,rest,session} from './commercialApi.ts';
export interface Brand{slug:string;name:string;logo_url:string;accent:string;whatsapp:string;description:string}
export const SAMPLE:Brand={slug:'demo-travel',name:'Demo Travel Manasik',logo_url:'',accent:'#246648',whatsapp:'',description:'Contoh identitas mitra • bukan travel nyata.'};
const PREVIEW='manasik-preview-v3';
export const slug=(()=>{const s=typeof location==='undefined'?'':new URLSearchParams(location.search).get('mitra')??'';return /^[a-z0-9][a-z0-9-]{1,49}$/.test(s)?s:'';})();
export function scopedKey(k:string):string{return slug?k+':'+slug+':'+(session()?.user?.id??'guest'):k;}
export function tenantUrl(path:string):string{if(!slug)return path;const u=new URL(path,location.href);if(u.origin!==location.origin)return path;u.searchParams.set('mitra',slug);return u.pathname+u.search+u.hash;}
export function previewBrand():Brand{try{const v=JSON.parse(localStorage.getItem(PREVIEW)??'null');if(v&&v.slug===SAMPLE.slug)return cleanBrand(v);}catch{}return SAMPLE;}
export function savePreview(b:Brand){localStorage.setItem(PREVIEW,JSON.stringify(cleanBrand({...b,slug:SAMPLE.slug})));}
export function cleanBrand(b:Brand):Brand{return {slug:b.slug,name:String(b.name??'').slice(0,100),logo_url:/^https:\/\//i.test(b.logo_url??'')?String(b.logo_url).slice(0,500):'',accent:/^#[0-9a-f]{6}$/i.test(b.accent??'')?b.accent:'#246648',whatsapp:/^[0-9]{8,15}$/.test(b.whatsapp??'')?b.whatsapp:'',description:String(b.description??'').slice(0,240)};}
interface DbPartner{id:string;slug:string;active:boolean;manasik_brand:Omit<Brand,'slug'>|Omit<Brand,'slug'>[]|null}
export async function lookup():Promise<{brand:Brand;id:string|null;demo:boolean}|null>{
 if(!slug)return null;if(slug===SAMPLE.slug)return {brand:previewBrand(),id:null,demo:true};if(!configured)return null;
 const rows=await rest<DbPartner[]>('manasik_partners?select=id,slug,active,manasik_brand(name,logo_url,accent,whatsapp,description)&active=eq.true&slug=eq.'+encodeURIComponent(slug));
 const p=rows[0];if(!p)return null;const b=Array.isArray(p.manasik_brand)?p.manasik_brand[0]:p.manasik_brand;if(!b)return null;return {brand:cleanBrand({...b,slug:p.slug}),id:p.id,demo:false};
}
let brand:Brand|null=null;
export function brandName(){return brand?.name??(slug===SAMPLE.slug?previewBrand().name:'MANASIK 3D');}
export function reportProgress(mode:'umrah'|'hajj',n:number):void{
 if(!configured||!slug||slug===SAMPLE.slug||!session())return;
 try{const k=scopedKey('manasik-pending-'+mode);const prev=Number(localStorage.getItem(k)??0);localStorage.setItem(k,String(Math.max(n,Number.isFinite(prev)?prev:0)));}catch{}
 void flush().catch(()=>{});
}
let flushing=false;
export async function flush(){
 if(flushing||!configured||!slug||slug===SAMPLE.slug||!session())return;flushing=true;
 try{const p=await lookup();if(!p?.id)return;const uid=session()!.user.id;
 for(const mode of ['umrah','hajj'] as const){const k=scopedKey('manasik-pending-'+mode);const raw=localStorage.getItem(k);if(raw===null)continue;const n=Number(raw),max=mode==='umrah'?5:13;if(!Number.isInteger(n)||n<0||n>max){localStorage.removeItem(k);continue;}
 const rows=await rest<{user_id:string}[]>('manasik_participants?partner_id=eq.'+p.id+'&user_id=eq.'+uid+'&'+mode+'_stage=lt.'+n,{method:'PATCH',auth:true,body:{[mode+'_stage']:n},prefer:'return=representation'});void rows;
 if(localStorage.getItem(k)===raw)localStorage.removeItem(k);
 }}finally{flushing=false;}
}
function apply(b:Brand,demo:boolean){
 brand=b;document.title=b.name+' — '+document.title.split('—').pop()?.trim();
 for(const el of document.querySelectorAll<HTMLElement>('[data-tenant-brand]')){el.textContent=b.name;if(b.logo_url){const img=document.createElement('img');img.src=b.logo_url;img.alt='';img.referrerPolicy='no-referrer';img.style.cssText='max-height:34px;max-width:100px;object-fit:contain;vertical-align:middle;margin-right:7px';el.prepend(img);}}
 const panel=document.querySelector<HTMLElement>('header');if(panel)panel.style.background=b.accent;
 const style=document.createElement('style');style.textContent='.action,.primary{background:'+b.accent+'!important;color:white!important}.tenant-chip{margin:7px 0;font-size:12px;font-weight:700;color:inherit}';document.head.append(style);
 const slot=document.querySelector<HTMLElement>('[data-tenant-menu]');
 if(slot){const d=document.createElement('div');d.className='tenant-chip';d.textContent=demo?'DEMO IDENTITAS MITRA • data contoh, bukan akun sungguhan':b.description;
 const a=document.createElement('a');a.className='secondary';a.href=tenantUrl('./peserta.html');a.textContent=demo?'Demo akun peserta':'Akun & izin progress';slot.append(d,a);if(b.whatsapp){const w=document.createElement('a');w.className='secondary';w.href='https://wa.me/'+b.whatsapp;w.textContent='Hubungi travel';w.target='_blank';w.rel='noopener noreferrer';slot.append(w);}}
}
export function bootTenant(){
 if(!slug)return;
 const rewire=(a:HTMLAnchorElement)=>{if(!new URL(a.href).searchParams.has('mitra')&&a.origin===location.origin&&/\/(index|umrah|hajj|player|sai|explore|peserta)\.html$|\/$/.test(a.pathname))a.href=tenantUrl(a.href);};
 document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(rewire);
 document.addEventListener('click',e=>{const a=(e.target as Element|null)?.closest('a[href]') as HTMLAnchorElement|null;if(a)rewire(a);},true);
 void lookup().then(p=>{if(p)apply(p.brand,p.demo);else{const el=document.querySelector<HTMLElement>('[data-tenant-brand]');if(el)el.textContent='Mitra tidak tersedia';}}).catch(()=>{});
 void flush().catch(()=>{});window.addEventListener('pageshow',()=>{void flush().catch(()=>{});});
}
