import React, { useState, useEffect, useMemo } from 'react';
import { WithdrawalSheet } from '../components/WithdrawalSheet';
import { DateRangeSheet } from '../components/DateRangeSheet';
import { useNavigate } from 'react-router-dom';
import { fetchBalance, fetchPayments, fetchActivity, fetchWithdrawalRequests, WithdrawalRequest } from '../services/api';
import type { BalanceResponse, PaymentsResponse, ActivityResponse } from '../types';

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
    startStr: `${year}-${String(month).padStart(2, '0')}-01`,
    endStr: `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
  };
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const Finance: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('current');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [paymentsData, setPaymentsData] = useState<PaymentsResponse | null>(null);
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
            startStr: customRange.start,
            endStr: customRange.end,
          };
        }
        return currentMonth;
      }
    }
  }, [selectedFilter, customRange, currentMonth, prevMonth1, prevMonth2]);

  // 取得日期範圍
  const dateRange = useMemo(() => {
    switch (selectedFilter) {
      case 'current': return { startStr: currentMonth.startStr, endStr: currentMonth.endStr };
      case 'prev1': return { startStr: prevMonth1.startStr, endStr: prevMonth1.endStr };
      case 'prev2': return { startStr: prevMonth2.startStr, endStr: prevMonth2.endStr };
      case 'custom':
        if (customRange) return { startStr: customRange.start, endStr: customRange.end };
        return { startStr: currentMonth.startStr, endStr: currentMonth.endStr };
    }
  }, [selectedFilter, customRange, currentMonth, prevMonth1, prevMonth2]);

  // 載入餘額和帳務紀錄（只載入一次）
  useEffect(() => {
    async function loadInitial() {
      try {
        const [balance, activity, withdrawals] = await Promise.all([
          fetchBalance(),
          fetchActivity(),
          fetchWithdrawalRequests({ page_size: 20 }),
        ]);
        setBalanceData(balance);
        setActivityData(activity);
        setWithdrawalRequests(withdrawals.requests);
      } catch {
        // silent
      }
    }
    loadInitial();
  }, []);

  // 日期範圍變更時重新載入 payments
  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      try {
        const payments = await fetchPayments(dateRange.startStr, dateRange.endStr);
        setPaymentsData(payments);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [dateRange.startStr, dateRange.endStr]);

  // 使用 API 回傳的 summary 彙總資料
  const statement = useMemo(() => {
    const s = paymentsData?.summary;
    if (!s) return { total: 0, rent: 0, fee: 0, income: 0 };
    return {
      total: s.total_card_amount,
      rent: s.total_actual_daily_rent,
      fee: s.total_actual_transaction_fee,
      income: s.total_actual_income,
    };
  }, [paymentsData]);

  const availableBalance = balanceData?.balance?.available_amount ?? 0;
  // 合併每日結算和提領紀錄
  const combinedRecords = useMemo(() => {
    // 只取收入類型的活動（排除提領，避免重複）
    const incomeRecords = activityData?.items
      ?.filter(item => item.type === 'income')
      .map(item => ({
        type: 'income' as const,
        date: item.date,
        amount: item.amount,
        description: item.description,
        status: '',
      })) || [];

    const withdrawalRecords = withdrawalRequests.map(req => ({
      type: 'withdrawal' as const,
      date: req.created_at.split('T')[0],
      amount: parseFloat(req.amount),
      description: '提領申請',
      status: req.status === 'COMPLETED' ? '已撥款' : '已申請',
      requestNo: req.request_no,
    }));

    // 合併並按日期排序（新的在前）
    return [...incomeRecords, ...withdrawalRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [activityData, withdrawalRequests]);

  const recentActivity = combinedRecords;

  // 重新載入餘額和帳務紀錄
  const reloadData = async () => {
    try {
      const [balance, activity, withdrawals] = await Promise.all([
        fetchBalance(),
        fetchActivity(),
        fetchWithdrawalRequests({ page_size: 20 }),
      ]);
      setBalanceData(balance);
      setActivityData(activity);
      setWithdrawalRequests(withdrawals.requests);
    } catch {
      // silent
    }
  };

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
            <span className="text-white/60 text-sm font-medium">可提領餘額</span>
            <h2 className="text-4xl font-bold text-success tracking-tight">
              {balanceData ? `$${availableBalance.toLocaleString()}` : '--'}
            </h2>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-white/40 text-sm">update</span>
              <p className="text-white/40 text-xs">即時查詢</p>
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
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <span className="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
                </div>
              ) : (
                <>
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
                    <span className="text-2xl font-bold text-primary tracking-tight">${statement.income.toLocaleString()}</span>
                  </div>
                </>
              )}
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
        </section>

        {/* Transactions */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">最近帳務紀錄</h3>
            <button onClick={() => navigate('/transactions')} className="text-xs text-primary font-medium">查看全部</button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="bg-card-dark rounded-xl p-6 border border-white/5 text-center text-white/30 text-sm">
              暫無紀錄
            </div>
          ) : (
            <div className="bg-card-dark rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center ${
                      item.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      <span className={`material-symbols-outlined text-[20px] ${
                        item.type === 'income' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {item.type === 'income' ? 'add_circle' : 'logout'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.description}</p>
                      <p className="text-[10px] text-white/40">{item.date} {item.type === 'withdrawal' && item.status && `・${item.status}`}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${
                    item.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <WithdrawalSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} amount={availableBalance} onSuccess={reloadData} />
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
