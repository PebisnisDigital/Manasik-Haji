/* Generated into dist/sw.js; only versioned public static files are cacheable. */
const CACHE=__CACHE_NAME__,STATIC=new Set(__STATIC_ASSETS__),SHELL=__SHELL_FILES__;
const base=new URL(self.registration.scope),urlFor=p=>new URL(p,base).href;
const corePages=new Set(['','index.html','manasik.html','player.html','sai.html']);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(urlFor))));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('umroh-static-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||req.headers.has('authorization'))return;
 const url=new URL(req.url);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
 const relative=url.pathname.slice(base.pathname.length);
 if(req.mode==='navigate'){if(!corePages.has(relative))return;event.respondWith(fetch(req).catch(async()=>{const saved=await (await caches.open(CACHE)).match(urlFor('offline.html'));return saved||new Response('Koneksi terputus. Hubungkan kembali internet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}));return;}
 if(url.search||(!STATIC.has(relative)&&!SHELL.includes(relative)))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),key=urlFor(relative),cached=await cache.match(key);if(cached)return cached;const response=await fetch(req);if(response.ok&&response.type==='basic'&&!response.redirected){try{await cache.put(key,response.clone());}catch{/* quota: still serve network response */}}return response;})());
});
