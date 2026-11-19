import {VoiceGuide} from '../audio/VoiceGuide.ts';
import {bootTenant,scopedKey} from '../tenant.ts';
import {Ambience} from './ambience.ts';
import {LEVELS,makeSave,decodeSave,finishQuest,route,missions,coins,unlockNext,type AdventureSave,type Avatar,type Campaign} from './state.ts';
import {LESSONS,type Lesson} from './lessons.ts';
import {mountHome,type HomeWorld} from './homeScene.ts';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const btn=(id:string)=>$<HTMLButtonElement>(id);
const KEY=scopedKey('manasik-adventure-v4');let save:AdventureSave=makeSave('male','umrah');
try{save=decodeSave(localStorage.getItem(KEY))??save;}catch{}
const guide=new VoiceGuide('Selamat datang! Ikuti penanda emas untuk menyelesaikan misi.');
const ambience=new Ambience();let world:HomeWorld|null=null,fallback=false,settings=false,audioStarted=false,sound=false,transition=false,rewardTimer=0,dialogTimer=0,dialogEpoch=0,lineIndex=0,currentLesson:Lesson|null=null;
const prompts=[
 ['Yuk, sentuh koin emas di dekat ibu.','Sekarang, ambil koin di depan televisi.','Bagus! Ambil koin dekat pintu rumah.'],
 ['Yuk, ambil koin di dekat sajadah.','Sekarang, ambil koin di meja ruang tamu.','Temui keluarga lagi dan sentuh koin emas.']
];
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));$('checkpoint').textContent='Checkpoint lokal tersimpan.';}catch{$('checkpoint').textContent='Checkpoint tidak dapat disimpan.';}}
function instruct(){const text=prompts[save.level-1][save.quest];if(text){guide.announce(text,'mission-'+save.level+'-'+save.quest,0,true);$('fallbackHint').textContent=text;}}
function refresh(){const q=save.quest,qs=missions(save.level);$('levelTag').textContent='LEVEL '+String(save.level).padStart(2,'0')+' · '+LEVELS[save.level-1].toUpperCase();$('questTitle').textContent=qs[q]?.title??'Level selesai!';$('coins').textContent=String(coins(save));$('dots').replaceChildren(...Array.from({length:3},(_,i)=>{const el=document.createElement('span');el.className='dot'+(i<q?' done':'');return el;}),document.createTextNode(q+'/3'));btn('walk').disabled=settings||transition||fallback||q===3;btn('access').disabled=settings||transition||q===3;}
function renderMap(){const done=save.quest===3;const completed=done?save.level:save.level-1;const next=completed+1;$('mapTitle').textContent='Level '+String(completed).padStart(2,'0')+' selesai!';$('mapCoins').textContent=String(coins(save));$('mapInfo').textContent=completed+' / '+route(save.campaign).length+' level • '+(save.campaign==='umrah'?'Umroh':'Haji tamattu’');$('levels').replaceChildren(...route(save.campaign).map(n=>{const canPlay=n===next&&n<=2;const el=document.createElement(canPlay?'button':'div');el.className='node '+(n<=completed?'done':canPlay?'next':n===next?'pending':'');const title=document.createElement('strong');title.textContent=n<=completed?'✓ '+String(n).padStart(2,'0'):String(n).padStart(2,'0');const label=document.createElement('span');label.textContent=LEVELS[n-1];el.append(title,label);if(canPlay)el.onclick=advance;else if(n===next){const st=document.createElement('span');st.textContent='Segera hadir';el.append(st);}return el;}));btn('next').disabled=!(save.level===1&&done);btn('next').textContent=save.level===1?'▶ Main level 02':'Level 03 • segera hadir';$('nextInfo').textContent=save.level===1?'Niat dan Doa':'Menemukan Travel — konten masih dikembangkan.';$('map').hidden=false;world?.setActive(false);}
function showMap(){transition=false;refresh();renderMap();guide.announce('Level selesai! Koin latihan terkumpul. '+(save.level===1?'Peta terbuka. Pilih level dua, Niat dan Doa.':'Level tiga terbuka, kontennya segera hadir.'),'map-'+save.level,0,true);}
// Dialogues use the same speech engine sequentially, so guidance never overlaps.
function closeDialogue(){clearTimeout(dialogTimer);dialogEpoch++;world?.talk('');$('conversation').hidden=true;$('game').classList.remove('dialogue');}
function showLesson(){if(!currentLesson)return;closeDialogue();$('lessonTitle').textContent=currentLesson.title;$('lessonBody').textContent=currentLesson.body;btn('lessonNext').textContent=save.quest===3?'Buka peta →':'Lanjut misi →';$('lesson').hidden=false;guide.announce(currentLesson.body,'lesson-'+save.level+'-'+save.quest,0,true);btn('lessonNext').focus();}
function playLine(){if(!currentLesson||document.hidden)return;const line=currentLesson.lines[lineIndex];if(!line){showLesson();return;}const token=++dialogEpoch;$('speaker').textContent=line.speaker;$('line').textContent=line.text;world?.talk(line.speaker);guide.announce(line.text,'dialog-'+token,0,true);const duration=Math.max(2700,Math.min(12000,line.text.split(/\s+/).length*520+650));dialogTimer=window.setTimeout(()=>{if(token!==dialogEpoch)return;lineIndex++;playLine();},duration);}
function collect(){if(settings||transition||save.quest===3||document.hidden)return;const prior=save.quest;currentLesson=LESSONS[save.level-1][prior];if(!currentLesson)return;transition=true;world?.setActive(false);save=finishQuest(save,prior);persist();refresh();ambience.reward();clearTimeout(rewardTimer);$('reward').hidden=false;rewardTimer=window.setTimeout(()=>{$('reward').hidden=true;},900);lineIndex=0;$('game').classList.add('dialogue');$('conversation').hidden=false;playLine();}
btn('skipDialogue').onclick=showLesson;
btn('lessonVoice').onclick=()=>{if(currentLesson){guide.announce(currentLesson.body,'lesson-replay-'+(++dialogEpoch),0,true);if(!btn('voiceToggle').disabled&&btn('voiceToggle').getAttribute('aria-pressed')!=='true')btn('voiceToggle').click();}};
btn('lessonNext').onclick=()=>{if(!transition||!currentLesson)return;$('lesson').hidden=true;currentLesson=null;transition=false;world?.target(save.quest);refresh();if(save.quest===3)showMap();else{world?.setActive(true);instruct();}};
async function setSound(on:boolean){sound=on;if(on){if(!await ambience.start())sound=false;}else ambience.stop();btn('ambient').textContent=sound?'Suasana aktif':'Suasana mati';btn('ambient').setAttribute('aria-pressed',String(sound));}
function enableAudio(){if(audioStarted)return;audioStarted=true;$('enableAudio').hidden=true;if(!btn('voiceToggle').disabled&&btn('voiceToggle').getAttribute('aria-pressed')!=='true')btn('voiceToggle').click();void setSound(true);}
btn('enableAudio').onclick=enableAudio;
document.addEventListener('pointerdown',e=>{if(audioStarted||!(e.target instanceof Element)||e.target.closest('#settingsPanel,#settings,#voiceToggle,#voiceReplay,#enableAudio'))return;enableAudio();},{capture:true});
window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','KeyE'].includes(e.code))enableAudio();});
function mount(){closeDialogue();clearTimeout(rewardTimer);currentLesson=null;$('lesson').hidden=true;$('reward').hidden=true;$('map').hidden=true;$('settingsPanel').hidden=true;settings=false;transition=false;fallback=false;world?.dispose();world=null;$('fallback').hidden=true;$('controls').hidden=false;$('navigation').hidden=false;
 try{world=mountHome($<HTMLCanvasElement>('world'),$('joy'),$('knob'),save.avatar,save.quest,save.level,{onNear:()=>{},onStep:()=>ambience.step(),onCollect:collect,onNav:(angle,distance)=>{const nav=$('navigation');nav.hidden=save.quest===3||settings||fallback||transition;$('navArrow').style.transform='rotate('+(-angle)+'rad)';$('navDistance').textContent=Math.ceil(distance)+' m';}});}catch{$('fallback').hidden=false;$('controls').hidden=true;$('navigation').hidden=true;fallback=true;}
 refresh();persist();if(save.quest===3){renderMap();guide.announce('Peta perjalanan terbuka.','resume-map',0,true);}else{world?.setActive(true);instruct();}
}
function advance(){if(save.level!==1||save.quest!==3)return;save=unlockNext(save);persist();mount();}
btn('next').onclick=advance;btn('access').onclick=collect;btn('walk').onclick=()=>{world?.walkToTarget();};
btn('settings').onclick=()=>{if(transition)return;settings=true;world?.setActive(false);guide.stop();$<HTMLSelectElement>('avatar').value=save.avatar;$<HTMLSelectElement>('campaign').value=save.campaign;$('settingsPanel').hidden=false;refresh();};
btn('closeSettings').onclick=()=>{settings=false;$('settingsPanel').hidden=true;if(save.quest<3){world?.setActive(true);instruct();}refresh();};
btn('ambient').onclick=()=>{void setSound(!sound);};
function restart(avatar:Avatar,campaign:Campaign){if(!confirm('Mulai ulang? Koin dan checkpoint perjalanan ini akan direset.'))return;save=makeSave(avatar,campaign);persist();mount();}
btn('reset').onclick=()=>restart($<HTMLSelectElement>('avatar').value as Avatar,$<HTMLSelectElement>('campaign').value as Campaign);btn('replayMap').onclick=()=>restart(save.avatar,save.campaign);
document.addEventListener('visibilitychange',()=>{if(document.hidden){ambience.stop();guide.stop();clearTimeout(dialogTimer);dialogEpoch++;world?.setActive(false);}else{if(sound)void ambience.start();if(transition&&currentLesson&&!$('conversation').hidden)playLine();world?.setActive(!settings&&!transition&&save.quest<3);}});
window.addEventListener('pagehide',()=>{ambience.stop();world?.setActive(false);});window.addEventListener('pageshow',e=>{if(e.persisted){if(sound)void ambience.start();world?.setActive(!settings&&!transition&&save.quest<3);}});
bootTenant();mount();
