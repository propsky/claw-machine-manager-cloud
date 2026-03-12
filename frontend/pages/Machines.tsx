import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MachineStatus, ReadingsResponse, PaymentsResponse } from '../types';
import { fetchReadings, fetchPayments, restartMachine, startMachine } from '../services/api';
import { StoreSelector } from '../components/StoreSelector';

const PLAY_PRICE = 10;
const MACHINES_CACHE_TTL = 5 * 60 * 1000;
let todayCache: { data: ReadingsResponse; cachedAt: number } | null = null;

type DateFilter = 'today' | 'yesterday' | 'seven_days' | 'week' | 'month';
type FilterStatus = 'all' | 'online' | 'offline';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'seven_days', label: '7天內' },
  { key: 'week', label: '本週' },
  { key: 'month', label: '本月' },
];

interface MachineViewItem {
  key: string;
  machine_name: string;
  store_name: string;
  store_id: number;
  total_play_count: number;
  coin_play_count: number;
  epay_play_count: number;
  gift_out_count: number;
  revenue: number;
  last_reading_time: string | null;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayString(): string {
  return formatDate(new Date());
}

function getDateRange(filter: DateFilter): { start: string; end: string; isSingleDay: boolean } {
  const now = new Date();
  const today = formatDate(now);
  switch (filter) {
    case 'today':
      return { start: today, end: today, isSingleDay: true };
    case 'yesterday': {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      const ys = formatDate(y);
      return { start: ys, end: ys, isSingleDay: true };
    }
    case 'seven_days': {
      const d = new Date(now); d.setDate(now.getDate() - 6);
      return { start: formatDate(d), end: today, isSingleDay: false };
    }
    case 'week': {
      const monday = new Date(now);
      const offset = (now.getDay() === 0 ? 6 : now.getDay() - 1);
      monday.setDate(now.getDate() - offset);
      return { start: formatDate(monday), end: today, isSingleDay: false };
    }
    case 'month':
      return { start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), end: today, isSingleDay: false };
  }
}

function getTimeDiffMinutes(t: string): number {
  return Math.floor((Date.now() - new Date(t).getTime()) / 60000);
}

function getMachineStatus(lastReadingTime: string | null): MachineStatus {
  if (!lastReadingTime) return MachineStatus.OFFLINE;
  return getTimeDiffMinutes(lastReadingTime) > 90 ? MachineStatus.OFFLINE : MachineStatus.ONLINE;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

export const Machines: React.FC = () => {
  const [todayReadings, setTodayReadings] = useState<ReadingsResponse | null>(null);
  const [filterReadings, setFilterReadings] = useState<ReadingsResponse | null>(null);
  const [filterPayments, setFilterPayments] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  // 機台控制
  const [selectedMachine, setSelectedMachine] = useState<MachineViewItem | null>(null);
  const [controlLoading, setControlLoading] = useState(false);

  // 今日資料（機台狀態用），5 分鐘 cache
  const loadToday = useCallback(async (force = false) => {
    if (!force && todayCache && Date.now() - todayCache.cachedAt < MACHINES_CACHE_TTL) {
      setTodayReadings(todayCache.data);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchReadings(getTodayString());
      todayCache = { data, cachedAt: Date.now() };
      setTodayReadings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  // 篩選期間資料
  const loadFilterData = useCallback(async (filter: DateFilter) => {
    if (filter === 'today') {
      setFilterReadings(null);
      setFilterPayments(null);
      return;
    }
    const range = getDateRange(filter);
    setFilterLoading(true);
    setFilterReadings(null);
    setFilterPayments(null);
    try {
      if (range.isSingleDay) {
        const data = await fetchReadings(range.start);
        setFilterReadings(data);
      } else {
        // 取第一頁確認總頁數，再分批取完所有頁（每批 3 頁）
        const first = await fetchPayments(range.start, range.end, undefined, 1, 100);
        const totalPages = first.total_pages || 1;
        let allItems = [...first.items];

        for (let batchStart = 2; batchStart <= totalPages; batchStart += 3) {
          const batch = Array.from(
            { length: Math.min(3, totalPages - batchStart + 1) },
            (_, i) => batchStart + i
          );
          const pages = await Promise.all(
            batch.map(p => fetchPayments(range.start, range.end, undefined, p, 100))
          );
          pages.forEach(p => { allItems = allItems.concat(p.items); });
        }

        setFilterPayments({ ...first, items: allItems });
      }
    } catch (err) {
      console.error('載入篩選資料失敗:', err);
    } finally {
      setFilterLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
    const interval = setInterval(() => loadToday(), 30000);
    return () => clearInterval(interval);
  }, [loadToday]);

  useEffect(() => {
    loadFilterData(dateFilter);
  }, [dateFilter, loadFilterData]);

  // 今日機台狀態 map（cpu_id → last_reading_time）
  const todayStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    (todayReadings?.items || []).forEach(item => map.set(item.cpu_id, item.last_reading_time));
    return map;
  }, [todayReadings]);

  // store_name → store_id 對照（從今日 readings 取得，供多日 payments 過濾用）
  const storeNameToId = useMemo(() => {
    const map = new Map<string, number>();
    (todayReadings?.items || []).forEach(item => map.set(item.store_name, item.store_id));
    return map;
  }, [todayReadings]);

  // 選中場地名稱（多日模式的 store 過濾備用）
  const selectedStoreName = useMemo(() => {
    if (!selectedStoreId) return null;
    return todayReadings?.items.find(i => i.store_id === selectedStoreId)?.store_name ?? null;
  }, [selectedStoreId, todayReadings]);

  // 統一機台顯示資料
  const allMachineItems = useMemo((): MachineViewItem[] => {
    if (dateFilter === 'today') {
      return (todayReadings?.items || []).map(item => ({
        key: item.cpu_id,
        machine_name: item.machine_name,
        store_name: item.store_name,
        store_id: item.store_id,
        total_play_count: item.total_play_count,
        coin_play_count: item.coin_play_count,
        epay_play_count: item.epay_play_count,
        gift_out_count: item.gift_out_count,
        revenue: item.total_play_count * PLAY_PRICE,
        last_reading_time: item.last_reading_time,
      }));
    }

    const range = getDateRange(dateFilter);

    if (range.isSingleDay && filterReadings) {
      return (filterReadings.items || []).map(item => ({
        key: item.cpu_id,
        machine_name: item.machine_name,
        store_name: item.store_name,
        store_id: item.store_id,
        total_play_count: item.total_play_count,
        coin_play_count: item.coin_play_count,
        epay_play_count: item.epay_play_count,
        gift_out_count: item.gift_out_count,
        revenue: item.total_play_count * PLAY_PRICE,
        last_reading_time: todayStatusMap.get(item.cpu_id) ?? null,
      }));
    }

    if (!range.isSingleDay && filterPayments) {
      const machineMap = new Map<string, MachineViewItem>();
      (filterPayments.items || []).forEach(item => {
        const key = item.happy_cpu_id || item.machine_id;
        if (machineMap.has(key)) {
          const m = machineMap.get(key)!;
          m.total_play_count += item.transaction_count;
          m.coin_play_count += item.transaction_count - item.card_play_count;
          m.epay_play_count += item.card_play_count;
          m.gift_out_count += item.prize_count;
          m.revenue += item.total_revenue;
        } else {
          machineMap.set(key, {
            key,
            machine_name: item.machine_display_name || item.machine_name,
            store_name: item.store_name,
            store_id: storeNameToId.get(item.store_name) ?? 0,
            total_play_count: item.transaction_count,
            coin_play_count: item.transaction_count - item.card_play_count,
            epay_play_count: item.card_play_count,
            gift_out_count: item.prize_count,
            revenue: item.total_revenue,
            last_reading_time: todayStatusMap.get(key) ?? null,
          });
        }
      });
      return Array.from(machineMap.values());
    }

    return [];
  }, [dateFilter, todayReadings, filterReadings, filterPayments, todayStatusMap, storeNameToId]);

  // 場地過濾
  const storeMachines = selectedStoreId
    ? allMachineItems.filter(m =>
        m.store_id === selectedStoreId ||
        (m.store_id === 0 && m.store_name === selectedStoreName)
      )
    : allMachineItems;

  // 排序
  const sortedMachines = storeMachines.slice().sort((a, b) => {
    const sc = a.store_name.localeCompare(b.store_name, 'zh-TW');
    if (sc !== 0) return sc;
    return a.machine_name.localeCompare(b.machine_name, undefined, { numeric: true });
  });

  const onlineCount = sortedMachines.filter(m => getMachineStatus(m.last_reading_time) === MachineStatus.ONLINE).length;
  const offlineCount = sortedMachines.filter(m => getMachineStatus(m.last_reading_time) === MachineStatus.OFFLINE).length;

  const filteredMachines = sortedMachines.filter(m => {
    if (statusFilter === 'online') return getMachineStatus(m.last_reading_time) === MachineStatus.ONLINE;
    if (statusFilter === 'offline') return getMachineStatus(m.last_reading_time) === MachineStatus.OFFLINE;
    return true;
  });

  const isLoading = loading || filterLoading;

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <StoreSelector
            selectedStoreId={selectedStoreId}
            onStoreChange={setSelectedStoreId}
          />
          <h1 className="text-xl font-bold tracking-tight text-white flex-1 text-center">機台監控</h1>
          <button
            onClick={() => { loadToday(true); loadFilterData(dateFilter); }}
            className="text-slate-400 hover:text-primary transition-colors w-10 flex justify-end"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        {/* 日期快速篩選 */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {DATE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
                dateFilter === key ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 機台狀態篩選 */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              statusFilter === 'all' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'
            }`}
          >
            全部 {sortedMachines.length}
          </button>
          <button
            onClick={() => setStatusFilter('online')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              statusFilter === 'online' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'
            }`}
          >
            上線 <span className="text-neon-green ml-0.5">{onlineCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              statusFilter === 'offline' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'
            }`}
          >
            斷線 <span className="text-slate-400 ml-0.5">{offlineCount}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 space-y-2.5">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        )}

        {error && (
          <div className="bg-bright-red/10 border border-bright-red/30 rounded-xl p-4 text-bright-red text-center">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredMachines.map((machine, idx) => {
          const status = getMachineStatus(machine.last_reading_time);
          const avgPayout = machine.gift_out_count > 0
            ? Math.round(machine.revenue / machine.gift_out_count)
            : 0;

          return (
            <div
              key={`${machine.key}-${idx}`}
              onClick={() => setSelectedMachine(machine)}
              className="bg-card-dark rounded-xl p-4 shadow-lg border border-white/10 relative overflow-hidden transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-black text-lg tracking-tighter leading-none">
                      {machine.machine_name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5">{machine.store_name}</span>

                  <div className="flex items-center gap-1.5 mt-1">
                    {status === MachineStatus.ONLINE && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse"></div>
                        <span className="text-xs text-neon-green font-bold tracking-wider uppercase">上線</span>
                      </div>
                    )}
                    {status === MachineStatus.OFFLINE && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bright-red/10 border border-bright-red/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-bright-red"></div>
                        <span className="text-xs text-bright-red font-bold tracking-wider uppercase">斷線</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  {machine.last_reading_time ? `更新 ${formatTime(machine.last_reading_time)}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">總遊玩</span>
                  <span className="text-base font-bold tracking-tight text-white">
                    {machine.total_play_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">投幣</span>
                  <span className="text-base font-bold tracking-tight text-white">
                    {machine.coin_play_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">電支</span>
                  <span className="text-base font-bold tracking-tight text-primary">
                    {machine.epay_play_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">營業額</span>
                  <span className="text-base font-bold tracking-tight text-neon-green">
                    ${machine.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">出獎數</span>
                  <span className="text-base font-bold tracking-tight text-white">
                    {machine.gift_out_count}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">均出</span>
                  <span className={`text-base font-bold tracking-tight ${
                    avgPayout > 800 ? 'text-bright-red font-black' : 'text-white'
                  }`}>
                    {avgPayout > 0 ? avgPayout.toLocaleString() : '--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-6"></div>
      </main>

      {/* 機台詳情 Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedMachine(null)}></div>
          <div className="relative w-full max-w-md bg-surface-dark rounded-t-2xl shadow-2xl border-t border-white/10 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{selectedMachine.machine_name}</h2>
              <button onClick={() => setSelectedMachine(null)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">門市</span>
                <span className="text-white">{selectedMachine.store_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">機台 ID</span>
                <span className="text-white font-mono text-xs">{selectedMachine.key}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">總遊玩</span>
                <span className="text-white">{selectedMachine.total_play_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">營業額</span>
                <span className="text-neon-green">${selectedMachine.revenue.toLocaleString()}</span>
              </div>
            </div>

            {/* 控制按鈕 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (window.confirm(`確定要重啟「${selectedMachine.machine_name}」嗎？`)) {
                    setControlLoading(true);
                    // TODO: 串接 API
                    // restartMachine(parseInt(selectedMachine.key)).then(() => alert('已發送重啟指令')).catch(() => alert('發送失敗')).finally(() => setControlLoading(false));
                    setTimeout(() => { setControlLoading(false); alert('已發送重啟指令（暫時 mock）'); }, 1000);
                  }
                }}
                disabled={controlLoading}
                className="flex items-center justify-center gap-2 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">restart_alt</span>
                重啟
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`確定要對「${selectedMachine.machine_name}」發送遠端投幣指令嗎？`)) {
                    setControlLoading(true);
                    // TODO: 串接 API
                    // startMachine(parseInt(selectedMachine.key)).then(() => alert('已發送投幣指令')).catch(() => alert('發送失敗')).finally(() => setControlLoading(false));
                    setTimeout(() => { setControlLoading(false); alert('已發送投幣指令（暫時 mock）'); }, 1000);
                  }
                }}
                disabled={controlLoading}
                className="flex items-center justify-center gap-2 py-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">savings</span>
                遠端投幣
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
