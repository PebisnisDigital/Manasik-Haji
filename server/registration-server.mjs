import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync,existsSync,statSync,createReadStream} from 'node:fs';
import {registrationStore,TICKET} from './registration-store.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export const defaultDb=()=>path.resolve(process.env.REGISTRATION_DB||path.join(root,'private-data','registration.sqlite'));
export function createRegistrationServer({dbPath=defaultDb(),allowedOrigins=[],secureCookie=false}={}){
 mkdirSync(path.dirname(dbPath),{recursive:true});const store=registrationStore(dbPath),rate=new Map();
 const cookieName='manasik_registration',base='/api/registration';
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),isApi=url.pathname.startsWith(base);
  const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  if(isApi){
   try{
    if(!['GET','POST'].includes(req.method))return json(405,{error:'Metode tidak tersedia.'});
    if(req.method==='POST'){
     const origin=req.headers.origin;
     // Production behind a proxy must explicitly list the public HTTPS origin.
     if(!origin||!allowedOrigins.includes(origin))return json(403,{error:'Asal permintaan tidak diizinkan.'});
     if(!String(req.headers['content-type']).startsWith('application/json'))return json(415,{error:'Gunakan JSON.'});
     const ip=req.socket.remoteAddress,now=Date.now();let limit=rate.get(ip);if(!limit||now-limit.start>1800000){limit={start:now,count:0};rate.set(ip,limit);}if(++limit.count>80)return json(429,{error:'Terlalu banyak permintaan. Coba lagi nanti.'});
    }
    const secret=(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    const current=store.get(secret);
    if(req.method==='GET'&&url.pathname===base)return json(200,{ticket:TICKET,registration:current});
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return json(413,{error:'Data terlalu besar.'});}
    let input;try{input=JSON.parse(body);}catch{return json(400,{error:'Data tidak valid.'});}
    const setSession=value=>res.setHeader('Set-Cookie',cookieName+'='+value+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000'+(secureCookie?'; Secure':''));
    if(req.method==='POST'&&url.pathname===base+'/redeem'){
     const redeemed=store.redeem(input?.token);setSession(redeemed.secret);return json(200,{ticket:TICKET,registration:redeemed.registration});
    }
    if(req.method==='POST'&&url.pathname===base+'/magic-link')return json(200,{ticket:TICKET,registration:current,...store.issue(secret)});
    if(req.method==='POST'&&url.pathname===base){
     if(current)return json(200,{ticket:TICKET,registration:current});
     const created=store.create(input);res.setHeader('Set-Cookie',cookieName+'='+created.secret+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000'+(secureCookie?'; Secure':''));return json(201,{ticket:TICKET,registration:created.registration});
    }
    if(req.method==='POST'&&url.pathname===base+'/report')return json(200,{ticket:TICKET,registration:store.claim(secret,input.reference)});
    return json(404,{error:'Layanan tidak ditemukan.'});
   }catch(error){return json(400,{error:error instanceof Error?error.message:'Permintaan gagal.'});}
  }
  // Optional local production server. API responses and private data are never static files.
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
  const dist=path.join(root,'dist'),file=path.resolve(dist,'.'+(decoded==='/'?'/index.html':decoded));
  if(!file.startsWith(dist+path.sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
  const ext=path.extname(file),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2'};
  res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'?'no-store':'public, max-age=3600'});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
 });
 server.on('close',()=>store.close());return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.REGISTRATION_PORT||4180),host=process.env.REGISTRATION_HOST||'127.0.0.1';
 const allowedOrigins=(process.env.REGISTRATION_ORIGINS||'http://127.0.0.1:4173,http://127.0.0.1:5173,http://127.0.0.1:4180').split(',').map(s=>s.trim());
 const server=createRegistrationServer({allowedOrigins,secureCookie:process.env.REGISTRATION_SECURE_COOKIE==='1'});server.listen(port,host,()=>console.log('Pendaftaran manual: http://'+host+':'+port));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
