import React, { useState } from 'react';
import { blockchainService } from '../services/blockchain';

export default function Institutions() {
  const [instId, setInstId] = useState('');
  const [instName, setInstName] = useState('');
  const [instWallet, setInstWallet] = useState('');
  const [authInstId, setAuthInstId] = useState('');
  const [issuerWallet, setIssuerWallet] = useState('');
  const [status, setStatus] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setStatus('Processing transaction...');
      await blockchainService.registerInstitution(instId, instName, instWallet);
      setStatus('Success: Institution Registered!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleAuthorize = async (e) => {
    e.preventDefault();
    try {
      setStatus('Processing transaction...');
      await blockchainService.authorizeIssuer(authInstId, issuerWallet);
      setStatus('Success: Issuer Authorized!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page-container">
      <h2>Institution Management</h2>
      {status && <div className="status-message">{status}</div>}
      
      <div className="card">
        <h3>Register Institution (Platform Admin Only)</h3>
        <form onSubmit={handleRegister}>
          <input placeholder="Institution ID" value={instId} onChange={e => setInstId(e.target.value)} required />
          <input placeholder="Institution Name" value={instName} onChange={e => setInstName(e.target.value)} required />
          <input placeholder="Institution Wallet Address" value={instWallet} onChange={e => setInstWallet(e.target.value)} required />
          <button type="submit" className="btn-primary">Register Institution</button>
        </form>
      </div>

      <div className="card">
        <h3>Authorize Issuer (Institution Admin Only)</h3>
        <form onSubmit={handleAuthorize}>
          <input placeholder="Institution ID" value={authInstId} onChange={e => setAuthInstId(e.target.value)} required />
          <input placeholder="Issuer Wallet Address" value={issuerWallet} onChange={e => setIssuerWallet(e.target.value)} required />
          <button type="submit" className="btn-primary">Authorize Issuer</button>
        </form>
      </div>
    </div>
  );
}
