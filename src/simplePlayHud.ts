import {districtReturnUrl} from './adventure/districtReturn.ts';
import {mountGraphics} from './graphicsQuality.ts';
import {NUSUK_LEVELS} from './adventure/nusukModel.ts';
import {nusukHajjActive} from './adventure/nusukMode.ts';
import {clearSimpleInput,setSimpleMenu,setSimpleShift,simpleMenuOpen,simpleSprinting,toggleSimpleRun} from './simpleInput.ts';
import {tenantUrl} from './tenant.ts';
import './simplePlayHud.css';
type Kind='field'|'miqat'|'tawaf'|'sai'|'adventure'|'district';
const text=(s:string)=>document.querySelector<HTMLElement>(s)?.textContent?.trim()??'';
const shown=(el:Element)=>!el.closest('[hidden]');
export function notifySimplePlay(message:string){document.dispatchEvent(new CustomEvent('simple-play-notice',{detail:message}));}
export function mountSimplePlayHud(kind:Kind){
 if(document.getElementById('simplePlay'))return;
 document.body.classList.add('simplePlay');document.body.dataset.simpleKind=kind;
 const root=document.createElement('div');root.id='simplePlay';root.innerHTML='<header class="simpleTop"><div><strong id="simpleLevel"></strong><small id="simpleCount"></small></div><button id="simpleGear" type="button" aria-label="Pengaturan" aria-haspopup="dialog">⚙</button></header><div id="simpleGuide" class="simpleGuide" role="status" aria-live="polite"></div><div class="simpleButtons"><button id="simpleRun" type="button" aria-pressed="false">Lari</button><button id="simpleAction" type="button">Aksi</button></div>';
 document.body.append(root);if(!document.querySelector('.graphicsControl')){const host=document.createElement('div');host.hidden=true;root.append(host);mountGraphics(host);}
 const dialog=document.createElement('dialog');dialog.id='simpleSettings';dialog.setAttribute('aria-labelledby','simpleSettingsTitle');dialog.innerHTML='<section><header><h2 id="simpleSettingsTitle">Pengaturan</h2><button id="simpleClose" type="button" aria-label="Tutup menu">×</button></header><p id="simpleContext" hidden></p><div id="simpleOptions"></div><button id="simpleResume" type="button">Lanjut bermain</button></section>';document.body.append(dialog);
 const el=(id:string)=>document.getElementById(id)!;
 const action=el('simpleAction') as HTMLButtonElement,run=el('simpleRun') as HTMLButtonElement,options=el('simpleOptions');
 let raf=0,disposed=false,activePopup:HTMLElement|null=null,notification='',notificationTimer=0;
 function popupFocus(){
  const popup=Array.from(document.querySelectorAll<HTMLElement>('.overlay,.layer')).filter(e=>!(e instanceof HTMLDialogElement)&&!e.hidden).at(-1)??null;
  if(popup===activePopup)return;const previous=activePopup;activePopup=popup;if(!popup){if(previous?.contains(document.activeElement)&&!overlay()&&!dialog.open)el('simpleGear').focus();return;}
  const heading=popup.querySelector<HTMLElement>('h1,h2');
  if(heading){if(!heading.id)heading.id=popup.id+'Title';popup.setAttribute('aria-labelledby',heading.id);}
  popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');
  const target=Array.from(popup.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select:not(:disabled)')).find(e=>e.getClientRects().length>0);
  target?.focus();
 }
 function overlay(){return !!document.querySelector('#certificate:not([hidden])')||Array.from(document.querySelectorAll<HTMLElement>('.overlay,.layer')).some(e=>!e.hidden&&(e instanceof HTMLDialogElement?e.open:true))||Array.from(document.querySelectorAll('dialog[open]')).some(e=>e!==dialog);}
 function candidates():HTMLElement[]{
  let selector=kind==='field'?'#actions button':kind==='miqat'?'#miqatInteract,#miqatWalk':kind==='district'?'#interactButton':kind==='tawaf'?'#nextSai,#auto':kind==='sai'?'#next,#auto':'#cutButton,#action';
  let nodes=selector.split(',').flatMap(s=>Array.from(document.querySelectorAll<HTMLElement>(s))).filter(e=>shown(e)&&!(e as HTMLButtonElement).disabled);
  if(kind==='miqat')nodes=nodes.slice(0,1);
  if(kind==='tawaf'||kind==='sai')nodes=nodes.slice(0,1);
  return nodes;
 }
 function sourceLevel(){if(kind==='field')return text('#levelLabel').replace(/^PETUALANGAN HAJI\s*[•·]\s*/,'');if(kind==='miqat')return text('.miqatHeader small');if(kind==='district')return text('#objectiveNumber');if(kind==='tawaf'||kind==='sai')return text('h1');return text('.hud .kicker,.hud .eyebrow');}
 function level(){const raw=sourceLevel();if(['field','tawaf','sai'].includes(kind)&&new URLSearchParams(location.search).get('campaign')!=='hajj')return raw;const number=Number(raw.match(/LEVEL\s*0?(\d+)/i)?.[1]);return kind!=='district'&&nusukHajjActive()&&NUSUK_LEVELS[number-1]?'Level '+number+'/12 · '+NUSUK_LEVELS[number-1].title:raw;}
 function counter(){if(kind==='tawaf'||kind==='sai')return text('#count');if(kind==='field'){const c=document.getElementById('fieldClock');if(c?.dataset.kind==='aqabah')return Number(c.dataset.aqabahBeat)<7?'Lontaran '+c.dataset.throws+'/7':Number(c.dataset.aqabahBeat)===7?'Panduan dam':'Tahallul '+c.dataset.cuts+'/3';if(c?.dataset.kind==='muzdalifah')return 'Kerikil '+c.dataset.stones+'/7';if(c?.dataset.campBeat!==undefined)return 'Kegiatan '+Math.min(11,Number(c.dataset.campBeat)+1)+'/11';if(c?.dataset.arafahBeat!==undefined)return 'Kegiatan '+Math.min(13,Number(c.dataset.arafahBeat)+1)+'/13';return [text('.throwMeters')?text('#eyebrow'):'',text('.throwMeters .active span'),text('.throwMeters .active strong')].filter(Boolean).join(' · ');}if(kind==='miqat'){const r=document.querySelector<HTMLElement>('.miqatRoom');return r?.dataset.phase==='tawaf'?'Putaran '+(r.dataset.laps??'0')+'/7':'';}return text('#lap,#leg,#step');}
 function guidance(){const alert=kind==='field'?text('#notice'):kind==='miqat'?text('#miqatNotice'):text('#notification:not([hidden]),#toast:not([hidden]),#banner:not([hidden])');if(notification&&!/belum|gagal|tidak tersedia|tidak dapat/i.test(alert))return notification;if(kind==='miqat'&&alert.startsWith('Kamera diarahkan'))return 'Amati Ka’bah, lalu tekan Aksi lagi.';if(alert&&!/Dekati penanda|^Lencana adalah/.test(alert))return alert.split(/(?<=[.!?])\s/)[0].slice(0,160);
  const objective=kind==='field'?text('#title'):kind==='miqat'?[text('#miqatGoal'),text('#miqatHint').split(/(?<=[.!?])\s/)[0]].filter(Boolean).join(' · '):kind==='district'?text('#routeCue:not([hidden])')||text('#missionTitle'):kind==='tawaf'||kind==='sai'?text('#status'):text('#cutPanel:not([hidden]) #cutText')||text('#mission,#title');
  const next=candidates()[0];return objective.split(/(?<=[.!?])\s/)[0].slice(0,160)+(next&&/Jalan ke lokasi|Dekati |Ikuti jalur|Jalan ke penanda/.test(next.textContent??'')?' · Ikuti penanda.':'');
 }
 const assign=(node:HTMLElement,value:string)=>{if(node.textContent!==value)node.textContent=value;};
 function paint(){raf=0;if(disposed)return;popupFocus();assign(el('simpleLevel'),level());assign(el('simpleCount'),counter());assign(el('simpleGuide'),guidance());
  const busy=overlay()||simpleMenuOpen();root.classList.toggle('simpleCovered',busy);if(document.body.classList.contains('simpleModalOpen')!==busy)document.body.classList.toggle('simpleModalOpen',busy);action.disabled=busy||!candidates().length;run.disabled=busy;run.setAttribute('aria-pressed',String(simpleSprinting()));assign(run,kind==='district'&&!!document.querySelector('#vehicleInfo:not([hidden])')?'Rem':'Lari');
 }
 function queue(){if(!raf)raf=requestAnimationFrame(paint);}
 const onNotification=(event:Event)=>{const message=(event as CustomEvent<unknown>).detail;if(typeof message!=='string')return;notification=message.slice(0,180);clearTimeout(notificationTimer);notificationTimer=window.setTimeout(()=>{notification='';queue();},6000);queue();};document.addEventListener('simple-play-notice',onNotification);
 function close(){setSimpleMenu(false);clearSimpleInput();window.dispatchEvent(new Event('blur'));dialog.close('control');}
 dialog.addEventListener('close',()=>{setSimpleMenu(false);clearSimpleInput();if(dialog.returnValue!=='control')window.dispatchEvent(new Event('blur'));paint();if(!overlay())el('simpleGear').focus();});
 el('simpleClose').onclick=el('simpleResume').onclick=close;
 function open(title:string,context=''){dialog.returnValue='';assign(el('simpleSettingsTitle'),title);assign(el('simpleContext'),context);el('simpleContext').hidden=!context;setSimpleMenu(true);window.dispatchEvent(new Event('blur'));dialog.showModal();(options.querySelector('button,select,a') as HTMLElement|null)?.focus();paint();}
 function proxy(source:HTMLElement){const b=document.createElement('button');b.type='button';b.textContent=(source.textContent??'').trim();b.onclick=()=>{close();source.click();queue();};options.append(b);}
 el('simpleGear').onclick=()=>{
  if(overlay())return;options.replaceChildren();
  const links=[['Peta level','./adventure-map.html?journey='+(nusukHajjActive()?'hajj':'umrah')],['Menu utama','./index.html?lobby=1']];
  const help=document.createElement('button');help.type='button';help.textContent='Cara main';help.onclick=()=>{assign(el('simpleSettingsTitle'),'Cara main');const p=document.createElement('p');p.textContent='Joystick untuk berjalan. Geser layar untuk melihat. Lari mempercepat gerakan; Aksi untuk berinteraksi atau mengikuti penanda. Di bus, Lari berubah menjadi Rem. PC: WASD/panah, Shift dan tombol AKSI.';options.replaceChildren(p);};options.append(help);
  const district=districtReturnUrl();if(district)links.unshift(['Kembali ke distrik',district]);
  for(const [label,href]of links){const a=document.createElement('a');a.textContent=label;a.href=tenantUrl(href);options.append(a);}
  const selectors=kind==='field'?'.coreVoice button,.coreVoice select':kind==='miqat'?'#miqatPause,#arrivalLook,.tawafRadio button':kind==='district'?'#pauseButton,#cameraButton':kind==='tawaf'||kind==='sai'?'.hud button:not(#auto):not(#pause):not(#brisk),.hud select:not(#avatar)':'#sound,#voice,#camera,#focus,#helpButton,#helpBtn,#guide';
  for(const source of new Set(document.querySelectorAll<HTMLElement>(selectors+',.graphicsControl select,.companionButton,.missionTrigger'))){if(source instanceof HTMLSelectElement){const label=document.createElement('label');label.textContent=source.id==='cameraMode'?'Kamera':'Grafis';const select=source.cloneNode(true) as HTMLSelectElement;select.removeAttribute('id');select.value=source.value;select.onchange=()=>{source.value=select.value;source.dispatchEvent(new Event('change',{bubbles:true}));};label.append(select);options.append(label);}else if(!source.closest('[hidden]'))proxy(source);}
  for(const source of document.querySelectorAll<HTMLElement>('.walkReset,.coreFull'))proxy(source);
  open('Pengaturan');
 };
 action.onclick=()=>{if(action.disabled)return;const list=candidates();if(list.length>1){options.replaceChildren();list.forEach(proxy);open(kind==='field'?text('#title')||'Pilih aksi':'Pilih aksi',kind==='field'?[level(),text('#body')].filter(Boolean).join(' — '):'');}else list[0]?.click();queue();};
 run.onclick=()=>{toggleSimpleRun();paint();};
 const reset=()=>{clearSimpleInput();queue();};
 window.addEventListener('keydown',e=>{if(e.code.startsWith('Shift')&&!overlay()&&!simpleMenuOpen()){setSimpleShift(true);queue();}if(e.code==='KeyE'&&!e.repeat&&['field','tawaf','sai'].includes(kind)&&!simpleMenuOpen()&&!overlay()){e.preventDefault();action.click();}});
 window.addEventListener('keyup',e=>{if(e.code.startsWith('Shift')){setSimpleShift(false);queue();}});window.addEventListener('blur',reset);window.addEventListener('orientationchange',reset);document.addEventListener('visibilitychange',reset);
 document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!activePopup||activePopup.hidden)return;const items=Array.from(activePopup.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select:not(:disabled),[tabindex="0"]')).filter(e=>e.getClientRects().length>0);if(!items.length)return;const first=items[0],last=items.at(-1)!;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 const observer=new MutationObserver(records=>{if(records.some(r=>!(r.target instanceof Element?r.target:r.target.parentElement)?.closest('#simplePlay,#simpleSettings')))queue();});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled','class','open']});
 document.addEventListener('close',e=>{if(e.target!==dialog){queue();requestAnimationFrame(()=>{if(!disposed&&!overlay()&&!simpleMenuOpen())el('simpleGear').focus();});}},true);
 window.addEventListener('pageshow',event=>{if(event.persisted&&kind!=='field'&&kind!=='miqat')location.reload();});
 paint();window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);clearTimeout(notificationTimer);document.removeEventListener('simple-play-notice',onNotification);observer.disconnect();clearSimpleInput();setSimpleMenu(false);},{once:true});
}
