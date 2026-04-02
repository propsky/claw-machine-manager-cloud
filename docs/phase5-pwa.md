# Phase 5 PWA 開發說明

## 專案背景

這是 claw-machine-manager-cloud 專案，
React 19 + Vite + Cloudflare Pages，
branch: feature/pwa（base: cloudflare-pages），
目前版本 v3.1.8，
要做 Phase 5 PWA 支援。

## 目標

讓使用者可以將 App 加到手機桌面，體驗接近 Native App。

## 待完成項目（來自 README Phase 5）

- [ ] 新增 manifest.json + service worker
- [ ] 支援「加到手機桌面」
- [ ] 離線 cache 基本頁面框架
- [ ] App icon 設計

## 技術架構

- **Framework**: React 19 + React Router 7 (HashRouter)
- **Build Tool**: Vite 6（使用 vite-plugin-pwa 來處理 service worker）
- **部署**: Cloudflare Pages
- **入口**: `frontend/index.html`
- **Public 資料夾**: `frontend/public/`

## 注意事項

- HashRouter 模式下 service worker 的 cache 策略要注意路徑
- iOS Safari 對 PWA 支援有限制（無 Web Push），安裝引導要區分 iOS / Android
- manifest.json 放在 `frontend/public/` 下
- Cloudflare Pages 部署根目錄是 `frontend/dist/`

## 開始開發

```bash
cd frontend && npm install
npm run dev
```
