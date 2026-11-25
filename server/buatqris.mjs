import {createHmac,timingSafeEqual} from 'node:crypto';
const endpoint='https://app.buatqris.site/api';
export async function qrRpc(op,secret='',data={}){
 const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY,url=process.env.VITE_SUPABASE_URL,k=process.env.HAJJI_TICKET_GATEWAY;
 if(!key||!url||!k)throw Error('QRIS belum dikonfigurasi.');
 const r=await fetch(url+'/rest/v1/rpc/hajji_qris_gateway',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({k,op,secret,data}),signal:AbortSignal.timeout(7000)});
 if(!r.ok)throw Error('QRIS belum dapat diproses. Hubungi admin jika sudah membayar.');return r.json();
}
async function provider(config,fields){
 const form=new URLSearchParams({account_id:config.account_id,secret_token:config.secret_token,...fields});
 const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'HAJJI-DIGITAL/1.0'},body:form,signal:AbortSignal.timeout(10000),redirect:'error'});
 const payload=await r.json();if(r.status===429||payload.error==='rate_limited')return null;if(!r.ok||payload.success===false)throw Error('BuatQRIS belum merespons. Jangan melakukan pembayaran ulang.');return payload.data??payload;
}
function trustedUrl(raw){try{const u=new URL(String(raw));return u.protocol==='https:'&&(u.hostname==='buatqris.site'||u.hostname.endsWith('.buatqris.site'))?u.href:null;}catch{return null;}}
export function paymentResult(data){const isTest=data.is_test===true||data.is_test===1||data.is_test==='1'?true:data.is_test===false||data.is_test===0||data.is_test==='0'?false:null;return {transaction_id:String(data.transaction_id??''),status:String(data.status??''),amount:Number(data.amount),total_amount:Number(data.total_amount),is_test:isTest};}
export async function handleQr(op,secret){
 if(op==='qris-create'){
  const reserved=await qrRpc('reserve',secret);
  if(!reserved.config)return reserved.qris??null;
  const c=reserved.config,fields={action:'api_create_qris',amount:String(reserved.amount),description:'HAJJI.DIGITAL '+reserved.registration_id,fee_by:c.fee_by,callback_url:'https://manasik-haji-rho.vercel.app/api/buatqris-webhook',app_name:'HAJJI.DIGITAL',app_url:'https://manasik-haji-rho.vercel.app'};
  if(c.qris_method!=='default')fields.qris_method=c.qris_method;if(c.qris_name)fields.qris_name=c.qris_name;if(c.test_mode)fields.test='1';
  const d=await provider(c,fields);if(!d)throw Error('BuatQRIS sedang membatasi permintaan. Hubungi admin.');
  const result=paymentResult(d),qr_url=trustedUrl(d.qr_url)??(typeof d.qris_image==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(d.qris_image)&&d.qris_image.length<500000?d.qris_image:null);
  const payment_url=trustedUrl(d.payment_url);
  if(!qr_url&&!payment_url)throw Error('Gambar QRIS belum tersedia. Hubungi admin.');
  if(result.is_test===null)result.is_test=c.test_mode; // Creation mode was fixed server-side; settlement requires explicit provider mode.
  const expires=new Date(d.expired_at??Date.now()+900000);
  return (await qrRpc('save',secret,{...result,id:reserved.id,qr_url,payment_url,expires_at:Number.isFinite(expires.getTime())?expires.toISOString():new Date(Date.now()+900000).toISOString()})).qris;
 }
 if(op==='qris-check'){
  const check=await qrRpc('check',secret);
  if(!check.config)return check.qris;
  const d=await provider(check.config,{action:'api_check_status',transaction_id:check.qris.transaction_id});
  if(!d)return check.qris;
  const result=paymentResult(d);if(result.transaction_id!==check.qris.transaction_id)throw Error('Identitas transaksi tidak cocok.');
  return (await qrRpc('apply','',result)).qris;
 }
 return (await qrRpc('get',secret)).qris;
}
export function validSignature(raw,given,key){if(!key||typeof given!=='string'||!/^sha256=[a-fA-F0-9]{64}$/.test(given))return false;const expected=createHmac('sha256',key).update(raw).digest();return timingSafeEqual(expected,Buffer.from(given.slice(7),'hex'));}
