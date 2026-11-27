import {clearSimpleInput,setSimpleMenu} from './simpleInput.ts';
type View='affiliate'|'commission';
export function mountAffiliateHud(gear:HTMLElement,canOpen:()=>boolean=()=>true){
 if(document.getElementById('gameAffiliateButton'))return;
 const svg=(shape:string)=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
 function makeButton(id:string,label:string,shape:string){const b=document.createElement('button');b.id=id;b.type='button';b.className='gameAffiliateButton';b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','gameAffiliateDialog');b.setAttribute('aria-expanded','false');b.innerHTML=svg(shape);return b;}
 const network=makeButton('gameAffiliateButton','Affiliate','<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>');
 const money=makeButton('gameCommissionButton','Komisi Saya','<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 9a4 4 0 0 0 4-4m12 0a4 4 0 0 0 4 4M2 15a4 4 0 0 1 4 4m12 0a4 4 0 0 1 4-4"/>');
 gear.before(network,money);
 const dialog=document.createElement('dialog');dialog.id='gameAffiliateDialog';dialog.setAttribute('aria-labelledby','gameAffiliateTitle');
 const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');title.id='gameAffiliateTitle';title.textContent='Affiliate Saya';close.type='button';close.textContent='×';close.setAttribute('aria-label','Tutup panel');header.append(title,close);
 const frame=document.createElement('iframe');frame.title='Dashboard pemain';frame.referrerPolicy='no-referrer';frame.allow='clipboard-write';dialog.append(header,frame);document.body.append(dialog);
 let trigger=network;
 function position(){const rect=gear.getBoundingClientRect();dialog.style.top=Math.round(rect.bottom+8)+'px';dialog.style.right=Math.max(8,Math.round(innerWidth-rect.right))+'px';dialog.style.height='min(690px, '+Math.max(100,innerHeight-rect.bottom-20)+'px)';}
 const finish=()=>{frame.removeAttribute('src');setSimpleMenu(false);clearSimpleInput();network.setAttribute('aria-expanded','false');money.setAttribute('aria-expanded','false');window.dispatchEvent(new Event('blur'));trigger.focus({preventScroll:true});};
 close.onclick=()=>dialog.close();dialog.addEventListener('close',finish);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 function open(view:View,b:HTMLButtonElement){if(dialog.open){dialog.close();return;}if(!canOpen()||document.querySelector('dialog[open]'))return;trigger=b;title.textContent=view==='affiliate'?'Affiliate Saya':'Komisi Saya';frame.title=title.textContent;position();clearSimpleInput();setSimpleMenu(true);window.dispatchEvent(new Event('blur'));frame.src='/affiliate.html?embedded=1&view='+view;dialog.showModal();b.setAttribute('aria-expanded','true');close.focus();}
 network.onclick=()=>open('affiliate',network);money.onclick=()=>open('commission',money);
 window.addEventListener('resize',()=>{if(dialog.open)position();});
 window.addEventListener('pagehide',()=>{if(dialog.open)dialog.close();},{once:true});
}
