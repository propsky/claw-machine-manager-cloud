import React, { useState, useEffect, useMemo } from 'react';
import { MachineStatus, ReadingsResponse, ReadingItem, BalanceResponse, ActivityResponse, PaymentsResponse } from '../types';
import { fetchReadings, fetchBalance, fetchActivity, fetchPayments } from '../services/api';

const PLAY_PRICE = 10;

type DateFilter = 'today' | 'yesterday' | 'week' | 'month';

function getMachineStatus(machine: ReadingItem): MachineStatus {
  const lastTime = new Date(machine.last_reading_time);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60));
  return diffMinutes > 60 ? MachineStatus.OFFLINE : MachineStatus.ONLINE;
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

const FILTER_LABELS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '本週' },
  { key: 'month', label: '本月' },
];

export const Dashboard: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<DateFilter>('today');
  // 即時資料（今日 readings，用於場地健康）
  const [realtimeReadings, setRealtimeReadings] = useState<ReadingsResponse | null>(null);
  // 篩選用的營收資料
  const [revenueData, setRevenueData] = useState<{ coin: number; epay: number } | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // 載入即時資料（一次性 + 定時刷新）
  useEffect(() => {
    loadRealtimeData();
    const interval = setInterval(loadRealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 篩選變更時載入對應營收資料
  useEffect(() => {
    loadRevenueData(selectedFilter);
  }, [selectedFilter]);

  async function loadRealtimeData() {
    try {
      const [readings, balance, activity] = await Promise.all([
        fetchReadings(formatDate(new Date())),
        fetchBalance(),
        fetchActivity(),
      ]);
      setRealtimeReadings(readings);
      setBalanceData(balance);
      setActivityData(activity);

      // 如果當前篩選是今日，同步更新營收資料
      if (selectedFilter === 'today') {
        const summary = readings.summary;
        setRevenueData({
          coin: summary ? summary.total_coin * PLAY_PRICE : readings.items.reduce((s, m) => s + m.coin_play_count, 0) * PLAY_PRICE,
          epay: summary ? summary.total_epay * PLAY_PRICE : readings.items.reduce((s, m) => s + m.epay_play_count, 0) * PLAY_PRICE,
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function loadRevenueData(filter: DateFilter) {
    const range = getDateRange(filter);
    setRevenueLoading(true);

    try {
      if (range.isSingleDay) {
        // 單日：用 readings API
        const readings = await fetchReadings(range.start);
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
    } catch {
      // silent
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

  const filterTitle = useMemo(() => {
    return FILTER_LABELS.find(f => f.key === selectedFilter)?.label + '總營收';
  }, [selectedFilter]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center bg-background-light/80 dark:bg-background-dark/80 ios-blur p-4 pb-2 justify-between">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800">
          <span className="material-symbols-outlined text-slate-600 dark:text-zinc-400">menu</span>
        </div>
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
        <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-slate-200 dark:border-zinc-800 shadow-sm opacity-50">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-zinc-800">
            <span className="material-symbols-outlined text-slate-400">bar_chart</span>
          </div>
          <div>
            <p className="text-slate-400 dark:text-zinc-500 text-base font-bold">營收報表</p>
            <p className="text-slate-400 dark:text-zinc-600 text-[10px] font-bold">開發中</p>
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
                  item.type === 'income' ? 'text-green-500' : 'text-white'
                }`}>
                  {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
