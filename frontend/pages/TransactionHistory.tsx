import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchActivity } from '../services/api';
import type { ActivityItem } from '../types';

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 篩選狀態
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // 分頁狀態
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivity(
        undefined, // storeId
        startDate || undefined,
        endDate || undefined,
        page,
        pageSize
      );
      setItems(data.items || []);
      setTotalCount(data.total_count || 0);
      setTotalPages(data.total_pages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 清除篩選
  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // 是否有篩選
  const hasFilter = startDate || endDate;

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

      {/* Date Filter */}
      <div className="px-4 py-3 bg-surface-dark border-b border-white/5">
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white text-sm border-none outline-none"
          />
          <span className="text-white/40">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white text-sm border-none outline-none"
          />
          {hasFilter && (
            <button
              onClick={clearFilter}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-2">
        <p className="text-xs text-white/40">
          {hasFilter 
            ? `${startDate || '開始'} ~ ${endDate || '結束'}`
            : '全部'
          } 
          {' '}・共 {totalCount} 筆
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-2 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <span className="material-symbols-outlined text-5xl mb-3">receipt_long</span>
            <p className="text-sm">沒有找到帳務紀錄</p>
          </div>
        ) : (
          <div className="bg-card-dark rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {items.map((item, idx) => {
              const isIncome = item.type === 'income';
              return (
                <div key={idx} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <span className={`material-symbols-outlined text-[20px] ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {isIncome ? 'add_circle' : 'logout'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.description}</p>
                      <p className="text-[10px] text-white/40">{item.date} {!isIncome && '・已申請'}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                    {isIncome ? '+' : '-'}${item.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm disabled:opacity-30"
            >
              上一頁
            </button>
            <span className="text-sm text-white/60">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm disabled:opacity-30"
            >
              下一頁
            </button>
          </div>
        )}

        <div className="h-10"></div>
      </main>
    </div>
  );
};
