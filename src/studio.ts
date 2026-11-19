import {configured,me,session,signIn,logout,rest} from './commercialApi.ts';
import {SAMPLE,previewBrand,savePreview,cleanBrand,type Brand} from './tenant.ts';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const notice=(s:string)=>$('notice').textContent=s;const field=(id:string)=>$<HTMLInputElement>(id);const value=(id:string)=>field(id).value;
type Partner={id:string;slug:string;active:boolean;manasik_brand:Omit<Brand,'slug'>|Omit<Brand,'slug'>[]|null};type Row={alias:string;umrah_stage:number;hajj_stage:number};
let partners:Partner[]=[],selected:Partner|null=null,superadmin=false,saving=false,slugEdited=false;
const demo=!configured;
function formNotice(s:string,ok=false){$('editNotice').textContent=s;$('editNotice').classList.toggle('ok',ok);}
const slugify=(n:string)=>n.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50).replace(/-+$/g,'');
function whatsapp(raw:string){let n=raw.replace(/[\s()+.-]/g,'');if(n.startsWith('0'))n='62'+n.slice(1);return n;}
function draft():Brand{return cleanBrand({slug:value('slug'),name:value('name').trim(),logo_url:value('logo').trim(),accent:value('accent'),whatsapp:whatsapp(value('wa')),description:value('desc').trim()});}
function preview(){const b=draft();$('preview').style.background=b.accent;$('previewName').textContent=b.name||'Nama travel';$('previewDesc').textContent=b.description;const img=$<HTMLImageElement>('previewLogo');img.hidden=!b.logo_url;if(b.logo_url){img.src=b.logo_url;img.referrerPolicy='no-referrer';}else img.removeAttribute('src');const url=new URL('./index.html',location.href);url.searchParams.set('mitra',demo?SAMPLE.slug:b.slug);const a=$<HTMLAnchorElement>('open');a.href=url.href;const published=demo||!!selected;a.setAttribute('aria-disabled',String(!published));a.tabIndex=published?0:-1;$<HTMLButtonElement>('copy').disabled=!published;$('share').textContent=demo?'Preview custom hanya berlaku pada browser ini.':published?url.href:'Simpan mitra untuk mengaktifkan link ini.';}
function fill(b:Brand){field('slug').value=b.slug;field('name').value=b.name;field('logo').value=b.logo_url;field('accent').value=b.accent;field('wa').value=b.whatsapp;field('desc').value=b.description;preview();}
function rows(data:Row[]){$('total').textContent=String(data.length);$('uDone').textContent=String(data.filter(x=>x.umrah_stage===5).length);$('hDone').textContent=String(data.filter(x=>x.hajj_stage===13).length);$('rows').replaceChildren(...data.map(x=>{const tr=document.createElement('tr');for(const c of [x.alias||'Peserta',x.umrah_stage+'/5',x.hajj_stage+'/13']){const td=document.createElement('td');td.textContent=c;tr.append(td);}return tr;}));}
async function refresh(){if(demo){$('dataNote').textContent='DATA CONTOH • tiga peserta fiktif.';rows([{alias:'Peserta demo A',umrah_stage:5,hajj_stage:4},{alias:'Peserta demo B',umrah_stage:2,hajj_stage:13},{alias:'Peserta demo C',umrah_stage:1,hajj_stage:0}]);return;}if(!selected){rows([]);return;}$('dataNote').textContent='Progress tertinggi yang dilaporkan perangkat peserta, bukan nilai ujian resmi.';rows(await rest<Row[]>('manasik_participants?select=alias,umrah_stage,hajj_stage&partner_id=eq.'+selected.id+'&order=updated_at.desc',{auth:true}));}
function select(p:Partner|null){selected=p;slugEdited=!!p;formNotice('');$('formTitle').textContent=p?'Edit identitas travel':'Buat mitra baru';$('savePartner').textContent=p?'Simpan perubahan':'Buat & publikasikan mitra';$<HTMLSelectElement>('partner').value=p?.id??'';const b=p?.manasik_brand;const data=Array.isArray(b)?b[0]:b;fill(data&&p?{...data,slug:p.slug}:{...SAMPLE,slug:p?.slug??'',name:'',description:''});field('slug').disabled=!!p;field('active').checked=p?.active??true;$('grant').hidden=!superadmin||!p;void refresh().catch(e=>notice(e.message));}
async function load(preferredId?:string){const user=await me();superadmin=user.app_metadata?.manasik_superadmin===true;const memberships=await rest<{partner_id:string}[]>('manasik_members?select=partner_id',{auth:true});if(!superadmin&&!memberships.length){notice('Akun ini belum memiliki akses dashboard mitra.');$('login').hidden=true;$('logout').hidden=false;return;}$('identity').textContent=superadmin?'Superadmin • '+(user.email??''):'Manajer mitra • '+(user.email??'');$('login').hidden=true;$('logout').hidden=false;$('panel').hidden=$('data').hidden=false;$('new').hidden=!superadmin;$('activeLabel').hidden=!superadmin;const all=await rest<Partner[]>('manasik_partners?select=id,slug,active,manasik_brand(name,logo_url,accent,whatsapp,description)&order=slug',{auth:true});partners=superadmin?all:all.filter(p=>memberships.some(m=>m.partner_id===p.id));const sel=$<HTMLSelectElement>('partner');sel.replaceChildren(new Option(partners.length?'— Buat mitra baru —':'Belum ada mitra',''),...partners.map(p=>new Option(p.slug,p.id)));sel.options[0].disabled=!superadmin;select(partners.find(p=>p.id===preferredId)??partners[0]??null);}
$('edit').addEventListener('input',e=>{const target=e.target as HTMLElement;if(target.id==='slug')slugEdited=true;if(target.id==='name'&&!slugEdited&&!selected&&!demo)field('slug').value=slugify(value('name'));preview();});
$('edit').addEventListener('submit',async e=>{
 e.preventDefault();if(saving)return;formNotice('');
 const b=draft(),name=field('name'),slugField=field('slug');
 if(!b.name){formNotice('Isi nama travel terlebih dahulu.');name.focus();return;}
 if(!demo&&!selected&&!/^[a-z0-9][a-z0-9-]{1,49}$/.test(b.slug)||!demo&&!selected&&b.slug==='demo-travel'){formNotice('Alamat link harus 2–50 karakter, huruf kecil, angka atau tanda hubung.');slugField.focus();return;}
 if(value('logo').trim()&&!b.logo_url){formNotice('Logo harus berupa link https yang valid. Boleh dikosongkan.');field('logo').focus();return;}
 if(value('wa').trim()&&!b.whatsapp){formNotice('Nomor WhatsApp tidak valid. Gunakan 08... atau 628..., atau kosongkan.');field('wa').focus();return;}
 saving=true;const button=$<HTMLButtonElement>('savePartner');button.disabled=true;$<HTMLButtonElement>('new').disabled=true;$<HTMLSelectElement>('partner').disabled=true;button.textContent='Menyimpan...';
 try{
  if(demo){savePreview(b);formNotice('Preview disimpan di browser.',true);return;}
  let id=selected?.id;
  if(!id){
   if(!superadmin)throw Error('Akses superadmin diperlukan.');
   id=await rest<string>('rpc/manasik_create_partner',{auth:true,method:'POST',body:{p_slug:b.slug,p_name:b.name,p_logo_url:b.logo_url,p_accent:b.accent,p_whatsapp:b.whatsapp,p_description:b.description,p_active:field('active').checked}});
  }else{
   const {slug:_slug,...restBrand}=b;void _slug;
   await rest('manasik_brand?on_conflict=partner_id',{auth:true,method:'POST',body:{partner_id:id,...restBrand},prefer:'resolution=merge-duplicates'});
   if(superadmin)await rest('manasik_partners?id=eq.'+id,{auth:true,method:'PATCH',body:{active:field('active').checked}});
  }
  try{await load(id);formNotice('Mitra berhasil disimpan. Link simulator siap dibuka jika mitra aktif.',true);}catch{formNotice('Mitra sudah disimpan. Muat ulang halaman untuk melihatnya.',true);}
 }catch(e){const msg=(e as Error).message;formNotice(/duplicate key|unique constraint/i.test(msg)?'Alamat link sudah digunakan. Pilih alamat lain.':msg);}
 finally{saving=false;button.disabled=false;$<HTMLButtonElement>('new').disabled=false;$<HTMLSelectElement>('partner').disabled=false;button.textContent=selected||demo?'Simpan perubahan':'Buat & publikasikan mitra';}
});
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($<HTMLAnchorElement>('open').href);notice('Link disalin.');}catch{notice('Salin link melalui alamat preview.');}};
$('refresh').onclick=()=>{void refresh().catch(e=>notice(e.message));};$('new').onclick=()=>{select(null);field('name').focus();formNotice('Isi nama travel. Alamat link dibuat otomatis.');};
$<HTMLSelectElement>('partner').onchange=e=>select(partners.find(p=>p.id===(e.target as HTMLSelectElement).value)??null);
$('grant').addEventListener('submit',async e=>{e.preventDefault();if(!superadmin||!selected)return;try{await rest('manasik_members',{auth:true,method:'POST',body:{partner_id:selected.id,user_id:value('manager')},prefer:'resolution=ignore-duplicates'});notice('Akses manajer ditambahkan.');}catch(e){notice((e as Error).message);}});
$('login').addEventListener('submit',async e=>{e.preventDefault();try{const f=new FormData(e.target as HTMLFormElement);await signIn(String(f.get('email')),String(f.get('password')));(e.target as HTMLFormElement).reset();await load();}catch(e){notice((e as Error).message);}});
$('logout').onclick=async()=>{await logout();location.reload();};
if(demo){$('mode').textContent='WHITE LABEL • DEMO LOKAL';$('demoWarning').hidden=false;$('panel').hidden=$('data').hidden=false;$<HTMLSelectElement>('partner').append(new Option('Demo Travel','demo'));field('slug').disabled=true;$('formTitle').textContent='Edit identitas demo';$('savePartner').textContent='Simpan preview';fill(previewBrand());void refresh();}
else{$('mode').textContent='WHITE LABEL • AKSES AKUN';$('login').hidden=!!session();if(session())void load().catch(e=>{notice(e.message);$('login').hidden=false;});}
