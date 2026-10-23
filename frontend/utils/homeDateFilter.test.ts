import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeDateFilter } from './homeDateFilter';
import { formatYmd, taipeiNow } from './time';

/** 本地年月日，與 formatYmd / taipeiNow 的 getter 契約一致。 */
function calendarDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0);
}

describe('首頁日期篩選標籤順序', () => {
  it('按鈕順序與文案固定為八個', () => {
    expect(HomeDateFilter.labels.map((item) => item.label)).toEqual([
      '今日',
      '昨日',
      '前日',
      '大前日',
      '近七天',
      '本週',
      '本月',
      '自訂日期',
    ]);
    expect(HomeDateFilter.labels.map((item) => item.key)).toEqual([
      'today',
      'yesterday',
      'day_before_yesterday',
      'three_days_ago',
      'seven_days',
      'week',
      'month',
      'custom',
    ]);
  });
});

describe('前日與大前日是單日', () => {
  it('月中各往回 2 天、3 天，起訖同一天', () => {
    const now = calendarDate(2026, 10, 23);
    expect(HomeDateFilter.range('today', now)).toEqual({
      start: '2026-10-23',
      end: '2026-10-23',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('yesterday', now)).toEqual({
      start: '2026-10-22',
      end: '2026-10-22',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('day_before_yesterday', now)).toEqual({
      start: '2026-10-21',
      end: '2026-10-21',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('three_days_ago', now)).toEqual({
      start: '2026-10-20',
      end: '2026-10-20',
      isSingleDay: true,
    });
  });

  it('平年 3/1 往回跨月', () => {
    const now = calendarDate(2026, 3, 1);
    expect(HomeDateFilter.range('day_before_yesterday', now)).toEqual({
      start: '2026-02-27',
      end: '2026-02-27',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('three_days_ago', now)).toEqual({
      start: '2026-02-26',
      end: '2026-02-26',
      isSingleDay: true,
    });
  });

  it('閏年 3/1 往回仍是單日，且經過 2/29', () => {
    const now = calendarDate(2024, 3, 1);
    expect(HomeDateFilter.range('yesterday', now).start).toBe('2024-02-29');
    expect(HomeDateFilter.range('day_before_yesterday', now)).toEqual({
      start: '2024-02-28',
      end: '2024-02-28',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('three_days_ago', now)).toEqual({
      start: '2024-02-27',
      end: '2024-02-27',
      isSingleDay: true,
    });
  });

  it('元旦往回跨年', () => {
    const now = calendarDate(2026, 1, 1);
    expect(HomeDateFilter.range('day_before_yesterday', now)).toEqual({
      start: '2025-12-30',
      end: '2025-12-30',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('three_days_ago', now)).toEqual({
      start: '2025-12-29',
      end: '2025-12-29',
      isSingleDay: true,
    });
  });
});

describe('前日與大前日使用台北時區', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('UTC 仍在前一月、台北已是新的一個月時，以台北日曆日回推', () => {
    // 2026-03-01 00:30 Asia/Taipei = 2026-02-28 16:30Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-28T16:30:00Z'));

    expect(new Date().toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(formatYmd(taipeiNow())).toBe('2026-03-01');

    expect(HomeDateFilter.range('day_before_yesterday')).toEqual({
      start: '2026-02-27',
      end: '2026-02-27',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('three_days_ago')).toEqual({
      start: '2026-02-26',
      end: '2026-02-26',
      isSingleDay: true,
    });
  });

  it('台北 3/2 凌晨，前日與大前日都落在二月', () => {
    // 2026-03-02 00:30 Asia/Taipei = 2026-03-01 16:30Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T16:30:00Z'));

    expect(formatYmd(taipeiNow())).toBe('2026-03-02');
    expect(HomeDateFilter.range('day_before_yesterday')).toEqual({
      start: '2026-02-28',
      end: '2026-02-28',
      isSingleDay: true,
    });
    expect(HomeDateFilter.range('three_days_ago')).toEqual({
      start: '2026-02-27',
      end: '2026-02-27',
      isSingleDay: true,
    });
  });
});

describe('近七天、本週、本月演算法不變', () => {
  it('近七天仍是今天往回 6 天', () => {
    expect(HomeDateFilter.range('seven_days', calendarDate(2026, 10, 22))).toEqual({
      start: '2026-10-16',
      end: '2026-10-22',
      isSingleDay: false,
    });
  });

  it('本週從週一算到今天，週日則回到上週一', () => {
    expect(HomeDateFilter.range('week', calendarDate(2026, 10, 22))).toEqual({
      start: '2026-10-19',
      end: '2026-10-22',
      isSingleDay: false,
    });
    expect(HomeDateFilter.range('week', calendarDate(2026, 3, 1))).toEqual({
      start: '2026-02-23',
      end: '2026-03-01',
      isSingleDay: false,
    });
  });

  it('本月從 1 號算到今天', () => {
    expect(HomeDateFilter.range('month', calendarDate(2026, 10, 22))).toEqual({
      start: '2026-10-01',
      end: '2026-10-22',
      isSingleDay: false,
    });
    expect(HomeDateFilter.range('month', calendarDate(2026, 3, 1))).toEqual({
      start: '2026-03-01',
      end: '2026-03-01',
      isSingleDay: false,
    });
  });
});
