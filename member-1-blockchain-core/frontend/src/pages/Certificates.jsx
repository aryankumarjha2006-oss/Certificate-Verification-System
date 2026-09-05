import React, { useState } from 'react';
import { blockchainService } from '../services/blockchain';

export default function Certificates() {
  const [instId, setInstId] = useState('');
  const [certId, setCertId] = useState('');
  const [hash, setHash] = useState('');
  const [status, setStatus] = useState('');
  const [certData, setCertData] = useState(null);

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      setStatus('Processing issuance transaction...');
      await blockchainService.issueCertificate(instId, certId, hash, 0); // Expiry 0 for demo
      setStatus(`Success: Certificate ${certId} issued!`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setStatus('Verifying on blockchain...');
      const result = await blockchainService.verifyCertificate(certId, hash);
      const data = await blockchainService.getCertificate(certId);
      setStatus(`Verification Result: ${result}`);
      setCertData(data);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setCertData(null);
    }
  };

  return (
    <div className="page-container">
      <h2>Certificate Lifecycle</h2>
      {status && <div className="status-message">{status}</div>}

      <div className="card">
        <h3>Issue Certificate (Authorized Issuers Only)</h3>
        <form onSubmit={handleIssue}>
          <input placeholder="Institution ID" value={instId} onChange={e => setInstId(e.target.value)} required />
          <input placeholder="Certificate ID" value={certId} onChange={e => setCertId(e.target.value)} required />
          <input placeholder="Document Hash (0x...)" value={hash} onChange={e => setHash(e.target.value)} required />
          <button type="submit" className="btn-primary">Issue Certificate</button>
        </form>
      </div>

      <div className="card">
        <h3>Create New Version</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            setStatus('Processing version creation...');
            await blockchainService.createNewVersion(instId, certId, hash, 0);
            setStatus(`Success: New version of ${certId} created!`);
          } catch (err) {
            setStatus(`Error: ${err.message}`);
          }
        }}>
          <input placeholder="Institution ID" value={instId} onChange={e => setInstId(e.target.value)} required />
          <input placeholder="Certificate ID" value={certId} onChange={e => setCertId(e.target.value)} required />
          <input placeholder="New Document Hash (0x...)" value={hash} onChange={e => setHash(e.target.value)} required />
          <button type="submit" className="btn-primary">Create New Version</button>
        </form>
      </div>

      <div className="card">
        <h3>Verify Certificate (Public)</h3>
        <form onSubmit={handleVerify}>
          <input placeholder="Certificate ID" value={certId} onChange={e => setCertId(e.target.value)} required />
          <input placeholder="Document Hash to Verify" value={hash} onChange={e => setHash(e.target.value)} required />
          <button type="submit" className="btn-secondary">Verify Hash</button>
        </form>
        {certData && certData.exists && (
          <div className="cert-details">
            <h4>On-Chain Certificate Details:</h4>
            <p><strong>ID:</strong> {certData.certificateId}</p>
            <p><strong>Hash:</strong> {certData.certificateHash}</p>
            <p><strong>Issuer:</strong> {certData.issuer}</p>
            <p><strong>Latest Version:</strong> {certData.version.toString()}</p>
            <p><strong>Status:</strong> {certData.status === 0n ? "ACTIVE" : "REVOKED"}</p>
            
            <button className="btn-secondary" style={{marginTop: '1rem'}} onClick={async () => {
                const count = await blockchainService.getCertificateVersionCount(certData.certificateId);
                let history = [];
                for(let i=1; i<=count; i++) {
                    const v = await blockchainService.getCertificateVersion(certData.certificateId, i);
                    history.push(`V${i}: ${v.certificateHash} (Status: ${v.status === 0n ? 'ACTIVE' : 'REVOKED'})`);
                }
                alert("Version History:\n" + history.join("\n"));
            }}>View Version History</button>
          </div>
        )}
      </div>
    </div>
  );
}
