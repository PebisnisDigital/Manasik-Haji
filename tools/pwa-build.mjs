import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {PUBLIC_GAME_PAGES,pwaVersion} from './pwa-policy.mjs';
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length,0);t.copy(b,4);data.copy(b,8);let c=0xffffffff;for(const x of Buffer.concat([t,data]))c=crcTable[(c^x)&255]^(c>>>8);b.writeUInt32BE((c^0xffffffff)>>>0,8+data.length);return b;}
const FALLBACK="eNqtWUlyJDcMJAmA9TY/zU/x0U/y3Qc7Yk4zYcnITJBd1WpJrbFrQqPuWrKwJBIg9fr6+vLy8s/L6/cfrz++f/v2159///H7b7/+0p86Go/+PxwCco9w+6+g+bTHnMc65pzhPwvZ2jhjCY6H/wRiPhJ49jiuiHzFjK8iNocdggNIEOns+lcQW5NjxMpEZCrm4ZmUzMrGfN7GFvMoMDeCOL7l7/zWN2TG8UnjdDvAovfhPiZeMPGp97A8ze/p9DORW2gBw+huuT5hHE+FEJ+IYguhBR5l6HbM8vF0WHh5efJM/xhQvk53S6yE8uGIYkY/Vsw8HTbGYgLwwyAKLpEyTAlng1bkDwwroiB+aSOyXez+DE5RKzRiWIPfx0Zk0hXYDwAJNwEFxI2WTINf7hueieFNZKm/B4eMRTdqic9tjpMZYnOVcdDnjAvvau+wOFgOHfUQVVxIDeC8TcMFBhSBA+B+wyNAFxwCQxNV+Ci19Ij1HK1s5CXrvYj4EJAlG32MrILMHGOGpNC8Qe8nSjjtUiSYszEUmHiQi3ks7ivMM1S7CdQXHkGKi6tWaOG9gVE1xptMLDTxJj97Y4qbF5UIGFZ48dbjJjgnWY3GdFZIusS7rc3RZgwXmQiB96FU4o3HZF5RwGPgG1+d0StW+siUgGksRfmIYuYzjM/FQNE+y9WyYm1uWkObXJSTzXmGV4SXl204xCH/tYt5U6Hg2yfVV90RP6phqJNOoO8pISArzb2IIS/6KIUK2BfzdIhjb06FrQybTDibR7r7rtLQ6xWqTEeGrV9OqfJ8hXCeU0wmM1pm6ojQuynPAvTTkTRbp3z1z2GMsVhVhZvw8hWSRv6DiqKAyzrk1fJzt/yHU1sZQtp1M7DRvLMjKmNeT1vyC+QVVkzWQaiN1s0rBqtIWOoWUqDd2BIgKUX2dbYLXB0L76jOLAXio74yIrIwPnKiHGgLr7m6EF4CPIs1zajuTA8vh5tsNgX8mKvMuyhPVJ1K1U+8YQiBupsqzaBCdH/VBjuQeiXIRNr4wqNuTrpAf9OqpaMmGUEVQidRIwCZq60ekLrqlbTPUtA70dgKYuFVaPhrdWQV8ao1V51pysDrFh5lG4XGdBaeVWONU4Jj4xX3jKaicXXOKGXf3LWctzZ0kWPEElz2JivN2Xh7FEC0qoxlX35VRRwcdDNU6Owgy8bLChilOcC7ZTwW36lp5Asqo7Xq5Jhz88wItjgp0tSEuNg2KEZGAgcnXFtXG5xz32jq7N2bRpApdashKQrPIWTopbbKzVT6NCKZvIfB06xwrDFCGGGSchfeyWJi4K190Ih2KwUNbHt65gRhcAmdI3zJMPCCKoZ8RMk0X4X4tbv1QrXJo9SopJyPSoaFt1pjrEpGjoDX9xBzQ80kHyqg5a/XPEa8rpzGrXWzeU/IWPPr+oPfeuFRf5GsmovpVG8DOYhiiSKjyeMB3raPvNQkQbyt+YN8Vr69K79sjsF6i0d4UO56AiGqRYWwb/UBaUel2lAu26jyfIMX7ajW5ZzrSIi+62NXdOrsDQ/JLFW6OzoSmbw268LzNceofmNNItXPx21OjvkWDyuOtEEzombZqIdr6FCBdJ30vsaxWkse9yvMtbLzzcGwW3lI7yl5KR2dStv9BrSKZw96pwVmU21i+c5gqcG1SnlZbex5sp8gja208VSKQxKTVHC2UaM/mNpItlbTCxxGYaMYU1ckIjUG9V4Jx22VqTI0r7DEsbixPcGQgQ55arQYOoUsNRAT7zR+BimpLxN6ilvxH99Pi/fQS0EzPXFI3lrhaUgIkIT9EY9y9IVsShnxqZt6RQ1Eg+UvF/L3rFsXHj4zKLjS17KS7tAAxges9fO8tvzVqE2MwuNcRftC9/AliMqKa74yLiO5TiMGGKdCz1f8NAtiwjxCQr38Fbrz6sk8LT7IGvkSWu7i3rmzGU0vJbDu0XwwV87PAzk3fkhN9Mi2GLE2rtAqsdvka37OQSlJwCe4C4Uyvq4Fm5a1vhtJ8aoOdFkpit8ddhp2rqs3LRkx9K5B3uqoVbXZsLtjidb9itDXvC776qjPNSxb3Gr5Zp+E3h/ta7CpvG1pl6Z0uc4oxHFaK1yXXGfj7pYfx3VNUjdZDaHtnd0DKHcflC1jrNkKfHUOvK1zyQh587zT+nvr8wKsjQY2BeXPqo2sxpNQu709WqteAdeaq6S311anegLGzOXpp3ALcDFM201aBnOdq/VsLam9BtAPN8VaTdnORZTVKK35E0OdKwVGlmoj4eM9ttrSuYsTRV0zzimu7DKfbdkJcNHBT/zdX3zxCYrT+hMbdsUvj2Vo7P+EuHYUn9mh5ITEyRdLedcoLJzOEBpmsq/sybbaf5mrExbvoiyba9Pt+f3d21Yau3JOIWN0rbu+jHZFvG2Ln+Qg0dqXN8hvkJd98p/bb3/05wC6b5/8PeBfvnh3HQ==";
// Verified original logo; fetched at build time only, never from the player's browser.
const logoURL='https://www.dropbox.com/scl/fi/egb2dsdetrlhyhdk0iyrl/Luxurious-White-and-Gold-Hajji-Digital-Badge.png?rlkey=hfwwu9oqf9seb9ir0mbh3orpp&dl=1';
const logoHash='6537f97c1a559063c423ec3a1e165b01b6c2ebfe1929066ebc2ad8b946358e0e';
function readRGB(b){
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=b.readUInt32BE(16),h=b.readUInt32BE(20);assert.equal(w,1254);assert.equal(h,1254);assert.equal(b[24],8);assert.equal(b[25],2);assert.equal(b[28],0);
 const parts=[];for(let i=8;i<b.length;){const n=b.readUInt32BE(i),type=b.toString('ascii',i+4,i+8);if(type==='IDAT')parts.push(b.subarray(i+8,i+8+n));i+=12+n;}
 const scan=zlib.inflateSync(Buffer.concat(parts)),stride=w*3,data=Buffer.alloc(stride*h);
 function paeth(a,b,c){const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;}
 for(let y=0;y<h;y++){const filter=scan[y*(stride+1)];assert.ok(filter<=4);for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=3?data[i-3]:0,b=y?data[i-stride]:0,c=y&&x>=3?data[i-stride-3]:0;data[i]=(scan[y*(stride+1)+x+1]+(filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0))&255;}}
 return {w,h,data};
}
async function prepareLogo(){
 try{const response=await fetch(logoURL,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('Logo HTTP '+response.status);const original=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(original).digest('hex'),logoHash);console.log('Brand: verified original white/gold artwork');return readRGB(original);}
 catch(e){console.warn('Brand: using offline reduced-size copy of the same artwork:',String(e));const raw=zlib.inflateSync(Buffer.from(FALLBACK,'base64'));assert.equal(raw.length,24+80*80);const data=Buffer.alloc(80*80*3);for(let i=0;i<80*80;i++)for(let k=0;k<3;k++)data[i*3+k]=raw[raw[24+i]*3+k];return {w:80,h:80,data};}
}
function brandPNG(image,n,maskable){
 const raw=Buffer.alloc((n*3+1)*n),scale=maskable?.72:1;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=((x+.5)/n-.5)/scale+.5,v=((y+.5)/n-.5)/scale+.5;
  const i=y*(n*3+1)+1+x*3;
  if(u<0||u>=1||v<0||v>=1){raw[i]=255;raw[i+1]=253;raw[i+2]=248;continue;}
  const xx=Math.max(0,Math.min(image.w-1,u*image.w-.5)),yy=Math.max(0,Math.min(image.h-1,v*image.h-.5)),x0=Math.floor(xx),y0=Math.floor(yy),x1=Math.min(x0+1,image.w-1),y1=Math.min(y0+1,image.h-1),dx=xx-x0,dy=yy-y0;
  for(let k=0;k<3;k++){const a=image.data[(y0*image.w+x0)*3+k],b=image.data[(y0*image.w+x1)*3+k],c=image.data[(y1*image.w+x0)*3+k],d=image.data[(y1*image.w+x1)*3+k];raw[i+k]=Math.round((a*(1-dx)+b*dx)*(1-dy)+(c*(1-dx)+d*dx)*dy);}
 }
 const h=Buffer.alloc(13);h.writeUInt32BE(n,0);h.writeUInt32BE(n,4);h[8]=8;h[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
if(process.argv[2]==='prepare'){
 fs.mkdirSync('public',{recursive:true});const image=await prepareLogo();
 for(const [n,name,mask] of [[192,'pwa-icon-192.png',false],[512,'pwa-icon-512.png',false],[512,'pwa-maskable-512.png',true],[180,'pwa-apple-180.png',false]])fs.writeFileSync(path.join('public',name),brandPNG(image,n,mask));
 const payload=brandPNG(image,512,false).toString('base64');
 fs.writeFileSync('public/pwa-icon.svg','<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512"><title>HAJJI.DIGITAL</title><defs><clipPath id="round"><circle cx="256" cy="256" r="254"/></clipPath></defs><image width="512" height="512" clip-path="url(#round)" xlink:href="data:image/png;base64,'+payload+'"/></svg>');
 console.log('PWA: new white/gold emblem and four matching PNG icons generated');
}
else if(process.argv[2]==='finish'){
 const dir='dist';const assets=fs.readdirSync(path.join(dir,'assets')).filter(x=>/^[A-Za-z0-9_.-]+\.(?:js|css|woff2?|png|webp|svg|jpg|jpeg|avif|wasm)$/.test(x)).map(x=>'assets/'+x).sort();
 const shell=['offline.html','manifest.webmanifest','pwa-icon-192.png','pwa-icon-512.png','pwa-maskable-512.png','pwa-apple-180.png','pwa-icon.svg','hajji-brand.css'];
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
