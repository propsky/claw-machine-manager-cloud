import { formatYmd } from './time';

/** 營收報表的時間篩選。天數是「近 N 個日曆日」（含今天）。 */
export type RevenueFilter = 'day1' | 'day3' | 'day7' | 'day30';

type RevenueFilterOption = {
  key: RevenueFilter;
  label: string;
  /** 標籤所承諾、也是實際查詢的日曆天數（含頭含尾）。 */
  days: number;
};

/**
 * 營收報表的日期區間。
 *
 * payments API 只吃 YYYY-MM-DD，沒有小時。四個篩選一律查「近 N 個日曆日」（含今天）：
 * 24小時內 = 今天 1 天、3天內 = 3 天、7天內 = 7 天、30天內 = 30 天。
 * 回推天數是 N-1，與首頁「7天內」（今天往回 6 天）同一套含頭含尾規則。
 *
 * `now` 必須是本地 getter 已對齊日曆日的 Date（與 taipeiNow / formatYmd 相同契約）。
 */
export class RevenueRange {
  static readonly options: readonly RevenueFilterOption[] = [
    { key: 'day1', label: '24小時內', days: 1 },
    { key: 'day3', label: '3天內', days: 3 },
    { key: 'day7', label: '7天內', days: 7 },
    { key: 'day30', label: '30天內', days: 30 },
  ];

  static daysFor(filter: RevenueFilter): number {
    const option = RevenueRange.options.find((item) => item.key === filter);
    if (!option) {
      throw new Error(`未知的營收區間: ${filter}`);
    }
    return option.days;
  }

  /** 含頭含尾的日曆天數。start、end 為 YYYY-MM-DD。 */
  static inclusiveDays(start: string, end: string): number {
    const startMs = RevenueRange.parseYmdUtc(start);
    const endMs = RevenueRange.parseYmdUtc(end);
    return Math.round((endMs - startMs) / 86_400_000) + 1;
  }

  /**
   * 近 N 個日曆日。days 一律用起訖日現算，不另維護一份可能少算一天的常數。
   */
  static getRange(filter: RevenueFilter, now: Date): { start: string; end: string; days: number } {
    const span = RevenueRange.daysFor(filter);
    const end = formatYmd(now);
    const startDate = new Date(now.getTime());
    startDate.setDate(startDate.getDate() - (span - 1));
    const start = formatYmd(startDate);
    return { start, end, days: RevenueRange.inclusiveDays(start, end) };
  }

  /** 均日營收：總額除以實際查詢的日曆天數（含頭含尾）。 */
  static avgDaily(totalRevenue: number, days: number): number {
    if (!Number.isFinite(days) || days <= 0) return 0;
    return Math.round(totalRevenue / days);
  }

  private static parseYmdUtc(ymd: string): number {
    const [year, month, day] = ymd.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  }
}
