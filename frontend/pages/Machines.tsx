import React, { useState, useEffect } from 'react';
import { MachineStatus, ReadingsResponse, ReadingItem } from '../types';
import { fetchReadings } from '../services/api';

const PLAY_PRICE = 10;

function getTimeDiffMinutes(lastReadingTime: string): number {
  const lastTime = new Date(lastReadingTime);
  const now = new Date();
  return Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60));
}

function getMachineStatus(machine: ReadingItem): MachineStatus {
  const diffMinutes = getTimeDiffMinutes(machine.last_reading_time);
  // API 約 80 分鐘更新一次，設定 2 小時無回應視為離線
  if (diffMinutes > 120) {
    return MachineStatus.OFFLINE;
  }
  return MachineStatus.ONLINE;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

type FilterStatus = 'all' | 'online' | 'offline';

export const Machines: React.FC = () => {
  const [readingsData, setReadingsData] = useState<ReadingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const data = await fetchReadings(getTodayString());
      setReadingsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }

  const allMachines = readingsData?.items || [];

  // 依 store_name + machine_name 排序
  const sortedMachines = allMachines
    .slice()
    .sort((a, b) => {
      const storeCompare = a.store_name.localeCompare(b.store_name, 'zh-TW');
      if (storeCompare !== 0) return storeCompare;
      return a.machine_name.localeCompare(b.machine_name, undefined, { numeric: true });
    });

  const onlineCount = sortedMachines.filter(m => getMachineStatus(m) === MachineStatus.ONLINE).length;
  const offlineCount = sortedMachines.filter(m => getMachineStatus(m) === MachineStatus.OFFLINE).length;

  const filteredMachines = sortedMachines.filter(m => {
    if (filter === 'online') return getMachineStatus(m) === MachineStatus.ONLINE;
    if (filter === 'offline') return getMachineStatus(m) === MachineStatus.OFFLINE;
    return true;
  });

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-primary">analytics</span>
              <h1 className="text-xl font-bold tracking-tight text-white">機台監控清單</h1>
            </div>
          </div>
          <button onClick={loadData} className="text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              filter === 'all' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'
            }`}
          >
            全部 {readingsData?.total_machines || 0}
          </button>
          <button
            onClick={() => setFilter('online')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              filter === 'online' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'
            }`}
          >
            上線 <span className="text-neon-green ml-0.5">{onlineCount}</span>
          </button>
          <button
            onClick={() => setFilter('offline')}
            className={`px-4 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
              filter === 'offline' ? 'bg-primary text-black' : 'bg-white/5 text-slate-300'
            }`}
          >
            斷線 <span className="text-slate-400 ml-0.5">{offlineCount}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 space-y-2.5">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        )}

        {error && (
          <div className="bg-bright-red/10 border border-bright-red/30 rounded-xl p-4 text-bright-red text-center">
            {error}
          </div>
        )}

        {!loading && !error && filteredMachines.map((machine, idx) => {
          const status = getMachineStatus(machine);
          const revenue = machine.total_play_count * PLAY_PRICE;
          const avgPayout = machine.gift_out_count > 0
            ? Math.round(revenue / machine.gift_out_count)
            : 0;

          return (
            <div
              key={`${machine.cpu_id}-${idx}`}
              className="bg-card-dark rounded-xl p-4 shadow-lg border border-white/10 relative overflow-hidden transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-black text-lg tracking-tighter leading-none">
                      {machine.machine_name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5">{machine.store_name}</span>

                  <div className="flex items-center gap-1.5 mt-1">
                    {status === MachineStatus.ONLINE && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse"></div>
                        <span className="text-[10px] text-neon-green font-bold tracking-wider uppercase">上線</span>
                      </div>
                    )}
                    {status === MachineStatus.OFFLINE && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bright-red/10 border border-bright-red/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-bright-red"></div>
                        <span className="text-[10px] text-bright-red font-bold tracking-wider uppercase">斷線</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-600 font-medium">
                  更新 {formatTime(machine.last_reading_time)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">總遊玩</span>
                  <span className="text-[15px] font-bold tracking-tight text-white">
                    {machine.total_play_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">投幣</span>
                  <span className="text-[15px] font-bold tracking-tight text-white">
                    {machine.coin_play_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">電支</span>
                  <span className="text-[15px] font-bold tracking-tight text-primary">
                    {machine.epay_play_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">營業額</span>
                  <span className="text-[15px] font-bold tracking-tight text-neon-green">
                    ${revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">出獎數</span>
                  <span className="text-[15px] font-bold tracking-tight text-white">
                    {machine.gift_out_count}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">均出</span>
                  <span className={`text-[15px] font-bold tracking-tight
                    ${avgPayout > 800 ? 'text-bright-red font-black' : 'text-white'}`}>
                    {avgPayout > 0 ? avgPayout.toLocaleString() : '--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-6"></div>
      </main>
    </div>
  );
};
