import React from 'react';
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
