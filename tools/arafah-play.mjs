import {fieldAction} from './simple-qa-actions.mjs';
import {reachCamp} from './mina-camp-play.mjs';
export const arafahActions=['Laporkan kedatangan ke pembimbing','Batas Arafah sudah dikenali','Isi bekal air & minum','Istirahat sejenak di tempat teduh','Simak ringkasan arahan khutbah','Ikuti salat Zuhur dua rakaat','Ikuti salat Asar dua rakaat','Mulai doa wukuf','Tawarkan bantuan kepada jemaah','Pastikan jemaah tiba di tempat teduh','Lanjut dzikir & istigfar','Berdoa hingga matahari terbenam','Rombongan lengkap · siap Muzdalifah'];
export async function startArafahBeat(page,beat,touch=false){
 await reachCamp(page,arafahActions[beat],touch);
 if(beat===7){const choice=page.getByRole('button',{name:'Doa · keluarga dan orang tua',exact:true});if(await page.locator('#actions button').filter({hasText:'Doa · keluarga dan orang tua'}).count())await fieldAction(page,'Doa · keluarga dan orang tua',touch);}
}
export async function playArafah(page,{touch=false,start=0,onBeat=async()=>{}}={}){
 for(let beat=start;beat<arafahActions.length;beat++){
  await page.waitForFunction(n=>Number(document.getElementById('fieldClock')?.dataset.arafahBeat)===n,beat,{timeout:150000});
  await startArafahBeat(page,beat,touch);await onBeat(beat);
  if([3,4,5,6,7,10,11].includes(beat))await page.waitForFunction(n=>document.getElementById('fieldClock')?.dataset.arafahBeat!==String(n),beat,{timeout:150000});
 }
 await page.locator('#fieldClock[data-phase="4"]').waitFor({state:'attached'});
}
