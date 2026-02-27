import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MachineStatus, ReadingsResponse, ReadingItem, BalanceResponse, ActivityResponse, PaymentsResponse } from '../types';
import { fetchReadings, fetchBalance, fetchActivity, fetchPayments } from '../services/api';
import { StoreSelector } from '../components/StoreSelector';

const PLAY_PRICE = 10;

type DateFilter = 'today' | 'yesterday' | 'week' | 'month';

function getMachineStatus(machine: ReadingItem): MachineStatus {
  const lastTime = new Date(machine.last_reading_time);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60));
  // API 約 80 分鐘更新一次，設定 90 分鐘無回應視為離線
  return diffMinutes > 90 ? MachineStatus.OFFLINE : MachineStatus.ONLINE;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateRange(filter: DateFilter): { start: string; end: string; isSingleDay: boolean } {
  const now = new Date();
  const today = formatDate(now);

  switch (filter) {
    case 'today':
      return { start: today, end: today, isSingleDay: true };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const ys = formatDate(y);
      return { start: ys, end: ys, isSingleDay: true };
    }
    case 'week': {
      const dayOfWeek = now.getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      return { start: formatDate(monday), end: today, isSingleDay: false };
    }
    case 'month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDate(firstDay), end: today, isSingleDay: false };
    }
  }
}

function getRevenueDateRange(filter: RevenueFilter): { start: string; end: string } {
  const now = new Date();
  const today = formatDate(now);

  switch (filter) {
    case 'day1': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: formatDate(yesterday), end: today };
    }
    case 'day3': {
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return { start: formatDate(threeDaysAgo), end: today };
    }
    case 'day7': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { start: formatDate(sevenDaysAgo), end: today };
    }
    case 'day30': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { start: formatDate(thirtyDaysAgo), end: today };
    }
  }
}

const FILTER_LABELS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '本週' },
  { key: 'month', label: '本月' },
];

// 營收報表篩選
type RevenueFilter = 'day1' | 'day3' | 'day7' | 'day30';
const REVENUE_FILTER_LABELS: { key: RevenueFilter; label: string }[] = [
  { key: 'day1', label: '24小時內' },
  { key: 'day3', label: '3天內' },
  { key: 'day7', label: '7天內' },
  { key: 'day30', label: '30天內' },
];
const FILTER_DAYS: Record<RevenueFilter, number> = { day1: 1, day3: 3, day7: 7, day30: 30 };

export const Dashboard: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<DateFilter>('today');
  // 選中的場地 ID（null = 全部場地）
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  // 用 ref 追蹤最新的 selectedFilter，避免 setInterval 閉包問題
  const selectedFilterRef = useRef<DateFilter>(selectedFilter);
  // 營收報表 Modal
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>('day7');

  // 同步 ref 與 state
  useEffect(() => {
    selectedFilterRef.current = selectedFilter;
  }, [selectedFilter]);

  // 即時資料（今日 readings，用於場地健康）
  const [realtimeReadings, setRealtimeReadings] = useState<ReadingsResponse | null>(null);
  // 篩選用的營收資料
  const [revenueData, setRevenueData] = useState<{ coin: number; epay: number } | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenuePayments, setRevenuePayments] = useState<PaymentsResponse | null>(null);
  const [revenueReadings, setRevenueReadings] = useState<ReadingsResponse | null>(null);

  // 載入營收報表資料
  const loadRevenueReportData = useCallback(async (filter: RevenueFilter) => {
    const range = getRevenueDateRange(filter);
    setRevenuePayments(null);
    setRevenueReadings(null);
    setRevenueLoading(true);
    try {
      // 先取第一頁，確認總頁數（API 最大 page_size=100）
      const firstPage = await fetchPayments(range.start, range.end, selectedStoreId || undefined, 1, 100);
      const totalPages = firstPage.total_pages || 1;

      let allItems = [...firstPage.items];

      // 若有多頁，並行抓取剩餘頁
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            fetchPayments(range.start, range.end, selectedStoreId || undefined, i + 2, 100)
          )
        );
        rest.forEach(p => { allItems = allItems.concat(p.items); });
      }

      setRevenuePayments({ ...firstPage, items: allItems });
    } catch (error) {
      console.error('載入營收報表失敗:', error);
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  // 當營收報表開啟或篩選變更時，載入資料
  useEffect(() => {
    if (showRevenueReport) {
      loadRevenueReportData(revenueFilter);
    }
  }, [showRevenueReport, revenueFilter, loadRevenueReportData, selectedStoreId]);

  // 載入即時資料（場地健康、餘額、帳務）— 不動營收數據
  const loadRealtimeData = useCallback(async () => {
    try {
      const [readings, balance, activity] = await Promise.all([
        fetchReadings(formatDate(new Date()), selectedStoreId || undefined),
        fetchBalance(selectedStoreId || undefined),
        fetchActivity(selectedStoreId || undefined),
      ]);

      // 只有在有效數據時才更新
      if (readings && readings.items) {
        setRealtimeReadings(readings);
      }
      if (balance) {
        setBalanceData(balance);
      }
      if (activity) {
        setActivityData(activity);
      }

      // ★ 用 ref 讀取最新的 filter，避免閉包問題
      // 只有在「今日」篩選時，才用即時 readings 同步營收
      if (selectedFilterRef.current === 'today') {
        const summary = readings.summary;
        setRevenueData({
          coin: summary ? summary.total_coin * PLAY_PRICE : readings.items.reduce((s, m) => s + m.coin_play_count, 0) * PLAY_PRICE,
          epay: summary ? summary.total_epay * PLAY_PRICE : readings.items.reduce((s, m) => s + m.epay_play_count, 0) * PLAY_PRICE,
        });
      }
      // ★ 其他篩選（昨日、本週、本月）不覆蓋營收，保留 loadRevenueData 的結果
    } catch (error) {
      console.error('載入數據失敗:', error);
      // API 失敗時，不清除既有數據
    } finally {
      setLoading(false);
    }
  }, []);

  // 載入即時資料（一次性 + 定時刷新）
  useEffect(() => {
    loadRealtimeData();
    const interval = setInterval(loadRealtimeData, 30000);
    return () => clearInterval(interval);
  }, [loadRealtimeData, selectedStoreId]);

  // 篩選變更時載入對應營收資料
  useEffect(() => {
    loadRevenueData(selectedFilter);
  }, [selectedFilter]);

  async function loadRevenueData(filter: DateFilter) {
    const range = getDateRange(filter);
    setRevenueLoading(true);

    try {
      if (range.isSingleDay) {
        // 單日：用 readings API
        const readings = await fetchReadings(range.start, selectedStoreId || undefined);
        const summary = readings.summary;
        setRevenueData({
          coin: summary ? summary.total_coin * PLAY_PRICE : readings.items.reduce((s, m) => s + m.coin_play_count, 0) * PLAY_PRICE,
          epay: summary ? summary.total_epay * PLAY_PRICE : readings.items.reduce((s, m) => s + m.epay_play_count, 0) * PLAY_PRICE,
        });
      } else {
        // 多日：用 payments API（summary 已含 coin_amount / card_amount）
        const payments = await fetchPayments(range.start, range.end);
        const s = payments.summary;
        setRevenueData({
          coin: s ? s.total_coin_amount : 0,
          epay: s ? s.total_card_amount : 0,
        });
      }
    } catch (error) {
      console.error('載入營收失敗:', error);
      // API 失敗時，不清除既有數據
    } finally {
      setRevenueLoading(false);
    }
  }

  const machines = realtimeReadings?.items || [];
  const onlineCount = machines.filter(m => getMachineStatus(m) === MachineStatus.ONLINE).length;
  const offlineCount = machines.filter(m => getMachineStatus(m) === MachineStatus.OFFLINE).length;
  const availableBalance = balanceData?.balance?.available_amount ?? null;
  const recentActivity = activityData?.items?.slice(0, 3) || [];

  const totalCoinRevenue = revenueData?.coin ?? 0;
  const totalEpayRevenue = revenueData?.epay ?? 0;
  const totalRevenue = totalCoinRevenue + totalEpayRevenue;
  const isRevenueLoading = loading || revenueLoading;

  // 機台營收報告資料
  const revenueReport = useMemo(() => {
    // 營收 summary 資料
    const s = revenuePayments?.summary;
    const totalRevenue = s ? ((s.total_coin_amount || 0) + (s.total_card_amount || 0)) : 0;
    const coinRevenue = s?.total_coin_amount || 0;
    const cardRevenue = s?.total_card_amount || 0;
    const totalPlays = s?.total_transaction_count || 0;
    const totalPrizeCount = s?.total_prize_count || 0;
    const avgPayout = totalPrizeCount > 0 ? Math.round(totalRevenue / totalPrizeCount) : 0;
    const avgDailyRevenue = Math.round(totalRevenue / FILTER_DAYS[revenueFilter]);

    // 從 payments items 按機台聚合，正確涵蓋整個日期區間
    const machineMap = new Map<string, { name: string; plays: number; revenue: number; gifts: number }>();
    (revenuePayments?.items || []).forEach(item => {
      const key = item.machine_id || item.machine_name;
      const name = item.machine_display_name || item.machine_name;
      const plays = item.transaction_count || 0;
      const revenue = item.total_revenue || 0;
      const gifts = item.prize_count || 0;
      if (machineMap.has(key)) {
        const existing = machineMap.get(key)!;
        existing.plays += plays;
        existing.revenue += revenue;
        existing.gifts += gifts;
      } else {
        machineMap.set(key, { name, plays, revenue, gifts });
      }
    });
    const machineStats = Array.from(machineMap.values());

    // 計算總出貨數
    const totalGiftCount = machineStats.reduce((sum, m) => sum + m.gifts, 0);

    // 熱門機台（遊戲次數 > 0，出貨數 > 0）
    const hotMachines = machineStats
      .filter(m => m.plays > 0 && m.gifts > 0)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 3);

    // 異常機台（0 次遊戲 或 高遊戲但 0 出貨）
    const problemMachines = machineStats.filter(m =>
      m.plays === 0 || (m.plays > 5 && m.gifts === 0)
    );

    // 營收 TOP 3
    const topMachines = [...machineStats]
      .filter(m => m.plays > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    return {
      totalPlays,
      totalRevenue,
      coinRevenue,
      cardRevenue,
      avgPayout,
      avgDailyRevenue,
      totalGiftCount,
      hotMachines,
      problemMachines,
      topMachines,
      hasMachineData: machineStats.length > 0,
    };
  }, [revenuePayments, revenueFilter]);

  const filterTitle = useMemo(() => {
    return FILTER_LABELS.find(f => f.key === selectedFilter)?.label + '總營收';
  }, [selectedFilter]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center bg-background-light/80 dark:bg-background-dark/80 ios-blur p-4 pb-2 justify-between">
        {/* 場地選擇器 */}
        <StoreSelector
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
        />
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center dark:text-white">營運總覽</h2>
        <div className="flex w-10 items-center justify-end relative">
          <span className="material-symbols-outlined text-slate-600 dark:text-zinc-400">notifications</span>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 px-4 pt-4 pb-1 overflow-x-auto hide-scrollbar">
        {FILTER_LABELS.map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedFilter(f.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              selectedFilter === f.key
                ? 'bg-primary text-background-dark'
                : 'bg-white/10 text-slate-400 dark:text-zinc-500 hover:bg-white/15'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center pt-4 pb-4">
        <p className="text-slate-500 dark:text-zinc-500 text-sm font-bold tracking-wide">{filterTitle}</p>
        <h1 className="text-primary tracking-tight text-[48px] font-bold leading-tight mt-1">
          {isRevenueLoading ? '--' : `$${totalRevenue.toLocaleString()}`}
        </h1>

        <div className="flex gap-3 mt-6 w-full px-4">
          <div className="flex flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">payments</span>
              <p className="text-slate-500 dark:text-zinc-400 text-xs font-bold">現金收入</p>
            </div>
            <p className="text-xl font-bold dark:text-white">
              {isRevenueLoading ? '--' : `$${totalCoinRevenue.toLocaleString()}`}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">devices</span>
              <p className="text-slate-500 dark:text-zinc-400 text-xs font-bold">電支收入</p>
            </div>
            <p className="text-xl font-bold dark:text-white">
              {isRevenueLoading ? '--' : `$${totalEpayRevenue.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div 
          onClick={() => setShowRevenueReport(true)}
          className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-slate-200 dark:border-zinc-800 shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-zinc-800">
            <span className="material-symbols-outlined text-primary">insights</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-zinc-400 text-base font-bold">營收報表</p>
            <p className="text-primary text-lg font-bold">
              {revenueReport ? `$${revenueReport.totalRevenue.toLocaleString()}` : '--'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-zinc-800">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-zinc-400 text-base font-bold">可提領金額</p>
            <p className="text-primary text-lg font-bold">
              {loading || availableBalance === null ? '--' : `$${availableBalance.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Health List */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 tracking-wider">場地健康狀態</h3>
          <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">即時更新</span>
        </div>
        <div className="flex flex-col gap-0 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">toys</span>
              <span className="text-sm font-bold dark:text-slate-200">總機台數</span>
            </div>
            <span className="text-sm font-bold bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full dark:text-white">
              {loading ? '--' : realtimeReadings?.total_machines || 0}
            </span>
          </div>
          <div className="h-[1px] bg-slate-100 dark:bg-zinc-800 mx-4"></div>
          <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-success"></span>
              <span className="text-sm font-bold dark:text-slate-200">在線機台</span>
            </div>
            <span className="text-sm font-bold text-success">{loading ? '--' : onlineCount}</span>
          </div>
          <div className="h-[1px] bg-slate-100 dark:bg-zinc-800 mx-4"></div>
          <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-danger"></span>
              <span className="text-sm font-bold dark:text-slate-200">離線機台</span>
            </div>
            <span className="text-sm font-bold text-danger">{loading ? '--' : offlineCount}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="px-4 pb-6 pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 tracking-wider">最近帳務</h3>
          </div>
          <div className="flex flex-col gap-0 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-zinc-800">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center ${
                    item.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${
                      item.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {item.type === 'income' ? 'add_circle' : 'logout'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-white">{item.description}</p>
                    <p className="text-[10px] text-slate-400 dark:text-white/40">{item.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  item.type === 'income' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* 營收報表 Modal - 獨立於主要內容 */}
        {showRevenueReport && revenueReport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRevenueReport(false)}></div>
          <div className="relative w-full max-w-[430px] bg-surface-dark rounded-t-2xl shadow-2xl border-t border-white/10 flex flex-col pb-10 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex h-1.5 w-full items-center justify-center py-4">
              <div className="h-1.5 w-12 rounded-full bg-white/20"></div>
            </div>
            <div className="px-6 pb-4">
              <h1 className="text-white text-xl font-bold text-center">📊 營收報告</h1>
              {/* 篩選按鈕 */}
              <div className="flex gap-2 mt-3 justify-center">
                {REVENUE_FILTER_LABELS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setRevenueFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      revenueFilter === f.key
                        ? 'bg-primary text-background-dark'
                        : 'bg-white/10 text-white/50 hover:bg-white/15'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 space-y-4">
              {/* 總覽數據 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs">遊戲次數</p>
                  <p className="text-white font-bold text-lg">{revenueReport?.totalPlays || 0}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs">總營收</p>
                  <p className="text-primary font-bold text-lg">${(revenueReport?.totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* 現金與電支 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs">現金收入</p>
                  <p className="text-green-400 font-bold">${(revenueReport?.coinRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs">電支收入</p>
                  <p className="text-blue-400 font-bold">${(revenueReport?.cardRevenue || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* 均日營收 & 出獎率 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs">均日營收</p>
                  <p className="text-yellow-400 font-bold">${(revenueReport?.avgDailyRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/50 text-xs">均出</p>
                  <p className="text-purple-400 font-bold">${(revenueReport?.avgPayout || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* 出貨數量 */}
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs">總出貨數</span>
                  <span className="text-white font-bold">{revenueReport?.totalGiftCount || 0} 個</span>
                </div>
              </div>

              {/* 熱門機台 */}
              {revenueReport?.hotMachines && revenueReport.hotMachines.length > 0 && (
                <div>
                  <p className="text-primary text-sm font-bold mb-2 flex items-center gap-1">
                    <span>🔥</span> 熱門機台（應補貨）
                  </p>
                  <div className="space-y-2">
                    {revenueReport.hotMachines.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold">#{idx + 1}</span>
                          <span className="text-white text-sm">機台 {m.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">{m.plays} 次遊戲</p>
                          <p className="text-green-400 text-xs">已出貨 {m.gifts} 個</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 異常機台 */}
              {revenueReport?.problemMachines && revenueReport.problemMachines.length > 0 && (
                <div>
                  <p className="text-red-400 text-sm font-bold mb-2 flex items-center gap-1">
                    <span>⚠️</span> 異常機台（需檢查）
                  </p>
                  <div className="space-y-2">
                    {revenueReport.problemMachines.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 font-bold">!</span>
                          <span className="text-white text-sm">機台 {m.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 text-sm">{m.plays === 0 ? '0 次遊戲' : '高遊戲 0 出貨'}</p>
                          <p className="text-white/50 text-xs">{m.status === 'OFFLINE' ? '離線中' : '設定異常'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 營收 TOP 3 */}
              {revenueReport?.topMachines && revenueReport.topMachines.length > 0 && (
                <div>
                  <p className="text-white/70 text-sm font-bold mb-2 flex items-center gap-1">
                    <span>🏆</span> 營收 TOP 3
                  </p>
                  <div className="space-y-2">
                    {revenueReport.topMachines.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                          <span className="text-white text-sm">機台 {m.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-bold">${m.revenue.toLocaleString()}</p>
                          <p className="text-white/50 text-xs">{m.plays} 次</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pt-4">
              <button 
                onClick={() => setShowRevenueReport(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
