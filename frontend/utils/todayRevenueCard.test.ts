import { describe, expect, it } from 'vitest';
import type { PaymentsResponse, PaymentsSummary } from '../types';
import { RevenueRange } from './revenueRange';
import { formatYmd } from './time';
import { TodayRevenueCard } from './todayRevenueCard';

function payments(coin: number, card: number): PaymentsResponse {
  const summary = {
    total_revenue: coin + card,
    total_card_amount: card,
    total_coin_amount: coin,
    total_prize_count: 0,
    total_actual_income: 0,
    total_actual_transaction_fee: 0,
    total_actual_daily_rent: 0,
    total_card_play_count: 0,
    total_transaction_count: 0,
    total_cost: 0,
    total_gross_profit: 0,
  } satisfies PaymentsSummary;
  return {
    items: [],
    summary,
    total_count: 0,
    page: 1,
    page_size: 100,
    total_pages: 1,
  };
}

describe('TodayRevenueCard 金額', () => {
  it('資料還沒到時顯示 --，而不是 $0', () => {
    expect(TodayRevenueCard.format(null)).toBe('--');
    expect(TodayRevenueCard.format(null)).not.toBe('$0');
  });

  it('回應已到且合計為 0 時才顯示 $0', () => {
    expect(TodayRevenueCard.format(payments(0, 0))).toBe('$0');
  });

  it('沒有 summary 的已載入回應視為 0', () => {
    const loaded: PaymentsResponse = {
      items: [],
      total_count: 0,
      page: 1,
      page_size: 100,
      total_pages: 1,
    };
    expect(TodayRevenueCard.format(loaded)).toBe('$0');
  });

  it('顯示今日現金加電支', () => {
    expect(TodayRevenueCard.format(payments(1000, 280))).toBe(`$${(1280).toLocaleString()}`);
    expect(TodayRevenueCard.label).toBe('今日');
  });
});

describe('TodayRevenueCard 與 Modal 區間分開', () => {
  it('卡片 cache key 固定是今天（day1），不跟 Modal 選到的區間走', () => {
    expect(TodayRevenueCard.cacheKey(null)).toBe('day1-all');
    expect(TodayRevenueCard.cacheKey(12)).toBe('day1-12');
    expect(TodayRevenueCard.cacheKey(null, 'day1')).toBe('day1-all');
    expect(TodayRevenueCard.cacheKey(null, 'day7')).toBe('day7-all');
    expect(TodayRevenueCard.cacheKey(3, 'day30')).toBe('day30-3');
    expect(TodayRevenueCard.cacheKey(null)).not.toBe(TodayRevenueCard.cacheKey(null, 'day7'));
    expect(TodayRevenueCard.cacheKey(null)).not.toBe(TodayRevenueCard.cacheKey(null, 'day30'));
  });
});

describe('TodayRevenueCard 台北今天', () => {
  it('用 formatYmd 的日曆日，起訖都是當天，且與 day1 相同', () => {
    const now = new Date(2026, 9, 23, 15, 4, 0);
    expect(formatYmd(now)).toBe('2026-10-23');
    expect(TodayRevenueCard.range(now)).toEqual({
      start: '2026-10-23',
      end: '2026-10-23',
      days: 1,
    });
    const day1 = RevenueRange.getRange('day1', now);
    expect(TodayRevenueCard.range(now)).toEqual({
      start: day1.start,
      end: day1.end,
      days: day1.days,
    });
  });

  it('跨月、跨年的今天仍是單日', () => {
    expect(TodayRevenueCard.range(new Date(2026, 0, 1, 8, 0, 0))).toEqual({
      start: '2026-01-01',
      end: '2026-01-01',
      days: 1,
    });
    expect(TodayRevenueCard.range(new Date(2024, 1, 29, 23, 30, 0))).toEqual({
      start: '2024-02-29',
      end: '2024-02-29',
      days: 1,
    });
  });

  it('30 分鐘內的 cache 視為有效，超過就失效', () => {
    const now = 1_700_000_000_000;
    expect(TodayRevenueCard.fresh(now - TodayRevenueCard.cacheTtlMs + 1, now)).toBe(true);
    expect(TodayRevenueCard.fresh(now - TodayRevenueCard.cacheTtlMs, now)).toBe(false);
    expect(TodayRevenueCard.cacheTtlMs).toBe(30 * 60 * 1000);
  });
});
