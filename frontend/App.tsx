import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Machines } from './pages/Machines';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { TransactionHistory } from './pages/TransactionHistory';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/transactions" element={<TransactionHistory />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;