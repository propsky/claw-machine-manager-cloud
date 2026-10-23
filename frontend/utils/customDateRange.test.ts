import { describe, expect, it } from 'vitest';
import { CustomDateRange } from './customDateRange';

describe('自訂日期驗證', () => {
  it('上限常數是 90 天', () => {
    expect(CustomDateRange.maxInclusiveDays).toBe(90);
  });

  it('開始晚於結束時拒絕，且不能確認', () => {
    expect(CustomDateRange.validate('2026-10-23', '2026-10-22')).toBe('開始日期不能晚於結束日期');
    expect(CustomDateRange.canConfirm('2026-10-23', '2026-10-22')).toBe(false);
  });

  it('跨月、跨年的顛倒區間一樣拒絕', () => {
    expect(CustomDateRange.validate('2026-03-01', '2026-02-27')).toBe('開始日期不能晚於結束日期');
    expect(CustomDateRange.validate('2026-01-01', '2025-12-31')).toBe('開始日期不能晚於結束日期');
  });

  it('同一天可以確認', () => {
    expect(CustomDateRange.inclusiveDays('2026-10-23', '2026-10-23')).toBe(1);
    expect(CustomDateRange.validate('2026-10-23', '2026-10-23')).toBeNull();
    expect(CustomDateRange.canConfirm('2026-10-23', '2026-10-23')).toBe(true);
  });

  it('含頭含尾剛好 90 天可以，第 91 天不行', () => {
    expect(CustomDateRange.inclusiveDays('2026-01-01', '2026-03-31')).toBe(90);
    expect(CustomDateRange.inclusiveDays('2026-01-01', '2026-04-01')).toBe(91);
    expect(CustomDateRange.validate('2026-01-01', '2026-03-31')).toBeNull();
    expect(CustomDateRange.canConfirm('2026-01-01', '2026-03-31')).toBe(true);
    expect(CustomDateRange.validate('2026-01-01', '2026-04-01')).toBe('日期區間不能超過 90 天');
    expect(CustomDateRange.canConfirm('2026-01-01', '2026-04-01')).toBe(false);
  });

  it('閏年也用含頭含尾的日曆天數', () => {
    expect(CustomDateRange.inclusiveDays('2024-01-01', '2024-03-30')).toBe(90);
    expect(CustomDateRange.inclusiveDays('2024-01-01', '2024-03-31')).toBe(91);
    expect(CustomDateRange.validate('2024-01-01', '2024-03-30')).toBeNull();
    expect(CustomDateRange.validate('2024-01-01', '2024-03-31')).toBe('日期區間不能超過 90 天');
  });

  it('還沒選完日期時不顯示錯誤，也不能確認', () => {
    expect(CustomDateRange.validate('', '')).toBeNull();
    expect(CustomDateRange.validate('2026-10-01', '')).toBeNull();
    expect(CustomDateRange.validate('', '2026-10-01')).toBeNull();
    expect(CustomDateRange.canConfirm('', '')).toBe(false);
    expect(CustomDateRange.canConfirm('2026-10-01', '')).toBe(false);
    expect(CustomDateRange.canConfirm('', '2026-10-01')).toBe(false);
  });
});
