import {existsSync} from 'node:fs';
import {registrationStore} from './registration-store.mjs';
import {defaultDb} from './registration-server.mjs';
const [command,id,checked]=process.argv.slice(2),dbPath=defaultDb();
if(!existsSync(dbPath))throw Error('Belum ada data pendaftaran. Jalankan server dahulu.');
const store=registrationStore(dbPath);
function printLink(){const issued=store.issueForId(id),url=new URL(process.env.REGISTRATION_PUBLIC_URL||'http://127.0.0.1:4173/index.html');if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('Gunakan URL publik HTTPS atau localhost.');url.search='?access=1';url.hash='token='+issued.token;console.log('MAGIC LINK pribadi (kirim manual hanya kepada pendaftar):\n'+url.href);}
try{
 if(command==='list')console.table(store.list());
 else if(command==='approve'&&/^HJ-[A-F0-9]{12}$/.test(id||'')&&checked==='--bank-checked'){
  // Run only after a human matches bank statement: account, ID/name, amount Rp100.000.
  store.approve(id);console.log('Pendaftaran '+id+' disetujui setelah pemeriksaan mutasi bank.');printLink();
 }else if(command==='link')printLink();
 else if(command==='revoke-links'){console.log('Magic link dicabut: '+store.revoke(id));}
 else{console.log('Daftar: npm run registration:admin -- list\nSetelah cek mutasi bank: npm run registration:admin -- approve HJ-XXXXXXXXXXXX --bank-checked\nTautan tambahan: npm run registration:admin -- link HJ-XXXXXXXXXXXX\nCabut tautan: npm run registration:admin -- revoke-links HJ-XXXXXXXXXXXX');process.exitCode=1;}
}finally{store.close();}
