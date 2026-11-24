import {fieldAction} from './simple-qa-actions.mjs';
import assert from 'node:assert/strict';
export const campActions=['Ambil air & bekal','Siapkan diri untuk salat','Ikuti salat Zuhur','Ajak jemaah kembali','Pastikan jemaah tiba','Ikuti salat Asar','Ikuti salat Magrib','Ikuti salat Isya','Beristirahat di tenda','Ikuti salat Subuh','Rombongan siap · menuju Arafah'];
export async function reachCamp(page,name,touch=false){
 return fieldAction(page,name,touch);
}
export async function playMinaCamp(page,{touch=false,onBeat=async()=>{}}={}){
 for(let beat=0;beat<campActions.length;beat++){
  await page.waitForFunction(n=>Number(document.getElementById('fieldClock')?.dataset.campBeat)===n,beat,{timeout:150000});
  await reachCamp(page,campActions[beat],touch);await onBeat(beat);
  if([1,2,5,6,7,8,9].includes(beat))await page.waitForFunction(n=>document.getElementById('fieldClock')?.dataset.campBeat!==String(n),beat,{timeout:150000});
 }
 await page.waitForFunction(()=>document.getElementById('fieldClock')?.dataset.phase==='5',null,{timeout:30000});
 assert.match(await page.locator('#title').textContent(),/Pagi/);
}
