/**
 * 訪客模式 Mock 資料
 * 模擬 2 家場地、8 台機台、6 種機型的真實運營情境
 *
 * 大安店（4台）：娃娃機×2、扭蛋機×1、打地鼠×1（離線）
 * 信義店（4台）：娃娃機×1、搖馬機×1、彈珠檯×1、販賣機×1
 */

import type {
  ReadingsResponse,
  BalanceResponse,
  ActivityResponse,
  PaymentsResponse,
  FavoriteBankAccountListResponse,
} from '../types';
import type { UserProfile, StoreOption } from './api';

const today = new Date();
const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() - n);
  return fmt(d);
};
const todayHH = String(today.getHours()).padStart(2, '0');

export const MOCK_USER: UserProfile = {
  id: 0,
  username: 'guest',
  nickname: '訪客',
  real_name: '訪客體驗帳號',
  email: null,
  phone: '',
  bank_account: null,
  id_card_number: null,
  is_verified: false,
};

export const MOCK_STORES: StoreOption[] = [
  { id: 1, name: '大安店' },
  { id: 2, name: '信義店' },
];

export const MOCK_READINGS: ReadingsResponse = {
  date: fmt(today),
  total_machines: 8,
  items: [
    // ── 大安店 ───────────────────────────────────────────────
    {
      store_name: '大安店', store_id: 1,
      machine_name: '01號機',       // 娃娃機（預設 claw）
      cpu_id: 'MOCK_CLAW_001',
      clawmachine_id: 101,
      coin_play_count: 38, epay_play_count: 12,
      gift_play_count: 0,  gift_out_count: 3, free_play_count: 0,
      total_play_count: 50,
      first_reading_time: `${fmt(today)}T08:01:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:01:00`,
    },
    {
      store_name: '大安店', store_id: 1,
      machine_name: '02號機',       // 娃娃機（預設 claw）
      cpu_id: 'MOCK_CLAW_002',
      clawmachine_id: 102,
      coin_play_count: 21, epay_play_count: 5,
      gift_play_count: 0,  gift_out_count: 1, free_play_count: 0,
      total_play_count: 26,
      first_reading_time: `${fmt(today)}T08:02:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:02:00`,
    },
    {
      store_name: '大安店', store_id: 1,
      machine_name: '03號機',       // 扭蛋機（MOCK_GACHA_001 → gacha）
      cpu_id: 'MOCK_GACHA_001',
      clawmachine_id: 103,
      coin_play_count: 30, epay_play_count: 10,
      gift_play_count: 0,  gift_out_count: 8, free_play_count: 0,
      total_play_count: 40,
      first_reading_time: `${fmt(today)}T08:03:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:03:00`,
    },
    {
      store_name: '大安店', store_id: 1,
      machine_name: '04號機',       // 打地鼠（MOCK_WHACK_001 → whack）— 離線
      cpu_id: 'MOCK_WHACK_001',
      clawmachine_id: 104,
      coin_play_count: 25, epay_play_count: 8,
      gift_play_count: 0,  gift_out_count: 0, free_play_count: 0,
      total_play_count: 33,
      first_reading_time: `${fmt(today)}T08:04:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:04:00`,
    },

    // ── 信義店 ───────────────────────────────────────────────
    {
      store_name: '信義店', store_id: 2,
      machine_name: '01號機',       // 娃娃機（預設 claw）
      cpu_id: 'MOCK_CLAW_003',
      clawmachine_id: 201,
      coin_play_count: 55, epay_play_count: 20,
      gift_play_count: 0,  gift_out_count: 5, free_play_count: 0,
      total_play_count: 75,
      first_reading_time: `${fmt(today)}T08:05:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:05:00`,
    },
    {
      store_name: '信義店', store_id: 2,
      machine_name: '02號機',       // 搖馬機（MOCK_ROCKING_001 → rocking）
      cpu_id: 'MOCK_ROCKING_001',
      clawmachine_id: 202,
      coin_play_count: 45, epay_play_count: 5,
      gift_play_count: 0,  gift_out_count: 0, free_play_count: 0,
      total_play_count: 50,
      first_reading_time: `${fmt(today)}T08:06:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:06:00`,
    },
    {
      store_name: '信義店', store_id: 2,
      machine_name: '03號機',       // 彈珠檯（MOCK_PINBALL_001 → pinball）
      cpu_id: 'MOCK_PINBALL_001',
      clawmachine_id: 203,
      coin_play_count: 80, epay_play_count: 20,
      gift_play_count: 0,  gift_out_count: 0, free_play_count: 0,
      total_play_count: 100,
      first_reading_time: `${fmt(today)}T08:07:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:07:00`,
    },
    {
      store_name: '信義店', store_id: 2,
      machine_name: '04號機',       // 販賣機（MOCK_VENDING_001 → vending）
      cpu_id: 'MOCK_VENDING_001',
      clawmachine_id: 204,
      coin_play_count: 20, epay_play_count: 10,
      gift_play_count: 0,  gift_out_count: 0, free_play_count: 0,
      total_play_count: 30,
      first_reading_time: `${fmt(today)}T08:08:00`,
      last_reading_time:  `${fmt(today)}T${todayHH}:08:00`,
    },
  ],
};

export const MOCK_BALANCE: BalanceResponse = {
  balance: {
    total_amount: 28540,
    frozen_amount: 3000,
    available_amount: 25540,
    currency: 'TWD',
  },
  fee_summary: null,
};

// ─────────────────────────────────────────────────────────
// 機台定義（供 payments mock 使用）
//   coinPrice: null → 販賣機（直接用金額，不靠 count×price）
// ─────────────────────────────────────────────────────────
interface MockMachine {
  name: string; store: string; cpu: string;
  coin: number; card: number; prize: number;
  coinPrice: number | null;
}

const MOCK_MACHINES: MockMachine[] = [
  // 大安店
  { name: '01號機', store: '大安店', cpu: 'MOCK_CLAW_001',    coin: 1140, card: 360, prize: 12, coinPrice: 30  },
  { name: '02號機', store: '大安店', cpu: 'MOCK_CLAW_002',    coin: 630,  card: 150, prize: 4,  coinPrice: 30  },
  { name: '03號機', store: '大安店', cpu: 'MOCK_GACHA_001',   coin: 900,  card: 300, prize: 24, coinPrice: 30  },
  { name: '04號機', store: '大安店', cpu: 'MOCK_WHACK_001',   coin: 200,  card: 50,  prize: 0,  coinPrice: 10  },
  // 信義店
  { name: '01號機', store: '信義店', cpu: 'MOCK_CLAW_003',    coin: 1650, card: 600, prize: 18, coinPrice: 30  },
  { name: '02號機', store: '信義店', cpu: 'MOCK_ROCKING_001', coin: 450,  card: 50,  prize: 0,  coinPrice: 10  },
  { name: '03號機', store: '信義店', cpu: 'MOCK_PINBALL_001', coin: 800,  card: 200, prize: 0,  coinPrice: 10  },
  { name: '04號機', store: '信義店', cpu: 'MOCK_VENDING_001', coin: 600,  card: 400, prize: 0,  coinPrice: null },
];

/** 以日期字串 + 機台 cpu 為種子，產生固定的偽亂數（0~1），避免每次呼叫數字不一致 */
function seededRandom(dateStr: string, cpu: string): number {
  let h = 0;
  const s = dateStr + cpu;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return ((h >>> 0) % 1000) / 1000;
}

const makePaymentItems = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const items = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = fmt(new Date(d));
    for (const m of MOCK_MACHINES) {
      const factor = 0.7 + seededRandom(dateStr, m.cpu) * 0.6;
      const coin = Math.round(m.coin * factor / 10) * 10;
      const card = Math.round(m.card * factor / 10) * 10;
      const prize = Math.round(m.prize * factor);
      // 投幣次數：有單價就除，販賣機用估算件數
      const cardPlays = m.coinPrice ? Math.round(card / m.coinPrice) : Math.round(card / 20);
      const totalTxn  = m.coinPrice ? Math.round((coin + card) / m.coinPrice) : Math.round((coin + card) / 20);
      items.push({
        machine_name: m.name,
        product_name: '遊戲收入',
        coin_amount: coin,
        card_amount: card,
        total_revenue: coin + card,
        prize_count: prize,
        cost: Math.round((coin + card) * 0.3),
        average_prize_rate: prize > 0 ? Math.round((coin + card) / prize) : 0,
        gift_play_count: 0,
        free_play_count: 0,
        card_play_count: cardPlays,
        transaction_count: totalTxn,
        machine_id: m.cpu,
        card_machine_number: '',
        store_name: m.store,
        machine_display_name: m.name,
        actual_income: Math.round((coin + card) * 0.7),
        settlement_date: dateStr,
        is_settled: true,
        actual_transaction_fee: Math.round(card * 0.015),
        actual_daily_rent: 50,
        happy_cpu_id: m.cpu,
        data_date: dateStr,
      });
    }
  }
  return items;
};

export function getMockPayments(startDate: string, endDate: string, storeId?: number): PaymentsResponse {
  const allItems = makePaymentItems(startDate, endDate);
  const storeFilter = storeId === 1 ? '大安店' : storeId === 2 ? '信義店' : null;
  const items = storeFilter ? allItems.filter(i => i.store_name === storeFilter) : allItems;
  const summary = items.reduce(
    (acc, i) => {
      acc.total_revenue += i.total_revenue;
      acc.total_card_amount += i.card_amount;
      acc.total_coin_amount += i.coin_amount;
      acc.total_prize_count += i.prize_count;
      acc.total_actual_income += i.actual_income;
      acc.total_actual_transaction_fee += i.actual_transaction_fee;
      acc.total_actual_daily_rent += i.actual_daily_rent;
      acc.total_card_play_count += i.card_play_count;
      acc.total_transaction_count += i.transaction_count;
      return acc;
    },
    {
      total_revenue: 0, total_card_amount: 0, total_coin_amount: 0,
      total_prize_count: 0, total_actual_income: 0, total_actual_transaction_fee: 0,
      total_actual_daily_rent: 0, total_card_play_count: 0, total_transaction_count: 0,
    }
  );
  return {
    items,
    summary,
    total_count: items.length,
    page: 1,
    page_size: 100,
    total_pages: 1,
  };
}

export const MOCK_ACTIVITY: ActivityResponse = {
  items: [
    {
      type: 'income',
      date: daysAgo(1),
      amount: 8640,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-001', before_amount: 19900, after_amount: 28540 },
    },
    {
      type: 'withdrawal',
      date: daysAgo(3),
      amount: -10000,
      description: '提領申請',
      details: { order_no: 'DEMO-002', before_amount: 29900, after_amount: 19900 },
    },
    {
      type: 'income',
      date: daysAgo(4),
      amount: 9350,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-003', before_amount: 20550, after_amount: 29900 },
    },
    {
      type: 'income',
      date: daysAgo(5),
      amount: 7210,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-004', before_amount: 13340, after_amount: 20550 },
    },
    {
      type: 'income',
      date: daysAgo(6),
      amount: 6980,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-005', before_amount: 6360, after_amount: 13340 },
    },
  ],
  total_count: 5,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

export const MOCK_BANK_ACCOUNTS: FavoriteBankAccountListResponse = {
  total_count: 0,
  accounts: [],
};
