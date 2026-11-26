import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pwaVersion,PUBLIC_GAME_PAGES,MEMBER_GAME_PAGES} from './pwa-policy.mjs';
import {auditRelease,RELEASE_PAGES} from './release-check.mjs';

function fixture(run){const root=fs.mkdtempSync(path.join(os.tmpdir(),'manasik-release-test-'));try{return run(root);}finally{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('manasik-release-test-'));fs.rmSync(root,{recursive:true,force:true});}}
function validTree(root){
 for(const page of [...RELEASE_PAGES,'offline.html'])fs.writeFileSync(path.join(root,page),'<!doctype html><a href="./adventure-map.html">Peta</a>');
 for(const file of ['sw.js','manifest.webmanifest','pwa-icon-192.png','pwa-icon-512.png','pwa-maskable-512.png','pwa-apple-180.png','pwa-icon.svg'])fs.writeFileSync(path.join(root,file),'fixture');
 fs.mkdirSync(path.join(root,'assets'));fs.writeFileSync(path.join(root,'assets','game.js'),'import "./shared.js";');fs.writeFileSync(path.join(root,'assets','shared.js'),'export const value=1;');
}
test('an HTML-only chapter update changes the static worker version deterministically',()=>fixture(root=>{
 fs.writeFileSync(path.join(root,'game.js'),'fixed');fs.writeFileSync(path.join(root,'adventure-map.html'),'map v1');
 const before=pwaVersion(root,['game.js','adventure-map.html']);assert.equal(before,pwaVersion(root,['adventure-map.html','game.js','game.js']));fs.writeFileSync(path.join(root,'adventure-map.html'),'map v2');assert.notEqual(before,pwaVersion(root,['game.js','adventure-map.html']));
}));
test('campaign entries are member only; account/admin routes remain private',()=>{
 for(const page of ['district.html','adventure-map.html','hajj-adventure.html','tawaf-adventure.html','sai-adventure.html','tahallul-adventure.html'])assert(MEMBER_GAME_PAGES.includes(page)&&!PUBLIC_GAME_PAGES.includes(page));
 for(const page of ['oleh-oleh.html','account.html','admin.html','studio.html','peserta.html','certificate-admin.html','voice-admin.html','verify.html'])assert(!PUBLIC_GAME_PAGES.includes(page));
});
test('release integrity accepts local subdirectory links and ignores external navigation origins',()=>fixture(root=>{
 validTree(root);fs.appendFileSync(path.join(root,'index.html'),'<a href="./hajj-adventure.html?campaign=hajj&amp;chapter=miqat">Bab 1</a><a href="https://hajj.nusuk.sa/Journey">Sumber</a>');
 const result=auditRelease(root);assert.equal(result.passed,true,result.issues.join('\n'));assert.equal(result.entryPoints.length,RELEASE_PAGES.length);assert.deepEqual(result.externalOrigins,['https://hajj.nusuk.sa']);assert(result.files.every(f=>f.sha256.length===64));
}));
test('release integrity rejects missing chapter assets, root-relative links and private/dev files',()=>fixture(root=>{
 validTree(root);fs.appendFileSync(path.join(root,'index.html'),'<img src="./missing.png"><a href="/player.html">Absolute</a>');fs.writeFileSync(path.join(root,'.env'),'fixture only');fs.writeFileSync(path.join(root,'assets','game.js'),'window.__districtDebug={};');
 const result=auditRelease(root);assert.equal(result.passed,false);for(const expected of ['Missing local target','not subdirectory-safe','Development/private file','Development diagnostics'])assert(result.issues.some(s=>s.includes(expected)));
}));
test('release integrity checks JS module references and required chapter entries',()=>fixture(root=>{
 validTree(root);fs.unlinkSync(path.join(root,'hajj-adventure.html'));fs.unlinkSync(path.join(root,'assets','shared.js'));const result=auditRelease(root);assert.equal(result.passed,false);assert(result.issues.some(s=>s==='Missing required file: hajj-adventure.html'));assert(result.issues.some(s=>s.includes('assets/shared.js')));
}));

import middleware,{classify,readMemberCookie,verifyMember} from '../middleware.js';
const base='https://hajidigital.vercel.app';
const token='a'.repeat(64);
const env={VITE_SUPABASE_URL:'https://example.invalid',VITE_SUPABASE_PUBLISHABLE_KEY:'test',HAJJI_TICKET_GATEWAY:'test'};
test('every member entry and root gameplay alias requires access',()=>{
 for(const page of MEMBER_GAME_PAGES){
  for(const suffix of ['', '?board=preview','?board=contoh','?demo=1','?transfer=mina']){
   assert(classify(new URL('/'+page+suffix,base)).protected,page+suffix);
  }
  assert(classify(new URL('/'+page.replace('.html',''),base)).protected);
 }
 for(const route of ['/?play=miqat','/index.html?play=miqat&access=1','/?legacyLobby=1','/?demo=magic','/?contoh=1','/district.html?boarding=demo','/%64istrict.html'])assert(classify(new URL(route,base)).protected,route);
 for(const route of ['/','/index.html?access=1','/index.html?access=resume','/index.html?setup=1','/index.html?guide=1','/checkout.html','/admin.html'])assert(!classify(new URL(route,base)).protected,route);
});
test('anonymous visitors are redirected before the arena is served',async()=>{
 for(const page of MEMBER_GAME_PAGES){const r=await middleware(new Request(base+'/'+page));assert.equal(r.status,303);assert.equal(new URL(r.headers.get('location')).pathname,'/index.html');assert.match(r.headers.get('cache-control'),/no-store/);}
 const r=await middleware(new Request(base+'/district.html',{headers:{cookie:'manasik_registration=fake'}}));assert.equal(r.status,303);
 const head=await middleware(new Request(base+'/district.html',{method:'HEAD'}));assert.equal(head.status,303);
 assert.equal(readMemberCookie(new Request(base,{headers:{cookie:'manasik_registration='+token+'; manasik_registration='+token}})),null);
});
test('member verification uses database status rather than client claims and fails closed',async()=>{
 const check=r=>verifyMember(token,env,async(url,options)=>{assert.equal(url,'https://example.invalid/rest/v1/rpc/hajji_ticket_gateway');assert.equal(JSON.parse(options.body).secret,token);assert.equal(JSON.parse(options.body).op,'get');return Response.json({registration:r});});
 assert.equal(await check({status:'approved',access_suspended:false,program:'hajj'}),'approved');
 assert.equal(await check({status:'approved',access_suspended:false,program:'umrah'}),'approved');
 for(const r of [null,{status:'pending',access_suspended:false,program:'hajj'},{status:'reported',access_suspended:false,program:'hajj'},{status:'approved',access_suspended:true,program:'hajj'},{status:'approved',program:'hajj'}])assert.equal(await check(r),'denied');
 assert.equal(await verifyMember(token,{},async()=>{throw Error('must not fetch')}),'unavailable');
 assert.equal(await verifyMember(token,env,async()=>{throw Error('network')}),'unavailable');
 assert.equal(await verifyMember(token,env,async()=>new Response('',{status:500})),'unavailable');
});
