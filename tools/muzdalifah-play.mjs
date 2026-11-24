import {fieldAction} from './simple-qa-actions.mjs';
import {reachCamp} from './mina-camp-play.mjs';
export const muzActions=['Laporkan kedatangan di Muzdalifah','Tempat salat siap','Ikuti salat Magrib tiga rakaat','Ikuti salat Isya dua rakaat','Isi air & minum','Tawarkan bantuan tempat istirahat','Pastikan jemaah sampai di alas','Pelajari pilihan kerikil','Ambil kerikil','Beristirahat hingga Subuh','Ikuti salat Subuh dua rakaat','Lanjut dzikir & doa fajar','Rombongan siap · menuju Aqabah'];
export async function collectMuzdalifah(page,{touch=false,onStone=async()=>{}}={}){
 let stones=Number(await page.locator('#fieldClock').getAttribute('data-stones'));
 for(;stones<7;stones++){await reachCamp(page,'Ambil kerikil '+(stones+1)+'/7',touch);await onStone(stones);await page.waitForFunction(n=>Number(document.getElementById('fieldClock').dataset.stones)===n+1,stones,{timeout:60000});}
 await reachCamp(page,'Tujuh kerikil siap · rapikan bekal',touch);
}
export async function playMuzdalifah(page,{touch=false,start=0,onBeat=async()=>{},onStone=async()=>{}}={}){
 for(let beat=start;beat<muzActions.length;beat++){
  await page.locator('#fieldClock[data-muzdalifah-beat="'+beat+'"]').waitFor({state:'attached',timeout:150000});
  if(beat===8)await collectMuzdalifah(page,{touch,onStone});
  else{await reachCamp(page,muzActions[beat],touch);if(beat===7){const choice=page.getByRole('button',{name:'Pilih kerikil kecil',exact:true});await fieldAction(page,'Pilih kerikil kecil',touch);}}
  await onBeat(beat);
  if([2,3,9,10,11].includes(beat))await page.waitForFunction(n=>document.getElementById('fieldClock').dataset.muzdalifahBeat!==String(n),beat,{timeout:150000});
 }
 await page.locator('#fieldClock[data-muzdalifah-beat="13"]').waitFor({state:'attached'});
}
