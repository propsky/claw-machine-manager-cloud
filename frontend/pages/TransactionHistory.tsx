import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchActivity } from '../services/api';
import type { ActivityItem } from '../types';

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // TODO(後端): 待 activity API 支援 start_date / end_date / page / page_size 後，
  // 在此加入日期篩選狀態，並將參數傳入 fetchActivity()。
  // CF Function (functions/api/store-app/activity.js) 也需同步轉發這些參數。
  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchActivity();
      setItems(data.items || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 ios-blur px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => navigate('/finance')}
          className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight">帳務紀錄</h1>
        <div className="size-10"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full">
        <p className="text-xs text-white/30 mb-4 px-1">顯示最近 10 筆帳務紀錄</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <span className="material-symbols-outlined text-5xl mb-3">receipt_long</span>
            <p className="text-sm">目前沒有帳務紀錄</p>
          </div>
        ) : (
          <div className="bg-card-dark rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {items.map((item, idx) => {
              const isIncome = item.type === 'income';
              return (
                <div key={idx} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center ${
                        isIncome ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isIncome ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {isIncome ? 'add_circle' : 'logout'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.description}</p>
                      <p className="text-[10px] text-white/40">{item.date} {!isIncome && '・已申請'}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isIncome ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {isIncome ? '+' : '-'}${item.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="h-10"></div>
      </main>
    </div>
  );
};
