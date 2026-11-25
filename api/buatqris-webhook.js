import {qrRpc,validSignature,paymentResult} from '../server/buatqris.mjs';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{
  const chunks=[];let size=0;for await(const chunk of req){const b=Buffer.from(chunk);size+=b.length;if(size>32768)return res.status(413).json({error:'Too large'});chunks.push(b);}
  const raw=Buffer.concat(chunks);const c=await qrRpc('webhook-config');
  if(!validSignature(raw,req.headers['x-buatqris-signature'],c.signing_secret))return res.status(401).json({error:'Invalid signature'});
  let body;try{body=JSON.parse(raw.toString('utf8'));}catch{return res.status(400).json({error:'Invalid JSON'});}
  const event=String(body.event??'');if(!['payment.success','payment.failed','payment.expired'].includes(event))return res.status(200).json({ok:true,ignored:true});
  const result=paymentResult(body.data??body);if(result.status!==event.slice(8)||!result.transaction_id)return res.status(400).json({error:'Invalid event'});
  await qrRpc('apply','',result);return res.status(200).json({ok:true});
 }catch{return res.status(503).json({error:'Retry delivery'});}
}
