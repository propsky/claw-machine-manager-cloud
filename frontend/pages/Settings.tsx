import React from 'react';
import { logout } from '../services/auth';

export const Settings: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
      <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 ios-blur px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <div className="size-10"></div>
        <h1 className="text-lg font-bold tracking-tight">系統設定</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-md mx-auto w-full">
        {/* Account Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 px-1">帳戶</h3>
          <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">個人資料</p>
                  <p className="text-xs text-white/40">管理您的基本資訊</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/20">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/60">account_balance</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">收款銀行帳戶</p>
                  <p className="text-xs text-white/40">國泰世華 (013) **** 0570</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/20">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 px-1">偏好設定</h3>
          <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/60">notifications</span>
                </div>
                <div>
                  <p className="text-sm font-bold">通知設定</p>
                  <p className="text-xs text-white/40">機台異常即時告警</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/60">language</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">系統語言</p>
                  <p className="text-xs text-white/40">繁體中文</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/20">chevron_right</span>
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 px-1">關於</h3>
          <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/60">info</span>
                </div>
                <div>
                  <p className="text-sm font-bold">版本資訊</p>
                  <p className="text-xs text-white/40">Version 2.4.0 (Build 108)</p>
                </div>
              </div>
              <span className="text-xs text-white/20 px-2 py-1 bg-white/5 rounded-md font-mono">最新版本</span>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section className="pt-4">
          <button
            onClick={() => logout()}
            className="w-full bg-white/5 hover:bg-danger/10 text-danger font-bold py-4 rounded-xl border border-danger/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">logout</span>
            登出帳號
          </button>
          <p className="text-center text-[10px] text-white/20 mt-6">Claw Machine Manager Cloud © 2023</p>
        </section>
      </main>
    </div>
  );
};