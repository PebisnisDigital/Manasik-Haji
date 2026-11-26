/** Server-side paid member gate. Never trust browser progress, query flags or a cookie's mere presence. */
const publicPages=new Set(['index','checkout','affiliate','account','admin','studio','peserta','certificate-admin','voice-admin','verify','offline']);
const arenaPages=new Set(['district','manasik','player','sai','umrah','hajj','explore','legacy','adventure','adventure-map','avatar-preview','oleh-oleh','hajj-adventure','tawaf-adventure','sai-adventure','tahallul-adventure','mina-adventure','arafah-adventure','muzdalifah-adventure','aqabah-adventure','ifadah-adventure','tasyrik-adventure','wada-adventure']);
const cacheHeaders={'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function next(privatePage=false){return new Response(null,{headers:{'x-middleware-next':'1',...(privatePage?cacheHeaders:{})}});}
function redirect(url,path){const target=new URL(path,url.origin);const tenant=url.searchParams.get('mitra');if(tenant&&/^[a-z0-9-]{1,64}$/i.test(tenant))target.searchParams.set('mitra',tenant);return new Response(null,{status:303,headers:{...cacheHeaders,Location:target.href}});}
export function classify(url){
 let path;try{path=decodeURIComponent(url.pathname).replace(/\/+/g,'/').replace(/\/$/,'').toLowerCase();}catch{return {protected:true,name:'invalid',demo:false};}
 const name=path.replace(/^\//,'').replace(/\.html$/,'')||'index';
 const q=url.searchParams;
 const demo=q.has('demo')||q.has('contoh')||['preview','demo','contoh'].includes(q.get('board')??'')||q.get('boarding')==='demo';
 const root=name==='index';
 const protectedPage=root?demo||['play','legacyLobby','board','transfer','lobby'].some(k=>q.has(k)):arenaPages.has(name)||(!publicPages.has(name)&&path.endsWith('.html'));
 return {protected:protectedPage,name,demo};
}
export function readMemberCookie(request){
 const values=(request.headers.get('cookie')??'').split(';').map(x=>x.trim()).filter(x=>x.startsWith('manasik_registration=')).map(x=>x.slice('manasik_registration='.length));
 return values.length===1&&/^[a-f0-9]{64}$/.test(values[0])?values[0]:null;
}
export async function verifyMember(secret,env=process.env,fetcher=fetch){
 if(!secret)return 'denied';
 const url=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_PUBLISHABLE_KEY,cap=env.HAJJI_TICKET_GATEWAY;
 if(!url||!key||!cap)return 'unavailable';
 try{
  const response=await fetcher(url.replace(/\/$/,'')+'/rest/v1/rpc/hajji_ticket_gateway',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({k:cap,op:'get',secret,ip:'member-page',data:{}}),cache:'no-store',signal:AbortSignal.timeout(7000)});
  if(!response.ok)return 'unavailable';
  const data=await response.json(),r=data.registration;
  if(data.error)return 'unavailable';
  return r?.status==='approved'&&r.access_suspended===false&&['hajj','umrah'].includes(r.program)?'approved':'denied';
 }catch{return 'unavailable';}
}
export default async function middleware(request){
 const url=new URL(request.url),route=classify(url);
 if(!route.protected)return next();
 const verdict=await verifyMember(readMemberCookie(request));
 if(verdict==='unavailable')return new Response('Layanan verifikasi member belum tersedia. Muat ulang beberapa saat lagi.',{status:503,headers:{...cacheHeaders,'Content-Type':'text/plain; charset=utf-8','Retry-After':'15'}});
 if(verdict!=='approved')return redirect(url,'/index.html?member=required');
 if(route.demo)return redirect(url,'/district.html?board=magic');
 if(route.name==='district'&&!url.searchParams.has('transfer')&&url.searchParams.get('board')!=='magic')return redirect(url,'/district.html?board=magic');
 return next(true);
}
// Every HTML/root/extensionless request is evaluated, including HEAD and direct fetch.
// API and hashed assets do not use this page gate; their own authorization is separate.
export const config={matcher:['/','/((?!api/|assets/).*)']};
