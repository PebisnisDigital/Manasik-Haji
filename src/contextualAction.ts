/** Present the existing available interaction in plain Indonesian. Keyboard shortcuts are independent. */
export function contextualActionLabel(raw:string):string{
 const clean=raw.trim().replace(/^aksi\s*[·:–-]\s*/i,'').replace(/\s*[·|]\s*E$/i,'').trim();
 const key=clean.toLowerCase();
 if(!key||['aksi','interaksi','e'].includes(key))return '';
 if(key==='ikut antrean'||key==='ikut antrian')return 'MASUK ANTREAN';
 if(key==='siapkan pakaian ihram'||key==='kenakan pakaian ihram')return 'PAKAI BAJU IHRAM';
 return clean.toLocaleUpperCase('id-ID');
}
export function choiceActionLabel(labels:readonly string[]):string{
 const meaningful=[...new Set(labels.map(contextualActionLabel).filter(Boolean))];
 return meaningful.length===0?'':labels.length===1?meaningful[0]!:'PILIH KEGIATAN';
}
