// 場地列表緩存工具
// 24 小時更新一次，可手動強制刷新

import type { StoreOption } from './api';

const STORES_CACHE_KEY = 'claw_stores_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 小時

interface StoreCache {
  stores: StoreOption[];
  lastUpdated: number;
}

/**
 * 取得場地列表（帶緩存）
 * - 首次：從 API 取得
 * - 24 小時內：從 localStorage 讀取
 * - 超過 24 小時：背景刷新
 */
export async function getStoresWithCache(fetchFn: () => Promise<StoreOption[]>): Promise<StoreOption[]> {
  const cached = getCachedStores();

  // 如果沒有緩存，直接從 API 取得
  if (!cached) {
    const stores = await fetchFn();
    setCachedStores(stores);
    return stores;
  }

  // 檢查是否需要刷新
  const shouldRefresh = Date.now() - cached.lastUpdated > CACHE_DURATION;

  if (shouldRefresh) {
    // 背景刷新，不阻塞返回舊資料
    fetchFn()
      .then(stores => setCachedStores(stores))
      .catch(err => console.error('背景刷新場地失敗:', err));
  }

  return cached.stores;
}

/**
 * 強制刷新場地列表
 */
export async function refreshStores(fetchFn: () => Promise<StoreOption[]>): Promise<StoreOption[]> {
  const stores = await fetchFn();
  setCachedStores(stores);
  return stores;
}

/**
 * 取得最後更新時間
 */
export function getLastUpdateTime(): number | null {
  const cached = localStorage.getItem(STORES_CACHE_KEY);
  if (!cached) return null;
  
  try {
    return JSON.parse(cached).lastUpdated;
  } catch {
    return null;
  }
}

/**
 * 清除緩存
 */
export function clearStoresCache(): void {
  localStorage.removeItem(STORES_CACHE_KEY);
}

// ============ 私有函數 ============

function getCachedStores(): StoreCache | null {
  const cached = localStorage.getItem(STORES_CACHE_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function setCachedStores(stores: StoreOption[]): void {
  const cache: StoreCache = {
    stores,
    lastUpdated: Date.now(),
  };
  localStorage.setItem(STORES_CACHE_KEY, JSON.stringify(cache));
}
