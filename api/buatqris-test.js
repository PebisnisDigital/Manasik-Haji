import {qrRpc,provider,qrDisplay,QrisError,paymentResult} from '../server/buatqris.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const reply=(status,data)=>res.status(status).json(data);
 if(req.method!=='POST'||req.headers.origin!=='https://'+req.headers.host)return reply(403,{error:'Permintaan tidak diizinkan.'});
 const authorization=req.headers.authorization;
 if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization))return reply(401,{error:'Masuk sebagai superadmin.'});
 const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return reply(503,{error:'Backend belum dikonfigurasi.'});
 try{
  const check=await fetch(url+'/rest/v1/rpc/hajji_qris_admin',{method:'POST',headers:{apikey:key,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify({op:'test',data:{}}),signal:AbortSignal.timeout(7000)});
  if(!check.ok){const err=await check.json().catch(()=>({}));return reply(check.status===401||check.status===403?403:400,{error:check.status===401||check.status===403?'Akses superadmin diperlukan.':String(err.message??'Uji belum diizinkan.').slice(0,180)});}
  const c=await qrRpc('diagnostic-config'),fields={action:'api_create_qris',amount:'100000',test:'1',description:'HAJJI.DIGITAL SANDBOX TEST',fee_by:c.fee_by,app_name:'HAJJI.DIGITAL',app_version:'1.0',app_url:'https://manasik-haji-rho.vercel.app'};
  if(c.qris_method!=='default')fields.qris_method=c.qris_method;if(c.qris_name)fields.qris_name=c.qris_name;
  const d=await provider(c,fields),result=paymentResult(d);
  if(result.is_test!==true)return reply(502,{error:'Provider tidak mengonfirmasi mode sandbox. Jangan membayar QR apa pun.'});
  const display=qrDisplay(d);if(!display.qr_url&&!display.payment_url)return reply(502,{error:'BuatQRIS membuat transaksi sandbox tetapi tidak memberikan gambar atau link pembayaran.'});
  return reply(200,{ok:true,is_test:true,...display,amount:Number.isFinite(result.amount)?result.amount:100000,total_amount:Number.isFinite(result.total_amount)?result.total_amount:100000});
 }catch(e){return reply(e instanceof QrisError&&e.code==='rate_limited'?429:503,{error:e instanceof QrisError?e.message:'Uji koneksi gagal. Periksa konfigurasi server.'});}
}
