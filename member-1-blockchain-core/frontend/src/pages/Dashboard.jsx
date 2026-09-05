import React, { useState, useEffect } from 'react';
import { Card, StatCard, Badge, HashDisplay } from '../components/common/Components';
import { FileText, Shield, AlertTriangle, Building2, Users } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, revoked: 0, institutions: 0, loading: true });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function loadStats() {
      if (!blockchainService.provider) return;
      try {
        const data = await blockchainService.getAllEvents();
        const revokedIds = new Set(data.revoked.map(r => r.certId));
        const active = data.issued.filter(i => !revokedIds.has(i.certId));
        
        setStats({
          total: data.issued.length,
          active: active.length,
          revoked: data.revoked.length,
          institutions: data.institutions,
          loading: false
        });
        
        setRecent(data.issued.slice(-5).reverse());
      } catch (err) {
        console.error("Stats error", err);
      }
    }
    loadStats();
  }, [blockchainService.provider]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Platform Overview & Live Blockchain Statistics</p>
      </div>

      <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem'}}>
        <StatCard title="Total Credentials" value={stats.loading ? "-" : stats.total} icon={FileText} />
        <StatCard title="Active Credentials" value={stats.loading ? "-" : stats.active} icon={Shield} color="var(--success)" />
        <StatCard title="Revoked Credentials" value={stats.loading ? "-" : stats.revoked} icon={AlertTriangle} color="var(--danger)" />
        <StatCard title="Trusted Institutions" value={stats.loading ? "-" : stats.institutions} icon={Building2} color="var(--accent)" />
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>
        <Card title="Recent Issuance Activity">
          {recent.length === 0 ? (
             <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No recent credentials found.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Credential ID</th>
                    <th>Issuer Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(cert => (
                    <tr key={cert.certId}>
                      <td style={{fontWeight: 500}}>{cert.certId}</td>
                      <td><HashDisplay value={cert.issuer} /></td>
                      <td><Badge type="success">Active</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
