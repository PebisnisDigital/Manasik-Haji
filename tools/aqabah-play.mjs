import {fieldAction} from './simple-qa-actions.mjs';
import {reachCamp} from './mina-camp-play.mjs';
export async function playAqabah(page,{touch=false,start=0,onBeat=async()=>{},onThrow=async()=>{},onCut=async()=>{}}={}){
 const click=async l=>touch?l.tap():l.click();
 const names=['Periksa rombongan & tujuh kerikil','Isi air & minum sebelum Jamarat','Lewati koridor Jamarat','Tunggu jalur dibuka petugas','Tentukan jumrah untuk hari ini','', 'Keluar dari area lontar','Pelajari pelaksanaan dam','Temui petugas tahallul','','Pahami tahallul awal','Rombongan siap menuju Ifadah'];
 for(let beat=start;beat<12;beat++){
  await page.locator('#fieldClock[data-aqabah-beat="'+beat+'"]').waitFor({state:'attached',timeout:90000});
  if(beat===5){let n=Number(await page.locator('#fieldClock').getAttribute('data-throws'));for(;n<7;n++){await reachCamp(page,'Lontar kerikil '+(n+1)+'/7 · Allahu akbar',touch);await onThrow(n);await page.waitForFunction(n=>Number(document.getElementById('fieldClock').dataset.throws)===n+1,n);}await reachCamp(page,'Tujuh lontaran selesai · ikuti jalur keluar',touch);}
  else if(beat===9){let cuts=Number(await page.locator('#fieldClock').getAttribute('data-cuts'));for(;cuts<3;cuts++){await reachCamp(page,cuts===0?'Duduk & mulai tahallul':'Lanjut tindakan petugas '+(cuts+1)+'/3',touch);await onCut(cuts);await page.waitForFunction(n=>Number(document.getElementById('fieldClock').dataset.cuts)===n+1,cuts);}await reachCamp(page,'Tahallul selesai · simpan hasil',touch);}
  else{if(beat===7){const commit=page.getByRole('button',{name:'Lontaran tersimpan · lanjut panduan dam',exact:true});if(await page.locator('#actions button').filter({hasText:'Lontaran tersimpan · lanjut panduan dam'}).count())await fieldAction(page,'Lontaran tersimpan · lanjut panduan dam',touch);}await reachCamp(page,names[beat],touch);if(beat===4||beat===7)await fieldAction(page,beat===4?'Pilih Aqabah':'Pelajari dam melalui pihak berwenang',touch);}
  await onBeat(beat);if(beat===3)await page.locator('#fieldClock[data-aqabah-beat="4"]').waitFor({state:'attached',timeout:30000});
 }
 await page.locator('#fieldClock[data-aqabah-beat="12"]').waitFor({state:'attached'});
}
