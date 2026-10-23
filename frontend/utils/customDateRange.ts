/**
 * 自訂日期的前端驗證。payments 這類區間查詢有後端上限，
 * 這裡在送出前擋下不合法的範圍。
 */
export class CustomDateRange {
  /** 後端自訂區間上限：含頭含尾最多 90 個日曆日。超過即拒。 */
  static readonly maxInclusiveDays = 90;

  /** 兩者都有值且不合法時回傳錯誤文案；尚未填完或合法則回傳 null。 */
  static validate(start: string, end: string): string | null {
    if (!start || !end) return null;
    if (start > end) return '開始日期不能晚於結束日期';
    if (CustomDateRange.inclusiveDays(start, end) > CustomDateRange.maxInclusiveDays) {
      return `日期區間不能超過 ${CustomDateRange.maxInclusiveDays} 天`;
    }
    return null;
  }

  static canConfirm(start: string, end: string): boolean {
    return Boolean(start && end && CustomDateRange.validate(start, end) === null);
  }

  /** 含頭含尾的日曆天數。start、end 為 YYYY-MM-DD。 */
  static inclusiveDays(start: string, end: string): number {
    const startMs = CustomDateRange.parseYmdUtc(start);
    const endMs = CustomDateRange.parseYmdUtc(end);
    return Math.round((endMs - startMs) / 86_400_000) + 1;
  }

  private static parseYmdUtc(ymd: string): number {
    const [year, month, day] = ymd.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  }
}
