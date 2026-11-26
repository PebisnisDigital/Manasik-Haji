import {mountGraphics} from './graphicsQuality.ts';
import {readSetup,saveSetup,gameAudioPreferences,setGameAudioPreferences} from './frontSettings.ts';
import {parseGraphics} from './graphicsModel.ts';

export const gearIcon='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3-.6 2.3-2 .9-2.2-1.2-2 3.5 1.8 1.6-.1 2.3-1.8 1.6 2 3.5 2.2-1.1 2 .9.7 2.3h4l.6-2.3 2-.9 2.2 1.1 2-3.5-1.8-1.6.1-2.3 1.8-1.6-2-3.5-2.2 1.2-2-.9L14 3z"/><circle cx="12" cy="11.5" r="3"/></svg>';
export function mountGameplaySettings(host:HTMLElement){
 const panel=document.createElement('div');panel.className='gameplaySettingsRows';
 const graphics=mountGraphics(panel);graphics.querySelector('.graphicsNote')?.remove();
 const select=graphics.querySelector('select')!;
 select.addEventListener('change',()=>{const setup=readSetup();if(setup){const p=gameAudioPreferences();saveSetup({...setup,graphics:parseGraphics(select.value),voice:p.enabled,ambience:p.enabled,volume:p.volume});}});
 const row=document.createElement('label');row.className='gameplaySettingRow';row.innerHTML='<span>Suara</span>';
 const sound=document.createElement('input');sound.type='checkbox';sound.setAttribute('aria-label','Suara');sound.className='gameplaySoundSwitch';const state=document.createElement('span');state.className='gameplaySoundState';row.append(sound,state);
 const vol=document.createElement('label');vol.className='gameplayVolumeRow';vol.innerHTML='<span>Volume suara</span>';
 const output=document.createElement('output');const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.step='1';range.setAttribute('aria-label','Volume suara');vol.append(output,range);
 const sync=()=>{const pref=gameAudioPreferences();sound.checked=pref.enabled;state.textContent=pref.enabled?'Aktif':'Mati';range.disabled=!pref.enabled;range.value=String(pref.volume);output.textContent=pref.volume+'%';};
 sound.onchange=()=>{setGameAudioPreferences({enabled:sound.checked,volume:Number(range.value)});sync();};
 range.oninput=()=>{setGameAudioPreferences({enabled:sound.checked,volume:Number(range.value)});output.textContent=range.value+'%';};
 panel.append(row,vol);host.append(panel);sync();return panel;
}
