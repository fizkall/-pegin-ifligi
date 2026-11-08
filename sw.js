// İpek'in Çiftliği: çevrimdışı oynanabilsin diye dosyaları önbelleğe alır
const C='ipek-ciftligi-v15';
const A=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.pathname.startsWith('/api/')||/firestore|googleapis\.com\/identitytoolkit|securetoken/.test(r.url))return;
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const cl=res.clone();caches.open(C).then(c=>c.put('./index.html',cl));return res}).catch(()=>caches.match('./index.html')));return}
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok&&(u.origin===self.location.origin||/jsdelivr|gstatic|fonts\.googleapis/.test(r.url))){const cl=res.clone();caches.open(C).then(c=>c.put(r,cl))}return res})));
});
