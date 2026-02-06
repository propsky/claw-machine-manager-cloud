import React, { useState, useEffect } from 'react';
import { MachineStatus, ApiMachine, StoreReadingsResponse } from '../types';
import { fetchStoreReadings } from '../services/api';

const STORE_ID = 73;
const PLAY_PRICE = 10;

function getMachineStatus(machine: ApiMachine): MachineStatus {
  const lastTime = new Date(machine.last_reading_time);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60));
  return diffMinutes > 60 ? MachineStatus.OFFLINE : MachineStatus.ONLINE;
}

export const Dashboard: React.FC = () => {
  const [storeData, setStoreData] = useState<StoreReadingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const data = await fetchStoreReadings(STORE_ID);
      setStoreData(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const machines = storeData?.machines || [];
  const totalCoin = machines.reduce((sum, m) => sum + m.coin_play_times, 0);
  const totalEpay = machines.reduce((sum, m) => sum + m.epay_play_times, 0);
  const totalRevenue = (totalCoin + totalEpay) * PLAY_PRICE;
  const onlineCount = machines.filter(m => getMachineStatus(m) === MachineStatus.ONLINE).length;
  const offlineCount = machines.filter(m => getMachineStatus(m) === MachineStatus.OFFLINE).length;

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

      <div className="flex flex-col items-center pt-8 pb-4">
        <p className="text-slate-500 dark:text-zinc-500 text-sm font-bold tracking-wide">今日總營收</p>
        <h1 className="text-primary tracking-tight text-[48px] font-bold leading-tight mt-1">
          {loading ? '--' : `$${totalRevenue.toLocaleString()}`}
        </h1>

        <div className="flex gap-3 mt-6 w-full px-4">
          <div className="flex flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">payments</span>
              <p className="text-slate-500 dark:text-zinc-400 text-xs font-bold">現金支付</p>
            </div>
            <p className="text-xl font-bold dark:text-white">
              {loading ? '--' : `$${(totalCoin * PLAY_PRICE).toLocaleString()}`}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-1 rounded-xl p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">devices</span>
              <p className="text-slate-500 dark:text-zinc-400 text-xs font-bold">數位支付</p>
            </div>
            <p className="text-xl font-bold dark:text-white">
              {loading ? '--' : `$${(totalEpay * PLAY_PRICE).toLocaleString()}`}
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
        <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-slate-200 dark:border-zinc-800 shadow-sm opacity-50">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-zinc-800">
            <span className="material-symbols-outlined text-slate-400">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-slate-400 dark:text-zinc-500 text-base font-bold">可提領金額</p>
            <p className="text-slate-400 dark:text-zinc-600 text-[10px] font-bold">下階段開放</p>
          </div>
        </div>
      </div>

      {/* Health List */}
      <div className="px-4 pb-6">
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
              {loading ? '--' : storeData?.total_machines || 0}
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
    </div>
  );
};
