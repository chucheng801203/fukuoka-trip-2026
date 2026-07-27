/* 日文單字卡 JLPT — Service Worker
   只接管本 App 自己的檔案，同資料夾下的其他網頁完全不受影響。 */
const VERSION = "3bf338f7fe";
// 快取名稱包含部署路徑：同網域放兩份 App 也不會互刪對方的快取
const SCOPE_TAG = new URL(self.registration.scope).pathname.replace(/[^A-Za-z0-9]/g, "_");
const CACHE = "jvocab" + SCOPE_TAG + "-" + VERSION;
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
    // 主程式一定要快取成功，否則整次安裝視為失敗（瀏覽器之後會自動重試）
    await c.add(new Request(ASSETS[0], { cache: "reload" }));
    // 圖示等附屬資源盡力而為，單一檔案失敗不擋安裝
    await Promise.all(ASSETS.slice(1).map(async a => {
      try { await c.add(new Request(a, { cache: "reload" })); } catch (err) {}
    }));
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k =>
        (k.startsWith("jvocab" + SCOPE_TAG + "-") ||       // 本路徑的舊版本
         /^jvocab-[0-9a-f]{6,}$/.test(k))                  // 更早期未含路徑的命名
        && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
  if (e.data === "GET_VERSION" && e.source) e.source.postMessage({ type: "VERSION", version: VERSION });
  if (e.data === "GET_STATUS" && e.source) e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const missing = [];
    for (const a of ASSETS) if (!(await c.match(abs(a)))) missing.push(a);
    e.source.postMessage({ type: "STATUS", missing });
  })());
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
    const net = (async () => {
      try {
        const r = await fetch(req);
        if (r && r.ok && r.type === "basic") await cache.put(key, r.clone());  // 等寫入完成
        return r;
      } catch (err) { return null; }
    })();
    if (hit) { e.waitUntil(net); return hit; }     // 快取優先；背景更新交給 waitUntil，不會被提早終止
    const r = await net;
    if (r) return r;
    return new Response("離線中，而且這個檔案還沒被快取。請在有網路時開啟一次本頁。",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  })());
});
