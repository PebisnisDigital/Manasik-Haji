import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PUBLIC_GAME_PAGES,MEMBER_GAME_PAGES} from './pwa-policy.mjs';

export const PRIVATE_PAGES=[...MEMBER_GAME_PAGES,'account.html','admin.html','studio.html','peserta.html','certificate-admin.html','voice-admin.html','verify.html'];
export const RELEASE_PAGES=[...PUBLIC_GAME_PAGES.filter(Boolean),...PRIVATE_PAGES];
export function localReferences(file,text){
  const refs=[];
  if(file.endsWith('.html'))for(const m of text.matchAll(/\b(?:href|src|poster|action)\s*=\s*(["'])(.*?)\1/gi))refs.push(m[2]);
  if(/\.(?:css|html)$/.test(file))for(const m of text.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi))refs.push(m[2]);
  if(file.endsWith('.js'))for(const m of text.matchAll(/\b(?:from|import|new URL)\s*(?:\(\s*)?(["'])([^"']+)\1/g))if(m[2].startsWith('.')||m[2].startsWith('/'))refs.push(m[2]);
  return refs;
}
/** Read-only integrity audit, including deployment below a URL subdirectory. */
export function auditRelease(directory){
  const root=path.resolve(directory),files=[],issues=[],external=new Set();
  if(!fs.existsSync(root))return {passed:false,issues:['Build directory is missing'],files,entryPoints:[],totalBytes:0,externalOrigins:[]};
  function walk(relative=''){
    for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){
      const name=relative?relative+'/'+entry.name:entry.name;
      if(entry.isSymbolicLink()){issues.push('Symbolic link is not allowed in release: '+name);continue;}
      if(entry.isDirectory())walk(name);
      else if(entry.isFile()){const bytes=fs.readFileSync(path.join(root,name));files.push({path:name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
    }
  }
  walk();files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  const names=new Set(files.map(f=>f.path));
  for(const page of [...RELEASE_PAGES,'offline.html','sw.js','manifest.webmanifest','pwa-icon-192.png','pwa-icon-512.png','pwa-maskable-512.png','pwa-apple-180.png','pwa-icon.svg'])if(!names.has(page))issues.push('Missing required file: '+page);
  for(const item of files){
    if(/(?:^|\/)(?:\.env(?:\..*)?|\.git|node_modules)(?:\/|$)/.test(item.path)||item.path.endsWith('.map'))issues.push('Development/private file in release: '+item.path);
    if(!/\.(?:html|css|js)$/.test(item.path))continue;
    const text=fs.readFileSync(path.join(root,item.path),'utf8');
    if(item.path.endsWith('.js')&&/\b__districtDebug\b|\b__adventureDebug\b/.test(text))issues.push('Development diagnostics in release: '+item.path);
    for(const input of localReferences(item.path,text)){
      const ref=input.trim().replace(/&amp;/g,'&');if(!ref||ref.startsWith('#')||/^(?:data|blob|mailto|tel):/i.test(ref))continue;
      if(/^javascript:/i.test(ref)){issues.push('Script URL: '+item.path);continue;}
      let url;try{url=new URL(ref,'https://release.example/game/'+item.path);}catch{issues.push('Invalid reference in '+item.path);continue;}
      if(url.origin!=='https://release.example'){external.add(url.origin);continue;}
      if(ref.startsWith('/')||!url.pathname.startsWith('/game/')){issues.push('Reference is not subdirectory-safe: '+item.path+' → '+ref);continue;}
      let target;try{target=decodeURIComponent(url.pathname.slice('/game/'.length));}catch{issues.push('Invalid URL encoding: '+item.path);continue;}
      if(!target||target.endsWith('/'))target+='index.html';
      if(!names.has(target))issues.push('Missing local target: '+item.path+' → '+target);
    }
  }
  return {passed:issues.length===0,issues:[...new Set(issues)],files,entryPoints:RELEASE_PAGES.filter(f=>names.has(f)),totalBytes:files.reduce((n,f)=>n+f.bytes,0),externalOrigins:[...external].sort()};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=auditRelease(process.argv[2]||'dist');fs.mkdirSync('qa-output',{recursive:true});fs.writeFileSync('qa-output/release-integrity.json',JSON.stringify(report,null,2));
  if(!report.passed){console.error(report.issues.join('\n'));process.exitCode=1;}
  else console.log(`Release integrity: ${report.entryPoints.length} entry pages, ${report.files.length} files, ${report.totalBytes} bytes; local targets, subdirectory paths and development-file isolation passed.`);
}
