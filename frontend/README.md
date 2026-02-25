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
- [ ] 新增 CF Function proxy (`functions/api/withdrawal/`)
- [x] WithdrawalSheet 元件接上真實 API
- [x] 提領成功/失敗回饋 UI

### Phase 2: 營收數據彙總卡片
- [ ] Dashboard「營收報表」卡片改為真實數據（目前標示開發中）
- [ ] 顯示週報/月報關鍵指標：總營收、均日營收、最佳機台、出獎率
- [ ] 使用 payments API summary 計算彙總數據

### Phase 3: 個人資料 + 銀行帳戶管理
- [x] Settings 頁面串接 `GET /users/me` 顯示個人資料
- [x] 串接 `GET/POST/PUT/DELETE /api/favorite-bank-accounts` 管理收款帳戶
- [ ] 新增對應 CF Function proxy
- [ ] 提領時可選擇不同銀行帳戶

### Phase 4: PWA 支援
- [ ] 新增 manifest.json + service worker
- [ ] 支援「加到手機桌面」
- [ ] 離線 cache 基本頁面框架
- [ ] App icon 設計

---

## 版本資訊

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
