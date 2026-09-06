import React, { useState, useEffect } from 'react';
import { Card, StatCard, Badge } from '../components/common/Components';
import { LoadingState } from '../components/common/UIStates';
import { BarChart3, Activity, Users, FileText, CheckCircle, XCircle } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { ethers } from 'ethers';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalIssued: 0,
    totalRevoked: 0,
    totalInstitutions: 0,
    authorizedIssuers: 0,
    recentIssuance: [],
    recentRevocation: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [blockchainService.provider]);

  const loadAnalytics = async () => {
    if (!blockchainService.provider) return;
    try {
      setLoading(true);

      const instReg = blockchainService.institutionRegistry;
      const instFilter1 = instReg.filters.InstitutionRegistered();
      const instFilter2 = instReg.filters.IssuerAuthorized();

      const p1 = instReg.queryFilter(instFilter1, 0, "latest");
      const p2 = instReg.queryFilter(instFilter2, 0, "latest");

      const certRegAddress = await blockchainService.digitalCredential.certificateRegistry();
      const certReg = new ethers.Contract(certRegAddress, [
        "event CertificateIssued(string indexed certificateId, string certificateHash, address indexed issuer, uint256 expiryTimestamp, uint256 version)",
        "event CertificateRevoked(string indexed certificateId)"
      ], blockchainService.provider);

      const certFilter1 = certReg.filters.CertificateIssued();
      const certFilter2 = certReg.filters.CertificateRevoked();

      const p3 = certReg.queryFilter(certFilter1, 0, "latest");
      const p4 = certReg.queryFilter(certFilter2, 0, "latest");

      const [eInsts, eIssuers, eIssued, eRevoked] = await Promise.all([p1, p2, p3, p4]);

      const safeId = (val) => typeof val === 'string' ? val : (val?.hash || String(val || ''));

      // Compute unique counts
      const uniqueInsts = new Set(eInsts.map(e => safeId(e.args[0]))).size;
      const uniqueIssuers = new Set(eIssuers.map(e => `${safeId(e.args[0])}-${e.args[1]}`)).size;
      const uniqueIssued = new Set(eIssued.map(e => safeId(e.args[0]))).size;
      const uniqueRevoked = new Set(eRevoked.map(e => safeId(e.args[0]))).size;

      // Sort for recent activity
      const recentIssued = eIssued.sort((a,b) => b.blockNumber - a.blockNumber).slice(0, 5);
      const recentRevoked = eRevoked.sort((a,b) => b.blockNumber - a.blockNumber).slice(0, 5);

      setStats({
        totalInstitutions: uniqueInsts,
        authorizedIssuers: uniqueIssuers,
        totalIssued: uniqueIssued,
        totalRevoked: uniqueRevoked,
        activeCertificates: uniqueIssued - uniqueRevoked,
        recentIssuance: recentIssued.map(e => ({ id: safeId(e.args[0]), block: e.blockNumber })),
        recentRevocation: recentRevoked.map(e => ({ id: safeId(e.args[0]), block: e.blockNumber }))
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-subtitle">Real-time metrics derived directly from blockchain events.</p>
        </div>
        <div>
          <Badge type="primary">Source: Blockchain Events</Badge>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Aggregating blockchain events..." />
      ) : (
        <>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
            <StatCard title="Total Issued" value={stats.totalIssued} icon={FileText} color="var(--primary)" />
            <StatCard title="Active Credentials" value={stats.activeCertificates} icon={CheckCircle} color="var(--success)" />
            <StatCard title="Revoked Credentials" value={stats.totalRevoked} icon={XCircle} color="var(--danger)" />
            <StatCard title="Total Institutions" value={stats.totalInstitutions} icon={Users} color="var(--accent)" />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem'}}>

             <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BarChart3 size={18}/> Issuance Trends</div>} style={{display: 'flex', flexDirection: 'column'}}>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', padding: '2rem', textAlign: 'center'}}>
                   <BarChart3 size={48} color="var(--border)" style={{marginBottom: '1rem'}} />
                   <h3 style={{color: 'var(--text-main)', marginBottom: '0.5rem'}}>Insufficient historical block data</h3>
                   <div style={{fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '400px'}}>
                       Time-series analytics require a decentralized indexer (like The Graph) to aggregate blocks over time.
                   </div>
                </div>
             </Card>

             <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                 <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Activity size={18}/> Recent Issuances</div>}>
                    {stats.recentIssuance.length === 0 ? (
                        <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0'}}>No recent issuances found.</div>
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                           {stats.recentIssuance.map((item, i) => (
                               <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)'}}>
                                   <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                       <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)'}}></div>
                                       <span style={{fontWeight: 500}}>{item.id}</span>
                                   </div>
                                   <span className="mono" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Block {item.block}</span>
                               </div>
                           ))}
                        </div>
                    )}
                 </Card>

                 <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><XCircle size={18}/> Recent Revocations</div>}>
                    {stats.recentRevocation.length === 0 ? (
                        <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0'}}>No recent revocations found.</div>
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                           {stats.recentRevocation.map((item, i) => (
                               <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)'}}>
                                   <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                       <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)'}}></div>
                                       <span style={{fontWeight: 500}}>{item.id}</span>
                                   </div>
                                   <span className="mono" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Block {item.block}</span>
                               </div>
                           ))}
                        </div>
                    )}
                 </Card>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
