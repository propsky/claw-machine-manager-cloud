import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateRangeSheet } from '../components/DateRangeSheet';
import { fetchActivity } from '../services/api';
import type { ActivityItem } from '../types';

type FilterType = 'all' | 'custom';

function formatDateRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  const filteredItems = selectedFilter === 'custom' && customRange
    ? items.filter(item => {
        const d = item.date;
        return d >= customRange.start && d <= customRange.end;
      })
    : items;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'custom', label: '自訂範圍' },
  ];

  const handleCustomConfirm = (start: string, end: string) => {
    setCustomRange({ start, end });
    setSelectedFilter('custom');
    setIsDateSheetOpen(false);
  };

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

      {/* Sticky Date Filter */}
      <div className="sticky top-[52px] z-20 bg-background-light/80 dark:bg-background-dark/80 ios-blur px-4 py-3 border-b border-slate-200 dark:border-white/10">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar max-w-md mx-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                if (f.key === 'custom') {
                  setIsDateSheetOpen(true);
                } else {
                  setSelectedFilter(f.key);
                }
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                selectedFilter === f.key
                  ? 'bg-primary text-background-dark'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              {f.key === 'custom' && (
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full">
        {selectedFilter === 'custom' && customRange && (
          <p className="text-xs text-white/40 mb-4 px-1">
            顯示 {formatDateRange(customRange.start, customRange.end)} 的紀錄
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <span className="material-symbols-outlined text-5xl mb-3">receipt_long</span>
            <p className="text-sm">此期間沒有交易紀錄</p>
          </div>
        ) : (
          <div className="bg-card-dark rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {filteredItems.map((item, idx) => {
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
                      <p className="text-[10px] text-white/40">{item.date}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isIncome ? 'text-green-500' : 'text-white'
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

      <DateRangeSheet
        isOpen={isDateSheetOpen}
        onClose={() => setIsDateSheetOpen(false)}
        onConfirm={handleCustomConfirm}
        initialStart={customRange?.start}
        initialEnd={customRange?.end}
      />
    </div>
  );
};
