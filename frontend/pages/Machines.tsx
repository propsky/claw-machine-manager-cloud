import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MachineStatus, ReadingsResponse, PaymentsResponse } from '../types';
import { fetchReadings, fetchPayments, restartMachine, startMachine } from '../services/api';
import { StoreSelector } from '../components/StoreSelector';
import { DateRangeSheet } from '../components/DateRangeSheet';
import { getMachineTypeInfo, MACHINE_TYPE_INFO, MachineType } from '../config/machineTypeMap';
const MACHINES_CACHE_TTL = 5 * 60 * 1000;
let todayCache: { data: ReadingsResponse; cachedAt: number } | null = null;

type DateFilter = 'today' | 'yesterday' | 'seven_days' | 'week' | 'month' | 'realtime' | 'custom';
type FilterStatus = 'all' | 'online' | 'offline';
type SortBy = 'default' | 'revenue' | 'plays' | 'gifts';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'seven_days', label: '7天內' },
  { key: 'week', label: '本週' },
  { key: 'month', label: '本月' },
  { key: 'realtime', label: '即時抄表' },
  { key: 'custom', label: '自訂' },
];

const SORT_OPTIONS: { key: SortBy; label: string; icon: string }[] = [
  { key: 'default', label: '預設（場地 + 名稱）', icon: 'sort_by_alpha' },
  { key: 'revenue', label: '依營業額（高到低）', icon: 'attach_money' },
  { key: 'plays', label: '依遊玩次數（高到低）', icon: 'sports_esports' },
  { key: 'gifts', label: '依出獎數（高到低）', icon: 'card_giftcard' },
];

interface MachineViewItem {
  key: string;
  cpu_id: string;
  machine_name: string;
  store_name: string;
  store_id: number;
  total_play_count: number;
  coin_amount: number;
  card_amount: number;
  gift_out_count: number;
  revenue: number;
  last_reading_time: string | null;
  machineType: MachineType;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayString(): string {
  return formatDate(new Date());
}

function getDateRange(filter: Exclude<DateFilter, 'realtime' | 'custom'>): { start: string; end: string } {
  const now = new Date();
  const today = formatDate(now);
  switch (filter) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      const ys = formatDate(y);
      return { start: ys, end: ys };
    }
    case 'seven_days': {
      const d = new Date(now); d.setDate(now.getDate() - 6);
      return { start: formatDate(d), end: today };
    }
    case 'week': {
      const monday = new Date(now);
      const offset = (now.getDay() === 0 ? 6 : now.getDay() - 1);
      monday.setDate(now.getDate() - offset);
      return { start: formatDate(monday), end: today };
    }
    case 'month':
      return { start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), end: today };
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

function formatActionTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// localStorage helpers
const PINNED_KEY = 'pinned_machines';
function getPinnedIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PINNED_KEY) || '[]')); }
  catch { return new Set(); }
}
function togglePinnedStorage(cpuId: string): Set<string> {
  const ids = getPinnedIds();
  if (ids.has(cpuId)) ids.delete(cpuId); else ids.add(cpuId);
  localStorage.setItem(PINNED_KEY, JSON.stringify([...ids]));
  return ids;
}
const noteKey = (cpuId: string) => `machine_note_${cpuId}`;
const actionKey = (cpuId: string, action: 'restocked' | 'checked') => `machine_${action}_${cpuId}`;

export const Machines: React.FC = () => {
  const [todayReadings, setTodayReadings] = useState<ReadingsResponse | null>(null);
  const [filterPayments, setFilterPayments] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<MachineType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  // 自訂日期
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // 排序
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [showSortSheet, setShowSortSheet] = useState(false);

  // 釘選
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => getPinnedIds());

  // 機台控制
  const [selectedMachine, setSelectedMachine] = useState<MachineViewItem | null>(null);
  const [controlLoading, setControlLoading] = useState(false);

  // Modal 備註 + 補貨/檢查紀錄
  const [modalNote, setModalNote] = useState('');
  const [restockedTime, setRestockedTime] = useState<string | null>(null);
  const [checkedTime, setCheckedTime] = useState<string | null>(null);

  // 今日資料（機台狀態用），5 分鐘 cache
  const loadToday = useCallback(async (force = false) => {
    if (!force && todayCache && Date.now() - todayCache.cachedAt < MACHINES_CACHE_TTL) {
      setTodayReadings(todayCache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
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

  // 篩選期間資料（payments API 負責所有統計篩選，realtime 直接用 todayReadings）
  const loadFilterData = useCallback(async (filter: DateFilter, customRange?: { start: string; end: string }) => {
    if (filter === 'realtime') return;
    if (filter === 'custom' && !customRange) return;
    const range = filter === 'custom' ? customRange! : getDateRange(filter as Exclude<DateFilter, 'realtime' | 'custom'>);
    setFilterLoading(true);
    setFilterPayments(null);
    try {
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
    if (!selectedMachine) return;
    setModalNote(localStorage.getItem(noteKey(selectedMachine.cpu_id)) || '');
    setRestockedTime(localStorage.getItem(actionKey(selectedMachine.cpu_id, 'restocked')));
    setCheckedTime(localStorage.getItem(actionKey(selectedMachine.cpu_id, 'checked')));
  }, [selectedMachine]);


  useEffect(() => {
    if (dateFilter === 'realtime') {
      loadToday(true);
    } else if (dateFilter === 'custom') {
      if (customStart && customEnd) {
        loadFilterData('custom', { start: customStart, end: customEnd });
      }
    } else {
      loadFilterData(dateFilter);
    }
  }, [dateFilter, loadFilterData, loadToday, customStart, customEnd]);

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
    // 即時抄表：唯一使用 readings 原始 counter 值的情境
    if (dateFilter === 'realtime') {
      return (todayReadings?.items || []).map(item => {
        const typeInfo = getMachineTypeInfo(item.cpu_id);
        const coinPrice = typeInfo.coinPrice ?? 0;
        return {
          key: item.cpu_id,
          cpu_id: item.cpu_id,
          machine_name: item.machine_name,
          store_name: item.store_name,
          store_id: item.store_id,
          total_play_count: item.total_play_count,
          coin_amount: item.coin_play_count * coinPrice,
          card_amount: item.epay_play_count * coinPrice,
          gift_out_count: item.gift_out_count,
          revenue: item.total_play_count * coinPrice,
          last_reading_time: item.last_reading_time,
          machineType: typeInfo.type,
        };
      });
    }

    if (!filterPayments) return [];

    const machineMap = new Map<string, MachineViewItem>();
    (filterPayments.items || []).forEach(item => {
      const key = item.happy_cpu_id || item.machine_id;
      const typeInfo = getMachineTypeInfo(item.happy_cpu_id);
      const coinPlayCount = typeInfo.coinPrice
        ? Math.round(item.coin_amount / typeInfo.coinPrice)
        : (item.transaction_count || 0);
      if (machineMap.has(key)) {
        const m = machineMap.get(key)!;
        m.total_play_count += coinPlayCount + item.card_play_count;
        m.coin_amount += item.coin_amount;
        m.card_amount += item.card_amount;
        m.gift_out_count += item.prize_count;
        m.revenue += item.total_revenue;
      } else {
        machineMap.set(key, {
          key,
          cpu_id: item.happy_cpu_id,
          machine_name: item.machine_display_name || item.machine_name,
          store_name: item.store_name,
          store_id: storeNameToId.get(item.store_name) ?? 0,
          total_play_count: coinPlayCount + item.card_play_count,
          coin_amount: item.coin_amount,
          card_amount: item.card_amount,
          gift_out_count: item.prize_count,
          revenue: item.total_revenue,
          last_reading_time: todayStatusMap.get(key) ?? null,
          machineType: typeInfo.type,
        });
      }
    });
    return Array.from(machineMap.values());
  }, [dateFilter, todayReadings, filterPayments, todayStatusMap, storeNameToId]);

  // 場地過濾
  const storeMachines = selectedStoreId
    ? allMachineItems.filter(m =>
        m.store_id === selectedStoreId ||
        (m.store_id === 0 && m.store_name === selectedStoreName)
      )
    : allMachineItems;

  // 排序
  const sortedMachines = useMemo(() => {
    const list = storeMachines.slice();
    if (sortBy === 'revenue') return list.sort((a, b) => b.revenue - a.revenue);
    if (sortBy === 'plays') return list.sort((a, b) => b.total_play_count - a.total_play_count);
    if (sortBy === 'gifts') return list.sort((a, b) => b.gift_out_count - a.gift_out_count);
    return list.sort((a, b) => {
      const sc = a.store_name.localeCompare(b.store_name, 'zh-TW');
      if (sc !== 0) return sc;
      return a.machine_name.localeCompare(b.machine_name, undefined, { numeric: true });
    });
  }, [storeMachines, sortBy]);

  const onlineCount = sortedMachines.filter(m => getMachineStatus(m.last_reading_time) === MachineStatus.ONLINE).length;
  const offlineCount = sortedMachines.filter(m => getMachineStatus(m.last_reading_time) === MachineStatus.OFFLINE).length;

  // 目前資料集中實際出現的機台類型（決定是否顯示類型篩選列）
  const availableTypes = useMemo((): MachineType[] => {
    const seen = new Set(sortedMachines.map(m => m.machineType));
    return (Object.keys(MACHINE_TYPE_INFO) as MachineType[]).filter(t => seen.has(t));
  }, [sortedMachines]);

  const filteredMachines = sortedMachines.filter(m => {
    if (statusFilter === 'online' && getMachineStatus(m.last_reading_time) !== MachineStatus.ONLINE) return false;
    if (statusFilter === 'offline' && getMachineStatus(m.last_reading_time) !== MachineStatus.OFFLINE) return false;
    if (typeFilter !== 'all' && m.machineType !== typeFilter) return false;
    return true;
  });

  const isLoading = loading || filterLoading;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <StoreSelector
            selectedStoreId={selectedStoreId}
            onStoreChange={setSelectedStoreId}
          />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex-1 text-center">機台監控</h1>
          <div className="flex items-center gap-1 w-20 justify-end">
            <button
              onClick={() => setShowSortSheet(true)}
              className={`transition-colors ${sortBy !== 'default' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">sort</span>
            </button>
            <button
              onClick={() => { loadToday(true); if (dateFilter === 'custom' && customStart && customEnd) loadFilterData('custom', { start: customStart, end: customEnd }); else loadFilterData(dateFilter); }}
              className="text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        {/* 日期快速篩選 */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {DATE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                if (key === 'custom') {
                  setShowDateSheet(true);
                } else {
                  setDateFilter(key);
                }
              }}
              className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
                dateFilter === key ? 'bg-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
              }`}
            >
              {key === 'custom' && customStart && customEnd && dateFilter === 'custom'
                ? `${customStart.slice(5)} ～ ${customEnd.slice(5)}`
                : label}
            </button>
          ))}
        </div>

        {/* 機台狀態篩選 */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              statusFilter === 'all' ? 'bg-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
            }`}
          >
            全部 {sortedMachines.length}
          </button>
          <button
            onClick={() => setStatusFilter('online')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              statusFilter === 'online' ? 'bg-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
            }`}
          >
            上線 <span className="text-green-600 dark:text-neon-green ml-0.5">{onlineCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              statusFilter === 'offline' ? 'bg-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
            }`}
          >
            斷線 <span className="text-slate-400 ml-0.5">{offlineCount}</span>
          </button>
        </div>

        {/* 機台類型篩選（只有多種類型時才顯示） */}
        {availableTypes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
                typeFilter === 'all' ? 'bg-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
              }`}
            >
              全類型
            </button>
            {availableTypes.map(type => {
              const info = MACHINE_TYPE_INFO[type];
              const count = sortedMachines.filter(m => m.machineType === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
                    typeFilter === type ? 'bg-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {info.icon} {info.name} {count}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <main className="flex-1 p-3 space-y-2.5">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-bright-red/10 border border-red-200 dark:border-bright-red/30 rounded-xl p-4 text-red-600 dark:text-bright-red text-center">
            {error}
          </div>
        )}

        {!isLoading && !error && (() => {
          const pinnedList = filteredMachines.filter(m => pinnedIds.has(m.cpu_id));
          const unpinnedList = filteredMachines.filter(m => !pinnedIds.has(m.cpu_id));
          const displayList: { machine: typeof filteredMachines[0]; sectionHeader?: string }[] = [
            ...pinnedList.map((m, i) => ({ machine: m, sectionHeader: i === 0 ? '已釘選' : undefined })),
            ...unpinnedList.map((m, i) => ({ machine: m, sectionHeader: i === 0 && pinnedList.length > 0 ? '全部機台' : undefined })),
          ];

          return displayList.map(({ machine, sectionHeader }, idx) => {
          const status = getMachineStatus(machine.last_reading_time);
          const typeInfo = MACHINE_TYPE_INFO[machine.machineType];
          const hasGiftConcept = ['claw', 'gacha', 'whack', 'rocking'].includes(machine.machineType);
          const avgPayout = hasGiftConcept && machine.gift_out_count > 0
            ? Math.round(machine.revenue / machine.gift_out_count)
            : 0;
          const isPinned = pinnedIds.has(machine.cpu_id);

          return (
            <React.Fragment key={`${machine.key}-${idx}`}>
              {sectionHeader && (
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 px-1 pt-1">{sectionHeader}</p>
              )}
            <div
              onClick={() => setSelectedMachine(machine)}
              className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm dark:shadow-lg border border-slate-200 dark:border-white/10 relative overflow-hidden transition-all cursor-pointer active:scale-[0.98]"
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
                    {/* 機台類型 badge */}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      {typeInfo.icon} {typeInfo.name}
                    </span>
                    {status === MachineStatus.ONLINE && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-neon-green/10 border border-green-200 dark:border-neon-green/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-neon-green animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-neon-green font-bold tracking-wider uppercase">上線</span>
                      </div>
                    )}
                    {status === MachineStatus.OFFLINE && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-bright-red/10 border border-red-200 dark:border-bright-red/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-bright-red"></div>
                        <span className="text-xs text-red-600 dark:text-bright-red font-bold tracking-wider uppercase">斷線</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
                    {machine.last_reading_time ? `更新 ${formatTime(machine.last_reading_time)}` : ''}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPinnedIds(togglePinnedStorage(machine.cpu_id)); }}
                    className="transition-colors"
                  >
                    <span className={`material-symbols-outlined text-xl leading-none ${isPinned ? 'text-primary' : 'text-slate-300 dark:text-zinc-600'}`}>
                      {isPinned ? 'star' : 'star_border'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">總遊玩</span>
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    {machine.total_play_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">投幣</span>
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    ${machine.coin_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">電支</span>
                  <span className="text-base font-bold tracking-tight text-primary">
                    ${machine.card_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">營業額</span>
                  <span className="text-base font-bold tracking-tight text-green-600 dark:text-neon-green">
                    ${machine.revenue.toLocaleString()}
                  </span>
                </div>
                {hasGiftConcept && (
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium mb-0.5">出獎數</span>
                      <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                        {machine.gift_out_count}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium mb-0.5">均出</span>
                      <span className={`text-base font-bold tracking-tight ${
                        avgPayout > 800 ? 'text-red-600 dark:text-bright-red font-black' : 'text-slate-900 dark:text-white'
                      }`}>
                        {avgPayout > 0 ? avgPayout.toLocaleString() : '--'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            </React.Fragment>
          );
          });
        })()}
        <div className="h-6"></div>
      </main>

      {/* 自訂日期 Sheet */}
      <DateRangeSheet
        isOpen={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        onConfirm={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
          setShowDateSheet(false);
          setDateFilter('custom');
        }}
        initialStart={customStart}
        initialEnd={customEnd}
      />

      {/* 排序 Sheet */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSortSheet(false)}></div>
          <div className="relative w-full max-w-[430px] bg-white dark:bg-surface-dark rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-white/10 pb-10 animate-slide-up">
            <div className="flex h-1.5 w-full items-center justify-center py-4">
              <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/20"></div>
            </div>
            <h2 className="text-center text-lg font-bold text-slate-900 dark:text-white pb-4">排序方式</h2>
            <div className="px-4 space-y-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setSortBy(opt.key); setShowSortSheet(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                    sortBy === opt.key
                      ? 'bg-primary/15 text-primary'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{opt.icon}</span>
                  <span className="font-medium text-sm">{opt.label}</span>
                  {sortBy === opt.key && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 機台詳情 Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedMachine(null)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-white/10 p-6 pb-10 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedMachine.machine_name}</h2>
              <button onClick={() => setSelectedMachine(null)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">門市</span>
                <span className="text-slate-900 dark:text-white">{selectedMachine.store_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">機台 ID</span>
                <span className="text-slate-900 dark:text-white font-mono text-xs">{selectedMachine.key}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">總遊玩</span>
                <span className="text-slate-900 dark:text-white">{selectedMachine.total_play_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">營業額</span>
                <span className="text-green-600 dark:text-neon-green">${selectedMachine.revenue.toLocaleString()}</span>
              </div>
            </div>

            {/* 補貨 / 檢查按鈕 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    const t = new Date().toISOString();
                    localStorage.setItem(actionKey(selectedMachine.cpu_id, 'restocked'), t);
                    setRestockedTime(t);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-500 dark:text-blue-400 rounded-xl font-medium text-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                  已補貨
                </button>
                {restockedTime && (
                  <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500">{formatActionTime(restockedTime)}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    const t = new Date().toISOString();
                    localStorage.setItem(actionKey(selectedMachine.cpu_id, 'checked'), t);
                    setCheckedTime(t);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-500 dark:text-purple-400 rounded-xl font-medium text-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  已檢查
                </button>
                {checkedTime && (
                  <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500">{formatActionTime(checkedTime)}</p>
                )}
              </div>
            </div>

            {/* 備註 */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 mb-1.5 block">備註</label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                onBlur={() => {
                  if (modalNote.trim()) {
                    localStorage.setItem(noteKey(selectedMachine.cpu_id), modalNote);
                  } else {
                    localStorage.removeItem(noteKey(selectedMachine.cpu_id));
                  }
                }}
                placeholder="輸入機台備註..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-zinc-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* 控制按鈕 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (window.confirm(`確定要重啟「${selectedMachine.machine_name}」嗎？`)) {
                    setControlLoading(true);
                    restartMachine(selectedMachine.cpu_id)
                      .then(() => {
                        alert('✅ 指令已發送，請稍後查看機台狀態');
                      })
                      .catch((err) => {
                        alert('❌ 發送失敗：' + (err.message || err.detail || '未知錯誤'));
                      })
                      .finally(() => setControlLoading(false));
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
                    startMachine(selectedMachine.cpu_id)
                      .then(() => {
                        alert('✅ 指令已發送，請稍後查看機台狀態');
                      })
                      .catch((err) => {
                        alert('❌ 發送失敗：' + (err.message || err.detail || '未知錯誤'));
                      })
                      .finally(() => setControlLoading(false));
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
