# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claw Machine Manager Cloud 是一個為夾娃娃機台場營運商設計的行動優先 React 網頁應用程式，提供機台監控、營收追蹤和提款管理功能。

## Development Commands

```bash
# 安裝依賴（在 frontend 目錄下執行）
cd frontend && npm install

# 開發伺服器（port 3000）
npm run dev

# 生產環境建置
npm run build

# 預覽生產環境建置
npm run preview
```

## Tech Stack

- **Framework**: React 19 + React Router 7 (HashRouter)
- **Build Tool**: Vite 6
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS (CDN) + Material Symbols Icons
- **State**: React hooks only (無 Redux/Zustand)

## Architecture

```
frontend/
├── pages/           # 頁面元件 (Dashboard, Machines, Finance, Settings)
├── components/      # 共用元件 (Layout, WithdrawalSheet)
├── types.ts         # TypeScript 型別定義
├── App.tsx          # Router 設定
└── index.html       # Tailwind 設定 + CDN 載入
```

**路由結構**:
- `/` → Dashboard（營運總覽）
- `/machines` → 機台管理
- `/finance` → 財務中心
- `/settings` → 設定

## Key Types

```typescript
MachineStatus: 'ONLINE' | 'OFFLINE' | 'ERROR'
Machine: { id, name, status, statusDetail, lastUpdated, revenue, accumulated, grossMargin, payoutCount, avgPayout }
Transaction: { id, type, title, date, amount }
```

## Design System

- **主色調**: #f2d00d (黃色)
- **深色模式**: class-based dark mode
- **響應式設計**: 最大寬度 430px（行動優先）
- **字體**: Noto Sans TC, Quicksand, Spline Sans

## Environment Variables

在 `frontend/.env.local` 設定：
```
GEMINI_API_KEY=your_api_key
```

## Notes

- UI 目前使用 mock data
- 專案無測試框架與 linting 設定
- 所有介面文字為繁體中文
