import type { PaymentsResponse } from '../types';
import { RevenueRange, type RevenueFilter } from './revenueRange';
import { formatYmd, taipeiNow } from './time';

/**
 * 首頁「營收報表」卡片。
 *
 * 金額一律是台北日曆日的今天，跟報表 Modal 目前選的區間無關。
 * 資料還沒回來時顯示「--」；只有回應已到且合計真的是 0 才顯示 $0。
 */
export class TodayRevenueCard {
  static readonly label = '今日';
  /** 與營收報表 Modal 共用的 30 分鐘 cache。 */
  static readonly cacheTtlMs = 30 * 60 * 1000;

  /** 台北今天。start 與 end 同一天，天數含頭含尾為 1。 */
  static range(now: Date = taipeiNow()): { start: string; end: string; days: number } {
    const today = formatYmd(now);
    return {
      start: today,
      end: today,
      days: RevenueRange.inclusiveDays(today, today),
    };
  }

  /**
   * 營收 cache key。預設 filter 是 day1（今天），
   * 所以卡片不會跟著 Modal 目前的區間換成 day7 / day30。
   */
  static cacheKey(storeId: number | null, filter: RevenueFilter = 'day1'): string {
    return `${filter}-${storeId ?? 'all'}`;
  }

  static fresh(cachedAt: number, now = Date.now()): boolean {
    return now - cachedAt < TodayRevenueCard.cacheTtlMs;
  }

  static total(payments: PaymentsResponse): number {
    const summary = payments.summary;
    if (!summary) return 0;
    return (summary.total_coin_amount || 0) + (summary.total_card_amount || 0);
  }

  /** `null` 代表尚未取得回應。 */
  static format(payments: PaymentsResponse | null): string {
    if (payments === null) return '--';
    return `$${TodayRevenueCard.total(payments).toLocaleString()}`;
  }
}
