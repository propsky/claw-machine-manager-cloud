import React, { useState, useEffect } from 'react';
import { FavoriteBankAccount } from '../types';
import { fetchBankAccounts, createBankAccount, deleteBankAccount, setDefaultBankAccount, fetchUserProfile, updateUserProfile, UserProfile } from '../services/api';
import { BANK_CODES, getBankName } from '../constants/bankCodes';
import { Toast, ToastType } from '../components/Toast';

export const Settings: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<FavoriteBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FavoriteBankAccount | null>(null);
  
  // 個人資料狀態
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    real_name: '',
    phone: '',
    bank_account: '',
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
        bank_account: data.bank_account || '',
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
        bank_account: profileForm.bank_account,
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
        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Account Section */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 px-1">帳戶</h3>
          <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden">
            <button 
              onClick={() => { loadProfile(); setShowProfileEdit(true); }}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5"
            >
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
            
            {/* 銀行帳戶 - 可點擊展開 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/60">account_balance</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">收款銀行帳戶</p>
                    <p className="text-xs text-white/40">{defaultDisplay}</p>
                  </div>
                </div>
              </div>

              {/* 銀行帳戶列表 */}
              {loading ? (
                <div className="text-center py-4 text-white/40 text-sm">載入中...</div>
              ) : bankAccounts.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {bankAccounts.map((account) => (
                    <div 
                      key={account.id} 
                      className={`p-3 rounded-lg border ${
                        account.is_default 
                          ? 'border-primary/50 bg-primary/10' 
                          : 'border-white/5 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">
                            {account.bank_name}
                            {account.is_default && <span className="ml-2 text-xs text-primary">(預設)</span>}
                          </p>
                          <p className="text-xs text-white/40">
                            {account.branch_name || ''} {account.account_number}
                          </p>
                          <p className="text-xs text-white/40">{account.account_holder_name}</p>
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
                <p className="text-center py-4 text-white/40 text-sm">尚未設定銀行帳戶</p>
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
          <div className="bg-card-dark rounded-xl border border-white/5 p-4 space-y-4">
            <h4 className="text-sm font-bold">新增銀行帳戶</h4>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 銀行代碼 */}
              <div>
                <label className="block text-xs text-white/40 mb-1">銀行</label>
                <select
                  value={formData.bank_code}
                  onChange={(e) => handleBankCodeChange(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
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
                <label className="block text-xs text-white/40 mb-1">分行名稱（選填）</label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder="例如：桃園分行"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* 帳號 */}
              <div>
                <label className="block text-xs text-white/40 mb-1">帳號</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="請輸入帳號"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* 戶名 */}
              <div>
                <label className="block text-xs text-white/40 mb-1">戶名</label>
                <input
                  type="text"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                  placeholder="請輸入戶名"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* 設為預設 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
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
                  className="flex-1 py-2 bg-white/10 text-white rounded-lg text-sm font-bold"
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
                  <p className="text-xs text-white/40">Version 2.5.4 (Build 20260225)</p>
                </div>
              </div>
              <span className="text-xs text-white/20 px-2 py-1 bg-white/5 rounded-md font-mono">最新版本</span>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section className="pt-4">
          <button className="w-full bg-white/5 hover:bg-danger/10 text-danger font-bold py-4 rounded-xl border border-danger/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
            <span className="material-symbols-outlined">logout</span>
            登出帳號
          </button>
          <p className="text-center text-[10px] text-white/20 mt-6">Claw Machine Manager Cloud © 2023</p>
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
          <div className="relative w-full max-w-[430px] bg-surface-dark rounded-t-2xl shadow-2xl border-t border-white/10 flex flex-col pb-10 animate-slide-up">
            <div className="flex h-1.5 w-full items-center justify-center py-4">
              <div className="h-1.5 w-12 rounded-full bg-white/20"></div>
            </div>
            <div className="px-6 pb-4">
              <h1 className="text-white text-xl font-bold text-center">個人資料</h1>
              <p className="text-white/50 text-sm text-center mt-1">填寫完整以便提領</p>
            </div>
            <form onSubmit={handleProfileSubmit} className="px-6 space-y-4">
              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">真實姓名</label>
                <input
                  type="text"
                  value={profileForm.real_name}
                  onChange={e => setProfileForm({...profileForm, real_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="請輸入真實姓名"
                  required
                />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">聯絡電話</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="請輸入聯絡電話"
                  required
                />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">銀行帳號</label>
                <input
                  type="text"
                  value={profileForm.bank_account}
                  onChange={e => setProfileForm({...profileForm, bank_account: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="請輸入銀行帳號"
                  required
                />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">身份證字號</label>
                <input
                  type="text"
                  value={profileForm.id_card_number}
                  onChange={e => setProfileForm({...profileForm, id_card_number: e.target.value.toUpperCase()})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="請輸入身份證字號"
                  maxLength={10}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-4 rounded-xl transition-colors"
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
    </div>
  );
};
