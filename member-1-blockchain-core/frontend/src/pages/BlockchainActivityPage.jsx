import React, { useState, useEffect } from 'react';
import { Card, Badge, HashDisplay } from '../components/common/Components';
import { LoadingState, EmptyState } from '../components/common/UIStates';
import { Activity, Search, Filter } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function BlockchainActivityPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

      const parseArg = (val) => {
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object' && val.hash) return val.hash;
        return String(val ?? '');
      };

      const combined = [
        ...e1.map(e => ({ name: 'InstitutionRegistered', block: Number(e.blockNumber), tx: String(e.transactionHash || ''), entity: parseArg(e.args[0]) })),
        ...e2.map(e => ({ name: 'IssuerAuthorized', block: Number(e.blockNumber), tx: String(e.transactionHash || ''), entity: parseArg(e.args[1]) })),
        ...e3.map(e => ({ name: 'CertificateIssued', block: Number(e.blockNumber), tx: String(e.transactionHash || ''), entity: parseArg(e.args[0]) })),
        ...e4.map(e => ({ name: 'CertificateRevoked', block: Number(e.blockNumber), tx: String(e.transactionHash || ''), entity: parseArg(e.args[0]) }))
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

  const filtered = events.filter(e => {
     const txStr = String(e?.tx || '');
     const entityStr = String(e?.entity || '');
     return txStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entityStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Trail</h1>
        <p className="page-subtitle">Immutable chronological log of all smart contract events directly from the blockchain.</p>
      </div>

      <Card>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap'}}>
           <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
             <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
             <input
               type="text"
               placeholder="Search by Tx Hash or Entity..."
               className="form-input"
               style={{ width: '100%', paddingLeft: '2.5rem' }}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <button className="btn btn-secondary">
             <Filter size={18} /> Filter Events
           </button>
        </div>

        {loading ? (
          <LoadingState message="Syncing blockchain activity..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Activity Found"
            description="There are no blockchain events matching your search."
          />
        ) : (
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
                {filtered.map((e, idx) => (
                  <tr key={idx}>
                    <td>{getEventBadge(e.name)}</td>
                    <td className="mono" style={{fontWeight: 500, fontSize: '0.9rem'}}>{e.entity}</td>
                    <td className="mono" style={{fontSize: '0.9rem'}}>Block {e.block}</td>
                    <td><HashDisplay value={e.tx} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
