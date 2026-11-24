import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {PUBLIC_GAME_PAGES,pwaVersion} from './pwa-policy.mjs';
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length,0);t.copy(b,4);data.copy(b,8);let c=0xffffffff;for(const x of Buffer.concat([t,data]))c=crcTable[(c^x)&255]^(c>>>8);b.writeUInt32BE((c^0xffffffff)>>>0,8+data.length);return b;}
function polygon(x,y,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function segment(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/Math.max(1,dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
const outline=[[160,212],[256,163],[352,212],[352,332],[256,381],[160,332]],gold=[228,196,124],pale=[235,208,149];function pixel(x,y){const r=Math.hypot(x-256,y-256);let c=[18,58,48];if(Math.abs(r-184)<2)c=gold;if(polygon(x,y,outline))c=x<256?[16,36,31]:[23,43,34];for(let i=0;i<outline.length;i++)if(segment(x,y,outline[i],outline[(i+1)%outline.length])<3.5)c=pale;for(const [a,b] of [[[160,212],[256,261]],[[256,261],[352,212]],[[256,261],[256,381]]])if(segment(x,y,a,b)<2.5)c=gold;for(const [a,b] of [[[160,242],[256,292]],[[256,292],[352,242]]])if(segment(x,y,a,b)<7.5)c=gold;if(segment(x,y,[230,115],[282,115])<2.5||segment(x,y,[256,89],[256,141])<2.5||Math.hypot(x-256,y-115)<9)c=pale;return c;}
function png(n,maskable){const raw=Buffer.alloc((n*3+1)*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const sum=[0,0,0];for(const sy of [.25,.75])for(const sx of [.25,.75]){let a=(x+sx)*512/n,b=(y+sy)*512/n;if(maskable){a=(a-256)/.82+256;b=(b-256)/.82+256;}const c=pixel(a,b);for(let k=0;k<3;k++)sum[k]+=c[k];}const i=y*(n*3+1)+1+x*3;for(let k=0;k<3;k++)raw[i+k]=Math.round(sum[k]/4);}const h=Buffer.alloc(13);h.writeUInt32BE(n,0);h.writeUInt32BE(n,4);h[8]=8;h[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
if(process.argv[2]==='prepare'){fs.mkdirSync('public',{recursive:true});for(const [n,name,mask] of [[192,'pwa-icon-192.png',false],[512,'pwa-icon-512.png',false],[512,'pwa-maskable-512.png',true],[180,'pwa-apple-180.png',false]])fs.writeFileSync(path.join('public',name),png(n,mask));console.log('PWA: four PNG icons generated');}
else if(process.argv[2]==='finish'){
 const dir='dist';const assets=fs.readdirSync(path.join(dir,'assets')).filter(x=>/^[A-Za-z0-9_.-]+\.(?:js|css|woff2?|png|webp|svg|jpg|jpeg|avif|wasm)$/.test(x)).map(x=>'assets/'+x).sort();
 const shell=['offline.html','manifest.webmanifest','pwa-icon-192.png','pwa-icon-512.png','pwa-maskable-512.png','pwa-apple-180.png','pwa-icon.svg'];
 const pages=fs.readdirSync(dir).filter(f=>f.endsWith('.html'));
 const version=pwaVersion(dir,[...shell,...assets,...pages]);
 const source=fs.readFileSync('tools/pwa-worker.js','utf8').replace('__CACHE_NAME__',JSON.stringify(version)).replace('__STATIC_ASSETS__',JSON.stringify(assets)).replace('__SHELL_FILES__',JSON.stringify(shell)).replace('__PUBLIC_GAME_PAGES__',JSON.stringify(PUBLIC_GAME_PAGES));
 new vm.Script(source);fs.writeFileSync(path.join(dir,'sw.js'),source);
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.webmanifest'),'utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');for(const f of [...manifest.icons,{src:'pwa-apple-180.png',sizes:'180x180'}]){const b=fs.readFileSync(path.join(dir,f.src));assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),Number(f.sizes.split('x')[0]));assert.equal(b.readUInt32BE(20),Number(f.sizes.split('x')[1]));}
 // Run the actual worker routing with mocked browser primitives, verifying no API or authenticated navigation caching.
 const handlers={},cacheWrites=[],networkRequests=[];const scope='https://qa.example/';const response={ok:true,type:'basic',redirected:false,clone(){return this;}};
 const cache={addAll:async urls=>{cacheWrites.push(...urls);},match:async key=>key.endsWith('offline.html')?response:undefined,put:async key=>cacheWrites.push(key)};
 const context={URL,Set,Promise,Response,console,caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async req=>{networkRequests.push(req.url);return response;},self:{registration:{scope},location:new URL(scope),addEventListener:(name,handler)=>handlers[name]=handler,clients:{claim:async()=>{}}}};
 vm.runInNewContext(source,context);let installing;handlers.install({waitUntil:p=>installing=p});await installing;assert.ok(cacheWrites.some(x=>x.endsWith('/offline.html')));assert.ok(!cacheWrites.some(x=>/account\.html|admin\.html/.test(x)));
 async function request(url,opts={}){let result;handlers.fetch({request:{url,method:'GET',mode:'cors',headers:{has:()=>false},...opts},respondWith:p=>result=p,waitUntil:()=>{}});if(result)await result;return !!result;}
 assert.equal(await request('https://api.example/rest/v1/runs'),false);assert.equal(await request(scope+'account.html',{mode:'navigate'}),false);assert.equal(await request(scope+'admin.html',{mode:'navigate'}),false);assert.equal(await request(scope+'rest/v1/runs'),false);assert.equal(await request(scope+'index.html?mitra=travel',{mode:'navigate'}),true);assert.equal(await request(scope+assets[0]),true);assert.equal(await request(scope+assets[0]+'?secret=1'),false);assert.equal(await request(scope+assets[0],{method:'POST'}),false);assert.equal(await request(scope+assets[0],{headers:{has:()=>true}}),false);assert.ok(networkRequests.every(u=>u.startsWith(scope)));
 const before=cacheWrites.length;
 for(const page of PUBLIC_GAME_PAGES)assert.equal(await request(scope+page+'?mitra=travel',{mode:'navigate'}),true);
 assert.equal(cacheWrites.length,before,'Navigation HTML must never enter the static cache');
 // The same actual worker must recover game navigation when the network is gone.
 context.fetch=async()=>{throw new Error('offline');};
 for(const page of PUBLIC_GAME_PAGES)assert.equal(await request(scope+page,{mode:'navigate'}),true);
 for(const page of ['oleh-oleh.html','account.html','admin.html','studio.html','peserta.html','certificate-admin.html','voice-admin.html','verify.html'])assert.equal(await request(scope+page,{mode:'navigate'}),false);
 assert.equal(cacheWrites.length,before);
 console.log('PWA QA: manifest, 4 icon sizes, worker syntax, '+PUBLIC_GAME_PAGES.length+' public game routes online/offline and private-route/cache isolation passed. '+assets.length+' build assets eligible for lazy cache.');
}else throw new Error('Use prepare or finish');
