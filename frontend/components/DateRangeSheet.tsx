import React, { useState, useEffect } from 'react';

interface DateRangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

export const DateRangeSheet: React.FC<DateRangeSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialStart,
  initialEnd,
}) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStart(initialStart || '');
      setEnd(initialEnd || '');
    }
  }, [isOpen, initialStart, initialEnd]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (start && end) {
      onConfirm(start, end);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Sheet Content */}
      <div className="relative w-full max-w-[430px] bg-surface-dark rounded-t-2xl shadow-2xl border-t border-white/10 flex flex-col pb-10 animate-slide-up font-display">
        {/* Handle */}
        <div className="flex h-1.5 w-full items-center justify-center py-4 z-10">
          <div className="h-1.5 w-12 rounded-full bg-white/20"></div>
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-6 z-10">
          <h1 className="text-white text-xl font-bold text-center">自訂日期範圍</h1>
          <p className="text-white/50 text-sm text-center mt-1">選擇要查看的日期區間</p>
        </div>

        {/* Content */}
        <div className="px-6 space-y-5 z-10">
          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-medium">開始日期</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all [color-scheme:dark]"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-medium">結束日期</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all [color-scheme:dark]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleConfirm}
              disabled={!start || !end}
              className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              確認篩選
              <span className="material-symbols-outlined text-sm">filter_alt</span>
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
