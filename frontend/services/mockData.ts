/**
 * 訪客模式 Mock 資料
 * 模擬一個有 2 家場地、6 台機台的真實運營情境
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
  { id: 1, name: '示範店 A（農安店）' },
  { id: 2, name: '示範店 B（光復店）' },
];

export const MOCK_READINGS: ReadingsResponse = {
  date: fmt(today),
  total_machines: 6,
  items: [
    {
      store_name: '示範店 A（農安店）',
      store_id: 1,
      machine_name: '01號機',
      cpu_id: 'AA000000001',
      clawmachine_id: 101,
      coin_play_count: 38,
      epay_play_count: 12,
      gift_play_count: 0,
      gift_out_count: 3,
      free_play_count: 0,
      total_play_count: 50,
      first_reading_time: `${fmt(today)}T08:01:00`,
      last_reading_time: `${fmt(today)}T${String(today.getHours()).padStart(2, '0')}:01:00`,
    },
    {
      store_name: '示範店 A（農安店）',
      store_id: 1,
      machine_name: '02號機',
      cpu_id: 'AA000000002',
      clawmachine_id: 102,
      coin_play_count: 21,
      epay_play_count: 5,
      gift_play_count: 0,
      gift_out_count: 1,
      free_play_count: 0,
      total_play_count: 26,
      first_reading_time: `${fmt(today)}T08:02:00`,
      last_reading_time: `${fmt(today)}T${String(today.getHours()).padStart(2, '0')}:02:00`,
    },
    {
      store_name: '示範店 A（農安店）',
      store_id: 1,
      machine_name: '03號機',
      cpu_id: 'AA000000003',
      clawmachine_id: 103,
      coin_play_count: 0,
      epay_play_count: 0,
      gift_play_count: 0,
      gift_out_count: 0,
      free_play_count: 0,
      total_play_count: 0,
      first_reading_time: `${daysAgo(1)}T22:00:00`,
      last_reading_time: `${daysAgo(1)}T23:00:00`,
    },
    {
      store_name: '示範店 B（光復店）',
      store_id: 2,
      machine_name: '01號機',
      cpu_id: 'BB000000001',
      clawmachine_id: 201,
      coin_play_count: 55,
      epay_play_count: 20,
      gift_play_count: 0,
      gift_out_count: 5,
      free_play_count: 0,
      total_play_count: 75,
      first_reading_time: `${fmt(today)}T08:05:00`,
      last_reading_time: `${fmt(today)}T${String(today.getHours()).padStart(2, '0')}:05:00`,
    },
    {
      store_name: '示範店 B（光復店）',
      store_id: 2,
      machine_name: '02號機',
      cpu_id: 'BB000000002',
      clawmachine_id: 202,
      coin_play_count: 42,
      epay_play_count: 8,
      gift_play_count: 0,
      gift_out_count: 4,
      free_play_count: 0,
      total_play_count: 50,
      first_reading_time: `${fmt(today)}T08:06:00`,
      last_reading_time: `${fmt(today)}T${String(today.getHours()).padStart(2, '0')}:06:00`,
    },
    {
      store_name: '示範店 B（光復店）',
      store_id: 2,
      machine_name: '03號機',
      cpu_id: 'BB000000003',
      clawmachine_id: 203,
      coin_play_count: 18,
      epay_play_count: 3,
      gift_play_count: 0,
      gift_out_count: 2,
      free_play_count: 0,
      total_play_count: 21,
      first_reading_time: `${fmt(today)}T08:07:00`,
      last_reading_time: `${fmt(today)}T${String(today.getHours()).padStart(2, '0')}:07:00`,
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

const makePaymentItems = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const items = [];
  const machines = [
    { name: '01號機', store: '示範店 A（農安店）', cpu: 'AA000000001', coin: 380, card: 120, prize: 12 },
    { name: '02號機', store: '示範店 A（農安店）', cpu: 'AA000000002', coin: 210, card: 50,  prize: 6  },
    { name: '03號機', store: '示範店 A（農安店）', cpu: 'AA000000003', coin: 60,  card: 0,   prize: 1  },
    { name: '01號機', store: '示範店 B（光復店）', cpu: 'BB000000001', coin: 550, card: 200, prize: 18 },
    { name: '02號機', store: '示範店 B（光復店）', cpu: 'BB000000002', coin: 420, card: 80,  prize: 14 },
    { name: '03號機', store: '示範店 B（光復店）', cpu: 'BB000000003', coin: 180, card: 30,  prize: 5  },
  ];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = fmt(new Date(d));
    for (const m of machines) {
      const factor = 0.7 + Math.random() * 0.6;
      const coin = Math.round(m.coin * factor / 10) * 10;
      const card = Math.round(m.card * factor / 10) * 10;
      const prize = Math.round(m.prize * factor);
      items.push({
        machine_name: m.name,
        product_name: '夾娃娃',
        coin_amount: coin,
        card_amount: card,
        total_revenue: coin + card,
        prize_count: prize,
        cost: Math.round((coin + card) * 0.3),
        average_prize_rate: prize > 0 ? Math.round(((coin + card) / prize)) : 0,
        gift_play_count: 0,
        free_play_count: 0,
        card_play_count: card / 10,
        transaction_count: (coin + card) / 10,
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

export function getMockPayments(startDate: string, endDate: string): PaymentsResponse {
  const items = makePaymentItems(startDate, endDate);
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
      amount: 6720,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-001', before_amount: 21820, after_amount: 28540 },
    },
    {
      type: 'withdrawal',
      date: daysAgo(3),
      amount: -10000,
      description: '提領申請',
      details: { order_no: 'DEMO-002', before_amount: 31820, after_amount: 21820 },
    },
    {
      type: 'income',
      date: daysAgo(4),
      amount: 8350,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-003', before_amount: 23470, after_amount: 31820 },
    },
    {
      type: 'income',
      date: daysAgo(5),
      amount: 7210,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-004', before_amount: 16260, after_amount: 23470 },
    },
    {
      type: 'income',
      date: daysAgo(6),
      amount: 5980,
      description: '每日營收入帳',
      details: { order_no: 'DEMO-005', before_amount: 10280, after_amount: 16260 },
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
