import './companionView.css';
import {companionStory} from './companionModel.ts';

let opened=false;
export const companionOpen=()=>opened;
interface Options {chapter:()=>string;objective:()=>string;blocked:()=>boolean;onPause?:()=>void;onResume?:()=>void}
export function mountCompanion(host:HTMLElement,o:Options){
  const button=document.createElement('button');button.type='button';button.className='companionButton';button.textContent='Radio rombongan';button.setAttribute('aria-haspopup','dialog');
  const dialog=document.createElement('dialog');dialog.className='companionDialog';dialog.setAttribute('aria-label','Percakapan rombongan');
  const header=document.createElement('header'),badge=document.createElement('span'),title=document.createElement('h2'),sub=document.createElement('p');badge.className='companionBadge';
  const text=document.createElement('p');text.className='companionLine';text.setAttribute('aria-live','polite');const choices=document.createElement('div');choices.className='companionChoices';
  const close=document.createElement('button');close.type='button';close.textContent='Tutup radio';header.append(badge,title,sub);dialog.append(header,text,choices,close);host.append(button);document.body.append(dialog);
  const portrait=matchMedia('(orientation:portrait) and (pointer:coarse)');let disposed=false;
  function home(){
    const c=companionStory(o.chapter());title.textContent=c.speaker+' · Pembimbing';sub.textContent=c.place+' · Radio rombongan';badge.textContent=c.speaker.slice(0,1);
    text.textContent='Di sini '+c.speaker+'. Rombongan siap mendengarkan. Ada yang ingin kamu tanyakan?';choices.replaceChildren();
    for(const [label,line]of [['Tujuan kita sekarang?',o.objective().trim().slice(0,400)||c.care],['Cerita rombongan',c.story],['Tips perjalanan',c.care]]){
      const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{text.textContent=line;for(const sibling of choices.children)sibling.removeAttribute('aria-pressed');b.setAttribute('aria-pressed','true');};choices.append(b);
    }
  }
  button.onclick=()=>{if(disposed||opened||document.hidden||portrait.matches||o.blocked())return;home();try{dialog.showModal();}catch{return;}opened=true;o.onPause?.();window.dispatchEvent(new Event('blur'));choices.querySelector('button')?.focus();};
  close.onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{opened=false;window.dispatchEvent(new Event('blur'));o.onResume?.();if(!disposed&&button.isConnected&&!button.hidden)button.focus();});
  const orient=()=>{if(portrait.matches&&dialog.open)dialog.close();};portrait.addEventListener('change',orient);
  const hide=()=>{if(dialog.open)dialog.close();};window.addEventListener('pagehide',hide);
  return {button,dispose(){disposed=true;hide();portrait.removeEventListener('change',orient);window.removeEventListener('pagehide',hide);button.remove();dialog.remove();}};
}
