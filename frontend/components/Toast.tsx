import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-primary',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className={`${bgColor} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[200px]`}>
        <span className="text-lg font-bold">{icon}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// Toast context for global usage
interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

let showToastFn: ToastContextType['showToast'] | null = null;

export const showToast = (message: string, type: ToastType = 'success') => {
  if (showToastFn) {
    showToastFn(message, type);
  }
};

export const ToastContainer: React.FC<{ setter: typeof showToastFn }> = ({ setter }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    setter((message: string, type: ToastType = 'success') => {
      setToast({ message, type });
    });
  }, [setter]);

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
};
