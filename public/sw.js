const CACHE='sbh-ride-v3';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        return await fetch(new Request(req,{cache:'no-store'}));
      }catch{
        const cached=await caches.match(req);
        return cached||Response.error();
      }
    })());
    return;
  }
  event.respondWith(fetch(new Request(req,{cache:'no-store'})).catch(()=>caches.match(req)));
});
