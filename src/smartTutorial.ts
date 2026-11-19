import './smartTutorial.css';
import {freshTutorial,train,nextSkill,skills,type Skill,type TutorialKind,type TutorialEvent} from './tutorialModel.ts';
type Options={kind:TutorialKind;host:HTMLElement;blocked?:()=>boolean;ready?:()=>boolean};
const icons:Record<Skill,string>={walk:'<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="6"/><path d="M24 3V9M24 39V45M3 24H9M39 24H45"/>',look:'<rect x="5" y="8" width="38" height="30" rx="5"/><path d="M13 24H35M18 19l-5 5 5 5m12-10 5 5-5 5"/>',guide:'<circle cx="24" cy="15" r="6"/><path d="M12 40v-7a12 12 0 0 1 24 0v7M33 7h10v9l-5-3h-5"/>',arrival:'<path d="M24 43S9 29 9 19a15 15 0 0 1 30 0c0 10-15 24-15 24Z"/><circle cx="24" cy="19" r="5"/>',action:'<rect x="5" y="13" width="38" height="23" rx="6"/><path d="m16 24 6 6 12-12"/>',route:'<path d="M9 36C9 14 39 14 39 36M9 36l-5-7m5 7 7-2M39 36l-7-2m7 2 5-7"/><circle cx="24" cy="12" r="4"/>'};
export function installSmartTutorial(o:Options){
 const key='umroh-tutorial-v1:'+o.kind;let dismissed=false;try{dismissed=localStorage.getItem(key)==='done';}catch{}
 let state=freshTutorial(),enabled=!dismissed,visible=false,lastSkill:Skill|null=null,marked:HTMLElement[]=[];
 const button=document.createElement('button');button.type='button';button.className='tutorialReplay';button.textContent='? Bantuan';button.setAttribute('aria-label','Ulangi petunjuk bermain');o.host.append(button);
 const panel=document.createElement('section');panel.className='smartTutorial tutorial-'+o.kind;panel.hidden=true;panel.setAttribute('aria-label','Petunjuk bermain');panel.innerHTML='<div class="tutorialGraphic"></div><div class="tutorialWords"><div class="tutorialStep"></div><strong class="tutorialTitle"></strong><p class="tutorialBody"></p></div><button type="button" class="tutorialSkip">Lewati</button>';document.body.append(panel);
 const $=(s:string)=>panel.querySelector<HTMLElement>(s)!;
 const touch=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;
 function info(k:Skill):{title:string;body:string;target:string}{switch(k){
 case 'walk':return {title:'Coba berjalan',body:touch()?'Geser bulatan joystick kiri.':'Tekan W A S D atau tombol panah.',target:o.kind==='lobby'?'#joystick':'#joy'};
 case 'look':return {title:'Lihat sekitar',body:touch()?'Geser layar dengan satu jari.':'Klik dan geser pada dunia 3D.',target:''};
 case 'guide':return {title:'Temui pemandu',body:'Dekati pemandu atau pilih Haji / Umroh.',target:'#goHajj,#goUmrah'};
 case 'arrival':return {title:'Dekati penanda',body:'Tekan Jalan ke lokasi, atau gunakan joystick.',target:'.walkJoy,#actions button'};
 case 'action':return {title:'Ikuti panduan',body:'Tekan tombol aktivitas saat sudah tiba.',target:'#actions button:not(:disabled)'};
 case 'route':return {title:o.kind==='tawaf'?'Ikuti jalur tawaf':'Ikuti jalur sa’i',body:'Tekan Ikuti jalur otomatis bila perlu.',target:'#auto'};
 }}
 function clear(){for(const e of marked)e.classList.remove('tutorialTarget');marked=[];}
 function paint(){const k=nextSkill(state,o.kind),show=enabled&&!!k&&(!o.ready||o.ready())&&!document.hidden&&!o.blocked?.()&&!document.documentElement.classList.contains('missionOpen');if(!show){if(visible){panel.hidden=true;visible=false;clear();}return;}if(!k)return;const i=info(k);if(!visible||lastSkill!==k){lastSkill=k;$('.tutorialGraphic').innerHTML='<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[k]+'</svg>';$('.tutorialStep').textContent='CARA MAIN · '+(skills(o.kind).indexOf(k)+1)+'/'+skills(o.kind).length;$('.tutorialTitle').textContent=i.title;$('.tutorialBody').textContent=i.body;panel.hidden=false;visible=true;}const next=i.target?Array.from(document.querySelectorAll<HTMLElement>(i.target)).filter(e=>!e.hidden&&e.getClientRects().length):[];if(next.length!==marked.length||next.some((e,i)=>e!==marked[i])){clear();marked=next;for(const e of marked)e.classList.add('tutorialTarget');}}
 function finish(){enabled=false;try{localStorage.setItem(key,'done');}catch{}paint();}
 function event(e:TutorialEvent){if(!enabled||o.blocked?.()||document.hidden||o.ready&&!o.ready())return;const before=nextSkill(state,o.kind);state=train(state,e);const after=nextSkill(state,o.kind);if(!after){finish();return;}if(before!==after)paint();}
 function replay(){state=freshTutorial();enabled=true;lastSkill=null;paint();}
 button.onclick=replay;$('.tutorialSkip').onclick=finish;
 window.addEventListener('resize',paint);document.addEventListener('visibilitychange',paint);window.addEventListener('pagehide',clear);
 return {event,paint,replay,finish,button,hide(){panel.hidden=true;clear();visible=false;}};
}
