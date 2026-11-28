import {clearSimpleInput,setSimpleMenu} from './simpleInput.ts';
import './gameAffiliateHud.css';
import {getSupportGroup,supportContent,whatsappIcon} from './memberSupport.ts';
type View='affiliate'|'commission'|'support';
export function mountAffiliateHud(gear:HTMLElement,canOpen:()=>boolean=()=>true){
 if(document.getElementById('gameAffiliateButton'))return;
 const svg=(shape:string)=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
 function makeButton(id:string,label:string,shape:string){const b=document.createElement('button');b.id=id;b.type='button';b.className='gameAffiliateButton '+(gear.classList.contains('iconButton')?'iconButton secondary':'');b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-controls','gameAffiliateDialog');b.setAttribute('aria-expanded','false');b.innerHTML=svg(shape);return b;}
 const network=makeButton('gameAffiliateButton','Affiliate','<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>');
 const money=makeButton('gameCommissionButton','Komisi Saya','<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 9a4 4 0 0 0 4-4m12 0a4 4 0 0 0 4 4M2 15a4 4 0 0 1 4 4m12 0a4 4 0 0 1 4-4"/>');
 const whatsapp=makeButton('gameSupportButton','Grup WhatsApp',whatsappIcon);whatsapp.hidden=true;
 gear.before(network,money,whatsapp);
 void getSupportGroup().then(()=>{whatsapp.hidden=false;alignIcons();}).catch(()=>{});
 const panel=document.createElement('aside');panel.id='gameAffiliateDialog';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','gameAffiliateTitle');
 const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');title.id='gameAffiliateTitle';title.textContent='Affiliate Saya';close.type='button';close.textContent='×';close.setAttribute('aria-label','Tutup panel');header.append(title,close);
 const frame=document.createElement('iframe');frame.title='Dashboard pemain';frame.referrerPolicy='no-referrer';frame.allow='clipboard-write';const support=supportContent();support.body.hidden=true;panel.append(header,frame,support.body);document.body.append(panel);
 let trigger=network;
 function alignIcons(){const rect=gear.getBoundingClientRect();if(rect.width&&rect.height){for(const b of [network,money,whatsapp]){b.style.setProperty('--affiliate-icon-width',rect.width+'px');b.style.setProperty('--affiliate-icon-height',rect.height+'px');}}}
 function position(){const rect=gear.getBoundingClientRect();panel.style.top=Math.round(rect.bottom+8)+'px';panel.style.right=Math.max(8,Math.round(innerWidth-rect.right))+'px';panel.style.maxHeight=Math.max(100,innerHeight-rect.bottom-20)+'px';panel.style.height=panel.dataset.view==='support'?'auto':'min(620px, '+Math.max(100,innerHeight-rect.bottom-20)+'px)';}
 function finish(restoreFocus=true){if(panel.hidden)return;panel.hidden=true;frame.removeAttribute('src');support.clear();support.body.hidden=true;document.body.classList.remove('affiliateHudOpen');setSimpleMenu(false);clearSimpleInput();network.setAttribute('aria-expanded','false');money.setAttribute('aria-expanded','false');whatsapp.setAttribute('aria-expanded','false');window.dispatchEvent(new Event('blur'));if(restoreFocus)trigger.focus({preventScroll:true});}
 close.onclick=()=>finish();
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&e.target instanceof Node&&!panel.contains(e.target)&&!network.contains(e.target)&&!money.contains(e.target)&&!whatsapp.contains(e.target))finish(false);},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();e.stopPropagation();finish();}},true);
 frame.addEventListener('load',()=>{try{frame.contentDocument?.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}});}catch{}});
 function open(view:View,b:HTMLButtonElement){if(!panel.hidden){if(trigger===b){finish();return;}finish(false);}if(!canOpen()||document.querySelector('dialog[open]'))return;trigger=b;title.textContent=view==='affiliate'?'Affiliate Saya':view==='commission'?'Komisi Saya':'Grup WhatsApp Member';frame.title=title.textContent;panel.dataset.view=view;position();clearSimpleInput();setSimpleMenu(true);window.dispatchEvent(new Event('blur'));document.body.classList.add('affiliateHudOpen');frame.hidden=view==='support';support.body.hidden=view!=='support';if(view==='support'){frame.removeAttribute('src');void support.refresh();}else frame.src='/affiliate.html?embedded=1&view='+view;panel.hidden=false;b.setAttribute('aria-expanded','true');close.focus({preventScroll:true});}
 network.onclick=()=>open('affiliate',network);money.onclick=()=>open('commission',money);whatsapp.onclick=()=>open('support',whatsapp);
 alignIcons();requestAnimationFrame(alignIcons);
 window.addEventListener('resize',()=>{alignIcons();if(!panel.hidden)position();});
 window.addEventListener('pagehide',()=>finish(false),{once:true});
}
