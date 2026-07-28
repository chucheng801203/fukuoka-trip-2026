/* 日文單字卡 JLPT — Service Worker
   只接管本 App 自己的檔案，同資料夾下的其他網頁完全不受影響。 */
const VERSION = "2867b4974e";
// 快取名稱包含部署路徑＋路徑雜湊：/a-b/ 與 /a_b/ 這種替換後同名的路徑也不會互刪快取
const SCOPE_PATH = new URL(self.registration.scope).pathname;
let SCOPE_HASH = 0;
for (const ch of SCOPE_PATH) SCOPE_HASH = (SCOPE_HASH * 31 + ch.codePointAt(0)) >>> 0;
const SCOPE_TAG = SCOPE_PATH.replace(/[^A-Za-z0-9]/g, "_") + SCOPE_HASH.toString(36);
const LEGACY_TAG = "jvocab" + SCOPE_PATH.replace(/[^A-Za-z0-9]/g, "_") + "-";   // 前一版未加雜湊的命名
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
    const mine = abs(ASSETS[0]);
    await Promise.all(keys.map(async k => {
      if (k === CACHE) return;
      if (k.startsWith("jvocab" + SCOPE_TAG + "-"))        // 本路徑的舊版本（含路徑雜湊，不會撞名）
        return caches.delete(k);
      if (k.startsWith(LEGACY_TAG)) {
        // 前一版命名未含路徑雜湊：/a-b/ 與 /a_b/ 會產生相同前綴。
        // 先確認快取裡存的是「本路徑」的主程式才刪，不誤刪同網域其他部署的舊快取
        try {
          const c = await caches.open(k);
          if (await c.match(mine)) return caches.delete(k);
        } catch (err) {}
      }
    }));
    // 註：不清除最早期「jvocab-<build>」全域命名的快取——同網域其他部署可能還在用
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
    if (hit) return hit;   // 版本鎖定：內容更新一律由「新版 SW 安裝」原子切換，不做背景覆寫，避免新舊混版
    let r = null;
    try { r = await fetch(req); } catch (err) {}
    if (r && r.ok && r.type === "basic") {
      try { await cache.put(key, r.clone()); }             // 補快取（例如安裝時漏掉的圖示）
      catch (err) {}                                       // 寫不進快取就算了，不能吃掉成功的回應
    }
    if (r) return r;
    return new Response("離線中，而且這個檔案還沒被快取。請在有網路時開啟一次本頁。",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  })());
});
