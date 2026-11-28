import {randomBytes} from 'node:crypto';
const ORIGIN='https://hajji.digital';
class BridgeError extends Error{constructor(status,message){super(message);this.status=status;}}
async function provider(path,method='GET',body){
 const access=process.env.REPLIZ_ACCESS_KEY,secret=process.env.REPLIZ_SECRET_KEY;
 if(!access||!secret)throw new BridgeError(503,'API Repliz belum dikonfigurasi.');
 const r=await fetch('https://api.repliz.com/public'+path,{method,headers:{Authorization:'Basic '+Buffer.from(access+':'+secret).toString('base64'),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(7000),redirect:'error'});
 if(!r.ok)throw new BridgeError(r.status,'Repliz menolak permintaan (HTTP '+r.status+').');
 if(r.status===204||method==='DELETE')return {};
 return r.json();
}
const states={pending:'scheduled',process:'publishing',success:'published',error:'failed'};
export async function adminBridge(req,res){
 const reply=(s,d)=>res.status(s).json(d);
 if(req.method!=='POST'||req.headers.origin!==ORIGIN||req.headers.host!=='hajji.digital'||!String(req.headers['content-type']).startsWith('application/json'))return reply(403,{error:'Permintaan tidak diizinkan.'});
 const auth=req.headers.authorization;
 if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_.-]+$/.test(auth)||auth.length>10000)return reply(401,{error:'Login superadmin diperlukan.'});
 let data;try{data=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!data||typeof data!=='object'||JSON.stringify(data).length>2000||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(data.id)||!['submit','sync','cancel'].includes(data.action))throw Error();}catch{return reply(400,{error:'Data tidak valid.'});}
 const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY,k=process.env.HAJJI_TICKET_GATEWAY;
 if(!url||!key||!k||!process.env.REPLIZ_ACCESS_KEY||!process.env.REPLIZ_SECRET_KEY)return reply(503,{error:'Konfigurasi layanan belum lengkap.'});
 const db=async(op,extra={})=>{const r=await fetch(url+'/rest/v1/rpc/hajji_autojualan_bridge',{method:'POST',headers:{apikey:key,Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify({k,op,data:{id:data.id,...extra}}),signal:AbortSignal.timeout(5000)});const d=await r.json();if(!r.ok)throw new BridgeError(r.status===401||r.status===403?403:409,typeof d.message==='string'&&d.code!=='42501'?d.message.slice(0,250):'Akses superadmin diperlukan.');return d;};
 const nonce=randomBytes(32).toString('hex');
 try{
  if(data.action==='submit'){
   if(data.confirm!==true)return reply(400,{error:'Review dan konfirmasi jadwal diperlukan.'});
   const p=await db('claim',{nonce,confirm:true,batch:data.batch===true});let attempted=false;
   try{
    const a=await provider('/account/'+p.account_id);
    if(a.isConnected!==true||a.type!==p.platform||(a.id??a._id)!==p.account_id)throw new BridgeError(409,'Akun Repliz tidak aktif atau tidak cocok.');
    let channel;
    if(p.platform==='whatsapp'&&p.target_id!=='status'){
     const list=await provider('/addon/whatsapp/channel?'+new URLSearchParams({accountId:p.account_id}));
     const rows=Array.isArray(list)?list:Array.isArray(list.docs)?list.docs:null;
     channel=rows?.find(x=>x.id===p.target_id&&x.type===p.target?.type);
     if(!channel||typeof channel.name!=='string')throw new BridgeError(409,'Grup atau channel tidak lagi tersedia. Jadwal tidak dikirim.');
     channel={id:channel.id,name:channel.name,type:channel.type,picture:typeof channel.picture==='string'?channel.picture:''};
    }
    const at=new Date(p.schedule_at);if(!Number.isFinite(at.getTime())||at.getTime()<Date.now()+600000)throw new BridgeError(409,'Waktu jadwal sudah terlalu dekat.');
    if(typeof p.body!=='string'||!p.body.trim()||(p.platform==='threads'&&p.body.length>500))throw new BridgeError(400,'Isi materi tidak valid.');
    const type=p.media_url?p.media_type:'text';if(!['text','image','video'].includes(type)||p.media_url&&!/^https:\/\/[^\s]+$/.test(p.media_url))throw new BridgeError(400,'Media tidak valid.');
    const payload={title:'',accountId:p.account_id,description:p.body,type,medias:p.media_url?[{type,url:p.media_url}]:[],scheduleAt:at.toISOString(),additionalInfo:{isDraft:false,...(channel?{channel}:{})}};
    attempted=true;const result=await provider('/schedule','POST',payload);
    if(typeof result.scheduleId!=='string'||!/^[a-f0-9]{24}$/.test(result.scheduleId))throw new BridgeError(502,'ID jadwal tidak dapat diverifikasi.');
    await db('finish',{nonce,state:'scheduled',schedule_id:result.scheduleId,note:'Jadwal diterima Repliz.'});return reply(200,{status:'scheduled'});
   }catch(e){const state=attempted?'uncertain':'failed';try{await db('finish',{nonce,state,note:attempted?'Respons pengiriman belum pasti. Periksa dashboard Repliz; jangan kirim ulang.':e instanceof BridgeError?e.message:'Pemeriksaan akun gagal. Jadwal belum dikirim.'});}catch{}return reply(409,{error:attempted?'Pengiriman belum pasti. Periksa Repliz sebelum mengambil tindakan.':e instanceof BridgeError?e.message:'Pemeriksaan gagal. Tidak ada pengiriman.'});}
  }
  if(data.action==='sync'){
   const p=await db('lookup');const r=await provider('/schedule/'+p.schedule_id);
   if((r.id??r._id??r.scheduleId)!==p.schedule_id||!states[r.status])throw new BridgeError(502,'Status Repliz belum dapat diverifikasi.');
   const state=states[r.status];if(p.state!=='published'&&p.state!=='cancelled'&&p.state!=='cancelling')await db('sync',{schedule_id:p.schedule_id,state,note:'Status Repliz: '+r.status});return reply(200,{status:state});
  }
  if(data.confirm!==true)return reply(400,{error:'Konfirmasi pembatalan diperlukan.'});
  const p=await db('cancel-claim',{nonce,confirm:true,batch:data.batch===true});let attempted=false;
  try{const r=await provider('/schedule/'+p.schedule_id);if((r.id??r._id??r.scheduleId)!==p.schedule_id||r.status!=='pending')throw new BridgeError(409,'Jadwal tidak lagi menunggu publikasi. Periksa status terlebih dahulu.');attempted=true;await provider('/schedule/'+p.schedule_id,'DELETE');await db('cancel-finish',{nonce,state:'cancelled',note:'Jadwal dibatalkan di Repliz.'});return reply(200,{status:'cancelled'});}
  catch(e){try{await db('cancel-finish',{nonce,state:attempted?'uncertain':'scheduled',note:attempted?'Pembatalan belum pasti. Periksa Repliz.':'Pembatalan belum dilakukan. Sinkronkan status.'});}catch{}return reply(409,{error:attempted?'Pembatalan belum pasti. Periksa Repliz.':e instanceof BridgeError?e.message:'Gagal memeriksa jadwal.'});}
 }catch(e){return reply(e instanceof BridgeError&&[400,401,403,409].includes(e.status)?e.status:503,{error:e instanceof BridgeError?e.message:'Layanan belum tersedia.'});}
}
