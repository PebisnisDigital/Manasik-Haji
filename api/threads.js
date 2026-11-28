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
async function repliz(path,method='GET',data){
 const access=process.env.REPLIZ_ACCESS_KEY,secret=process.env.REPLIZ_SECRET_KEY;
 if(!access||!secret)throw new Err(503,'Koneksi Threads belum siap. Silakan hubungi tim support.');
 const r=await fetch('https://api.repliz.com/public/account'+path,{method,headers:{Authorization:'Basic '+Buffer.from(access+':'+secret).toString('base64'),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!r.ok)throw new Err(r.status,r.status===402?'Kapasitas layanan Threads belum tersedia.':'Koneksi Threads belum dapat diproses.');
 return r.status===204?{}:r.json();
}
function callback(res){
 const nonce=randomBytes(18).toString('base64');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'nonce-"+nonce+"'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; style-src 'unsafe-inline'");
 return res.status(200).send('<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Threads Autopilot</title><style>body{font:16px system-ui;max-width:480px;margin:12vh auto;padding:22px;color:#25211b;background:#fffdf8}a{color:#166534}</style><h1>Threads Autopilot</h1><p id="note" role="status">Memeriksa otorisasi…</p><a href="/district.html?board=magic">Kembali ke distrik</a><script nonce="'+nonce+'">const q=new URLSearchParams(location.search),code=q.get("code"),state=q.get("flow");history.replaceState(null,"","/api/threads?action=callback");const note=document.getElementById("note");if(!code||!state){note.textContent="Otorisasi dibatalkan atau tidak lengkap.";}else{fetch("/api/threads?action=connect",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,state})}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Koneksi gagal.");note.textContent="Akun Threads berhasil terhubung. Silakan kembali ke distrik.";}).catch(e=>{note.textContent=e.message||"Koneksi gagal. Hubungi admin.";});}</script></html>');
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 const op=new URL(req.url,ORIGIN).searchParams.get('action'),reply=(s,d)=>res.status(s).json(d);
 if(req.method==='GET'&&op==='callback')return callback(res);
 if(req.method!=='POST'||req.headers.origin!==ORIGIN||req.headers.host!=='hajji.digital'||!String(req.headers['content-type']).startsWith('application/json'))return reply(403,{error:'Permintaan tidak diizinkan.'});
 const secret=String(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('manasik_registration='))?.slice(21)??'';
 let data;try{data=typeof req.body==='string'?JSON.parse(req.body):req.body??{};if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>10000)throw Error();}catch{return reply(400,{error:'Data tidak valid.'});}
 try{
  if(op==='status'&&!enabled())return reply(200,{enabled:false,status:'none'});
  if(op==='status'){const d=await rpc(secret,'status');let status=d.status,username=d.username;if(status==='connected'&&enabled()){try{const a=await repliz('/'+d.account_id);if(a.isConnected===false)status='disconnected';username=a.username??username;}catch(e){if(e.status===404)status='disconnected';}}return reply(200,{enabled:enabled(),status,username});}
  if(!enabled())return reply(503,{error:'Koneksi Threads belum siap. Silakan hubungi tim support.'});
  if(op==='start'){if(data.consent!==true)return reply(400,{error:'Persetujuan diperlukan.'});const state=randomBytes(32).toString('hex');await rpc(secret,'start',{state,consent:true});const redirect=ORIGIN+'/api/threads?action=callback&flow='+state;const auth=await repliz('/threads/authorize?'+new URLSearchParams({redirect}));const url=new URL(auth.url);if(url.protocol!=='https:'||!['threads.net','www.threads.net','threads.com','www.threads.com'].includes(url.hostname))throw new Err(502,'URL Threads tidak valid.');return reply(200,{url:url.href});}
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
  if(op==='disconnect'){if(data.confirm!==true)return reply(400,{error:'Konfirmasi diperlukan.'});const d=await rpc(secret,'disconnect_begin');try{await repliz('/'+d.account_id,'DELETE');}catch(e){if(e.status!==404)throw e;}await rpc(secret,'disconnect_finish',{account_id:d.account_id});return reply(200,{status:'none'});}
  return reply(405,{error:'Operasi tidak tersedia.'});
 }catch(e){return reply(e instanceof Err&&[400,402,403].includes(e.status)?e.status:503,{error:e instanceof Err?e.message:'Layanan Threads belum tersambung. Hubungi admin.'});}
}
