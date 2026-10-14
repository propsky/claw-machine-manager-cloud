/**
 * 台北時間工具
 *
 * 後端（smartpay）的時間一律是台北時間，且回傳字串不帶時區（如 "2026-10-06T14:12:33"）。
 * 瀏覽器預設會用「裝置所在時區」解讀，裝置不在台灣時區時，斷線判斷與「今天」的日期都會偏掉。
 * 所有日期計算與後端時間解析都應經過這裡，統一以台北時間（UTC+8，無日光節約）為準。
 */

const TAIPEI_OFFSET_MINUTES = 8 * 60;
export const TAIPEI_TZ = 'Asia/Taipei';

/**
 * 取得「以台北時間為牆上時鐘」的 Date。
 * 回傳值的 getFullYear / getMonth / getDate / getDay 等本地 getter 會是台北的日期，
 * 供日期區間計算（今天、昨天、本週、本月）使用；不可拿來和真實時間戳相減。
 */
export function taipeiNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + TAIPEI_OFFSET_MINUTES) * 60000);
}

/** 以本地 getter 格式化成 YYYY-MM-DD（搭配 taipeiNow() 衍生的 Date 使用） */
export function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 台北時間的今天（YYYY-MM-DD） */
export function taipeiToday(): string {
  return formatYmd(taipeiNow());
}

/** 解析後端時間字串：沒帶時區的一律視為台北時間 */
export function parseServerTime(s: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
  return new Date(hasZone ? s : `${s}+08:00`);
}

/** 後端時間距今幾分鐘 */
export function minutesSince(serverTime: string): number {
  return Math.floor((Date.now() - parseServerTime(serverTime).getTime()) / 60000);
}
