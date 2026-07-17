// Moonlight SW — shell-only offline, zero tracking, zero CDN fetch.
// We do NOT cache CDN. We cache our own app shell.
// Self-contained, no external requests ever.
const CACHE="moonlight-v1";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./vendor/qrcode-generator.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  const url=new URL(e.request.url);
  // never intercept peerjs or signaling — must go to network
  if(url.host.includes("peerjs.com"))return;
  // allow vendor + app shell from cache, network-first for everything else within same origin
  if(url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      if(res&&res.status===200&&e.request.method==="GET"){
        const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));
      }
      return res;
    }).catch(()=>r)));
  }
});
