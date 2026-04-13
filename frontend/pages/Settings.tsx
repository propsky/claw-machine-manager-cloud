import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

declare const __APP_VERSION__: string;
import { FavoriteBankAccount } from '../types';
import { fetchBankAccounts, createBankAccount, deleteBankAccount, setDefaultBankAccount, fetchUserProfile, updateUserProfile, UserProfile } from '../services/api';
import { logout, isGuest } from '../services/auth';
import { BANK_CODES, getBankName } from '../constants/bankCodes';
import { Toast, ToastType } from '../components/Toast';

// 版本更新記錄
const CHANGELOG = [
  {
    version: '3.3.1',
    date: '2026-04-13',
    features: [
      '新增淺色／深色主題切換',
      '預設維持深色模式，可在設定頁偏好設定切換',
      '主題設定儲存於本機，重新開啟 App 後保留',
    ]
  },
  {
    version: '3.3.0',
    date: '2026-04-12',
    features: [
      '多機台類型支援：娃娃機、扭蛋機、打地鼠、搖馬機、彈珠檯、販賣機',
      '機台卡片顯示類型圖示與名稱',
      '機台監控新增類型篩選列',
      '營收報表加入機台類型篩選與圖示',
      'Dashboard 健康狀態顯示機台類型分佈',
      '訪客模式擴充多機型示範資料',
    ]
  },
  {
    version: '3.2.2',
    date: '2026-04-02',
    features: [
      '統一機台頁日期篩選改用 payments API',
      '修正即時抄表為唯一使用 readings 的情境'
    ]
  },
  {
    version: '3.2.1',
    date: '2026-03-19',
    features: [
      '修正機台頁與總覽頁數字顯示錯誤',
      '新增即時抄表值篩選'
    ]
  },
  {
    version: '3.1.1',
    date: '2026-03-13',
    features: [
      '機台控制介面串接真實 API',
      '重啟/遠端投幣顯示發送結果或錯誤訊息'
    ]
  },
  {
    version: '3.1.0',
    date: '2026-03-06',
    features: [
      '機台控制介面 - 點擊機台可進行重啟/遠端投幣',
      '營收報告機台顯示場地名稱',
      '機器列表場地名稱優化'
    ]
  },
  {
    version: '3.0.0',
    date: '2026-02-27',
    features: [
      '多場地功能 - 支援 22+ 場地管理',
      '場地選單 - 可切換不同場地',
      '營收報告時間篩選 - 24小時/3天/7天/30天',
      '帳務紀錄日期篩選與分頁',
      '機器頁面優化'
    ]
  },
  {
    version: '2.7.0',
    date: '2026-02-26',
    features: [
      '營收報告改版 - 新增熱門機台/異常機台/營收 TOP 3',
      '出貨數顯示',
      'Cloudflare Pages API 代理修復'
    ]
  },
  {
    version: '2.6.0',
    date: '2026-02-25',
    features: [
      '營收報告 - 時間區間篩選功能',
      '場地版本號自動化'
    ]
  },
  {
    version: '2.5.0',
    date: '2026-02-20',
    features: [
      '提領功能上線',
      '銀行帳戶管理',
      '個人資料驗證',
      '每日結算與提領紀錄'
    ]
  }
];

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState<FavoriteBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FavoriteBankAccount | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  // 主題切換
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('claw_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('claw_theme', 'light');
    }
  };

  // PWA 安裝相關
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  const installPromptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const appUrl = window.location.origin;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptRef.current) return;
    installPromptRef.current.prompt();
    const { outcome } = await installPromptRef.current.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      installPromptRef.current = null;
    }
  };

  // 隱藏開發功能：連點版本資訊 20 下解鎖提領金額顯示
  const [devTapCount, setDevTapCount] = useState(0);
  const handleVersionTap = () => {
    const next = devTapCount + 1;
    if (next === 20) {
      const current = localStorage.getItem('show_balance') === '1';
      localStorage.setItem('show_balance', current ? '0' : '1');
      setToast({ message: current ? '已隱藏提領功能' : '🔓 已解鎖提領功能', type: current ? 'info' : 'success' });
      setDevTapCount(0);
    } else {
      if (next >= 15) setToast({ message: `還差 ${20 - next} 下解鎖`, type: 'info' });
      setDevTapCount(next);
    }
  };

  // 個人資料狀態
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    real_name: '',
    phone: '',
    id_card_number: '',
  });
  
  // 表單狀態
  const [formData, setFormData] = useState({
    bank_code: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    account_holder_name: '',
    is_default: false,
  });

  // 載入銀行帳戶列表
  useEffect(() => {
    loadBankAccounts();
    loadProfile();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBankAccounts();
      setBankAccounts(data.accounts);
    } catch (err: any) {
      console.error('載入銀行帳戶失敗:', err);
      // API 失敗時視為沒有銀行帳戶，不顯示錯誤訊息
      // 使用者可以看到「尚未設定」的提示
      setBankAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // 載入個人資料
  const loadProfile = async () => {
    try {
      const data = await fetchUserProfile();
      setProfileData(data);
      setProfileForm({
        real_name: data.real_name || '',
        phone: data.phone || '',
        id_card_number: data.id_card_number || '',
      });
    } catch (err) {
      console.error('載入個人資料失敗:', err);
    }
  };

  // 更新個人資料
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateUserProfile({
        real_name: profileForm.real_name,
        phone: profileForm.phone,
        id_card_number: profileForm.id_card_number,
      });
      await loadProfile();
      setShowProfileEdit(false);
      setToast({ message: '個人資料已更新', type: 'success' });
    } catch (err: any) {
      console.error('更新個人資料失敗:', err);
      setToast({ message: err.message || '更新失敗，請稍後再試', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  // 銀行選單變更時自動填入銀行名稱
  const handleBankCodeChange = (code: string) => {
    const bank = BANK_CODES.find(b => b.code === code);
    setFormData({
      ...formData,
      bank_code: code,
      bank_name: bank?.name || '',
    });
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      const accountData = {
        bank_code: formData.bank_code,
        bank_name: formData.bank_name,
        branch_name: formData.branch_name || undefined,
        account_number: formData.account_number,
        account_holder_name: formData.account_holder_name,
        is_default: formData.is_default,
      };

      await createBankAccount(accountData);
      
      // 重置表單
      setFormData({
        bank_code: '',
        bank_name: '',
        branch_name: '',
        account_number: '',
        account_holder_name: '',
        is_default: false,
      });
      setShowAddForm(false);
      
      // 重新載入列表
      await loadBankAccounts();
      setToast({ message: '銀行帳戶新增成功！', type: 'success' });
    } catch (err: any) {
      console.error('新增銀行帳戶失敗:', err);
      setError('新增銀行帳戶失敗，請稍後再試');
    }
  };

  // 刪除帳戶
  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個銀行帳戶嗎？')) return;
    
    try {
      setError(null);
      await deleteBankAccount(id);
      await loadBankAccounts();
      setToast({ message: '銀行帳戶已刪除', type: 'success' });
    } catch (err: any) {
      console.error('刪除銀行帳戶失敗:', err);
      setError('刪除銀行帳戶失敗，請稍後再試');
    }
  };

  // 設為預設
  const handleSetDefault = async (id: number) => {
    try {
      setError(null);
      await setDefaultBankAccount(id);
      await loadBankAccounts();
      setToast({ message: '已設為預設帳戶', type: 'success' });
    } catch (err: any) {
      console.error('設定預設失敗:', err);
      setError('設定預設帳戶失敗，請稍後再試');
    }
  };

  // 取得預設帳戶顯示
  const defaultAccount = bankAccounts.find(a => a.is_default);
  const defaultDisplay = defaultAccount 
    ? `${defaultAccount.bank_name} (${defaultAccount.bank_code}) **** ${defaultAccount.account_number.slice(-4)}`
    : '尚未設定';

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
      <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 ios-blur px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <div className="size-10"></div>
        <h1 className="text-lg font-bold tracking-tight">系統設定</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-md mx-auto w-full">
        {/* 訪客模式提示 */}
        {isGuest() && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-0.5">visibility</span>
            <div>
              <p className="text-primary font-bold text-sm">訪客體驗模式</p>
              <p className="text-slate-500 dark:text-white/50 text-xs mt-0.5">目前顯示的是示範資料，不會連接真實機台。若要使用完整功能，請登入正式帳號。</p>
            </div>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Account Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 px-1">帳戶</h3>
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            <button
              onClick={() => { loadProfile(); setShowProfileEdit(true); }}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">個人資料</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">管理您的基本資訊</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 dark:text-white/20">chevron_right</span>
            </button>

            {/* 銀行帳戶 - 可點擊展開 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-500 dark:text-white/60">account_balance</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">收款銀行帳戶</p>
                    <p className="text-xs text-slate-400 dark:text-white/40">{defaultDisplay}</p>
                  </div>
                </div>
              </div>

              {/* 銀行帳戶列表 */}
              {loading ? (
                <div className="text-center py-4 text-slate-400 dark:text-white/40 text-sm">載入中...</div>
              ) : bankAccounts.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`p-3 rounded-lg border ${
                        account.is_default
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">
                            {account.bank_name}
                            {account.is_default && <span className="ml-2 text-xs text-primary">(預設)</span>}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-white/40">
                            {account.branch_name || ''} {account.account_number}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-white/40">{account.account_holder_name}</p>
                        </div>
                        <div className="flex gap-2">
                          {!account.is_default && (
                            <button
                              onClick={() => handleSetDefault(account.id)}
                              className="text-xs px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30"
                            >
                              設為預設
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-slate-400 dark:text-white/40 text-sm">尚未設定銀行帳戶</p>
              )}

              {/* 新增按鈕 */}
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full mt-4 py-3 bg-primary/20 text-primary rounded-lg text-sm font-bold hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  新增銀行帳戶
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 新增表單 */}
        {showAddForm && (
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-white/5 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold">新增銀行帳戶</h4>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 銀行代碼 */}
              <div>
                <label className="block text-xs text-slate-400 dark:text-white/40 mb-1">銀行</label>
                <select
                  value={formData.bank_code}
                  onChange={(e) => handleBankCodeChange(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">選擇銀行</option>
                  {BANK_CODES.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name} ({bank.code}) - {bank.fee === 0 ? '免手續費' : `手續費 $${bank.fee}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 分行名稱 */}
              <div>
                <label className="block text-xs text-slate-400 dark:text-white/40 mb-1">分行名稱（選填）</label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder="例如：桃園分行"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* 帳號 */}
              <div>
                <label className="block text-xs text-slate-400 dark:text-white/40 mb-1">帳號</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="請輸入帳號"
                  required
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* 戶名 */}
              <div>
                <label className="block text-xs text-slate-400 dark:text-white/40 mb-1">戶名</label>
                <input
                  type="text"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                  placeholder="請輸入戶名"
                  required
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* 設為預設 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-primary focus:ring-primary"
                />
                <label htmlFor="is_default" className="text-sm">設為預設帳戶</label>
              </div>

              {/* 按鈕 */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      bank_code: '',
                      bank_name: '',
                      branch_name: '',
                      account_number: '',
                      account_holder_name: '',
                      is_default: false,
                    });
                  }}
                  className="flex-1 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white rounded-lg text-sm font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-black rounded-lg text-sm font-bold"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 px-1">偏好設定</h3>
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            {/* 外觀主題 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 dark:text-white/60">{isDark ? 'dark_mode' : 'light_mode'}</span>
                </div>
                <div>
                  <p className="text-sm font-bold">外觀主題</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{isDark ? '深色模式' : '淺色模式'}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isDark} onChange={toggleTheme} />
                <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 dark:text-white/60">notifications</span>
                </div>
                <div>
                  <p className="text-sm font-bold">通知設定</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">機台異常即時告警</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 dark:text-white/60">language</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">系統語言</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">繁體中文</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 dark:text-white/20">chevron_right</span>
            </button>
          </div>
        </section>

        {/* 安裝 App Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 px-1">安裝 App</h3>
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowInstall(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">install_mobile</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">加到手機桌面</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">
                    {isInStandaloneMode ? '已安裝為 App' : '掃碼或查看安裝說明'}
                  </p>
                </div>
              </div>
              {isInStandaloneMode
                ? <span className="text-xs text-primary px-2 py-1 bg-primary/10 rounded-md">已安裝</span>
                : <span className="material-symbols-outlined text-slate-300 dark:text-white/20">chevron_right</span>
              }
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 px-1">關於</h3>
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            {/* 版本資訊 */}
            <div className="flex items-center justify-between p-4 select-none" onClick={handleVersionTap}>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 dark:text-white/60">info</span>
                </div>
                <div>
                  <p className="text-sm font-bold">版本資訊</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Version {__APP_VERSION__}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 dark:text-white/20 px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-md font-mono">最新版本</span>
            </div>

            {/* 更新記錄按鈕 */}
            <div
              className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
              onClick={() => setShowChangelog(true)}
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">history</span>
                </div>
                <div>
                  <p className="text-sm font-bold">更新記錄</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">查看近 5 次版本更新</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 dark:text-white/20">chevron_right</span>
            </div>
          </div>
        </section>

        {/* 關於我們 */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider px-1">關於我們</h2>
          <a
            href="https://www.propskynet.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white py-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm transition-all flex items-center gap-3 px-4 active:scale-[0.98]"
          >
            <img src="/propsky-logo.png" alt="Propsky" className="h-8 object-contain" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">擎天有限公司</p>
              <p className="text-xs text-slate-400 dark:text-white/40">www.propskynet.com</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-white/30">open_in_new</span>
          </a>
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 space-y-1">
            <p className="text-xs text-slate-500 dark:text-white/60">擎天娃娃機管理平台，提供雲端物聯卡、後台管理系統、電子支付整合與行銷解決方案。</p>
            <a
              href="https://lin.ee/Mz1uIEc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 mt-1"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              加入 LINE 官方帳號
            </a>
          </div>
        </section>

        {/* Logout */}
        <section className="pt-2">
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            className="w-full bg-white dark:bg-white/5 hover:bg-danger/10 text-danger font-bold py-4 rounded-xl border border-danger/20 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">logout</span>
            登出帳號
          </button>
          <p className="text-center text-[10px] text-slate-300 dark:text-white/20 mt-6">擎天智慧販賣機管理 © 2026</p>
        </section>
      </main>

      {/* Toast 提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 個人資料編輯 Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowProfileEdit(false)}></div>
          <div className="relative w-full max-w-[430px] bg-white dark:bg-surface-dark rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-white/10 flex flex-col pb-10 animate-slide-up">
            <div className="flex h-1.5 w-full items-center justify-center py-4">
              <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/20"></div>
            </div>
            <div className="px-6 pb-4">
              <h1 className="text-slate-900 dark:text-white text-xl font-bold text-center">個人資料</h1>
              <p className="text-slate-500 dark:text-white/50 text-sm text-center mt-1">填寫完整以便提領</p>
            </div>
            <form onSubmit={handleProfileSubmit} className="px-6 space-y-4">
              <div>
                <label className="text-slate-600 dark:text-white/70 text-sm font-medium block mb-2">真實姓名</label>
                <input
                  type="text"
                  value={profileForm.real_name}
                  onChange={e => setProfileForm({...profileForm, real_name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="請輸入真實姓名"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-white/70 text-sm font-medium block mb-2">聯絡電話</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="請輸入聯絡電話"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-white/70 text-sm font-medium block mb-2">身份證字號</label>
                <input
                  type="text"
                  value={profileForm.id_card_number}
                  onChange={e => setProfileForm({...profileForm, id_card_number: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="請輸入身份證字號"
                  maxLength={10}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-medium py-4 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-background-dark font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {profileLoading ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 更新記錄 Modal */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowChangelog(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-white/10 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">更新記錄</h2>
              <button onClick={() => setShowChangelog(false)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {CHANGELOG.map((item) => (
                <div key={item.version} className="bg-slate-50 dark:bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary font-bold">v{item.version}</span>
                    <span className="text-xs text-slate-400 dark:text-white/40">{item.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-slate-600 dark:text-white/70 flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* 安裝說明 Modal */}
      {showInstall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInstall(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-white/10 flex flex-col">
            <div className="flex h-1.5 w-full items-center justify-center py-4">
              <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/20"></div>
            </div>
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-lg font-bold">加到手機桌面</h2>
              <button onClick={() => setShowInstall(false)}>
                <span className="material-symbols-outlined text-slate-400 dark:text-white/40">close</span>
              </button>
            </div>

            <div className="px-6 pb-8 space-y-5">
              {/* 已安裝提示 */}
              {isInStandaloneMode && (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl p-4">
                  <span className="material-symbols-outlined text-primary material-symbols-filled">check_circle</span>
                  <p className="text-sm text-primary font-bold">App 已安裝在桌面</p>
                </div>
              )}

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-slate-400 dark:text-white/40">掃描 QR Code 在其他裝置開啟</p>
                <div className="p-3 bg-white rounded-2xl">
                  <QRCodeSVG
                    value={profileData?.id ? `${appUrl}?ref=${profileData.id}` : appUrl}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#121212"
                    level="M"
                  />
                </div>
                <p className="text-[11px] text-slate-300 dark:text-white/30 font-mono">
                  {profileData?.id ? `${appUrl}?ref=${profileData.id}` : appUrl}
                </p>
              </div>

              {/* Android 安裝按鈕 */}
              {canInstall && (
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-primary text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">install_mobile</span>
                  立即安裝到桌面
                </button>
              )}

              {/* iOS 安裝說明 */}
              {isIOS && !isInStandaloneMode && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-widest">iPhone / iPad 安裝步驟</p>
                  <div className="space-y-2">
                    {[
                      { icon: 'open_in_browser', text: '用 Safari 開啟此頁' },
                      { icon: 'ios_share', text: '點下方分享按鈕（方塊＋箭頭）' },
                      { icon: 'add_box', text: '選「加入主畫面」' },
                      { icon: 'check_circle', text: '確認後 App 圖示出現在桌面' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3">
                        <span className="material-symbols-outlined text-primary text-xl">{step.icon}</span>
                        <span className="text-sm text-slate-700 dark:text-white/80">{step.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-300 dark:text-white/30 text-center pt-1">※ 必須使用 Safari，Chrome 不支援 iOS 安裝</p>
                </div>
              )}

              {/* 非 iOS 且無 install prompt 的說明 */}
              {!isIOS && !canInstall && !isInStandaloneMode && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-widest">Android 安裝步驟</p>
                  <div className="space-y-2">
                    {[
                      { icon: 'open_in_browser', text: '用 Chrome 開啟此頁' },
                      { icon: 'more_vert', text: '點右上角選單（三個點）' },
                      { icon: 'add_to_home_screen', text: '選「安裝應用程式」或「加到主畫面」' },
                      { icon: 'check_circle', text: '確認後 App 圖示出現在桌面' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3">
                        <span className="material-symbols-outlined text-primary text-xl">{step.icon}</span>
                        <span className="text-sm text-slate-700 dark:text-white/80">{step.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
