import {nusukHajjActive} from './nusukMode.ts';
import {mountCompanion} from './companionView.ts';
import './adventureHud.css';
import {tenantUrl} from '../tenant.ts';
import {withTransfer} from '../travelStory.ts';
interface Snapshot {stage:number;count?:number;gate?:number;reward:number;distance:number;nearGuide:boolean;complete:boolean}
export function mountAdventureHud(){
  const onDeparture=(e:MouseEvent)=>{const link=(e.target as Element|null)?.closest<HTMLAnchorElement>('a[href]');if(!link||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const original=link.getAttribute('href')!;const departure=withTransfer(original);if(departure!==original){e.preventDefault();location.assign(tenantUrl(departure));}};document.addEventListener('click',onDeparture);
  const root=document.createElement('aside');root.className='adventureTracker';root.setAttribute('aria-label','Progres petualangan');
  const reward=document.createElement('strong'),hint=document.createElement('span'),save=document.createElement('span');
  save.setAttribute('role','status');save.className='checkpointState';root.append(reward,hint,save);document.body.append(root);
  const returnLinks:HTMLAnchorElement[]=[];
  for(const id of ['mapLayer','endLayer','pause','end','finish']){
    const mapLink=document.getElementById(id)?.querySelector<HTMLAnchorElement>('a[href*="adventure-map.html"]');
    if(!mapLink)continue;const link=document.createElement('a');link.className=mapLink.className;link.style.cssText=mapLink.style.cssText;link.href=tenantUrl('./district.html');link.textContent='Kembali ke rombongan';mapLink.after(link);returnLinks.push(link);
  }
  if(nusukHajjActive()&&location.pathname.endsWith('tahallul-adventure.html')){const finish=document.getElementById('finish');if(finish){const link=document.createElement('a');link.href=tenantUrl('./hajj-adventure.html?campaign=hajj&chapter=ihram');link.textContent='Lanjut Level 04 · Mina';link.className=finish.querySelector('a')?.className??'';(finish.querySelector('.row')??finish).append(link);returnLinks.push(link);}}
  const overlays=Array.from(document.querySelectorAll<HTMLElement>('.layer,.overlay'));
  const blocked=()=>overlays.some(el=>!el.hidden);
  const companion=mountCompanion(document.body,{chapter:()=>location.pathname.includes('tahallul')?'tahallul':location.pathname.includes('sai-')?'sai':'tawaf',objective:()=>[document.getElementById('mission')?.textContent??document.getElementById('title')?.textContent,document.getElementById('hint')?.textContent??document.getElementById('journey')?.textContent,hint.textContent].filter(Boolean).join('. '),blocked,onPause:()=>{if('speechSynthesis' in window)speechSynthesis.cancel();}});
  companion.button.classList.add('adventureCompanion');
  const visibility=()=>{companion.button.hidden=blocked();};const observer=new MutationObserver(visibility);overlays.forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['hidden']}));visibility();
  let signature='';
  return {
    update(s:Snapshot){const text=[s.stage,s.count,s.gate,s.reward,Math.ceil(s.distance),s.nearGuide,s.complete].join('|');if(text===signature)return;signature=text;
      reward.textContent='◆ '+s.reward+' koin petualangan'+(s.complete?' · Lencana level diraih':'');
      hint.textContent=s.complete?'Level tuntas · buka peta perjalanan':s.nearGuide?'Pembimbing: tekan E / Interaksi':Math.ceil(s.distance)+' m menuju tujuan'+(s.stage===1&&s.gate!==undefined?' · checkpoint '+s.gate:'');
    },
    saved(ok:boolean){save.textContent=ok?'✓ Checkpoint tersimpan':'Checkpoint belum tersimpan · penyimpanan penuh atau tidak tersedia';save.classList.toggle('saveFailed',!ok);},
    dispose(){document.removeEventListener('click',onDeparture);observer.disconnect();companion.dispose();root.remove();returnLinks.forEach(a=>a.remove());},
  };
}
/** Read-only diagnostics for local regression checks; never shipped in production. */
export function adventureDiagnostics(snapshot:()=>object){if(import.meta.env.DEV)Object.assign(window,{__adventureDebug:{snapshot}});}
