# 私立中山紀念堂 — 前端 (Frontend)

本倉庫為《私立中山紀念堂》專案的純前端靜態應用程式，採用 Vanilla HTML5 / CSS3 / JavaScript 開發，無任何前端框架依賴，天然適配 Cloudflare Pages、Vercel、GitHub Pages 等靜態託管平台。

---

## 目錄結構

```
frontend/
├── index.html              # 應用程式首頁入口
├── api/                    # 執行期環境設定
│   ├── env.example.js      # 環境變數設定範本 (WORKER_API)
│   └── prohibited_words/   # 敏感詞庫範本 (public.json)
├── events/                 # 紀念專題頁面 (黃埔建軍、抗戰勝利、總理誕辰/逝世、辛亥革命)
├── js/                     # 模組化 JavaScript (彈幕、音訊播放、日曆、語系、人機驗證)
├── main/                   # 核心樣式、主視覺肖像、國歌樂曲及圖示
├── pages/                  # 次級頁面 (關於、管理後台、最新公告、生平年表、設定、致謝)
├── webapp/                 # PWA Manifest、各尺寸圖示與 iOS 啟動畫面 (Splash Screens)
├── tools/                  # 配套構建輔助工具 (如 captcha_builder)
└── LICENSE                 # GNU AGPLv3 授權條款
```

---

## 部署至 Cloudflare Pages

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)，進入 **Compute (Workers) > Workers & Pages**。
2. 點擊 **Create application > Pages > Connect to Git**。
3. 選擇本倉庫 `Sun-Yatsen-memorial-frontend`。
4. 設定建置組態：
   - **Framework preset**：None
   - **Build command**：留空（純靜態無須建置）
   - **Build output directory**：`/`（直接使用根目錄）
5. 部署完成後，複製 `api/env.example.js` 為 `api/env.js`，將 `WORKER_API` 設定為後端 Cloudflare Worker 網址即可聯調。

---

## 授權條款 (License)

本專案遵循 [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE) 開源授權協議。
Copyright (C) 2026 Situla.
