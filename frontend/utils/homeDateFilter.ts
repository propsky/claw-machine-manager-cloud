import { formatYmd, taipeiNow } from './time';

/** 首頁營收區間。自訂日期的起訖由 DateRangeSheet 另給。 */
export type HomeDateFilterKey =
  | 'today'
  | 'yesterday'
  | 'day_before_yesterday'
  | 'three_days_ago'
  | 'seven_days'
  | 'week'
  | 'month'
  | 'custom';

export type HomeDateRange = {
  start: string;
  end: string;
  isSingleDay: boolean;
};

type HomeDateFilterOption = {
  key: HomeDateFilterKey;
  label: string;
};

/**
 * 首頁日期篩選。
 *
 * 單日區間（今日、昨日、前日、大前日）以台北日曆日回推，
 * 起訖同一天。近七天、本週、本月的演算法維持原樣：
 * 近七天是今天往回 6 天（含頭含尾 7 天），本週從週一到今天，本月從 1 號到今天。
 *
 * `now` 必須是本地 getter 已對齊日曆日的 Date（與 taipeiNow / formatYmd 相同契約）。
 */
export class HomeDateFilter {
  static readonly labels: readonly HomeDateFilterOption[] = [
    { key: 'today', label: '今日' },
    { key: 'yesterday', label: '昨日' },
    { key: 'day_before_yesterday', label: '前日' },
    { key: 'three_days_ago', label: '大前日' },
    { key: 'seven_days', label: '近七天' },
    { key: 'week', label: '本週' },
    { key: 'month', label: '本月' },
    { key: 'custom', label: '自訂日期' },
  ];

  static range(filter: Exclude<HomeDateFilterKey, 'custom'>, now: Date = taipeiNow()): HomeDateRange {
    const today = formatYmd(now);

    switch (filter) {
      case 'today':
        return HomeDateFilter.singleDay(now, 0);
      case 'yesterday':
        return HomeDateFilter.singleDay(now, 1);
      case 'day_before_yesterday':
        return HomeDateFilter.singleDay(now, 2);
      case 'three_days_ago':
        return HomeDateFilter.singleDay(now, 3);
      case 'seven_days':
        return { start: formatYmd(HomeDateFilter.shiftDays(now, 6)), end: today, isSingleDay: false };
      case 'week': {
        const dayOfWeek = now.getDay(); // 0=Sun
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return { start: formatYmd(HomeDateFilter.shiftDays(now, mondayOffset)), end: today, isSingleDay: false };
      }
      case 'month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: formatYmd(firstDay), end: today, isSingleDay: false };
      }
    }
  }

  /** 台北日曆日往回 offset 天，起訖同一天。 */
  private static singleDay(now: Date, offset: number): HomeDateRange {
    const day = formatYmd(HomeDateFilter.shiftDays(now, offset));
    return { start: day, end: day, isSingleDay: true };
  }

  private static shiftDays(now: Date, days: number): Date {
    const shifted = new Date(now.getTime());
    shifted.setDate(shifted.getDate() - days);
    return shifted;
  }
}
