import {clearSimpleInput,setSimpleMenu} from './simpleInput.ts';
export function mountAffiliateHud(gear:HTMLElement,canOpen:()=>boolean=()=>true){
 if(document.getElementById('gameAffiliateButton'))return;
 const button=document.createElement('button');button.id='gameAffiliateButton';button.type='button';button.className='gameAffiliateButton';button.title='Affiliate';button.setAttribute('aria-label','Affiliate');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/></svg>';
 gear.before(button);
 const dialog=document.createElement('dialog');dialog.id='gameAffiliateDialog';dialog.setAttribute('aria-label','Affiliate HAJJI.DIGITAL');
 const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');title.textContent='Affiliate Saya';close.type='button';close.textContent='×';close.setAttribute('aria-label','Tutup affiliate');header.append(title,close);
 const frame=document.createElement('iframe');frame.title='Pengaturan affiliate';frame.referrerPolicy='no-referrer';frame.allow='clipboard-write';dialog.append(header,frame);document.body.append(dialog);
 const finish=()=>{frame.removeAttribute('src');setSimpleMenu(false);clearSimpleInput();button.setAttribute('aria-expanded','false');window.dispatchEvent(new Event('blur'));button.focus({preventScroll:true});};
 close.onclick=()=>dialog.close();dialog.addEventListener('close',finish);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 button.onclick=()=>{if(dialog.open){dialog.close();return;}if(!canOpen()||document.querySelector('dialog[open]'))return;clearSimpleInput();setSimpleMenu(true);window.dispatchEvent(new Event('blur'));frame.src='/affiliate.html?embedded=1';dialog.showModal();button.setAttribute('aria-expanded','true');close.focus();};
 window.addEventListener('pagehide',()=>{if(dialog.open)dialog.close();},{once:true});
}
