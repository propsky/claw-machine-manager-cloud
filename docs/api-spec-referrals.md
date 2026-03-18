# 後端新增需求：QR Code 分享追蹤 API

## 背景

前端 App（v3.2.0）新增 PWA「加到手機桌面」功能，Settings 頁提供個人化 QR Code 讓使用者分享給他人。

每個 QR Code 帶有分享者的 user ID（`?ref=USER_ID`）。當有人掃碼並開啟 App，前端會自動呼叫此 API 記錄一筆分享事件，讓營運方日後可以查詢「誰分享了多少次、吸引了多少人」。

---

## 需求一：`POST /api/referrals` 記錄分享事件

### 說明

有人掃碼並開啟 App 時，前端**不需要使用者登入**即會呼叫此 API。此端點應為**公開端點（不需 Authorization header）**。

### Request

```
POST /api/referrals
Content-Type: application/json
```

```json
{
  "sharer_id": 123,
  "scanned_at": "2026-03-18T10:30:00.000Z",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `sharer_id` | `integer` | 是 | 分享者的 user ID（`/api/users/me` 的 `id` 欄位） |
| `scanned_at` | `string` | 是 | 掃碼時間，ISO 8601 格式 |
| `user_agent` | `string` | 否 | 掃碼裝置的 User-Agent |

### Response（成功 201）

```json
{
  "ok": true
}
```

### Response（錯誤）

| 狀況 | Status | body |
|---|---|---|
| `sharer_id` 不存在（找不到此 user） | 404 | `{ "error": "sharer not found" }` |
| 請求格式錯誤 | 400 | `{ "error": "..." }` |

### 備註

- IP 位址請從 request 中自行取得（不由前端傳入），寫入 DB 備查
- 同一 IP 同一天對同一 `sharer_id` 不需去重，每次掃碼都記錄

---

## 需求二：`GET /api/referrals` 查詢分享紀錄

### 說明

讓管理員或分享者本人可以查詢分享事件列表。**需要 Authorization header**（Bearer token）。

### Request

```
GET /api/referrals?sharer_id=123&start_date=2026-03-01&end_date=2026-03-31&page=1&page_size=20
Authorization: Bearer <token>
```

| 參數 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `sharer_id` | `integer` | 否 | 篩選特定分享者，不帶則回傳所有（需管理員權限） |
| `start_date` | `string` | 否 | 格式 `YYYY-MM-DD` |
| `end_date` | `string` | 否 | 格式 `YYYY-MM-DD` |
| `page` | `integer` | 否 | 頁碼，預設 1 |
| `page_size` | `integer` | 否 | 每頁筆數，預設 20，最大 100 |

### Response（成功 200）

```json
{
  "total_count": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "items": [
    {
      "id": 1,
      "sharer_id": 123,
      "sharer_username": "operator_01",
      "scanned_at": "2026-03-18T10:30:00.000Z",
      "ip": "1.2.3.4",
      "created_at": "2026-03-18T10:30:01.000Z"
    }
  ]
}
```

---

## 需求三：`GET /api/referrals/summary` 分享統計（選填，後續可做）

> 此 endpoint 非緊急，有時間再實作。

```
GET /api/referrals/summary?sharer_id=123
Authorization: Bearer <token>
```

```json
{
  "sharer_id": 123,
  "sharer_username": "operator_01",
  "total_scans": 42,
  "unique_ips": 37,
  "first_scan": "2026-03-01T08:00:00.000Z",
  "last_scan": "2026-03-18T10:30:00.000Z"
}
```

---

## 建議資料表結構

```sql
CREATE TABLE referrals (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  sharer_id   INT NOT NULL,
  scanned_at  DATETIME NOT NULL,
  user_agent  TEXT,
  ip          VARCHAR(45),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sharer_id) REFERENCES users(id),
  INDEX idx_sharer (sharer_id),
  INDEX idx_created (created_at DESC)
);
```

---

## 前端對接說明

前端已實作完成，待後端 API 上線後：

1. **更新 `functions/api/referrals.js`**（Cloudflare Pages Function）

   目前為臨時實作（使用 Cloudflare D1 本地儲存）。後端 API 上線後改為 proxy 模式：

   ```javascript
   // POST：轉發給後端
   const response = await fetch('https://smartpay.propskynet.com/api/referrals', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: await request.text(),
   });

   // GET：轉發（加上 Authorization）
   const token = request.headers.get('Authorization') || '';
   const response = await fetch('https://smartpay.propskynet.com/api/referrals?' + url.searchParams, {
     headers: { 'Authorization': token },
   });
   ```

2. **不需要修改前端 React 程式碼**，前端呼叫的是 `/api/referrals`，由 CF Function 代理，對前端透明。

---

## 優先順序

| 端點 | 優先 | 說明 |
|---|---|---|
| `POST /api/referrals` | **高** | 分享事件記錄，掃碼馬上要用 |
| `GET /api/referrals` | 中 | 查詢用，不急但要有 |
| `GET /api/referrals/summary` | 低 | 統計功能，之後再說 |
