import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {registrationStore,TICKET} from './registration-store.mjs';
import {createRegistrationServer} from './registration-server.mjs';
const input={name:'Peserta Uji',phone:'081234567890',program:'hajj',avatar:'male',consent:true};
test('manual registration cannot be approved by a player report, forged status, or repeated submission',()=>{
 const store=registrationStore(':memory:');try{
  const {registration:r,secret}=store.create({...input,status:'approved',amount:1});assert.equal(r.status,'pending');assert.equal(TICKET.amount,100000);assert.equal(store.get('invalid'),null);assert.equal(store.get('f'.repeat(64)),null);
  assert.throws(()=>store.approve(r.id));assert.throws(()=>store.claim(secret,''));assert.equal(store.claim(secret,'Pengirim uji, 22 November 10:00').status,'reported');assert.equal(store.get(secret).approved,null);
  store.approve(r.id);assert.equal(store.get(secret).status,'approved');const approved=store.get(secret).approved;store.claim(secret,'Laporan ulang');assert.equal(store.get(secret).status,'approved');assert.equal(store.get(secret).approved,approved);assert.throws(()=>store.approve(r.id));
 }finally{store.close();}
});
test('invalid personal data and missing consent never create orders',()=>{
 const store=registrationStore(':memory:');try{for(const bad of [{name:''},{name:'x'.repeat(61)},{phone:'abc'},{phone:'081'},{avatar:'other'},{program:'free'},{consent:false}])assert.throws(()=>store.create({...input,...bad}));assert.equal(store.list().length,0);}finally{store.close();}
});
test('magic links require approval, are reusable across sessions, and revocation invalidates derived sessions',()=>{
 const store=registrationStore(':memory:');try{
  const {registration:r,secret}=store.create({...input,avatar:'female',program:'umrah'});assert.throws(()=>store.issue(secret));assert.throws(()=>store.issueForId(r.id));assert.throws(()=>store.redeem('invalid'));
  store.claim(secret,'Synthetic bank reference');store.approve(r.id);const a=store.issue(secret),b=store.issueForId(r.id);assert.notEqual(a.token,b.token);assert.match(a.href,/^\.\/index.html\?access=1#token=[a-f0-9]{64}$/);
  const first=store.redeem(a.token),second=store.redeem(a.token);assert.notEqual(first.secret,second.secret);assert.equal(first.registration.avatar,'female');assert.equal(first.registration.program,'umrah');assert.equal(store.get(first.secret).id,r.id);assert.equal(store.get(second.secret).id,r.id);assert.equal(store.get(secret).id,r.id);
  assert.throws(()=>store.redeem('f'.repeat(64)));assert.equal(store.revoke(r.id),2);assert.throws(()=>store.redeem(a.token));assert.throws(()=>store.redeem(b.token));assert.equal(store.get(first.secret),null);assert.equal(store.get(second.secret),null);assert.equal(store.get(secret).status,'approved');assert(store.redeem(store.issue(secret).token));
 }finally{store.close();}
});
test('API isolates cookies, persists approval across restart, rejects cross-origin and oversized writes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'manasik-registration-')),dbPath=path.join(dir,'test.sqlite'),origin='http://127.0.0.1:4173';let server;
 const open=async()=>{server=createRegistrationServer({dbPath,allowedOrigins:[origin]});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+'/api/registration';};
 const close=()=>new Promise(resolve=>server.close(resolve));
 try{
  let url=await open();const post=(body,cookie='',o=origin)=>fetch(url,{method:'POST',headers:{Origin:o,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
  assert.equal((await post(input,'','https://untrusted.invalid')).status,403);assert.equal((await post({...input,name:'x'.repeat(5000)})).status,413);
  const response=await post(input),r=await response.json(),setCookie=response.headers.get('set-cookie'),cookie=setCookie.split(';')[0];assert.equal(response.status,201);assert(setCookie.includes('HttpOnly'));assert(setCookie.includes('SameSite=Strict'));assert(!('phone'in r.registration));assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await(await fetch(url)).json()).registration,null);assert.equal((await(await post({...input,status:'approved'},cookie)).json()).registration.id,r.registration.id);
  const claim=await fetch(url+'/report',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({reference:'Bank test reference',status:'approved'})});assert.equal((await claim.json()).registration.status,'reported');
  assert.equal((await fetch(url+'/approve',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:'{}'})).status,404);
  const store=registrationStore(dbPath);store.approve(r.registration.id);store.close();await close();url=await open();assert.equal((await(await fetch(url,{headers:{Cookie:cookie}})).json()).registration.status,'approved');
  const link=await fetch(url+'/magic-link',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:'{}'}),issued=await link.json();assert.equal(link.status,200);assert.equal(link.headers.get('cache-control'),'no-store');
  const redeemed=await fetch(url+'/redeem',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token:issued.token})});assert.equal(redeemed.status,200);const accessCookie=redeemed.headers.get('set-cookie').split(';')[0];assert.notEqual(cookie,accessCookie);assert.equal((await redeemed.json()).registration.id,r.registration.id);assert.equal((await(await fetch(url,{headers:{Cookie:accessCookie}})).json()).registration.status,'approved');
  assert.equal((await fetch(url+'/magic-link',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'})).status,400);
  assert.equal((await fetch(new URL('/private-data/registration.sqlite',url))).status,404);
 }finally{if(server?.listening)await close();assert.equal(path.dirname(dir),os.tmpdir());assert(path.basename(dir).startsWith('manasik-registration-'));fs.rmSync(dir,{recursive:true,force:true});}
});
