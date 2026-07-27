/* 日文單字卡 JLPT — Service Worker
   只接管本 App 自己的檔案，同資料夾下的其他網頁完全不受影響。 */
const VERSION = "ed9d00744a";
const CACHE = "jvocab-" + VERSION;
const ASSETS = [
  "./JLPT_N5-N3.html",
  "./jlpt-manifest.webmanifest",
  "./jlpt-icon-192.png",
  "./jlpt-icon-512.png",
  "./jlpt-icon-maskable-512.png",
  "./jlpt-apple-touch-icon.png",
  "./jlpt-favicon-32.png"
];

const abs = p => new URL(p, self.registration.scope).href;
const OWNED = new Set(ASSETS.map(abs));

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // 逐一加入，單一檔案失敗不會讓整包安裝失敗
    await Promise.all(ASSETS.map(async a => {
      try { await c.add(new Request(a, { cache: "reload" })); } catch (err) {}
    }));
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("jvocab-") && k !== CACHE)
                          .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
  if (e.data === "GET_VERSION" && e.source) e.source.postMessage({ type: "VERSION", version: VERSION });
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  const key = url.origin + url.pathname;          // 去掉 query 與 hash
  if (!OWNED.has(key)) return;                    // 不是本 App 的檔案 → 完全不干涉

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(key);
    const net = fetch(req).then(r => {
      if (r && r.ok && r.type === "basic") cache.put(key, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { net.catch(() => {}); return hit; }  // 快取優先，背景更新
    const r = await net;
    if (r) return r;
    return new Response("離線中，而且這個檔案還沒被快取。請在有網路時開啟一次本頁。",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  })());
});
