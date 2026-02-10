import React, { useState, useMemo } from 'react';
import { WithdrawalSheet } from '../components/WithdrawalSheet';
import { DateRangeSheet } from '../components/DateRangeSheet';
import { useNavigate } from 'react-router-dom';

type FilterType = 'current' | 'prev1' | 'prev2' | 'custom';

function getMonthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const year = start.getFullYear();
  const month = start.getMonth() + 1;
  return {
    start,
    end,
    label: `${year}/${String(month).padStart(2, '0')}`,
    title: `${year}年 ${month}月 帳務結算`,
    period: `${String(month).padStart(2, '0')}/01 - ${String(month).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}`,
  };
}

// Mock 各月結算資料
const mockStatements: Record<string, { total: number; rent: number; fee: number }> = {
  current: { total: 5120, rent: 1440, fee: 92 },
  prev1: { total: 4380, rent: 1440, fee: 79 },
  prev2: { total: 3860, rent: 1440, fee: 69 },
};

export const Finance: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('current');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const navigate = useNavigate();

  const currentMonth = useMemo(() => getMonthRange(0), []);
  const prevMonth1 = useMemo(() => getMonthRange(-1), []);
  const prevMonth2 = useMemo(() => getMonthRange(-2), []);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'current', label: currentMonth.label },
    { key: 'prev1', label: prevMonth1.label },
    { key: 'prev2', label: prevMonth2.label },
    { key: 'custom', label: '自訂範圍' },
  ];

  const activeMonthInfo = useMemo(() => {
    switch (selectedFilter) {
      case 'current': return currentMonth;
      case 'prev1': return prevMonth1;
      case 'prev2': return prevMonth2;
      case 'custom': {
        if (customRange) {
          const s = new Date(customRange.start);
          const e = new Date(customRange.end);
          const fmt = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
          return {
            title: '自訂區間 帳務結算',
            period: `${fmt(s)} - ${fmt(e)}`,
          };
        }
        return currentMonth;
      }
    }
  }, [selectedFilter, customRange, currentMonth, prevMonth1, prevMonth2]);

  const statement = selectedFilter === 'custom'
    ? { total: 3200, rent: 960, fee: 58 }
    : mockStatements[selectedFilter];
  const netIncome = statement.total - statement.rent - statement.fee;

  const handleCustomConfirm = (start: string, end: string) => {
    setCustomRange({ start, end });
    setSelectedFilter('custom');
    setIsDateSheetOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
      <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 ios-blur px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight">財務與提領中心</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-md mx-auto w-full">
        {/* Balance Card */}
        <section className="relative overflow-hidden rounded-xl bg-card-dark p-6 shadow-xl border border-white/5">
          <div className="absolute -right-12 -top-12 size-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="flex flex-col gap-1">
            <span className="text-white/60 text-sm font-medium">本月可提領餘額</span>
            <h2 className="text-4xl font-bold text-success tracking-tight">$2,861</h2>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-white/40 text-sm">update</span>
              <p className="text-white/40 text-xs">最後更新：2026-01-31 23:59</p>
            </div>
            <div className="size-8 rounded-full bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">account_balance_wallet</span>
            </div>
          </div>
        </section>

        {/* Statement Card */}
        <section className="space-y-3">
          <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden shadow-lg">
            <div className="px-5 pt-4 pb-3 border-b border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{activeMonthInfo.title}</h3>
                <span className="text-[11px] font-medium text-white/40 tracking-tighter">週期：{activeMonthInfo.period}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
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
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                      selectedFilter === f.key
                        ? 'bg-primary text-background-dark'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                  >
                    {f.key === 'custom' && (
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                    )}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">總刷卡金額</span>
                <span className="font-bold text-white tracking-wide">${statement.total.toLocaleString()}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">減：設備日租費</span>
                  <span className="text-red-400 font-medium">-${statement.rent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">減：金流手續費</span>
                  <span className="text-red-400 font-medium">-${statement.fee.toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="text-sm font-medium text-white/90 pb-0.5">本期實際入帳</span>
                <span className="text-2xl font-bold text-primary tracking-tight">${netIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="space-y-4">
          <button
            onClick={() => setIsSheetOpen(true)}
            className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">payments</span>
            申請提領款項
          </button>

          <div className="flex items-center justify-between bg-card-dark rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/60">account_balance</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">國泰世華 (013)</p>
                <p className="text-xs text-white/40">**** 0570</p>
              </div>
            </div>
            <button className="size-8 rounded-full hover:bg-white/5 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">edit_square</span>
            </button>
          </div>
        </section>

        {/* Transactions */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">最近 5 筆帳務紀錄</h3>
            <button onClick={() => navigate('/transactions')} className="text-xs text-primary font-medium">查看全部</button>
          </div>
          <div className="bg-card-dark rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-[20px]">add_circle</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">每日結算</p>
                  <p className="text-[10px] text-white/40">1月 31, 2026 • 23:59</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-500">+$120.00</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">logout</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">提領至銀行</p>
                  <p className="text-[10px] text-white/40">1月 25, 2026 • 10:15</p>
                </div>
              </div>
              <span className="text-sm font-bold text-white">-$1,500.00</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-[20px]">add_circle</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">每日結算</p>
                  <p className="text-[10px] text-white/40">1月 25, 2026 • 23:59</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-500">+$385.00</span>
            </div>
          </div>
        </section>
      </main>

      <WithdrawalSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} amount={2861} />
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
