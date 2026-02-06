import React, { useState, useEffect } from 'react';
import { MachineStatus, ApiMachine, StoreReadingsResponse } from '../types';
import { fetchStoreReadings } from '../services/api';

const STORE_ID = 73;
const PLAY_PRICE = 10; // 每次遊玩價格（元）

function getTimeDiffMinutes(lastReadingTime: string): number {
  const lastTime = new Date(lastReadingTime);
  const now = new Date();
  return Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60));
}

function getMachineStatus(machine: ApiMachine): MachineStatus {
  const diffMinutes = getTimeDiffMinutes(machine.last_reading_time);
  if (diffMinutes > 60) {
    return MachineStatus.OFFLINE;
  }
  return MachineStatus.ONLINE;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

export const Machines: React.FC = () => {
  const [storeData, setStoreData] = useState<StoreReadingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // 每 30 秒自動刷新
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const data = await fetchStoreReadings(STORE_ID);
      setStoreData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }

  // 依機台編號排序
  const sortedMachines = storeData?.machines
    .slice()
    .sort((a, b) => a.location_machine_number.localeCompare(b.location_machine_number, undefined, { numeric: true })) || [];

  const onlineCount = sortedMachines.filter(m => getMachineStatus(m) === MachineStatus.ONLINE).length;
  const offlineCount = sortedMachines.filter(m => getMachineStatus(m) === MachineStatus.OFFLINE).length;

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
            {storeData && (
              <span className="text-xs text-slate-500 ml-8">{storeData.store_name}</span>
            )}
          </div>
          <button onClick={loadData} className="text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button className="px-4 py-1 rounded-full bg-primary text-black text-xs font-bold shrink-0">
            全部 {storeData?.total_machines || 0}
          </button>
          <button className="px-4 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-bold shrink-0">
            上線 <span className="text-neon-green ml-0.5">{onlineCount}</span>
          </button>
          <button className="px-4 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-bold shrink-0">
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

        {!loading && !error && sortedMachines.map((machine) => {
          const status = getMachineStatus(machine);
          const displayName = machine.machine_name || machine.reading_machine_name || machine.location_machine_number;
          const displayId = `No.${machine.location_machine_number.padStart(2, '0')}`;
          const revenue = machine.total_play_times * PLAY_PRICE;
          const avgPayout = machine.gift_out_times > 0
            ? Math.round(revenue / machine.gift_out_times)
            : 0;

          return (
            <div
              key={machine.machine_code}
              className={`
                bg-card-dark rounded-xl p-4 shadow-lg border relative overflow-hidden transition-all
                ${status === MachineStatus.ERROR ? 'border-bright-red/30' : 'border-white/10'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-black text-lg tracking-tighter leading-none">
                      {displayId}
                    </span>
                    <span className="text-white font-bold text-lg leading-none">
                      {displayName}
                    </span>
                  </div>

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
                  <span className={`text-[15px] font-bold tracking-tight text-white`}>
                    {machine.total_play_times.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">投幣</span>
                  <span className={`text-[15px] font-bold tracking-tight text-white`}>
                    {machine.coin_play_times.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">電支</span>
                  <span className={`text-[15px] font-bold tracking-tight text-primary`}>
                    {machine.epay_play_times.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">營業額</span>
                  <span className={`text-[15px] font-bold tracking-tight text-neon-green`}>
                    ${revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">出獎數</span>
                  <span className={`text-[15px] font-bold tracking-tight text-white`}>
                    {machine.gift_out_times}
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
        {/* Spacer for scroll */}
        <div className="h-6"></div>
      </main>
    </div>
  );
};
