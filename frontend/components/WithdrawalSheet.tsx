import React, { useState, useEffect } from 'react';
import { FavoriteBankAccount } from '../types';
import { fetchBankAccounts, applyWithdrawal, fetchUserProfile } from '../services/api';

interface WithdrawalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess?: () => void;
}

export const WithdrawalSheet: React.FC<WithdrawalSheetProps> = ({ isOpen, onClose, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<FavoriteBankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<FavoriteBankAccount | null>(null);
  const [success, setSuccess] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // 檢查使用者資料是否完整
      const userProfile = await fetchUserProfile();
      const isComplete = !!(userProfile.real_name && userProfile.bank_account && userProfile.id_card_number);
      setProfileComplete(isComplete);

      if (!isComplete) {
        setError('請先完成個人資料驗證才能提領');
        return;
      }

      // 載入銀行帳戶
      const data = await fetchBankAccounts();
      const defaultAccount = data.accounts.find(a => a.is_default) || data.accounts[0] || null;
      setBankAccounts(data.accounts);
      setSelectedAccount(defaultAccount);
    } catch (err) {
      console.error('載入資料失敗:', err);
      setError('載入資料失敗，請稍後再試');
    }
  };

  const handleSubmit = async () => {
    if (!profileComplete) {
      setError('請先完成個人資料驗證才能提領');
      return;
    }

    if (!selectedAccount) {
      setError('請先設定銀行帳戶');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await applyWithdrawal(amount);
      setSuccess(true);
      onSuccess?.();
      // 2 秒後關閉
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('提領失敗:', err);
      setError(err.message || '提領失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Sheet Content */}
      <div className="relative w-full max-w-[430px] bg-surface-dark rounded-t-2xl shadow-2xl border-t border-white/10 flex flex-col pb-10 animate-slide-up font-display">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        {/* Handle */}
        <div className="flex h-1.5 w-full items-center justify-center py-4 z-10">
          <div className="h-1.5 w-12 rounded-full bg-white/20"></div>
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-6 z-10">
          <h1 className="text-white text-xl font-bold text-center">確認提領申請</h1>
          <p className="text-white/50 text-sm text-center mt-1">請核對您的提領資訊</p>
        </div>

        {/* Content Area */}
        <div className="px-6 space-y-6 z-10">
          {/* Success Message */}
          {success ? (
            <div className="flex flex-col items-center py-8">
              <div className="size-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
              </div>
              <p className="text-white text-lg font-bold">提領申請已提交</p>
              <p className="text-white/50 text-sm mt-1">預計 3 個工作天內完成撥款</p>
            </div>
          ) : (
            <>
              {/* Amount Input Display */}
              <div className="flex flex-col gap-2">
                <p className="text-white/70 text-sm font-medium">提領金額</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">$</span>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white text-2xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                    readOnly 
                    type="text" 
                    value={amount.toLocaleString()}
                  />
                </div>
              </div>

              {/* Bank Account */}
              <div className="flex flex-col gap-2">
                <p className="text-white/70 text-sm font-medium">提領帳戶</p>
                {selectedAccount ? (
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="text-primary bg-primary/10 flex items-center justify-center rounded-lg shrink-0 size-12">
                      <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <p className="text-white text-base font-semibold">{selectedAccount.bank_name}</p>
                      <p className="text-white/50 text-xs">帳號：{selectedAccount.account_number}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-300 text-sm">
                    請先在設定頁面新增銀行帳戶
                  </div>
                )}
              </div>

              {/* Processing Time */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-primary bg-primary/10 flex items-center justify-center rounded-lg shrink-0 size-12">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-white text-base font-semibold">3 個工作天</p>
                  <p className="text-white/50 text-xs uppercase tracking-wider">預計撥款時間</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Warnings/Notes */}
              <p className="text-white/40 text-[11px] leading-relaxed px-1">
                 點擊「確認提領」即代表您同意本平台的服務條款。手續費 $15 將從提領金額中扣除。
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !selectedAccount}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-background-dark font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      處理中...
                    </>
                  ) : (
                    <>
                      確認提領
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={onClose}
                  disabled={loading}
                  className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-medium py-4 rounded-xl transition-colors active:scale-95"
                >
                  取消
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
