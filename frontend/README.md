# Claw Machine Manager Cloud

娃娃機台場管理系統 — 為台場營運商設計的行動優先 React 網頁應用程式。

## 功能

- **營運總覽** — 今日/昨日/本週/本月營收，現金 vs 電支收入拆分
- **機台監控** — 即時抄表數據、在線/離線狀態、出獎率監控
- **財務中心** — 可提領餘額、月結算（刷卡金額/日租/手續費/實際入帳）
- **帳務紀錄** — 每日結算入帳、提領紀錄
- **登入認證** — 帳密登入 + JWT Token，不同帳號看到不同場地資料
- **銀行帳戶管理** — 新增/刪除/設定預設銀行帳戶
- **提領功能** — 申請提領、查詢提領紀錄

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS (CDN)
- **Router**: React Router 7 (HashRouter)
- **Build**: Vite 6
- **Deploy**: Cloudflare Pages + Pages Functions (API Proxy)
- **Backend API**: SmartPay (`https://smartpay.propskynet.com/docs`)

## 快速開始

```bash
cd frontend
npm install
npm run dev
```

開啟 http://localhost:3000

## 部署

Cloudflare Pages 自動部署（push 到 `cloudflare-pages` 分支即觸發）

- **Build command**: `cd frontend && npm install && npm run build`
- **Build output**: `frontend/dist`

## 專案結構

```
frontend/
  pages/          Dashboard, Machines, Finance, TransactionHistory, Settings, Login
  components/     Layout, WithdrawalSheet, DateRangeSheet
  services/       api.ts (API 呼叫), auth.ts (認證管理)
  types.ts        TypeScript 型別定義
  App.tsx         路由 + 認證守衛

functions/api/    Cloudflare Pages Functions (API Proxy)
  auth/login.js
  store-app/      readings, machines-status, balance, activity, payments
```

---

## Next Steps

### Phase 1: 提領功能串接真實 API
- [x] 串接 `POST /api/withdrawal/apply` 申請提領
- [x] 串接 `GET /api/withdrawal/my-requests` 查詢提領狀態
- [x] 新增 CF Function proxy (`functions/api/withdrawal/`)
- [x] WithdrawalSheet 元件接上真實 API
- [x] 提領成功/失敗回饋 UI

### Phase 2: 營收數據彙總卡片
- [x] Dashboard「營收報表」卡片改為真實數據
- [x] 顯示均日營收、均出（總營收/總出貨數）指標
- [x] 使用 payments API summary 計算彙總數據
- [x] 修正分頁問題，正確涵蓋完整日期區間所有資料

### Phase 3: 個人資料 + 銀行帳戶管理
- [x] Settings 頁面串接 `GET /users/me` 顯示個人資料
- [x] 串接 `GET/POST/PUT/DELETE /api/favorite-bank-accounts` 管理收款帳戶
- [x] 新增對應 CF Function proxy
- [ ] 提領時可選擇不同銀行帳戶

### Phase 4: 機台遠端控制
- [x] 機台詳情 Modal 介面
- [x] 重啟按鈕 + 二次確認
- [x] 遠端投幣按鈕 + 二次確認
- [x] 串接 `POST /api/claw-machines/{machine_id}/restart` 重啟 API
- [x] 串接 `POST /api/claw-machines/{machine_id}/start` 啟動/遠端投幣 API
- [ ] 後台小卡管理需先設置 MQTT Token 和 Card ID

### Phase 5: PWA 支援
- [ ] 新增 manifest.json + service worker
- [ ] 支援「加到手機桌面」
- [ ] 離線 cache 基本頁面框架
- [ ] App icon 設計

---

## 版本資訊

### v3.2.0 (2026-03-17)
**新功能**
- App 更名為「擎天智慧販賣機管理」
- 登入頁換上 Propsky 擎天 Logo
- 設定頁新增「關於我們」區塊，含公司介紹與 LINE OA 連結

### v3.1.8 (2026-03-17)
**新功能**
- 機台重啟/遠端投幣串接正式啟用，使用 readings API 的 clawmachine_id

### v3.1.7 (2026-03-17)
**修正**
- 暫停機台控制功能（按鈕 disabled），等待後端在 readings API 加入 id 欄位

### v3.1.6 (2026-03-17)
**修正**
- 機台重啟/遠端投幣改用 happy-cardmachines API 的整數 id，正確對應後端控制 API

### v3.1.5 (2026-03-17)
**修正**
- 修正 machines/status CF Function 路徑錯誤（machines-status.js → machines/status.js）

### v3.1.4 (2026-03-17)
**修正**
- 修正機台重啟/遠端投幣送出錯誤 ID 的問題：parseInt("8C4B1470EB1C") = 8，改為直接傳字串 cpu_id

### v3.1.3 (2026-03-17)
**修正**
- 機台控制改用 cpu_id，修正多日模式下送出錯誤機台 ID 導致重啟/遠端投幣失敗

### v3.1.2 (2026-03-17)
**修正**
- 新增 CF Function proxy，修正機台重啟與遠端投幣回傳 405 錯誤

### v3.1.0 (2026-03-06)
**新功能**
- 機台控制介面：點擊機台彈出詳情 Modal，可進行重啟/遠端投幣（需後端 API 支援）
- 營收報告的熱門機台、異常機台、營收 TOP 3 新增顯示場地名稱
- 機器列表場地名稱優化
- 設定頁新增「更新記錄」功能，顯示近 5 次版本更新
- 版本號更新至 3.1.0

### v3.0.0 (2026-02-27)
**新功能**
- 多場地功能：支援 22+ 場地管理
- 場地選單：可切換不同場地查看資料
- 營收報告時間篩選：24小時內、3天內、7天內、30天內
- 帳務紀錄日期篩選與分頁功能
- 機器列表優化

### v2.7.0 (2026-02-26)
**Bug 修復**
- 修復財務頁可提領餘額不顯示（缺少 CF Function proxy 導致 Promise.all 整組失敗）
- 修復設定頁銀行帳戶載入失敗（缺少 `/api/favorite-bank-accounts` 等 CF proxy）
- 修復營收報告機台統計跨區間資料錯誤（原只抓起始日單日 readings）
- 修復營收報告分頁問題（API page_size=20 導致 30 天只拿到 20/372 筆）
- 修復 Dashboard 最近帳務提領金額顏色顯示為白色，改為紅色
- 修正出獎率計算使用不存在欄位（`total_gift_count`），改用 `total_prize_count`

**新功能**
- 營收報表新增均日營收、均出（總營收 ÷ 總出貨數）指標
- 新增 7 個缺少的 Cloudflare Pages Function proxy（withdrawal、users、favorite-bank-accounts）
- payments API 支援 page/page_size 分頁參數，並行抓取所有頁合併計算
- 設定頁版本號改從 package.json 自動注入，不再手動維護
- 機台監控清單字體調大（11px → 12px，15px → 16px）

### v2.5.3 (2026-02-25)
**Bug 修復**
- 修復 API 失敗時顯示錯誤訊息，改為顯示「尚未設定銀行帳戶」
- 修復 Dashboard 切換篩選後，自動刷新會覆蓋營收數據（React 閉包問題）
- 修復機台離線判斷從 1 小時改為 90 分鐘（API 約 80 分鐘更新一次）

**新功能**
- 銀行帳戶管理（新增/刪除/設定預設）
- 提領功能（申請提領、查詢紀錄）

### v2.4.0 - v2.5.0
- 初始功能發布
- 營運總覽、機台監控、財務中心、帳務紀錄
