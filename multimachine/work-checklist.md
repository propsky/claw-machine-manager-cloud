# 多機台類型實作進度清單

**Branch:** `feature/multi-machine-type`
**規劃書:** `multimachine/多機台類型修改規劃書_v3.3.0.md`
**最後更新:** 2026-04-12

---

## 階段 0：前置（無需後端）✅ 已完成

- [x] 建立 `feature/multi-machine-type` 分支（從 `feature/guest-mode`）
- [x] 建立 `frontend/config/machineTypeMap.ts`：cpu_id → 機台類型靜態對映
  - 填入 `MACHINE_TYPE_MAP` 即可指定任何機台類型
  - `getMachineType(cpuId)` / `getMachineTypeInfo(cpuId)` 供元件使用
  - 優先順序：config 靜態表 > API 欄位 > 預設 claw
  - 支援 6 種類型：claw / gacha / whack / rocking / vending / **pinball（彈珠檯）**
- [x] 填入真實機台對映：781C3CEB8B9C(whack)、6CC8403B24E8(pinball)、6CC8403B0A8C(rocking)、6CC8403BCEBC(gacha)

---

## 階段 1：前端 UI（不依賴後端，使用 config 映射）

### types.ts
- [ ] 新增 `MachineType` export type（或直接從 config import）
- [ ] `ReadingItem` 新增選填欄位 `machine_type?: string`
- [ ] `PaymentItem` 新增選填欄位 `machine_type?: string`

### Machines.tsx
- [ ] `MachineViewItem` 新增 `machineType: MachineType` 欄位
- [ ] 合併 readings/payments 時呼叫 `getMachineTypeInfo(cpu_id)` 填入類型
- [ ] 機台卡片顯示機台類型圖示（icon）和名稱
- [ ] 新增「類型篩選 tab」（全部 / 娃娃機 / 扭蛋機 / ...）
  - 注意：與現有 status filter（全部/在線/離線）並排設計，避免衝突
- [ ] 修正 `PLAY_PRICE = 10`（改為從 `getMachineTypeInfo().coinPrice` 讀取）
  - ⚠️ 販賣機 coinPrice = null，revenue 計算需要特殊處理
- [ ] 有庫存機台（gacha/vending）顯示庫存欄位（目前 API 無此欄位，先隱藏或顯示 N/A）

### Dashboard.tsx
- [ ] 機台摘要卡片新增機台類型 icon
- [ ] 分析是否需要按類型分組顯示統計

### 確認後合併
- [ ] 在 `machineTypeMap.ts` 的 `MACHINE_TYPE_MAP` 填入真實機台的 cpu_id
- [ ] 測試各類型顯示正確
- [ ] 合併到 `feature/guest-mode` 或等 guest mode 合入 main 後再合併

---

## 階段 2：後端配合（有後端支援後執行）

> 對應規劃書 Backend Checklist 1.1 ~ 1.10

- [ ] DB: 建立 `machine_types` 資料表
- [ ] DB: `happy_cardmachines` 新增 `machine_type` 欄位（預設 'claw'）
- [ ] DB: `happy_cardmachines` 新增 `stock_quantity` 欄位
- [ ] API: `GET /api/machines/` 回傳 `machine_type`
- [ ] API: 新增 `GET /api/machine-types`
- [ ] API: `GET /api/store-app/readings` 回傳 `machine_type`
- [ ] API: `GET /api/store-app/readings` 回傳 `stock_quantity`（gacha/vending）
- [ ] API: `GET /api/store-app/payments` 回傳 `machine_type`
- [ ] Frontend: `getMachineType(cpuId, apiType)` 自動優先使用 API 回傳值（已在 config 實作）
- [ ] Frontend: 顯示真實庫存數量

---

## 階段 3：Phase 2 功能（未來）

- [ ] prize_count 彩票數/出獎品數顯示
- [ ] score 遊戲分數
- [ ] MQTT 遠端控制指令
- [ ] 後台機台設定頁面（可在 UI 設定機台類型，不需手動改 config）

---

## 已知問題與設計決策

| 問題 | 決策 |
|------|------|
| 打地鼠/搖馬機按時間計費，API 只有 play_count | Phase 1 先用次數，Phase 2 與後端確認計費模式 |
| 販賣機 coinPrice = null | 不計算 revenue，或改用 card_amount + coin_amount 直接加總 |
| readings 用 `cpu_id`，payments 用 `happy_cpu_id` | `getMachineType()` 兩個欄位都可傳入，保持一致 |
| config 靜態表需要手動維護 | 後端支援後自動降為覆寫層，不需刪除 |
