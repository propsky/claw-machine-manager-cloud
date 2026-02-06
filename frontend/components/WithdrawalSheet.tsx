import React from 'react';

interface WithdrawalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
}

export const WithdrawalSheet: React.FC<WithdrawalSheetProps> = ({ isOpen, onClose, amount }) => {
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

          {/* Info Cards */}
          <div className="space-y-3">
            {/* Bank Account */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-primary bg-primary/10 flex items-center justify-center rounded-lg shrink-0 size-12">
                <span className="material-symbols-outlined">account_balance</span>
              </div>
              <div className="flex flex-col flex-1">
                <p className="text-white text-base font-semibold">國泰世華 (0570)</p>
                <p className="text-white/50 text-xs uppercase tracking-wider">提領帳戶</p>
              </div>
              <span className="material-symbols-outlined text-white/30">chevron_right</span>
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
          </div>

          {/* Warnings/Notes */}
          <p className="text-white/40 text-[11px] leading-relaxed px-1">
             點擊「確認提領」即代表您同意本平台的服務條款。手續費 $15 將從提領金額中扣除。
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button 
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              確認提領
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button 
                onClick={onClose}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-4 rounded-xl transition-colors active:scale-95"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};