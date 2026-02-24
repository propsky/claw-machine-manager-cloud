import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo Area */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-2">
            <span className="material-symbols-outlined text-primary text-4xl">toys</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">娃娃機台場管理</h1>
          <p className="text-sm text-white/40">請登入您的帳號</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1">帳號</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入帳號"
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:text-background-dark/50 text-background-dark font-bold py-3.5 rounded-xl transition-all text-base flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                登入中...
              </>
            ) : (
              '登入'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-white/20">
          SmartPay Claw Machine Manager
        </p>
      </div>
    </div>
  );
};
