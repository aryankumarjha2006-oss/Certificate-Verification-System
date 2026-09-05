import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Institutions from './pages/Institutions';
import Certificates from './pages/Certificates';
import BlockchainActivityPage from './pages/BlockchainActivityPage';
import WalletConnect from './components/WalletConnect';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-brand">Member 1 Blockchain Admin</div>
          <div className="navbar-links">
            <Link to="/">Dashboard</Link>
            <Link to="/institutions">Institutions</Link>
            <Link to="/certificates">Certificates</Link>
            <Link to="/activity">Activity</Link>
          </div>
          <WalletConnect />
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/institutions" element={<Institutions />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/activity" element={<BlockchainActivityPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
