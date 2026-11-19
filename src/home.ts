import {readJourney} from './journey.ts';
const update=()=>{const j=readJourney(),n=j?.stage??0;document.querySelector('#bar')!.setAttribute('style','width:'+n*20+'%');document.querySelector('.meter')!.setAttribute('aria-valuenow',String(n));document.querySelector('#resumeText')!.textContent=n+' dari 5 tahap selesai • tersimpan di perangkat';document.querySelector('#start')!.textContent=n===5?'Lihat hasil pembelajaran →':n?'Lanjutkan perjalanan →':'Mulai perjalanan →';};
update();window.addEventListener('pageshow',update);
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 void import('./homeScene.ts').then(m=>m.startHomeScene()).catch(()=>{/* menu remains usable */});
}
