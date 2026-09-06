import React, { useState, useEffect } from 'react';
import { StatCard, Card, Badge } from '../components/common/Components';
import { LoadingState } from '../components/common/UIStates';
import { Users, FileText, CheckCircle, XCircle, AlertTriangle, Building2, Activity } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!blockchainService.provider) return;
        const data = await blockchainService.getAllEvents();
        const instReg = blockchainService.institutionRegistry;
        const instFilter2 = instReg.filters.IssuerAuthorized();
        const eIssuers = await instReg.queryFilter(instFilter2, 0, "latest");

        const uniqueIssuers = new Set(eIssuers.map(e => `${e.args[0]}-${e.args[1]}`)).size;

        setStats({
           totalIssued: data.issued.length,
           revoked: data.revoked.length,
           active: data.issued.length - data.revoked.length,
           institutions: data.institutions,
           issuers: uniqueIssuers,
           recent: data.issued.sort((a,b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, 5)
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [blockchainService.provider]);

  if (loading) {
    return (
      <div className="page-header">
         <h1 className="page-title">Welcome to CredChain</h1>
         <p className="page-subtitle">Blockchain Credential Infrastructure</p>
         <LoadingState message="Syncing with blockchain..." />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome to CredChain</h1>
        <p className="page-subtitle">Blockchain Credential Infrastructure</p>
      </div>

      {!blockchainService.provider ? (
        <div style={{ padding: '2rem', background: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)' }}>
           <h3 style={{ margin: '0 0 0.5rem 0' }}>Wallet Not Connected</h3>
           <p style={{ margin: 0 }}>Please connect your MetaMask wallet using the button in the top right to view dashboard statistics.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard title="Total Credentials" value={stats?.totalIssued || 0} icon={FileText} color="var(--primary)" />
            <StatCard title="Active Credentials" value={stats?.active || 0} icon={CheckCircle} color="var(--success)" />
            <StatCard title="Revoked" value={stats?.revoked || 0} icon={XCircle} color="var(--danger)" />
            <StatCard title="Institutions" value={stats?.institutions || 0} icon={Building2} color="var(--accent)" />
            <StatCard title="Issuers" value={stats?.issuers || 0} icon={Users} color="var(--secondary)" />
          </div>

          <div className="grid-2-1">
            <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Activity size={18} /> Recent Credential Activity</div>}>
              {stats?.recent?.length === 0 ? (
                 <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent credentials found.
                 </div>
              ) : (
                 <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Credential ID</th>
                          <th>Issuer</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                         {stats?.recent.map((r, i) => (
                            <tr key={i} style={{cursor: 'pointer'}} onClick={() => navigate(`/credentials/${r.certId}`)}>
                               <td style={{fontWeight: 500}}>{r.certId}</td>
                               <td className="mono" style={{fontSize: '0.85rem'}}>{r.issuer.substring(0,8)}...</td>
                               <td><Badge type="success">Issued</Badge></td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                 </div>
              )}
            </Card>

            <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AlertTriangle size={18} /> System Status</div>}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                     <span style={{ fontWeight: 500 }}>Smart Contracts</span>
                     <Badge type="success">Online</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                     <span style={{ fontWeight: 500 }}>Network</span>
                     <Badge type="primary">Localhost</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                     <span style={{ fontWeight: 500 }}>Wallet Connection</span>
                     <Badge type="success">Connected</Badge>
                  </div>
               </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
