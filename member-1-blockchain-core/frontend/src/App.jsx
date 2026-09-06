import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Institutions from './pages/Institutions';
import Certificates from './pages/Certificates';
import BlockchainActivityPage from './pages/BlockchainActivityPage';
import PublicVerification from './pages/PublicVerification';
import CredentialDetails from './pages/CredentialDetails';
import Analytics from './pages/Analytics';
import Issuers from './pages/Issuers';
import Verification from './pages/Verification';
import Settings from './pages/Settings';
import BlockchainLoader from './components/common/BlockchainLoader';
import btcCoin from './assets/bitcoin-coin.jpg';
import { blockchainService } from './services/blockchain';

import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';

function App() {
  const [wallet, setWallet] = useState(null);
  const [network, setNetwork] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isInitializing, setIsInitializing] = useState(true);
  const [progress, setProgress] = useState(0);

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
      alert(`Failed to connect wallet: ${err.message || err}`);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        try {
          await connect();
        } catch (e) {
          // silent fail for init
        }
      }
    };
    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        connect();
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    const iv = setInterval(() => {
      setProgress(p => Math.min(p + 2, 100));
    }, 50);
    return () => {
      clearInterval(iv);
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  if (isInitializing) {
    return (
      <BlockchainLoader
        progress={progress}
        onComplete={() => setIsInitializing(false)}
        coinSrc={btcCoin}
        size={380}
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify" element={<PublicVerification />} />
        <Route path="/*" element={
          <AppShell wallet={wallet} network={network} connect={connect}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/institutions" element={<Institutions />} />
              <Route path="/credentials" element={<Certificates />} />
              <Route path="/credentials/:id" element={<CredentialDetails />} />
              <Route path="/activity" element={<BlockchainActivityPage />} />
              <Route path="/issuers" element={<Issuers />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/settings" element={<Settings network={network} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppShell>
        } />
      </Routes>
    </Router>
  );
}

export default App;
