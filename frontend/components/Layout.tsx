import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItemClass = (path: string) => {
    const isActive = location.pathname === path;
    const baseClass = "flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer";
    const activeClass = "text-primary opacity-100";
    const inactiveClass = "text-slate-400 dark:text-zinc-600 opacity-60 hover:opacity-100";
    
    return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
  };

  const getIconStyle = (path: string) => {
     return location.pathname === path ? { fontVariationSettings: "'FILL' 1" } : {};
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto bg-background-light dark:bg-background-dark shadow-2xl font-sans">
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 bg-background-light dark:bg-background-dark">
        {children}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background-light/95 dark:bg-background-dark/95 ios-blur border-t border-slate-200 dark:border-zinc-800 px-6 py-3 pb-8 flex justify-between items-center z-40">
        <div onClick={() => navigate('/')} className={getNavItemClass('/')}>
          <span className="material-symbols-outlined" style={getIconStyle('/')}>home</span>
          <span className="text-[10px] font-bold">總覽</span>
        </div>
        <div onClick={() => navigate('/machines')} className={getNavItemClass('/machines')}>
          <span className="material-symbols-outlined" style={getIconStyle('/machines')}>joystick</span>
          <span className="text-[10px] font-bold">機台</span>
        </div>
        <div onClick={() => navigate('/finance')} className={getNavItemClass('/finance')}>
          <span className="material-symbols-outlined" style={getIconStyle('/finance')}>account_balance_wallet</span>
          <span className="text-[10px] font-bold">財務</span>
        </div>
        <div onClick={() => navigate('/settings')} className={getNavItemClass('/settings')}>
          <span className="material-symbols-outlined" style={getIconStyle('/settings')}>settings</span>
          <span className="text-[10px] font-bold">設定</span>
        </div>
      </div>
    </div>
  );
};