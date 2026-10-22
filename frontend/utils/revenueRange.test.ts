import { describe, expect, it } from 'vitest';
import { RevenueRange, type RevenueFilter } from './revenueRange';

/** 本地年月日，與 formatYmd / taipeiNow 的 getter 契約一致。 */
function calendarDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

const FILTERS: RevenueFilter[] = ['day1', 'day3', 'day7', 'day30'];

describe('RevenueRange 各篩選的起訖日與天數', () => {
  // 2026-10-22 在月中，用來鎖定「近 N 日」不是舊的「回推 N 日再加今天」（N+1 天）。
  const midMonth = calendarDate(2026, 10, 22);

  it.each([
    ['day1', '24小時內', 1, '2026-10-22', '2026-10-22'],
    ['day3', '3天內', 3, '2026-10-20', '2026-10-22'],
    ['day7', '7天內', 7, '2026-10-16', '2026-10-22'],
    ['day30', '30天內', 30, '2026-09-23', '2026-10-22'],
  ] as const)('%s（%s）查 %i 個日曆日 %s～%s', (key, label, days, start, end) => {
    const option = RevenueRange.options.find((item) => item.key === key);
    expect(option?.label).toBe(label);
    expect(option?.days).toBe(days);

    const range = RevenueRange.getRange(key, midMonth);
    expect(range).toEqual({ start, end, days });
    expect(range.days).toBe(RevenueRange.inclusiveDays(range.start, range.end));
    expect(range.days).toBe(RevenueRange.daysFor(key));
  });

  it('四個篩選都有對應標籤，且天數與標籤一致', () => {
    expect(RevenueRange.options.map((item) => item.key)).toEqual(FILTERS);
    for (const option of RevenueRange.options) {
      const stated = option.key === 'day1' ? 1 : Number(option.label.replace(/[^\d]/g, ''));
      expect(option.days).toBe(stated);
    }
  });
});

describe('RevenueRange 跨月、跨年與閏年邊界', () => {
  it.each([
    // 月初：往回跨進前一個月
    ['2026-10-01 day1', 'day1', calendarDate(2026, 10, 1), '2026-10-01', '2026-10-01', 1],
    ['2026-10-01 day3', 'day3', calendarDate(2026, 10, 1), '2026-09-29', '2026-10-01', 3],
    ['2026-10-01 day7', 'day7', calendarDate(2026, 10, 1), '2026-09-25', '2026-10-01', 7],
    ['2026-10-01 day30', 'day30', calendarDate(2026, 10, 1), '2026-09-02', '2026-10-01', 30],
    // 平年 3/1：2 月只有 28 天，30 天區間跨到 1 月
    ['2026-03-01 day1', 'day1', calendarDate(2026, 3, 1), '2026-03-01', '2026-03-01', 1],
    ['2026-03-01 day3', 'day3', calendarDate(2026, 3, 1), '2026-02-27', '2026-03-01', 3],
    ['2026-03-01 day7', 'day7', calendarDate(2026, 3, 1), '2026-02-23', '2026-03-01', 7],
    ['2026-03-01 day30', 'day30', calendarDate(2026, 3, 1), '2026-01-31', '2026-03-01', 30],
    // 閏年 3/1：2/29 存在，3 天區間是 2/28～3/1
    ['2024-03-01 day3', 'day3', calendarDate(2024, 3, 1), '2024-02-28', '2024-03-01', 3],
    ['2024-03-01 day7', 'day7', calendarDate(2024, 3, 1), '2024-02-24', '2024-03-01', 7],
    ['2024-03-01 day30', 'day30', calendarDate(2024, 3, 1), '2024-02-01', '2024-03-01', 30],
    // 元旦：往回跨年
    ['2026-01-01 day1', 'day1', calendarDate(2026, 1, 1), '2026-01-01', '2026-01-01', 1],
    ['2026-01-01 day3', 'day3', calendarDate(2026, 1, 1), '2025-12-30', '2026-01-01', 3],
    ['2026-01-01 day7', 'day7', calendarDate(2026, 1, 1), '2025-12-26', '2026-01-01', 7],
    ['2026-01-01 day30', 'day30', calendarDate(2026, 1, 1), '2025-12-03', '2026-01-01', 30],
  ] as const)('%s', (_name, filter, now, start, end, days) => {
    expect(RevenueRange.getRange(filter, now)).toEqual({ start, end, days });
  });
});

describe('RevenueRange.inclusiveDays', () => {
  it('同一天算 1 天', () => {
    expect(RevenueRange.inclusiveDays('2026-10-22', '2026-10-22')).toBe(1);
  });

  it('相鄰兩天算 2 天', () => {
    expect(RevenueRange.inclusiveDays('2026-10-21', '2026-10-22')).toBe(2);
  });

  it('跨月', () => {
    expect(RevenueRange.inclusiveDays('2026-01-31', '2026-02-01')).toBe(2);
    expect(RevenueRange.inclusiveDays('2026-02-27', '2026-03-01')).toBe(3);
  });

  it('跨年', () => {
    expect(RevenueRange.inclusiveDays('2025-12-31', '2026-01-01')).toBe(2);
    expect(RevenueRange.inclusiveDays('2025-12-03', '2026-01-01')).toBe(30);
  });

  it('閏年 2 月', () => {
    expect(RevenueRange.inclusiveDays('2024-02-28', '2024-03-01')).toBe(3);
    expect(RevenueRange.inclusiveDays('2024-02-01', '2024-03-01')).toBe(30);
  });
});

describe('RevenueRange.avgDaily', () => {
  it('除以實際查詢天數，而不是少算一天', () => {
    const range = RevenueRange.getRange('day7', calendarDate(2026, 10, 22));
    expect(range.days).toBe(7);
    expect(RevenueRange.avgDaily(700, range.days)).toBe(100);

    // 舊查詢是「回推 7 天＋今天」共 8 天，若仍除以 FILTER_DAYS 的 7 會得到 114。
    const oldWindowDays = RevenueRange.inclusiveDays('2026-10-15', '2026-10-22');
    expect(oldWindowDays).toBe(8);
    expect(RevenueRange.avgDaily(800, oldWindowDays)).toBe(100);
    expect(RevenueRange.avgDaily(800, 7)).toBe(114);
  });

  it('四捨五入到整數', () => {
    expect(RevenueRange.avgDaily(100, 3)).toBe(33);
    expect(RevenueRange.avgDaily(200, 3)).toBe(67);
    expect(RevenueRange.avgDaily(5, 2)).toBe(3);
  });

  it('天數不是正數時不除，回傳 0', () => {
    expect(RevenueRange.avgDaily(1000, 0)).toBe(0);
    expect(RevenueRange.avgDaily(1000, -1)).toBe(0);
  });

  it('24小時內只有今天，均日等於當日營收', () => {
    const range = RevenueRange.getRange('day1', calendarDate(2026, 10, 22));
    expect(range.start).toBe(range.end);
    expect(RevenueRange.avgDaily(1234, range.days)).toBe(1234);
  });
});
