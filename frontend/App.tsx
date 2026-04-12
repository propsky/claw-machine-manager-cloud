import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Machines } from './pages/Machines';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { TransactionHistory } from './pages/TransactionHistory';
import { isAuthenticated } from './services/auth';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  // 主題初始化（預設深色）
  useEffect(() => {
    const saved = localStorage.getItem('claw_theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 偵測 QR Code 分享來源（?ref=USER_ID 在 hash 之前）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref) return;

    fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharer_id: ref,
        scanned_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      }),
    }).catch(() => {});

    // 移除 ?ref= 避免重複送出
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/machines" element={<Machines />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/transactions" element={<TransactionHistory />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
