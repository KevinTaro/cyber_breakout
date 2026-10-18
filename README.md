# Cyber Breakout (賽博打磚塊) - Cloudflare Serverless Edition

一個具備高質感賽博龐克（Cyberpunk）視覺風格、60 FPS 流暢 Canvas 物理碰撞引擎、Procedural Web Audio 合成音效、多樣化強化技能（多球、雷射、烈焰穿透、底層防禦護盾、加寬板、磁吸吸附、時間延緩）與關卡編輯器的打磚塊遊戲。

本專案專為 **Cloudflare Pages** 與 **Cloudflare Pages Functions / Workers** 邊緣無伺服器環境架構設計，包含自動化 GitHub Actions CI/CD 流程與持久化 Workers KV 全球高分榜。

---

## 🏗️ 完整架構全景 (Architecture Overview)

```
+---------------------------------------------------------------------------------------+
|                                    客戶端 (User Browser)                               |
|                                                                                       |
|   +--------------------------+    +--------------------------+    +---------------+   |
|   | 60 FPS Canvas 2D Engine  |    | Procedural Web Audio API |    | React 19 UI   |   |
|   |  - 類比弧度反射與旋轉     |    |  - 即時振盪器音效合成     |    |  - HUD & 關卡 |   |
|   |  - 零 GC 粒子池環狀緩衝區 |    |  - 零外部音效檔載入延遲   |    |  - 狀態機模態 |   |
|   +--------------------------+    +--------------------------+    +---------------+   |
+------------------------------------------+--------------------------------------------+
                                           | HTTP/3 Anycast (< 50ms)
                                           v
+---------------------------------------------------------------------------------------+
|                            Cloudflare 全球邊緣網路 (Global Edge)                       |
|                                                                                       |
|   +---------------------------------------+   +-----------------------------------+   |
|   | Cloudflare Pages 靜態托管 (CDN)       |   | Cloudflare Pages Functions (Edge) |   |
|   |  - 全球 300+ 城市 Anycast 邊緣快取     |   |  - /api/leaderboard (GET / POST)  |   |
|   |  - 自動 Brotli 壓縮與 HTTP/3 最佳化   |   |  - /api/stats (邊緣健康探針)      |   |
|   |  - 靜態資源由 dist/ 目錄直出           |   |  - V8 Isolate < 5ms 冷啟動        |   |
|   +---------------------------------------+   +-----------------+-----------------+   |
|                                                                 |                     |
|                                                                 v                     |
|                                               +-----------------------------------+   |
|                                               | Cloudflare Workers KV / D1        |   |
|                                               |  - binding = "LEADERBOARD_KV"     |   |
|                                               |  - 全球多區域毫秒級持久化讀寫同步 |   |
|                                               +-----------------------------------+   |
+---------------------------------------------------------------------------------------+
                                           ^
                                           | 自動化建置部署 (CI/CD)
+------------------------------------------+--------------------------------------------+
|                          GitHub Actions (.github/workflows)                           |
|       git push main -> node --test -> npm run build -> cloudflare/wrangler-action     |
+---------------------------------------------------------------------------------------+
```

---

## 🚀 核心功能特色

1. **60 FPS 賽博龐克 Canvas 渲染引擎**：
   - 類比板面衝擊位置 + 板面運動慣性物理反射計算。
   - 包含重裝甲磚塊（多重打擊破裂紋理）、連鎖引爆導彈磚塊、堅不可摧障礙物。
   - 7 種強大技能晶片：**Tri-Ball (三球裂變)**、**Laser Cannons (雙聯裝雷射砲)**、**Fireball (烈焰無穿透反彈)**、**Expand (板面加寬)**、**Force Barrier (底層防禦力場)**、**Magnetic Grip (磁吸吸附)**、**Time Dilation (時間延緩)**。
   - 零 GC 物件池粒子系統（350 個粒子預分配環狀緩衝區），徹底避免垃圾回收卡頓。
   - 受擊停頓（Sim-level Hitstop）與依衝擊權重衰減的螢幕震動（Screen Shake）。

2. **Web Audio API 純代碼音效合成**：
   - 零外部音效檔案依賴，體積超小、載入 0 秒。
   - 包含反彈音階滑音、擊磚清脆複音、雷射光束射擊聲、炸彈次低音震盪、過關歡呼和弦與失敗樂句。

3. **內建關卡設計工坊 (Level Designer)**：
   - 玩家可自由使用 12 種磚塊筆刷繪製自訂關卡。
   - 支援匯出與匯入 JSON 格式，並能即刻進入遊戲進行實戰測試。

4. **後端邊緣無伺服器架構 (Cloudflare Pages Functions)**：
   - 端點位於 `/functions/api/leaderboard.ts` 與 `/functions/api/stats.ts`。
   - 具備自動容錯架構：未綁定 KV 時自動以記憶體與本地備援運作；綁定 KV 後自動升級為全球多節點同步高分庫。

---

## 🛠️ 本地開發與環境建置步驟

### 1. 系統需求
- Node.js 20+ 或 Node.js 22+ (推薦 Node.js 22)
- npm 10+

### 2. 安裝依賴
```bash
npm install
```

### 3. 運行單元測試（邏輯先驗）
本專案使用 Node 22 原生測試執行器驗證純物理與碰撞邏輯：
```bash
node --test src/game/rules.test.ts
```

### 4. 啟動本機開發伺服器
```bash
npm run dev
```
瀏覽器開啟：`http://localhost:3000`

### 5. 使用 Cloudflare Wrangler 在本地模擬 Pages Functions
若您安裝了 Wrangler，可在本機同時模擬前後端邊緣 Functions：
```bash
npm run build
npx wrangler pages dev dist
```

---

## 📦 Push 到 GitHub 指南

本專案已備妥 Git 相關設定，您可以透過以下兩種方式之一推送至 GitHub：

### 方式一：使用專案內建的一鍵推送腳本（最快）
在終端機執行：
```bash
./push-to-github.sh https://github.com/<您的GitHub用戶名>/cyber-breakout.git
```

### 方式二：手動執行標準 Git 指令
```bash
# 1. 初始化倉庫並指定主分支為 main
git init -b main

# 2. 暫存所有檔案
git add .

# 3. 建立提交
git commit -m "feat: complete cyber breakout game with cloudflare serverless deployment"

# 4. 綁定您的 GitHub 遠端倉庫（請替換為您的實際倉庫 URL）
git remote add origin https://github.com/<您的GitHub用戶名>/cyber-breakout.git

# 5. 推送至 GitHub
git push -u origin main
```

---

## ☁️ 部署到 Cloudflare Pages 詳細步驟

### 方法 A：Cloudflare 控制台 GitHub 連動（推薦，全自動持續部署）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. 在左側選單點選 **Workers & Pages** > 點擊 **Create Application** 按鈕。
3. 切換至 **Pages** 分頁，選擇 **Connect to Git**。
4. 授權並選擇您剛才推送的 GitHub 倉庫（例如 `cyber-breakout`）。
5. 設定建置組態（Framework Preset）：
   - **Framework preset**: 選擇 `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (預設空白即可)
6. 點擊 **Save and Deploy**。
7. 建置完成後，Cloudflare 會自動分配一個免費的 `https://cyber-breakout.pages.dev` 網址！

---

### 方法 B：使用 Wrangler CLI 終端機直接發布

如果您不想連動 GitHub，可直接在終端機發布：
```bash
# 1. 登入 Cloudflare 帳號
npx wrangler login

# 2. 建置靜態資源
npm run build

# 3. 發布至 Cloudflare Pages
npx wrangler pages deploy dist --project-name=cyber-breakout
```

---

### 方法 C：GitHub Actions 自動化 CI/CD（已內建）

專案根目錄已包含 `.github/workflows/deploy-cloudflare.yml`。
當您將代碼推送到 GitHub 的 `main` 分支時，GitHub Actions 會自動執行單元測試、編譯專案並發布至 Cloudflare Pages。

**需要設定的 GitHub Secrets：**
前往您的 GitHub 專案頁面 > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**：
1. `CLOUDFLARE_API_TOKEN`: 您的 Cloudflare API Token（需包含 Cloudflare Pages: Edit 權限）。
2. `CLOUDFLARE_ACCOUNT_ID`: 您的 Cloudflare Account ID（在 Cloudflare 控制台首頁右側 Overview 欄位可複製）。

---

## 🗄️ 配置持久化高分榜資料庫 (Cloudflare Workers KV)

專案後端 `/functions/api/leaderboard.ts` 支援使用 Cloudflare KV 儲存高分紀錄。

### 步驟 1：建立 KV Namespace
```bash
npx wrangler kv namespace create LEADERBOARD_KV
```
終端機會輸出類似如下內容：
```toml
[[kv_namespaces]]
binding = "LEADERBOARD_KV"
id = "49a18de489b44ab28cb617cf9dae4a1b"
```

### 步驟 2：綁定至 Cloudflare Pages
- **透過 Cloudflare 控制台**：
  進入您的 Pages 專案 > **Settings** > **Functions** > **KV namespace bindings** > 點選 **Add binding**：
  - Variable name: `LEADERBOARD_KV`
  - KV namespace: 選擇剛才建立的 `LEADERBOARD_KV`
- **或更新 `wrangler.toml`**：
  將剛才生成的 `[[kv_namespaces]]` 區塊取消註解並填入您的 `id`。

---

## 🎮 操作按鍵說明

| 操作按鍵 | 動作 |
| :--- | :--- |
| **A / D** 或 **← / →** | 控制板面左移 / 右移 |
| **滑鼠 / 觸控** | 游標或手指直接在畫面上拖曳平滑追蹤 |
| **Space (空白鍵)** | 發射吸附在板上的球 / 觸發雙聯裝雷射砲 |
| **P 或 Escape** | 暫停遊戲 / 繼續遊戲 |
| **M** | 切換靜音狀態 (Mute) |
| **R** | 快速重新開始當前關卡 |
| **D** | 開啟 Cloudflare 部署與 GitHub 架構中心 |
| **L** | 開啟全球邊緣高分榜 |

---

## 📜 授權協議

Apache License 2.0
