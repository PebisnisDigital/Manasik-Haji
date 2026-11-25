import {createHmac,timingSafeEqual} from 'node:crypto';
export const endpoint='https://api.buatqris.site';
export class QrisError extends Error{constructor(code,message){super(message);this.name='QrisError';this.code=code;}}
export async function qrRpc(op,secret='',data={}){
 const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY,url=process.env.VITE_SUPABASE_URL,k=process.env.HAJJI_TICKET_GATEWAY;
 if(!key||!url||!k)throw Error('QRIS belum dikonfigurasi.');
 const r=await fetch(url+'/rest/v1/rpc/hajji_qris_gateway',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({k,op,secret,data}),signal:AbortSignal.timeout(7000)});
 if(!r.ok){console.warn('QRIS database operation failed',{operation:op,status:r.status});throw new QrisError('database_error','QRIS belum dapat disimpan. Hubungi admin jika sudah membayar.');}return r.json();
}
export async function provider(config,fields,fetcher=fetch){
 const form=new URLSearchParams({account_id:config.account_id,secret_token:config.secret_token,...fields});
 let r;try{r=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'HAJJI-DIGITAL/1.0'},body:form.toString(),signal:AbortSignal.timeout(10000),redirect:'error'});}catch{throw new QrisError('provider_unknown','Koneksi BuatQRIS terputus. Status transaksi belum diketahui; jangan bayar ulang.');}
 let payload;try{payload=await r.json();}catch{throw new QrisError('provider_unknown','BuatQRIS mengembalikan respons yang belum bisa dibaca. Jangan bayar ulang.');}
 if(r.status===429||payload?.error==='rate_limited')throw new QrisError('rate_limited','BuatQRIS membatasi permintaan. Coba lagi setelah beberapa saat.');
 const data=payload?.data??payload;
 if(!r.ok||payload?.success===false||!data?.transaction_id){
  const explicit=payload?.success===false&&!data?.transaction_id&&[200,400,401,403,422].includes(r.status);
  const kind=explicit?'provider_rejected':'provider_unknown';
  console.warn('BuatQRIS request failed',{status:r.status,kind});
  throw new QrisError(kind,explicit?'BuatQRIS menolak pembuatan QR. Periksa Account ID, Secret Token dan metode QRIS di admin.':'Status transaksi belum diketahui. Hubungi admin sebelum mencoba pembayaran lagi.');
 }
 return data;
}
function trustedUrl(raw){try{const u=new URL(String(raw));return u.protocol==='https:'&&(u.hostname==='buatqris.site'||u.hostname.endsWith('.buatqris.site'))?u.href:null;}catch{return null;}}
export function qrDisplay(data){
 const img=typeof data.qris_image==='string'&&/^data:image\\/png;base64,[A-Za-z0-9+/=]+$/.test(data.qris_image)&&data.qris_image.length<500000?data.qris_image:null;
 return {qr_url:trustedUrl(data.qr_url)??img,qr_image:img,payment_url:trustedUrl(data.payment_url)};
}
export function paymentResult(data){const isTest=data.is_test===true||data.is_test===1||data.is_test==='1'?true:data.is_test===false||data.is_test===0||data.is_test==='0'?false:null;return {transaction_id:String(data.transaction_id??''),status:String(data.status??''),amount:Number(data.amount),total_amount:Number(data.total_amount),is_test:isTest};}
export async function handleQr(op,secret){
 if(op==='qris-create'){
  const reserved=await qrRpc('reserve',secret);
  if(!reserved.config)return reserved.qris??null;
  const c=reserved.config,fields={action:'api_create_qris',amount:String(reserved.amount),description:'HAJJI.DIGITAL '+reserved.registration_id,fee_by:c.fee_by,callback_url:'https://manasik-haji-rho.vercel.app/api/buatqris-webhook',app_name:'HAJJI.DIGITAL',app_version:'1.0',app_url:'https://manasik-haji-rho.vercel.app'};
  if(c.qris_method!=='default')fields.qris_method=c.qris_method;if(c.qris_name)fields.qris_name=c.qris_name;if(c.test_mode)fields.test='1';
  let d;try{d=await provider(c,fields);}catch(e){if(e instanceof QrisError&&['provider_rejected','rate_limited'].includes(e.code))await qrRpc('reject-create',secret,{id:reserved.id,code:e.code});throw e;}
  const result=paymentResult(d),{qr_url,qr_image,payment_url}=qrDisplay(d);
  if(d.amount==null)result.amount=reserved.amount;
  if(d.total_amount==null)result.total_amount=result.amount;
  if(result.is_test===null)result.is_test=c.test_mode; // Creation mode was fixed server-side; settlement requires explicit provider mode.
  const expires=new Date(d.expired_at??Date.now()+900000);
  const saved=await qrRpc('save',secret,{...result,id:reserved.id,qr_url,qr_image,payment_url,expires_at:Number.isFinite(expires.getTime())?expires.toISOString():new Date(Date.now()+900000).toISOString()});
  if(!qr_url&&!payment_url)console.warn('BuatQRIS response has transaction ID but no display image');return saved.qris;
 }
 if(op==='qris-check'){
  const check=await qrRpc('check',secret);
  if(!check.config)return check.qris;
  let d;try{d=await provider(check.config,{action:'api_check_status',transaction_id:check.qris.transaction_id});}catch(e){if(e instanceof QrisError&&e.code==='rate_limited')return check.qris;throw e;}
  const result=paymentResult(d);if(result.transaction_id!==check.qris.transaction_id)throw Error('Identitas transaksi tidak cocok.');
  return (await qrRpc('apply','',result)).qris;
 }
 return (await qrRpc('get',secret)).qris;
}
export function validSignature(raw,given,key){if(!key||typeof given!=='string'||!/^sha256=[a-fA-F0-9]{64}$/.test(given))return false;const expected=createHmac('sha256',key).update(raw).digest();return timingSafeEqual(expected,Buffer.from(given.slice(7),'hex'));}
