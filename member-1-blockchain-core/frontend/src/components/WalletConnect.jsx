import React, { useState, useEffect } from 'react';
import { blockchainService } from '../services/blockchain';

export default function WalletConnect() {
  const [wallet, setWallet] = useState(null);
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState('');

  const connect = async () => {
    try {
      setError('');
      const data = await blockchainService.connectWallet();
      setWallet(data.address);
      setNetwork(data.network);
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  useEffect(() => {
    // Check if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      connect();
    }
  }, []);

  return (
    <div className="wallet-connect">
      {wallet ? (
        <div className="wallet-info">
          <span>Connected: {wallet.substring(0, 6)}...{wallet.substring(38)}</span>
          <span className="network-badge">{network}</span>
        </div>
      ) : (
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      )}
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
