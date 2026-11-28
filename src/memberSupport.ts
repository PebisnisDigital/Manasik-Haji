import './gameAffiliateHud.css';
export const whatsappIcon='<path d="M20.4 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.1-4.1Z"/><path d="M8.2 7.8c-.7.4-.9 1.3-.6 2.2.8 2.4 2.9 4.5 5.2 5.3.9.3 1.8 0 2.3-.7l.5-.8-2.4-1.2-.8.8c-1.3-.5-2.1-1.3-2.6-2.6l.7-.8-1.1-2.4-.8.2Z"/>';
export async function getSupportGroup():Promise<string>{
 const res=await fetch('/api/registration/support-group',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
 const data=await res.json();if(!res.ok||typeof data.url!=='string'||!/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{16,64}$/.test(data.url))throw Error('Grup WhatsApp belum tersedia. Pastikan tiket Anda aktif.');
 return data.url;
}
export function supportContent(){
 const body=document.createElement('div');body.className='memberSupportContent';
 const intro=document.createElement('p');intro.textContent='Yuk, bergabung dengan grup resmi HAJJI.DIGITAL agar perjalanan belajar manasik lebih lancar.';
 const list=document.createElement('ul');for(const item of ['Bantuan saat mengalami kendala gameplay atau akses.','Support dan arahan penggunaan HAJJI.DIGITAL.','Informasi terbaru dan layanan member yang lebih maksimal.']){const li=document.createElement('li');li.textContent=item;list.append(li);}
 const action=document.createElement('a');action.textContent='Masuk Grup WA';action.target='_blank';action.rel='noopener noreferrer';action.className='memberSupportAction';action.setAttribute('aria-disabled','true');
 const note=document.createElement('p');note.className='memberSupportNote';note.setAttribute('role','status');
 const retry=document.createElement('button');retry.type='button';retry.className='memberSupportRetry';retry.textContent='Coba lagi';retry.hidden=true;
 let gen=0;
 async function refresh(){const id=++gen;action.removeAttribute('href');action.setAttribute('aria-disabled','true');retry.hidden=true;note.textContent='Memeriksa akses member…';try{const url=await getSupportGroup();if(id!==gen)return;action.href=url;action.setAttribute('aria-disabled','false');note.textContent='Grup khusus member HAJJI.DIGITAL.';}catch(err){if(id!==gen)return;note.textContent=err instanceof Error?err.message:'Grup belum tersedia.';retry.hidden=false;}}
 function clear(){gen++;action.removeAttribute('href');action.setAttribute('aria-disabled','true');}
 retry.onclick=()=>void refresh();body.append(intro,list,action,note,retry);return {body,refresh,clear};
}
export function mountMemberSupportShortcut(){
 if(window.parent!==window||document.getElementById('memberSupportShortcut'))return;
 const button=document.createElement('button');button.id='memberSupportShortcut';button.className='memberSupportStandalone';button.type='button';button.hidden=true;button.title='Grup WhatsApp';button.setAttribute('aria-label','Grup WhatsApp');button.setAttribute('aria-expanded','false');
 button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+whatsappIcon+'</svg>';
 const panel=document.createElement('aside');panel.id='memberSupportStandalonePanel';panel.hidden=true;panel.setAttribute('aria-label','Grup WhatsApp Member');const heading=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');title.textContent='Grup WhatsApp Member';close.type='button';close.textContent='×';close.setAttribute('aria-label','Tutup');heading.append(title,close);const content=supportContent();panel.append(heading,content.body);document.body.append(button,panel);
 const finish=()=>{panel.hidden=true;content.clear();button.setAttribute('aria-expanded','false');};
 button.onclick=()=>{if(!panel.hidden){finish();return;}panel.hidden=false;button.setAttribute('aria-expanded','true');void content.refresh();};close.onclick=finish;
 document.addEventListener('pointerdown',e=>{if(e.target instanceof Node&&!panel.contains(e.target)&&!button.contains(e.target))finish();},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)finish();});
 void getSupportGroup().then(()=>{button.hidden=false;}).catch(()=>{});
}
