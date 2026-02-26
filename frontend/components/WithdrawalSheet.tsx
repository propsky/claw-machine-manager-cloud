import React, { useState, useEffect } from 'react';
import { FavoriteBankAccount } from '../types';
import { fetchBankAccounts, applyWithdrawal, fetchUserProfile } from '../services/api';

interface WithdrawalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess?: () => void;
}

// 手續費：台新、國泰、玉山 = $0，其他 = $15
const NO_FEE_BANKS = ['台新銀行', '國泰世華', '玉山銀行'];

export const WithdrawalSheet: React.FC<WithdrawalSheetProps> = ({ isOpen, onClose, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<FavoriteBankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<FavoriteBankAccount | null>(null);
  const [success, setSuccess] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);
  
  // 提領金額
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadData();
      setError(null);
      setSuccess(false);
      setWithdrawAmount(amount.toString()); // 預設為最大值
    }
  }, [isOpen, amount]);

  const loadData = async () => {
    try {
      // 檢查使用者資料是否完整
      const userProfile = await fetchUserProfile();
      const isComplete = !!(userProfile.real_name && userProfile.phone && userProfile.id_card_number);
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

  // 計算手續費
  const getFee = () => {
    if (!selectedAccount) return 15;
    const isNoFee = NO_FEE_BANKS.some(bank => selectedAccount.bank_name.includes(bank));
    return isNoFee ? 0 : 15;
  };

  const fee = getFee();
  const inputAmount = parseFloat(withdrawAmount) || 0;
  const actualAmount = Math.max(0, inputAmount - fee);

  // 檢查是否可提領
  const canSubmit = inputAmount > 0 && inputAmount <= amount && selectedAccount && inputAmount >= fee;

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (inputAmount > amount) {
        setError('提領金額不可超過可提領餘額');
      } else if (inputAmount < fee && fee > 0) {
        setError(`手續費 $${fee}，請提領 $${fee} 以上`);
      } else {
        setError('請選擇銀行帳戶');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await applyWithdrawal(inputAmount, {
        bank_code: selectedAccount.bank_code,
        bank_name: selectedAccount.bank_name,
        account_number: selectedAccount.account_number,
        account_holder_name: selectedAccount.account_holder_name,
      });
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
        <div className="px-6 pt-2 pb-4 z-10">
          <h1 className="text-white text-xl font-bold text-center">確認提領申請</h1>
          <p className="text-white/50 text-sm text-center mt-1">可提領餘額：${amount.toLocaleString()}</p>
        </div>

        {/* Content Area */}
        <div className="px-6 space-y-4 z-10">
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
              {/* 錯誤訊息 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* 輸入提領金額 */}
              <div className="flex flex-col gap-2">
                <p className="text-white/70 text-sm font-medium">輸入提領金額</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">$</span>
                  <input 
                    type="number"
                    step="1"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(Math.floor(Number(e.target.value)).toString())}
                    max={amount}
                    min={1}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white text-2xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                    最高 ${amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 選擇銀行 */}
              <div className="flex flex-col gap-2">
                <p className="text-white/70 text-sm font-medium">選擇銀行</p>
                <select
                  value={selectedAccount?.id || ''}
                  onChange={e => {
                    const account = bankAccounts.find(a => a.id === parseInt(e.target.value));
                    setSelectedAccount(account || null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '24px'
                  }}
                >
                  {bankAccounts.length === 0 ? (
                    <option value="">請先新增銀行帳戶</option>
                  ) : (
                    bankAccounts.map(account => (
                      <option key={account.id} value={account.id} className="bg-zinc-900">
                        {account.bank_name} ({account.account_number})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 手續費與實際入帳 */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-white/70">
                  <span>手續費</span>
                  <span className={fee === 0 ? 'text-green-400' : ''}>${fee}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                  <span>實際入帳</span>
                  <span className="text-primary">${actualAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* 確認按鈕 */}
              <button 
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-background-dark font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    處理中...
                  </>
                ) : (
                  <>
                    確認提領 {actualAmount > 0 ? `$${actualAmount.toLocaleString()}` : ''} 元
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
