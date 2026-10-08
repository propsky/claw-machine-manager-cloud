import React from 'react';

interface ConfirmDialogProps {
  message: string;
  confirmText?: string;
  /** 不傳則只顯示單一確定按鈕（當作提示訊息使用） */
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * App 內建確認／提示對話框
 * 取代 window.confirm / alert，避免瀏覽器在標題列顯示網域英文
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  confirmText = '確定',
  cancelText,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
    <div className="absolute inset-0 bg-black/60" onClick={onCancel ?? onConfirm} />
    <div className="relative w-full max-w-[340px] bg-white dark:bg-card-dark rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
      <p className="text-base font-medium text-slate-900 dark:text-white text-center leading-relaxed whitespace-pre-line mb-6">
        {message}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onConfirm}
          className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3.5 rounded-xl transition-colors active:scale-95"
        >
          {confirmText}
        </button>
        {cancelText && onCancel && (
          <button
            onClick={onCancel}
            className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-medium py-3.5 rounded-xl transition-colors active:scale-95"
          >
            {cancelText}
          </button>
        )}
      </div>
    </div>
  </div>
);
