// Shared phone landscape gate for the new curriculum, with graceful manual rotation fallback.
export function installLandscape(onChange:()=>void=()=>{}):()=>boolean{
 const touch=matchMedia('(pointer: coarse)').matches||(navigator.maxTouchPoints>1&&Math.min(screen.width,screen.height)<=1024);
 let blocked=false;document.documentElement.classList.toggle('coreTouch',touch);
 if(!touch)return ()=>false;
 const overlay=document.createElement('section');overlay.className='coreRotate';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.innerHTML='<div><svg viewBox="0 0 80 60" width="88" height="66" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="10" width="22" height="42" rx="4"/><rect x="40" y="26" width="34" height="22" rx="4"/><path d="M31 9Q55 1 64 20M57 19l8 3 3-8"/></svg><h2>Putar HP</h2><p>Main dalam landscape.</p><button type="button">Layar penuh</button><small>Jika perlu, putar HP secara manual.</small></div>';
 document.body.append(overlay);
 const fs=async()=>{try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();const o=screen.orientation as ScreenOrientation&{lock?:(v:'landscape')=>Promise<void>};if(o?.lock)await o.lock('landscape');}catch{/* manual rotation */}};
 overlay.querySelector('button')!.onclick=()=>void fs();
 const full=document.createElement('button');full.type='button';full.className='coreFull';full.textContent='⛶';full.setAttribute('aria-label','Layar penuh');full.onclick=()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});else void fs();};document.body.append(full);
 const sync=()=>{const next=matchMedia('(orientation: portrait)').matches;const changed=next!==blocked;blocked=next;overlay.hidden=!blocked;full.hidden=blocked;document.documentElement.classList.toggle('coreBlocked',blocked);for(const el of Array.from(document.body.children))if(el instanceof HTMLElement&&el!==overlay&&el!==full)el.inert=blocked;if(changed){if(blocked)overlay.querySelector('button')?.focus({preventScroll:true});onChange();}};window.addEventListener('resize',sync);window.addEventListener('orientationchange',sync);document.addEventListener('fullscreenchange',sync);sync();return ()=>blocked;
}
