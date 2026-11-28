import {adminBridge} from '../server/autojualanBridge.js';
import {randomBytes} from 'node:crypto';
const ORIGIN='https://hajji.digital';
const enabled=()=>Boolean(process.env.REPLIZ_ACCESS_KEY&&process.env.REPLIZ_SECRET_KEY);
class Err extends Error{constructor(status,message){super(message);this.status=status;}}
async function rpc(secret,op,data={}){
 const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY,k=process.env.HAJJI_TICKET_GATEWAY;
 if(!url||!key||!k)throw new Err(503,'Database belum dikonfigurasi.');
 const r=await fetch(url+'/rest/v1/rpc/hajji_threads_gateway',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({k,op,secret,data}),signal:AbortSignal.timeout(7000)});
 if(!r.ok)throw new Err(503,'Layanan Threads belum siap.');const d=await r.json();if(d.error)throw new Err(403,d.error);return d;
}
async function repliz(path,method='GET',data,base='/account'){
 const access=process.env.REPLIZ_ACCESS_KEY,secret=process.env.REPLIZ_SECRET_KEY;
 if(!access||!secret)throw new Err(503,'Koneksi AUTOJUALAN belum siap. Silakan hubungi tim support.');
 const r=await fetch('https://api.repliz.com/public'+base+path,{method,headers:{Authorization:'Basic '+Buffer.from(access+':'+secret).toString('base64'),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!r.ok)throw new Err(r.status,r.status===402?'Kapasitas layanan AUTOJUALAN belum tersedia.':'Koneksi AUTOJUALAN belum dapat diproses.');
 return r.status===204?{}:r.json();
}
function callback(res){
 const nonce=randomBytes(18).toString('base64');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'nonce-"+nonce+"'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; style-src 'unsafe-inline'");
 return res.status(200).send('<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AUTOJUALAN</title><style>body{font:16px system-ui;max-width:480px;margin:12vh auto;padding:22px;color:#25211b;background:#fffdf8}a{color:#166534}</style><h1>AUTOJUALAN</h1><p id="note" role="status">Memeriksa otorisasi…</p><a href="/district.html?board=magic">Kembali ke distrik</a><script nonce="'+nonce+'">const q=new URLSearchParams(location.search),code=q.get("code"),state=q.get("flow");history.replaceState(null,"","/api/threads?action=callback");const note=document.getElementById("note");if(!code||!state){note.textContent="Otorisasi dibatalkan atau tidak lengkap.";}else{fetch("/api/threads?action=connect",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,state})}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Koneksi gagal.");note.textContent="Akun Threads berhasil terhubung. Silakan kembali ke distrik.";}).catch(e=>{note.textContent=e.message||"Koneksi gagal. Hubungi admin.";});}</script></html>');
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 const op=new URL(req.url,ORIGIN).searchParams.get('action'),reply=(s,d)=>res.status(s).json(d);
 if(op==='admin-bridge')return adminBridge(req,res);
 if(req.method==='GET'&&op==='callback')return callback(res);
 if(req.method!=='POST'||req.headers.origin!==ORIGIN||req.headers.host!=='hajji.digital'||!String(req.headers['content-type']).startsWith('application/json'))return reply(403,{error:'Permintaan tidak diizinkan.'});
 const secret=String(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('manasik_registration='))?.slice(21)??'';
 let data;try{data=typeof req.body==='string'?JSON.parse(req.body):req.body??{};if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>10000)throw Error();}catch{return reply(400,{error:'Data tidak valid.'});}
 try{
  
  if(op==='status'){const d=await rpc(secret,'status');let status=d.status,username=d.username;if(status==='connected'&&enabled()){try{const a=await repliz('/'+d.account_id);if(a.isConnected===false)status='disconnected';username=a.username??username;}catch(e){if(e.status===404)status='disconnected';}}return reply(200,{enabled:enabled(),status,username,platform:d.platform,targets:d.targets??[],resumable:d.resumable});}
  if(!enabled())return reply(503,{error:'Koneksi AUTOJUALAN belum siap. Silakan hubungi tim support.'});
  if(op==='wa-start'){
   if(data.consent!==true)return reply(400,{error:'Persetujuan diperlukan.'});
   const state=randomBytes(32).toString('hex');await rpc(secret,'start',{state,consent:true,platform:'whatsapp'});
   try{const session=await repliz('/whatsapp/session','POST');if(typeof session.token!=='string')throw new Err(502,'Sesi QR belum tersedia.');await rpc(secret,'wa_store',{platform:'whatsapp',state,token:session.token});return reply(200,{status:'pending',platform:'whatsapp'});}
   catch(e){await rpc(secret,'cancel_unstarted',{platform:'whatsapp',state}).catch(()=>{});throw e;}
  }
  if(op==='wa-poll'){
   const pending=await rpc(secret,'wa_get',{platform:'whatsapp'});const token=pending.token;
   let session;try{session=await repliz('/whatsapp/session?'+new URLSearchParams({token}));}catch(e){if(e.status===404){await rpc(secret,'wa_expire',{platform:'whatsapp',token});return reply(200,{status:'none',expired:true});}throw e;}
   if(pending.expired)return reply(200,{status:'pending',expired:true,platform:'whatsapp'});
   if(session.isConnected!==true){const qr=typeof session.qrcode==='string'&&session.qrcode.length<200000&&/^[A-Za-z0-9+/=]+$/.test(session.qrcode)?session.qrcode:'';return reply(200,{status:'pending',platform:'whatsapp',qrcode:qr});}
   const identity=session.generatedId;if(typeof identity!=='string'||!/^\d{5,20}@s\.whatsapp\.net$/.test(identity))throw new Err(502,'Nomor hasil scan belum bisa diverifikasi.');
   // Never adopt or update a number already linked in this workspace.
   for(let page=1;page<=10;page++){const listed=await repliz('?'+new URLSearchParams({page:String(page),limit:'100'}));if(!Array.isArray(listed.docs))throw new Err(502,'Daftar akun belum bisa diverifikasi.');if(listed.docs.some(a=>a.type==='whatsapp'&&a.generatedId===identity))throw new Err(409,'Nomor ini sudah terhubung. Lepas perangkat baru di WhatsApp dan hubungi support.');if(!listed.hasNextPage)break;if(page===10)throw new Err(503,'Daftar akun terlalu banyak. Hubungi support.');}
   await rpc(secret,'wa_claim',{platform:'whatsapp',token,identity});
   const connected=await repliz('/whatsapp/connect','POST',{token});const aid=connected.accountId;
   if(typeof aid!=='string'||!/^[a-f0-9]{24}$/.test(aid))throw new Err(502,'Koneksi perlu diperiksa tim support.');
   const a=await repliz('/'+aid);if(a.type!=='whatsapp'||a.isConnected!==true||a.generatedId!==identity)throw new Err(502,'Koneksi perlu diperiksa tim support.');
   await rpc(secret,'finish',{platform:'whatsapp',account_id:aid,username:a.username??a.name??''});
   try{const tags=Array.isArray(a.tags)?a.tags.filter(t=>typeof t==='string'):[];if(!tags.some(t=>t.toLowerCase()==='hajji.digital')&&tags.length<10)await repliz('/'+aid+'/tag','PUT',{tags:[...tags,'HAJJI.DIGITAL']});}catch{console.warn('Autojualan tag needs review');}
   return reply(200,{status:'connected',platform:'whatsapp'});
  }
  if(op==='wa-targets'||op==='wa-save-targets'){
   const d=await rpc(secret,'status');if(d.platform!=='whatsapp'||d.status!=='connected'||!d.account_id)throw new Err(403,'Hubungkan akun WhatsApp terlebih dahulu.');
   const result=await repliz('/whatsapp/channel?'+new URLSearchParams({accountId:d.account_id}),'GET',undefined,'/addon');
   const rows=Array.isArray(result)?result:Array.isArray(result.docs)?result.docs:null;if(!rows)throw new Err(502,'Daftar tujuan belum tersedia.');
   const options=[{id:'status',name:'Status WhatsApp',type:'status'},...rows.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&((x.type==='group'&&x.id.endsWith('@g.us'))||(x.type==='channel'&&x.id.endsWith('@newsletter')))).map(x=>({id:x.id,name:x.name.slice(0,150),type:x.type}))];
   if(op==='wa-targets')return reply(200,{options,targets:d.targets??[]});
   if(data.consent!==true||!Array.isArray(data.ids)||data.ids.length>20||data.ids.some(id=>typeof id!=='string'||!options.some(x=>x.id===id)))throw new Err(400,'Pilih tujuan yang valid dan izinkan promosi.');
   const targets=options.filter(x=>data.ids.includes(x.id));await rpc(secret,'targets',{platform:'whatsapp',targets});return reply(200,{targets});
  }
  if(op==='start'){if(data.consent!==true)return reply(400,{error:'Persetujuan diperlukan.'});const state=randomBytes(32).toString('hex');await rpc(secret,'start',{state,consent:true});const redirect=ORIGIN+'/api/threads?action=callback&flow='+state;let auth;try{auth=await repliz('/threads/authorize?'+new URLSearchParams({redirect}));}catch(e){await rpc(secret,'cancel_unstarted',{state}).catch(()=>{});throw e;}const url=new URL(auth.url);if(url.protocol!=='https:'||!['threads.net','www.threads.net','threads.com','www.threads.com'].includes(url.hostname))throw new Err(502,'URL Threads tidak valid.');return reply(200,{url:url.href});}
  if(op==='connect'){
   if(typeof data.code!=='string'||data.code.length<8||data.code.length>8000||typeof data.state!=='string'||!/^[a-f0-9]{64}$/.test(data.state))return reply(400,{error:'Otorisasi tidak valid.'});
   await rpc(secret,'claim',{state:data.state});
   let connected;try{connected=await repliz('/threads/connect','POST',{code:data.code});}catch(e){if([400,401,402,403,404,409,422].includes(e.status))await rpc(secret,'abort');throw e;}
   const aid=connected.accountId??connected.id??connected._id;
   if(typeof aid!=='string'||!/^[a-f0-9]{24}$/.test(aid))throw new Err(502,'Koneksi perlu diperiksa admin. Jangan mencoba ulang.');
   const a=await repliz('/'+aid);if(a.type!=='threads'||a.isConnected!==true)throw new Err(502,'Akun perlu diperiksa admin.');
   await rpc(secret,'finish',{account_id:aid,username:a.username??''});
   try{const tags=Array.isArray(a.tags)?a.tags.filter(t=>typeof t==='string'):[];if(!tags.some(t=>t.toLowerCase()==='hajji.digital')&&tags.length<10)await repliz('/'+aid+'/tag','PUT',{tags:[...tags,'HAJJI.DIGITAL']});}catch{console.warn('Threads tag needs admin review');}
   return reply(200,{status:'connected'});
  }
  if(op==='disconnect'){if(data.confirm!==true)return reply(400,{error:'Konfirmasi diperlukan.'});const d=await rpc(secret,'status'),platform=data.platform??'threads';if(d.platform!==platform||!d.account_id)throw new Err(403,'Platform tidak sesuai.');await rpc(secret,'disconnect_begin',{platform});try{const a=await repliz('/'+d.account_id);if(a.isConnected!==false)throw new Err(409,'Cabut izin akun dari perangkat tertaut WhatsApp atau aplikasi terhubung Threads, lalu hubungi support untuk menghentikan jadwal dan melepas akun.');throw new Err(409,'Koneksi telah terputus. Hubungi support untuk menyelesaikan penghentian jadwal dan mengganti platform.');}catch(e){if(e.status!==404)throw e;}await rpc(secret,'disconnect_finish',{platform,account_id:d.account_id});return reply(200,{status:'none'});}
  return reply(405,{error:'Operasi tidak tersedia.'});
 }catch(e){return reply(e instanceof Err&&[400,402,403,409].includes(e.status)?e.status:503,{error:e instanceof Err?e.message:'Layanan Threads belum tersambung. Hubungi admin.'});}
}
