import {initLandingReferral} from './landingReferral.ts';
import {clearTicketOwner} from './ticketProgress.ts';
import {defaultSetup,type JourneySetup} from './frontModel.ts';
import {readSetup,saveSetup} from './frontSettings.ts';
import {tenantUrl,bootTenant} from './tenant.ts';
import {readCore} from './coreProgress.ts';
import {loadCampaign} from './adventure/campaignProgress.ts';
import {mountPwa} from './pwa.ts';
import './gameFront.css';
import {gateGuide} from './gateGuide.ts';
import {readStory,saveStory} from './travelStory.ts';
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const params=new URLSearchParams(location.search);
if(!params.has('access')&&!params.has('play')&&params.get('demo')!=='magic')clearTicketOwner();
if(!params.has('access')&&!params.has('play')&&params.get('demo')!=='magic')initLandingReferral(params);
function bootError(error:unknown){document.documentElement.classList.remove('gameBoot','frontMode','gatePreparing');for(const id of ['gameFront','lobby','cinematicIntro'])document.getElementById(id)?.remove();const panel=document.createElement('main');panel.style.cssText='padding:24px;color:#fff4dc;background:#102c24;min-height:100dvh';const title=document.createElement('h2');title.textContent='Arena belum berhasil dimuat';const message=document.createElement('p');message.textContent='Checkpoint tetap tersimpan. Muat ulang untuk mencoba lagi.';const retry=document.createElement('button');retry.textContent='Muat ulang';retry.onclick=()=>location.reload();panel.append(title,message,retry);document.body.append(panel);console.error(error);}
if(params.get('play')==='miqat'){
 $('gameFront').remove();void import('./miqatRoom.ts').then(m=>m.mountMiqatRoom()).catch(bootError);
}else if(params.has('access')||params.get('demo')==='magic'){
 void import('./magicAccess.ts').then(m=>{document.documentElement.classList.remove('gameBoot');m.mountMagicAccess();}).catch(bootError);
}else if(params.has('guide')||params.has('legacyLobby')){
 if(params.has('guide')&&!readSetup()){location.replace(tenantUrl('./index.html'));}
 document.documentElement.classList.remove('frontMode','gameBoot');$('gameFront').remove();$('lobby').hidden=false;void import('./lobby.ts').catch(bootError);
}else if(!params.has('setup')){
 document.documentElement.classList.add('entranceMode','gatePreparing');$('gameFront').remove();$('avatarModal').hidden=true;$('lobby').inert=true;$('lobby').hidden=false;document.documentElement.classList.remove('frontMode','gameBoot');void import('./lobby.ts').catch(bootError);
}else{
 document.documentElement.classList.remove('gameBoot');document.documentElement.classList.add('frontMode');
 $('lobby').hidden=true;const coverArt=document.querySelector('.introArt')?.cloneNode(true);$('cinematicIntro').remove();bootTenant();
 const art=$('frontArt'); // Reuse the project's original illustration instead of loading a 3D world for menus.
 if(coverArt)art.append(coverArt);
 const update=$('pwaUpdate');if(update)$('frontInstall').append(update);mountPwa();
 for(const avatar of ['male','female']){const icon=document.querySelector('#'+avatar+' svg')?.cloneNode(true),mark=document.querySelector('input[name="avatar"][value="'+avatar+'"]')?.closest('label')?.querySelector('.frontMark');if(icon&&mark)mark.replaceChildren(icon);}
 let setup=readSetup()??defaultSetup();
 if(!readSetup()){try{const graphics=localStorage.getItem('umroh-graphics-v1');if(['auto','low','medium','high'].includes(graphics??''))setup.graphics=graphics as JourneySetup['graphics'];}catch{}
  const existing=loadCampaign().chapters.slice().reverse().find(c=>c.save)?.save??readCore('umrah');if(existing)setup.avatar=existing.avatar;
 }
 const requested=new URLSearchParams(location.search).get('program');if(requested==='hajj'||requested==='umrah')setup.program=requested;
 const form=$<HTMLFormElement>('frontForm');
 for(const name of ['program','avatar']){const input=form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${setup[name as 'program'|'avatar']}"]`);if(input)input.checked=true;}
 $<HTMLSelectElement>('frontGraphics').value=setup.graphics;$<HTMLInputElement>('frontVoice').checked=setup.voice;$<HTMLInputElement>('frontAmbience').checked=setup.ambience;$<HTMLInputElement>('frontVolume').value=String(setup.volume);
 function preview(){const data=new FormData(form),program=data.get('program')==='umrah'?'umrah':'hajj',avatar=data.get('avatar')==='female'?'female':'male';setup={version:1,program,avatar,graphics:$<HTMLSelectElement>('frontGraphics').value as JourneySetup['graphics'],voice:$<HTMLInputElement>('frontVoice').checked,ambience:$<HTMLInputElement>('frontAmbience').checked,volume:Number($<HTMLInputElement>('frontVolume').value)};
  $('frontVolumeValue').textContent=setup.volume+'%';$('frontJourneyCount').textContent=program==='hajj'?'12 LEVEL · HAJI QIRAN':'5 LEVEL · PERJALANAN UMROH';
  $('frontSummary').textContent=(program==='hajj'?'Haji':'Umroh')+' · '+(avatar==='female'?'Perempuan':'Laki-laki')+' · Grafis '+$<HTMLSelectElement>('frontGraphics').selectedOptions[0].textContent;
  const done=program==='hajj'?loadCampaign().done:readCore('umrah')?.step??0;$('frontSaved').textContent=done?'Progres ditemukan · '+done+'/'+(program==='hajj'?12:5)+' selesai. Checkpoint tetap tersimpan.':'Petualangan baru menantimu. Pilihan ini berlaku saat masuk ke level.';
 }
 form.addEventListener('input',preview);form.addEventListener('change',preview);preview();form.dataset.ready='true';
 const name=document.createElement('label');name.className='frontTraveller';name.textContent='Nama panggilan (opsional)';const nameInput=document.createElement('input');nameInput.name='traveller';nameInput.maxLength=60;nameInput.setAttribute('autocomplete','nickname');nameInput.placeholder='Petualang';nameInput.value=readStory().name==='Petualang'?'':readStory().name;name.append(nameInput);form.prepend(name);
 const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]');function submitLabel(){if(submit)submit.textContent='TEMUI '+gateGuide(setup.avatar).name.toUpperCase()+' →';}submitLabel();form.addEventListener('input',submitLabel);form.addEventListener('change',submitLabel);
 form.onsubmit=e=>{e.preventDefault();preview();if(!saveSetup(setup)||!saveStory({name:nameInput.value.trim()||'Petualang'})){$('frontNotice').textContent='Pengaturan belum tersimpan. Periksa penyimpanan browser atau versi save, lalu coba lagi.';return;}location.assign(tenantUrl('./index.html?guide=1'));};
 document.querySelectorAll<HTMLAnchorElement>('#gameFront a[href]').forEach(a=>a.href=tenantUrl(a.getAttribute('href')!));
 $('testFrontSound').onclick=()=>{if(setup.volume===0){$('frontNotice').textContent='Volume sedang 0%. Naikkan volume untuk mendengar contoh.';return;}try{const ctx=new AudioContext(),gain=ctx.createGain(),osc=ctx.createOscillator();gain.connect(ctx.destination);osc.connect(gain);osc.type='sine';osc.frequency.setValueAtTime(440,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+.18);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.08*(setup.volume/100)**2,ctx.currentTime+.03);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.35);osc.start();osc.stop(ctx.currentTime+.4);osc.onended=()=>void ctx.close();void ctx.resume();$('frontNotice').textContent='Contoh efek suara diputar.';}catch{$('frontNotice').textContent='Audio belum tersedia; panduan teks tetap bisa digunakan.';}};
}
