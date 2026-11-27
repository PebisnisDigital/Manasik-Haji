// The referral URL and the redeemable reward coupon are different identifiers.
const REF='hajji-landing-affiliate-v1';
const REWARD='hajji-referral-code';
const pattern=/^[A-Z0-9][A-Z0-9-]{2,29}$/;
let ref='',cached='',pending:Promise<string>|null=null;
export function initLandingReferral(params:URLSearchParams){
 const raw=params.get('ref')?.trim().toUpperCase();
 try{
  const previous=sessionStorage.getItem(REF);
  // A fresh visit to the central landing page must never inherit another affiliate.
  ref=raw!==undefined?raw:params.has('guide')||params.has('legacyLobby')?(previous??''):'';
  if(ref!==previous)sessionStorage.removeItem(REWARD);
  sessionStorage.setItem(REF,ref);
 }catch{ref=raw??'';}
 cached='';pending=null;
}
export function landingAffiliate(){return ref;}
export function claimedLandingCoupon(){try{return sessionStorage.getItem(REWARD)??'';}catch{return '';}}
export function clearClaimedLandingCoupon(){try{sessionStorage.removeItem(REWARD);}catch{}}
export function currentLandingCoupon(){return cached;}
export function resolveLandingCoupon():Promise<string>{
 if(pending)return pending;
 const source=ref;
 const work=(async()=>{
  if(source&&!pattern.test(source))throw Error('Link affiliate tidak valid.');
  const res=await fetch('/api/registration/coupon',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({reward_ref:source}),signal:AbortSignal.timeout(8000)});
  const data=await res.json(),code=data.coupon?.code;
  if(!res.ok||typeof code!=='string'||!pattern.test(code)||!Number.isInteger(data.coupon.amount)||data.coupon.discount<0)throw Error(data.error||'Kupon belum tersedia.');
  if(source!==ref)throw Error('Link affiliate berubah.');
  cached=code;return code;
 })();
 pending=work;void work.finally(()=>{if(pending===work)pending=null;}).catch(()=>{});
 return work;
}
export function claimLandingCoupon(code:string){
 if(!code||code!==cached)return false;
 try{sessionStorage.setItem(REWARD,code);return true;}catch{return false;}
}
