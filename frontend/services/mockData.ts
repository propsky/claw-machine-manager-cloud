/**
 * 訪客模式 Mock 資料
 * 模擬 2 家場地、8 台機台、6 種機型的真實運營情境
 *
 * 大安店（4台）：娃娃機×2、扭蛋機×1、打地鼠×1（離線）
 * 信義店（4台）：娃娃機×1、搖馬機×1、彈珠檯×1、販賣機×1
 *
 * ⚠️ 單一資料源原則：
 *   每台機台只定義「次數」(coinPlays / epayPlays / giftOut)，
 *   所有「金額」一律由 次數 × 單價 推導，單價直接取自 machineTypeMap，
 *   確保「次數」與「營業額」永遠對得上，且不會與前端反推邏輯漂移。
 *   （前端 Dashboard / Machines 是以 amount ÷ coinPrice 反推次數）
 */

import type {
  ReadingsResponse,
  BalanceResponse,
  ActivityResponse,
  PaymentsResponse,
  FavoriteBankAccountListResponse,
} from '../types';
import type { UserProfile, StoreOption } from './api';
import { getMachineTypeInfo } from '../config/machineTypeMap';

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

// ─────────────────────────────────────────────────────────
// 單一資料源：每台機台只定義「次數」，金額一律推導
//   coinPlays  = 投幣遊玩次數
//   epayPlays  = 電子支付（刷卡）遊玩次數
//   giftOut    = 出獎數（prize / gift_out）
//   單價取自 machineTypeMap（娃娃機/扭蛋機等=10，販賣機=null）
//   販賣機無固定單價，改用估算客單價 VENDING_UNIT_PRICE
// ─────────────────────────────────────────────────────────
interface MockMachine {
  store: string;
  store_id: number;
  name: string;
  cpu: string;
  clawmachine_id: number;
  coinPlays: number;
  epayPlays: number;
  giftOut: number;
}

const MACHINES: MockMachine[] = [
  // 大安店
  { store: '大安店', store_id: 1, name: '01號機', cpu: 'MOCK_CLAW_001',    clawmachine_id: 101, coinPlays: 38, epayPlays: 12, giftOut: 3 },
  { store: '大安店', store_id: 1, name: '02號機', cpu: 'MOCK_CLAW_002',    clawmachine_id: 102, coinPlays: 21, epayPlays: 5,  giftOut: 1 },
  { store: '大安店', store_id: 1, name: '03號機', cpu: 'MOCK_GACHA_001',   clawmachine_id: 103, coinPlays: 30, epayPlays: 10, giftOut: 8 },
  { store: '大安店', store_id: 1, name: '04號機', cpu: 'MOCK_WHACK_001',   clawmachine_id: 104, coinPlays: 25, epayPlays: 8,  giftOut: 0 },
  // 信義店
  { store: '信義店', store_id: 2, name: '01號機', cpu: 'MOCK_CLAW_003',    clawmachine_id: 201, coinPlays: 55, epayPlays: 20, giftOut: 5 },
  { store: '信義店', store_id: 2, name: '02號機', cpu: 'MOCK_ROCKING_001', clawmachine_id: 202, coinPlays: 45, epayPlays: 5,  giftOut: 0 },
  { store: '信義店', store_id: 2, name: '03號機', cpu: 'MOCK_PINBALL_001', clawmachine_id: 203, coinPlays: 80, epayPlays: 20, giftOut: 0 },
  { store: '信義店', store_id: 2, name: '04號機', cpu: 'MOCK_VENDING_001', clawmachine_id: 204, coinPlays: 20, epayPlays: 10, giftOut: 0 },
];

/** 販賣機無固定單價時，採用的估算客單價（元/次） */
const VENDING_UNIT_PRICE = 20;

/** 取得機台單價：優先用 machineTypeMap，販賣機(null) 退回估算客單價 */
function unitPrice(cpu: string): number {
  return getMachineTypeInfo(cpu).coinPrice ?? VENDING_UNIT_PRICE;
}

// 抄表（即時 counter 快照）— 由 MACHINES 的次數直接推導
export const MOCK_READINGS: ReadingsResponse = {
  date: fmt(today),
  total_machines: MACHINES.length,
  items: MACHINES.map((m, idx) => {
    const mm = String(idx + 1).padStart(2, '0');
    return {
      store_name: m.store,
      store_id: m.store_id,
      machine_name: m.name,
      cpu_id: m.cpu,
      clawmachine_id: m.clawmachine_id,
      coin_play_count: m.coinPlays,
      epay_play_count: m.epayPlays,
      gift_play_count: 0,
      gift_out_count: m.giftOut,
      free_play_count: 0,
      total_play_count: m.coinPlays + m.epayPlays,
      first_reading_time: `${fmt(today)}T08:${mm}:00`,
      last_reading_time: `${fmt(today)}T${todayHH}:${mm}:00`,
    };
  }),
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
    for (const m of MACHINES) {
      // 每日波動係數（0.7~1.3），套用在「次數」上，金額再由次數推導，保證一致
      const factor = 0.7 + seededRandom(dateStr, m.cpu) * 0.6;
      const coinPlays = Math.max(1, Math.round(m.coinPlays * factor));
      const epayPlays = Math.round(m.epayPlays * factor);
      const prize = Math.round(m.giftOut * factor);
      const price = unitPrice(m.cpu);

      const coin = coinPlays * price;
      const card = epayPlays * price;
      const revenue = coin + card;
      const totalPlays = coinPlays + epayPlays;

      items.push({
        machine_name: m.name,
        product_name: '遊戲收入',
        coin_amount: coin,
        card_amount: card,
        total_revenue: revenue,
        prize_count: prize,
        cost: Math.round(revenue * 0.3),
        average_prize_rate: prize > 0 ? Math.round(revenue / prize) : 0,
        gift_play_count: 0,
        free_play_count: 0,
        card_play_count: epayPlays,
        transaction_count: totalPlays,
        machine_id: m.cpu,
        card_machine_number: '',
        store_name: m.store,
        machine_display_name: m.name,
        actual_income: Math.round(revenue * 0.7),
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
