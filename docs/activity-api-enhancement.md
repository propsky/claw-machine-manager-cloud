# 後端修改需求：帳務紀錄 API 支援日期篩選與分頁

## 背景

前端 App 的「帳務紀錄」頁面目前呼叫 `GET /api/store-app/activity`，此 API 目前只回傳最近 10 筆，且不支援日期篩選或分頁。

前端希望能讓用戶查詢任意日期範圍的歷史帳務，需要後端配合新增以下參數支援。

---

## 需求：`GET /api/store-app/activity` 新增 Query 參數

### 新增參數

| 參數 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `start_date` | `string` | 否 | 查詢起始日期，格式 `YYYY-MM-DD` |
| `end_date` | `string` | 否 | 查詢結束日期，格式 `YYYY-MM-DD` |
| `page` | `integer` | 否 | 頁碼，從 1 開始，預設 1 |
| `page_size` | `integer` | 否 | 每頁筆數，預設 10，最大建議 50 |

### 行為規則

- 若未帶 `start_date` / `end_date`，維持原本行為（回傳最近 N 筆）
- 若帶了日期範圍，依 `date` 欄位篩選，並支援分頁
- `start_date` 和 `end_date` 為包含邊界（inclusive）

---

## 目前 Response 格式（保持不變）

```json
{
  "items": [
    {
      "type": "income",
      "date": "2026-03-01",
      "amount": 5000,
      "description": "場地結算入款",
      "details": {
        "order_no": "ORD-001",
        "before_amount": 10000,
        "after_amount": 15000
      }
    }
  ],
  "total_count": 42
}
```

### 新增分頁欄位（加在 Response root level）

```json
{
  "items": [...],
  "total_count": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

---

## 範例請求

```
GET /api/store-app/activity?start_date=2026-01-01&end_date=2026-03-31&page=1&page_size=20
```

---

## 前端配合說明

後端完成後，前端只需修改兩個地方即可立刻支援：

**1. `frontend/services/api.ts` — `fetchActivity` 函數加入參數**

```typescript
// 現在
export async function fetchActivity(storeId?: number): Promise<ActivityResponse>

// 修改後
export async function fetchActivity(
  storeId?: number,
  startDate?: string,
  endDate?: string,
  page?: number,
  pageSize?: number
): Promise<ActivityResponse>
```

**2. `functions/api/store-app/activity.js` — CF Function 轉發新參數**

```javascript
// 新增讀取並轉發以下 query params：
// start_date, end_date, page, page_size
```

**3. `frontend/pages/TransactionHistory.tsx`**

程式碼中已預留 TODO 註解，後端完成後直接在該位置加入日期選擇器即可。

---

## 優先順序

此需求為「日期查詢功能」的前置條件，目前前端暫時顯示「最近 10 筆」並隱藏日期篩選 UI，待後端支援後再一併開放。
