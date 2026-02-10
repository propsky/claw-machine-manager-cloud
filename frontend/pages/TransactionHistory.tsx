import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateRangeSheet } from '../components/DateRangeSheet';
import type { Transaction } from '../types';

// Mock 交易資料，橫跨三個月
const mockTransactions: Transaction[] = [
  { id: '1', type: 'income', title: '電支日結餘', date: '2026-02-10 23:59', amount: 145 },
  { id: '2', type: 'income', title: '電支日結餘', date: '2026-02-09 23:59', amount: 210 },
  { id: '3', type: 'income', title: '電支日結餘', date: '2026-02-08 23:59', amount: 98 },
  { id: '4', type: 'income', title: '電支日結餘', date: '2026-02-07 23:59', amount: 176 },
  { id: '5', type: 'withdraw', title: '提領至銀行', date: '2026-02-06 10:30', amount: 2000 },
  { id: '6', type: 'income', title: '電支日結餘', date: '2026-02-06 23:59', amount: 320 },
  { id: '7', type: 'income', title: '電支日結餘', date: '2026-02-05 23:59', amount: 185 },
  { id: '8', type: 'income', title: '電支日結餘', date: '2026-02-04 23:59', amount: 260 },
  { id: '9', type: 'income', title: '電支日結餘', date: '2026-02-03 23:59', amount: 142 },
  { id: '10', type: 'income', title: '電支日結餘', date: '2026-02-02 23:59', amount: 195 },
  { id: '11', type: 'income', title: '電支日結餘', date: '2026-02-01 23:59', amount: 230 },
  { id: '12', type: 'income', title: '電支日結餘', date: '2026-01-31 23:59', amount: 120 },
  { id: '13', type: 'withdraw', title: '提領至銀行', date: '2026-01-25 10:15', amount: 1500 },
  { id: '14', type: 'income', title: '電支日結餘', date: '2026-01-25 23:59', amount: 385 },
  { id: '15', type: 'income', title: '電支日結餘', date: '2026-01-24 23:59', amount: 198 },
  { id: '16', type: 'income', title: '電支日結餘', date: '2026-01-23 23:59', amount: 167 },
  { id: '17', type: 'income', title: '電支日結餘', date: '2026-01-20 23:59', amount: 290 },
  { id: '18', type: 'withdraw', title: '提領至銀行', date: '2026-01-15 14:00', amount: 3000 },
  { id: '19', type: 'income', title: '電支日結餘', date: '2026-01-15 23:59', amount: 410 },
  { id: '20', type: 'income', title: '電支日結餘', date: '2026-01-10 23:59', amount: 155 },
  { id: '21', type: 'income', title: '電支日結餘', date: '2026-01-05 23:59', amount: 220 },
  { id: '22', type: 'income', title: '電支日結餘', date: '2026-01-01 23:59', amount: 305 },
  { id: '23', type: 'income', title: '電支日結餘', date: '2025-12-31 23:59', amount: 180 },
  { id: '24', type: 'withdraw', title: '提領至銀行', date: '2025-12-28 09:45', amount: 2500 },
  { id: '25', type: 'income', title: '電支日結餘', date: '2025-12-28 23:59', amount: 275 },
  { id: '26', type: 'income', title: '電支日結餘', date: '2025-12-25 23:59', amount: 340 },
  { id: '27', type: 'income', title: '電支日結餘', date: '2025-12-20 23:59', amount: 198 },
  { id: '28', type: 'income', title: '電支日結餘', date: '2025-12-15 23:59', amount: 265 },
  { id: '29', type: 'withdraw', title: '提領至銀行', date: '2025-12-10 11:20', amount: 1800 },
  { id: '30', type: 'income', title: '電支日結餘', date: '2025-12-05 23:59', amount: 310 },
];

type FilterType = 'current' | 'prev1' | 'prev2' | 'custom';

function getMonthRange(offset: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  const labelYear = start.getFullYear();
  const labelMonth = String(start.getMonth() + 1).padStart(2, '0');
  return { start, end, label: `${labelYear}/${labelMonth}` };
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('current');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

  const currentMonth = useMemo(() => getMonthRange(0), []);
  const prevMonth1 = useMemo(() => getMonthRange(-1), []);
  const prevMonth2 = useMemo(() => getMonthRange(-2), []);

  const dateRange = useMemo(() => {
    switch (selectedFilter) {
      case 'current':
        return { start: currentMonth.start, end: currentMonth.end };
      case 'prev1':
        return { start: prevMonth1.start, end: prevMonth1.end };
      case 'prev2':
        return { start: prevMonth2.start, end: prevMonth2.end };
      case 'custom':
        if (customRange) {
          return {
            start: new Date(customRange.start + 'T00:00:00'),
            end: new Date(customRange.end + 'T23:59:59'),
          };
        }
        return { start: currentMonth.start, end: currentMonth.end };
    }
  }, [selectedFilter, customRange, currentMonth, prevMonth1, prevMonth2]);

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= dateRange.start && tDate <= dateRange.end;
    });
  }, [dateRange]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'current', label: currentMonth.label },
    { key: 'prev1', label: prevMonth1.label },
    { key: 'prev2', label: prevMonth2.label },
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
        {/* Date Range Description */}
        <p className="text-xs text-white/40 mb-4 px-1">
          顯示 {formatDateRange(dateRange.start, dateRange.end)} 的紀錄
        </p>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <span className="material-symbols-outlined text-5xl mb-3">receipt_long</span>
            <p className="text-sm">此期間沒有交易紀錄</p>
          </div>
        ) : (
          <div className="bg-card-dark rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {filteredTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center ${
                      t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        t.type === 'income' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {t.type === 'income' ? 'add_circle' : 'logout'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.title}</p>
                    {t.type === 'income' && t.title === '電支日結餘' && (
                      <p className="text-[10px] text-white/30">（含扣除手續費/日租）</p>
                    )}
                    <p className="text-[10px] text-white/40">
                      {t.date.replace(/-/g, '/').replace(' ', ' • ')}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${
                    t.type === 'income' ? 'text-green-500' : 'text-white'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}.00
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom spacing */}
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
