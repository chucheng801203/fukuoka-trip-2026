# 日文單字卡 PWA — 部署說明

## 檔案

| 檔案 | 用途 |
|---|---|
| `JLPT_N5-N3.html` | 主程式（含 7495 個單字，單獨開也能用） |
| `jlpt-sw.js` | Service Worker，負責離線快取 |
| `jlpt-manifest.webmanifest` | App 資訊（名稱、圖示、啟動網址） |
| `jlpt-icon-192.png` / `jlpt-icon-512.png` | App 圖示 |
| `jlpt-icon-maskable-512.png` | Android 自適應圖示 |
| `jlpt-apple-touch-icon.png` | iPhone／iPad 主畫面圖示 |
| `jlpt-favicon-32.png` | 瀏覽器分頁小圖示 |

## 部署（GitHub Pages）

把上面「全部檔案」放進 repo 裡 `JLPT_N5-N3.html` 原本所在的**同一層資料夾**，
例如 `fukuoka-trip-2026/`，然後 commit + push：

```bash
git add .
git commit -m "日文單字卡：加上 PWA 離線安裝"
git push
```

網址維持不變：`https://chucheng801203.github.io/fukuoka-trip-2026/JLPT_N5-N3.html`

> 路徑全部用相對位置，所以整包搬到別的資料夾或別的網域也一樣能跑。

## 安裝方式

- **Android / Chrome / Edge**：開啟網頁後，右上角會出現「安裝 App」按鈕，或用瀏覽器選單的「安裝應用程式」。
- **iPhone / iPad**：必須用 **Safari** 開啟 → 分享按鈕 → 「加入主畫面」。
- **桌機 Chrome / Edge**：網址列右側會出現安裝圖示。

安裝後從桌面開啟就是全螢幕，且**完全離線可用**。

## 更新版本

換上新的 `JLPT_N5-N3.html` 與 `jlpt-sw.js`（build 編號會自動改變）後 push，
使用者下次開啟時會在頁面上方看到「已下載新版本 → 立即更新」。

目前 build：`834e4979f4`

> **檔名為什麼還是 `JLPT_N5-N3.html`？**
> 因為網址與已安裝 App 的 `start_url` 都指向這個檔名，改名會讓已安裝的使用者打不開。
> 內容已經是完整的 N5〜N1（7495 字）。若真要改名，請同時修改
> `jlpt-manifest.webmanifest` 的 `start_url`／`shortcuts` 與 `jlpt-sw.js` 的 `ASSETS`。

## 疑難排解

### Android 出現「此應用程式針對的是較舊版本的 Android 系統…」

**這個錯誤和本專案無關。** 它是 Android 的 Play Protect 在攔截「安裝 APK 檔」時的警告，
原因是那個 APK 的 `targetSdkVersion` 太舊（比手機的 API level 低 2 版以上）。

PWA 安裝**不會產生 APK 下載**。會看到這個對話框，代表用的不是 Chrome 的原生安裝，而是：

1. 把網址丟進「網頁轉 APK」的服務（PWABuilder、AppsGeyser、WebIntoApp…）產生 APK 後手動安裝；或
2. 用了會「自己合成 APK 來假裝安裝」的瀏覽器（部分第三方瀏覽器的「加到桌面」是這樣做的）。

**正確做法**：用 **Chrome**（或 Edge、Samsung Internet）開啟網址 →
右上角 ⋮ 選單 → 「安裝應用程式 / 加到主畫面」。
Chrome 會向 Google 的 WebAPK 服務要一個由 Play Services 簽章的安裝包，
不會經過側載流程，也就不會被 Play Protect 擋。

需要條件：**https 網址**（GitHub Pages 符合）、手機有 Google Play 服務、
不要在 LINE／Facebook／IG 的內建瀏覽器裡開。

### 真的需要一個能上架 Google Play 的 APK

用 [PWABuilder](https://www.pwabuilder.com/) 輸入網址產生 Android 套件，
並把 `targetSdkVersion` 設成目前 Google Play 要求的版本，再自行簽章。

## 注意

- Service Worker 只接管上表列出的檔案，**同資料夾的其他網頁完全不受影響**。
- 學習進度存在瀏覽器的 localStorage，和快取無關；清除網站資料才會消失。
  可在「統計 → 進度備份」匯出 JSON 備份。
