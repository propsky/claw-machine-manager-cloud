#!/usr/bin/env node
/**
 * analyze-payments.js — 帳務正確性分析工具
 *
 * 用法:
 *   node analyze-payments.js <start_date> <end_date> [username] [password]
 *
 * 範例:
 *   node analyze-payments.js 2026-03-01 2026-03-31 mickey mypassword
 *   node analyze-payments.js 2026-04-01 2026-04-01   (帳密從環境變數讀取)
 *
 * 環境變數 (選填，優先於命令列參數):
 *   ANALYZE_USER=mickey
 *   ANALYZE_PASS=mypassword
 */

const BASE_URL = 'https://smartpay.propskynet.com';

// ─── 參數解析 ────────────────────────────────────────────────────────────────

const [,, startDate, endDate, cliUser, cliPass] = process.argv;

if (!startDate || !endDate) {
  console.error('用法: node analyze-payments.js <start_date> <end_date> [username] [password]');
  console.error('範例: node analyze-payments.js 2026-03-01 2026-03-31');
  process.exit(1);
}

const username = process.env.ANALYZE_USER || cliUser;
const password = process.env.ANALYZE_PASS || cliPass;

if (!username || !password) {
  console.error('錯誤: 需要帳號密碼。請透過環境變數 ANALYZE_USER / ANALYZE_PASS 或命令列第 3、4 個參數提供。');
  process.exit(1);
}

// ─── API 工具函數 ──────────────────────────────────────────────────────────────

async function login(user, pass) {
  const res = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass }),
  });
  if (!res.ok) throw new Error(`登入失敗: HTTP ${res.status}`);
  const data = await res.json();
  const token = data.token || data.access_token;
  if (!token) throw new Error(`登入失敗: 回應中沒有 token\n${JSON.stringify(data)}`);
  return token;
}

async function fetchPage(token, start, end, page, pageSize = 100) {
  const params = new URLSearchParams({
    start_date: start,
    end_date: end,
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(`${BASE_URL}/api/store-app/payments?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`fetchPayments 失敗: HTTP ${res.status}`);
  return res.json();
}

async function fetchAllPayments(token, start, end) {
  process.stderr.write('正在拉取資料');
  const first = await fetchPage(token, start, end, 1);
  const totalPages = first.total_pages || 1;
  let items = [...first.items];
  process.stderr.write(` (共 ${totalPages} 頁)`);

  // 每批 3 頁平行拉取
  for (let batchStart = 2; batchStart <= totalPages; batchStart += 3) {
    const batch = Array.from(
      { length: Math.min(3, totalPages - batchStart + 1) },
      (_, i) => batchStart + i
    );
    const pages = await Promise.all(batch.map(p => fetchPage(token, start, end, p)));
    pages.forEach(p => { items = items.concat(p.items); });
    process.stderr.write('.');
  }
  process.stderr.write('\n');
  return { items, summary: first.summary };
}

// ─── 統計聚合 ──────────────────────────────────────────────────────────────────

function aggregateByStore(items) {
  const storeMap = new Map();

  for (const item of items) {
    const key = item.store_name;
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        store_name: key,
        card_amount: 0,          // 電支金額
        transaction_fee: 0,      // 電支手續費
        daily_rent: 0,           // 日租費
        coin_amount: 0,          // 投幣金額
        prize_count: 0,          // 出獎數
        total_revenue: 0,        // 總營收
        actual_income: 0,        // 實收
        machine_count: 0,
        machines: new Map(),
      });
    }

    const store = storeMap.get(key);
    store.card_amount      += item.card_amount || 0;
    store.transaction_fee  += item.actual_transaction_fee || 0;
    store.daily_rent       += item.actual_daily_rent || 0;
    store.coin_amount      += item.coin_amount || 0;
    store.prize_count      += item.prize_count || 0;
    store.total_revenue    += item.total_revenue || 0;
    store.actual_income    += item.actual_income || 0;

    // 機台層級資料
    const mKey = item.happy_cpu_id || item.machine_id;
    if (!store.machines.has(mKey)) {
      store.machine_count++;
      store.machines.set(mKey, {
        cpu_id: item.happy_cpu_id || item.machine_id,
        machine_name: item.machine_display_name || item.machine_name,
        card_amount: 0,
        transaction_fee: 0,
        daily_rent: 0,
        coin_amount: 0,
        prize_count: 0,
        total_revenue: 0,
        actual_income: 0,
        days: new Set(),
      });
    }
    const m = store.machines.get(mKey);
    m.card_amount     += item.card_amount || 0;
    m.transaction_fee += item.actual_transaction_fee || 0;
    m.daily_rent      += item.actual_daily_rent || 0;
    m.coin_amount     += item.coin_amount || 0;
    m.prize_count     += item.prize_count || 0;
    m.total_revenue   += item.total_revenue || 0;
    m.actual_income   += item.actual_income || 0;
    if (item.data_date) m.days.add(item.data_date);
  }

  return storeMap;
}

function aggregateTotal(storeMap) {
  const total = {
    store_name: '【全部場地合計】',
    card_amount: 0,
    transaction_fee: 0,
    daily_rent: 0,
    coin_amount: 0,
    prize_count: 0,
    total_revenue: 0,
    actual_income: 0,
  };
  for (const s of storeMap.values()) {
    total.card_amount     += s.card_amount;
    total.transaction_fee += s.transaction_fee;
    total.daily_rent      += s.daily_rent;
    total.coin_amount     += s.coin_amount;
    total.prize_count     += s.prize_count;
    total.total_revenue   += s.total_revenue;
    total.actual_income   += s.actual_income;
  }
  return total;
}

// ─── 格式化輸出 ────────────────────────────────────────────────────────────────

const $ = n => `$${Math.round(n).toLocaleString('zh-TW')}`;
const sep = '─'.repeat(80);
const sep2 = '═'.repeat(80);

function printStoreRow(s) {
  console.log(`\n  場地: ${s.store_name}${s.machine_count ? `（${s.machine_count} 台）` : ''}`);
  console.log(`  ${'電支金額'.padEnd(12)} ${String($(s.card_amount)).padStart(12)}`);
  console.log(`  ${'  └ 手續費'.padEnd(12)} ${String($(s.transaction_fee)).padStart(12)}`);
  console.log(`  ${'  └ 日租費'.padEnd(12)} ${String($(s.daily_rent)).padStart(12)}`);
  console.log(`  ${'投幣金額'.padEnd(12)} ${String($(s.coin_amount)).padStart(12)}`);
  console.log(`  ${'出獎數'.padEnd(12)} ${String(s.prize_count.toLocaleString('zh-TW')).padStart(12)} 次`);
  console.log(`  ${'總營收'.padEnd(12)} ${String($(s.total_revenue)).padStart(12)}`);
  console.log(`  ${'實收'.padEnd(12)} ${String($(s.actual_income)).padStart(12)}`);
}

function printMachineTable(machines) {
  console.log(`\n  ${'機台'.padEnd(20)} ${'電支'.padStart(10)} ${'手續費'.padStart(8)} ${'日租'.padStart(8)} ${'投幣'.padStart(10)} ${'出獎'.padStart(6)} ${'實收'.padStart(10)}`);
  console.log('  ' + '─'.repeat(76));
  for (const m of [...machines.values()].sort((a, b) => b.total_revenue - a.total_revenue)) {
    const name = (m.machine_name || m.cpu_id).substring(0, 19).padEnd(20);
    console.log(
      `  ${name}` +
      ` ${String($(m.card_amount)).padStart(10)}` +
      ` ${String($(m.transaction_fee)).padStart(8)}` +
      ` ${String($(m.daily_rent)).padStart(8)}` +
      ` ${String($(m.coin_amount)).padStart(10)}` +
      ` ${String(m.prize_count).padStart(6)}` +
      ` ${String($(m.actual_income)).padStart(10)}`
    );
  }
}

function printSummaryVsApi(localTotal, apiSummary) {
  if (!apiSummary) return;

  console.log('\n' + sep2);
  console.log('  ▶ 本機統計 vs API summary 比對');
  console.log(sep2);

  const checks = [
    ['電支金額',   localTotal.card_amount,     apiSummary.total_card_amount],
    ['電支手續費', localTotal.transaction_fee,  apiSummary.total_actual_transaction_fee],
    ['日租費',     localTotal.daily_rent,        apiSummary.total_actual_daily_rent],
    ['投幣金額',   localTotal.coin_amount,       apiSummary.total_coin_amount],
    ['出獎數',     localTotal.prize_count,       apiSummary.total_prize_count],
    ['總營收',     localTotal.total_revenue,     apiSummary.total_revenue],
    ['實收',       localTotal.actual_income,     apiSummary.total_actual_income],
  ];

  let allMatch = true;
  for (const [label, local, api] of checks) {
    const diff = Math.abs(local - api);
    const ok = diff < 0.01;
    if (!ok) allMatch = false;
    const status = ok ? '✓' : '✗ 差異！';
    const localStr = typeof local === 'number' && label !== '出獎數' ? $(local) : String(Math.round(local));
    const apiStr   = typeof api   === 'number' && label !== '出獎數' ? $(api)   : String(Math.round(api));
    console.log(`  ${status}  ${label.padEnd(10)} 本機: ${String(localStr).padStart(12)}  API: ${String(apiStr).padStart(12)}${ok ? '' : `  (差 ${$(diff)})`}`);
  }

  if (allMatch) {
    console.log('\n  ✅ 本機聚合結果與 API summary 完全一致');
  } else {
    console.log('\n  ⚠️  有欄位不一致，請檢查上方差異項目');
  }
}

// ─── 主程式 ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(sep2);
  console.log(`  帳務分析報告`);
  console.log(`  期間: ${startDate} ～ ${endDate}`);
  console.log(`  帳號: ${username}`);
  console.log(sep2);

  // 1. 登入
  process.stderr.write('登入中...\n');
  const token = await login(username, password);
  process.stderr.write('登入成功\n');

  // 2. 拉取所有 payments 資料
  const { items, summary } = await fetchAllPayments(token, startDate, endDate);
  console.log(`\n  共取得 ${items.length} 筆記錄`);

  if (items.length === 0) {
    console.log('\n  ⚠️  此區間無任何帳務資料');
    return;
  }

  // 3. 聚合
  const storeMap = aggregateByStore(items);
  const localTotal = aggregateTotal(storeMap);

  // 4. 場地合計輸出
  console.log('\n' + sep2);
  console.log('  ▶ 各場地合計');
  console.log(sep2);

  for (const store of storeMap.values()) {
    console.log('\n' + sep);
    printStoreRow(store);
  }

  // 5. 全部合計
  console.log('\n' + sep2);
  console.log('  ▶ 全部場地加總');
  console.log(sep2);
  printStoreRow(localTotal);

  // 6. 比對 API summary
  printSummaryVsApi(localTotal, summary);

  // 7. 機台明細（各場地）
  console.log('\n' + sep2);
  console.log('  ▶ 各場地機台明細');
  console.log(sep2);

  for (const store of storeMap.values()) {
    console.log(`\n  ══ ${store.store_name} ══`);
    printMachineTable(store.machines);
  }

  console.log('\n' + sep2);
}

main().catch(err => {
  console.error('\n❌ 錯誤:', err.message);
  process.exit(1);
});
