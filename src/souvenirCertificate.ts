import {certificatePdf,issuedDate} from './certificateModel.ts';
import type {SouvenirSave} from './souvenirModel.ts';
export function souvenirCertificate(host:HTMLElement,save:SouvenirSave){
 const canvas=document.createElement('canvas');canvas.width=2100;canvas.height=1485;const g=canvas.getContext('2d');if(!g)throw Error('Sertifikat belum dapat ditampilkan');
 g.fillStyle='#faf5e7';g.fillRect(0,0,2100,1485);g.fillStyle='#163f33';g.fillRect(0,0,2100,38);g.fillRect(0,1447,2100,38);g.strokeStyle='#b39552';g.lineWidth=7;g.strokeRect(65,65,1970,1355);g.lineWidth=2;g.strokeRect(91,91,1918,1303);
 function text(s:string,y:number,font:string,color='#173e33',max=1750){g!.font=font;g!.fillStyle=color;g!.textAlign='center';g!.fillText(s,1050,y,max);}
 for(const x of [130,1970])for(const y of [130,1355]){g.save();g.translate(x,y);g.rotate(Math.PI/4);g.strokeRect(-26,-26,52,52);g.restore();}
 text('HAJJI.DIGITAL',230,'bold 48px Arial');text('SERTIFIKAT PENYELESAIAN PETUALANGAN',338,'bold 29px Arial','#977e44');text('Diberikan kepada',465,'italic 37px Georgia');
 let size=92;g.font='bold '+size+'px Georgia';while(g.measureText(save.name).width>1650&&size>34){size-=3;g.font='bold '+size+'px Georgia';}text(save.name,610,g.font);
 text('Telah menuntaskan 12 level game manasik haji',736,'34px Arial');text('dan meraih gelar dalam permainan',803,'29px Arial');text('HAJI DIGITAL',930,'bold 92px Georgia');
 text('Semoga ilmu ini membawa kebaikan dan keberkahan. Aamiin.',1060,'italic 32px Georgia');text(issuedDate(save.issuedAt),1170,'30px Arial');text('HD-'+save.certificateId.toUpperCase(),1240,'22px Arial');text('Penghargaan penyelesaian game manasik · Dokumen lokal HAJJI.DIGITAL',1320,'24px Arial','#66766a');
 canvas.className='souvenirCertificate';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Sertifikat Haji Digital untuk '+save.name+' · 12 level selesai');host.append(canvas);return canvas;
}
export function downloadSouvenirCertificate(canvas:HTMLCanvasElement,save:SouvenirSave){
 const raw=atob(canvas.toDataURL('image/jpeg',.96).split(',')[1]),pdf=certificatePdf(Uint8Array.from(raw,s=>s.charCodeAt(0)),canvas.width,canvas.height),url=URL.createObjectURL(new Blob([Uint8Array.from(pdf).buffer],{type:'application/pdf'}));
 const a=document.createElement('a');a.href=url;a.download='HAJJI-DIGITAL-'+save.certificateId.slice(0,8)+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
