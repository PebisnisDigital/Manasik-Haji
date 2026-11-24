import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pwaVersion,PUBLIC_GAME_PAGES} from './pwa-policy.mjs';
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
test('all campaign entries are public game routes; account/admin routes remain private',()=>{
 for(const page of ['district.html','adventure-map.html','hajj-adventure.html','tawaf-adventure.html','sai-adventure.html','tahallul-adventure.html'])assert(PUBLIC_GAME_PAGES.includes(page));
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
