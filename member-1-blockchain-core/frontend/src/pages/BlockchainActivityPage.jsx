import React, { useState, useEffect } from 'react';
import { Card, Badge, HashDisplay } from '../components/common/Components';
import { Activity, Search, Filter } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function BlockchainActivityPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [blockchainService.provider]);

  const loadActivity = async () => {
    if (!blockchainService.provider) return;
    try {
      setLoading(true);
      // Get Institution events
      const instFilter1 = blockchainService.institutionRegistry.filters.InstitutionRegistered();
      const instFilter2 = blockchainService.institutionRegistry.filters.IssuerAuthorized();
      
      const p1 = blockchainService.institutionRegistry.queryFilter(instFilter1, 0, "latest");
      const p2 = blockchainService.institutionRegistry.queryFilter(instFilter2, 0, "latest");
      
      // Get Credential events
      const certRegAddress = await blockchainService.digitalCredential.certificateRegistry();
      const certReg = new window.ethers.Contract(certRegAddress, [
        "event CertificateIssued(string indexed certificateId, string certificateHash, address indexed issuer, uint256 expiryTimestamp, uint256 version)",
        "event CertificateRevoked(string indexed certificateId)"
      ], blockchainService.provider);
      
      const certFilter1 = certReg.filters.CertificateIssued();
      const certFilter2 = certReg.filters.CertificateRevoked();
      
      const p3 = certReg.queryFilter(certFilter1, 0, "latest");
      const p4 = certReg.queryFilter(certFilter2, 0, "latest");
      
      const [e1, e2, e3, e4] = await Promise.all([p1, p2, p3, p4]);
      
      const combined = [
        ...e1.map(e => ({ name: 'InstitutionRegistered', block: e.blockNumber, tx: e.transactionHash, entity: e.args[0] })),
        ...e2.map(e => ({ name: 'IssuerAuthorized', block: e.blockNumber, tx: e.transactionHash, entity: e.args[1] })),
        ...e3.map(e => ({ name: 'CertificateIssued', block: e.blockNumber, tx: e.transactionHash, entity: e.args[0] })),
        ...e4.map(e => ({ name: 'CertificateRevoked', block: e.blockNumber, tx: e.transactionHash, entity: e.args[0] }))
      ];
      
      combined.sort((a,b) => b.block - a.block);
      setEvents(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (name) => {
    if (name.includes('Registered') || name.includes('Authorized') || name.includes('Issued')) return <Badge type="success">{name}</Badge>;
    if (name.includes('Revoked') || name.includes('Deactivated')) return <Badge type="danger">{name}</Badge>;
    return <Badge type="neutral">{name}</Badge>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Trail</h1>
        <p className="page-subtitle">Immutable chronological log of all smart contract events.</p>
      </div>

      <Card>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap'}}>
           <div className="form-input" style={{display: 'flex', alignItems: 'center', width: '300px', padding: '0.5rem 1rem'}}>
             <Search size={16} color="var(--text-muted)" style={{marginRight: '0.5rem'}} />
             <input type="text" placeholder="Search by Tx Hash..." style={{border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-main)'}} />
           </div>
           <button className="btn btn-secondary">
             <Filter size={16} /> Filter Events
           </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Entity Reference</th>
                <th>Block Number</th>
                <th>Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Loading audit trail...</td></tr>}
              {!loading && events.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No activity found</td></tr>}
              {events.map((e, idx) => (
                <tr key={idx}>
                  <td>{getEventBadge(e.name)}</td>
                  <td className="mono" style={{fontWeight: 500}}>{e.entity}</td>
                  <td className="mono">{e.block}</td>
                  <td><HashDisplay value={e.tx} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
