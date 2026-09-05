import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Institutions from './pages/Institutions';
import Certificates from './pages/Certificates';
import BlockchainActivityPage from './pages/BlockchainActivityPage';
import { blockchainService } from './services/blockchain';

import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';

function App() {
  const [wallet, setWallet] = useState(null);
  const [network, setNetwork] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const connect = async () => {
    try {
      const data = await blockchainService.connectWallet();
      setWallet(data.address);
      setNetwork(data.network);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet. Ensure MetaMask is installed and on the correct network.");
    }
  };

  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      connect();
    }
  }, []);

  return (
    <Router>
      <AppShell wallet={wallet} network={network} connect={connect}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/credentials" element={<Certificates />} />
          <Route path="/activity" element={<BlockchainActivityPage />} />
          <Route path="/issuers" element={<div className="page-header"><h1 className="page-title">Issuers</h1><p className="page-subtitle">Issuer management has been moved here.</p></div>} />
          <Route path="/verification" element={<div className="page-header"><h1 className="page-title">Verification</h1></div>} />
          <Route path="/settings" element={<div className="page-header"><h1 className="page-title">Settings</h1></div>} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
