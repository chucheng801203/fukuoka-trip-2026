# 日文單字卡 PWA — 部署說明

## 檔案

| 檔案 | 用途 |
|---|---|
| `JLPT_N5-N3.html` | 主程式（含 4000 個單字，單獨開也能用） |
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

目前 build：`1666a6e16d`

## 注意

- Service Worker 只接管上表列出的檔案，**同資料夾的其他網頁完全不受影響**。
- 學習進度存在瀏覽器的 localStorage，和快取無關；清除網站資料才會消失。
  可在「統計 → 進度備份」匯出 JSON 備份。
