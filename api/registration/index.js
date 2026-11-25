import {handleQr,QrisError} from '../../server/buatqris.mjs';
import {createHash} from 'node:crypto';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const reply=(code,value)=>res.status(code).json(value);
 const path=new URL(req.url,'https://local.invalid').pathname.replace(/^\/api\/registration\/?/,'');
 const op=req.method==='GET'&&!path?'get':req.method==='POST'?(path||'create'):'';
 if(!['get','create','report','magic-link','redeem','qris-create','qris-check','coupon','affiliate','lookup','resume'].includes(op))return reply(405,{error:'Metode tidak tersedia.'});
 if(req.method==='POST'&&(req.headers.origin!=='https://'+req.headers.host||!String(req.headers['content-type']).startsWith('application/json')))return reply(403,{error:'Permintaan tidak diizinkan.'});
 let data={};try{data=typeof req.body==='string'?JSON.parse(req.body):req.body??{};if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>4096)return reply(400,{error:'Data tidak valid.'});}catch{return reply(400,{error:'Data tidak valid.'});}
 const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY,url=process.env.VITE_SUPABASE_URL,cap=process.env.HAJJI_TICKET_GATEWAY;
 if(!key||!url||!cap)return reply(503,{error:'Layanan pendaftaran belum dikonfigurasi.'});
 const secret=String(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('manasik_registration='))?.slice(21)??'';
 const ip=createHash('sha256').update(String(req.headers['x-vercel-forwarded-for']??req.headers['x-forwarded-for']??'unknown').split(',')[0]).digest('hex');
 try{
 const qrisOp=op==='qris-create'||op==='qris-check';const qris=qrisOp?await handleQr(op,secret):null;
 const response=await fetch(url+'/rest/v1/rpc/hajji_ticket_gateway',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({k:cap,op:qrisOp?'get':op,secret,ip,data}),signal:AbortSignal.timeout(7000)});
 const result=await response.json();
 if(!response.ok)return reply(response.status===403?503:400,{error:response.status>=500||response.status===403?'Layanan belum tersedia.':String(result.message??'Permintaan gagal.').slice(0,180)});
 if(result.error)return reply(429,{error:result.error});
 if(result.secret){res.setHeader('Set-Cookie','manasik_registration='+result.secret+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000');delete result.secret;}
 if(qrisOp)result.qris=qris;else if((op==='get'||op==='lookup'&&result.lookup==='verified')&&result.registration?.status==='pending' ){try{result.qris=await handleQr('get',secret);}catch{}}
 return reply(200,result);
 }catch(err){if(err instanceof QrisError)return reply(err.code==='rate_limited'?429:503,{error:err.message,code:err.code});console.warn('Registration request failed',{operation:op});return reply(503,{error:'Layanan pendaftaran belum tersambung.'});}
}
