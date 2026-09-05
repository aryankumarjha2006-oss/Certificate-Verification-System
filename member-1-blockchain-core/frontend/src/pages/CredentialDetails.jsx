import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, HashDisplay } from '../components/common/Components';
import { LoadingState } from '../components/common/UIStates';
import { ArrowLeft, Clock, FileText, Search } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function CredentialDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareVersion, setCompareVersion] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [id, blockchainService.provider]);

  const loadVersions = async () => {
    if (!blockchainService.provider) return;
    try {
      setLoading(true);
      const count = await blockchainService.getCertificateVersionCount(id);

      const vList = [];
      for (let i = Number(count); i >= 1; i--) {
        const certRegAddress = await blockchainService.digitalCredential.certificateRegistry();
        const certReg = new window.ethers.Contract(certRegAddress, [
          "function getCertificateVersion(string memory, uint256) external view returns (tuple(string certificateId, string certificateHash, address issuer, uint256 expiryTimestamp, uint8 status, uint256 version))"
        ], blockchainService.provider);

        try {
          const vData = await certReg.getCertificateVersion(id, i);
          vList.push({
            version: Number(vData[5]),
            hash: vData[1],
            issuer: vData[2],
            expiry: Number(vData[3]),
            status: Number(vData[4])
          });
        } catch(e) {
          console.error("Failed to load version", i, e);
        }
      }

      setVersions(vList);
      if (vList.length > 0) {
          setSelectedVersion(vList[0].version);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
      return <div style={{padding: '2rem'}}><LoadingState message="Loading credential history from blockchain..." /></div>;
  }

  if (versions.length === 0) {
      return (
          <div style={{padding: '2rem'}}>
              <button className="btn btn-secondary" onClick={() => navigate('/credentials')}><ArrowLeft size={16}/> Back to Credentials</button>
              <div style={{marginTop: '2rem', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', textAlign: 'center'}}>
                Credential not found on the blockchain.
              </div>
          </div>
      );
  }

  const currentVersionData = versions.find(v => v.version === selectedVersion) || versions[0];
  const compVersionData = compareVersion ? versions.find(v => v.version === compareVersion) : null;

  return (
    <div>
      <div className="page-header" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
        <button className="btn btn-secondary" onClick={() => navigate('/credentials')} style={{padding: '0.6rem'}}><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">Credential History: {id}</h1>
          <p className="page-subtitle">Track the immutable version history of this credential directly from the blockchain.</p>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>

          <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Clock size={18}/> Version Timeline</div>}>
             <div style={{position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid var(--border)'}}>
                 {versions.map((v, idx) => {
                     const isLatest = idx === 0;
                     const isSelected = v.version === selectedVersion;
                     return (
                         <div key={v.version}
                              style={{
                                  position: 'relative',
                                  marginBottom: '2rem',
                                  padding: '1.5rem',
                                  borderRadius: 'var(--radius-lg)',
                                  background: isSelected ? 'var(--bg-main)' : 'transparent',
                                  border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                                  cursor: 'pointer',
                                  transition: 'all var(--transition-fast)'
                              }}
                              onClick={() => setSelectedVersion(v.version)}
                         >
                             <div style={{
                                 position: 'absolute',
                                 left: '-2.6rem',
                                 top: '1.5rem',
                                 width: '1rem',
                                 height: '1rem',
                                 borderRadius: '50%',
                                 background: isLatest ? 'var(--accent)' : 'var(--text-muted)',
                                 border: '2px solid var(--bg-card)'
                             }} />
                             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                                 <h3 style={{margin: 0, fontSize: '1.1rem'}}>Version {v.version}</h3>
                                 {isLatest && <Badge type="success">CURRENT</Badge>}
                             </div>
                             <div style={{fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                 <div><span style={{fontWeight: 500}}>Hash:</span> <span className="mono">{v.hash.substring(0, 10)}...{v.hash.substring(v.hash.length - 10)}</span></div>
                                 <div><span style={{fontWeight: 500}}>Issuer:</span> <span className="mono">{v.issuer.substring(0, 10)}...</span></div>
                                 <div><span style={{fontWeight: 500}}>Expiry:</span> {v.expiry > 0 ? new Date(v.expiry * 1000).toLocaleDateString() : 'Never'}</div>
                             </div>
                         </div>
                     );
                 })}
             </div>
          </Card>

          <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
              <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><FileText size={18}/> Selected Version Details</div>}>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                     <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                         <div>
                            <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Version Number</div>
                            <div style={{fontWeight: 600, fontSize: '1.1rem'}}>Version {currentVersionData.version} {currentVersionData.version === versions[0].version && "(Latest)"}</div>
                         </div>
                         <div>
                            <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Status Code</div>
                            <div style={{fontWeight: 600, fontSize: '1.1rem'}}>{currentVersionData.status}</div>
                         </div>
                     </div>
                     <div>
                        <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Document Hash</div>
                        <HashDisplay value={currentVersionData.hash} />
                     </div>
                     <div>
                        <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Issuer Wallet</div>
                        <HashDisplay value={currentVersionData.issuer} />
                     </div>
                     <div>
                        <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Expiry Date</div>
                        <div style={{fontWeight: 600, fontSize: '1.1rem'}}>{currentVersionData.expiry > 0 ? new Date(currentVersionData.expiry * 1000).toLocaleDateString() : 'Never'}</div>
                     </div>
                  </div>
              </Card>

              <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Search size={18}/> Hash Comparison</div>}>
                 <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem'}}>
                     Cryptographically compare the selected Version {currentVersionData.version} hash with another version to verify integrity across updates.
                 </p>
                 <div style={{marginBottom: '1.5rem'}}>
                     <select className="form-input" value={compareVersion || ''} onChange={e => setCompareVersion(e.target.value ? Number(e.target.value) : null)} style={{width: '100%'}}>
                         <option value="">-- Select a version to compare --</option>
                         {versions.filter(v => v.version !== currentVersionData.version).map(v => (
                             <option key={v.version} value={v.version}>Version {v.version}</option>
                         ))}
                     </select>
                 </div>

                 {compVersionData && (
                     <div style={{background: 'var(--bg-main)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)'}}>
                         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                             <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Version {currentVersionData.version}</span>
                             <span className="mono" style={{fontSize: '0.95rem'}}>{currentVersionData.hash.substring(0, 16)}...</span>
                         </div>
                         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                             <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Version {compVersionData.version}</span>
                             <span className="mono" style={{fontSize: '0.95rem'}}>{compVersionData.hash.substring(0, 16)}...</span>
                         </div>
                         <div style={{marginTop: '0.5rem', textAlign: 'center'}}>
                             {currentVersionData.hash === compVersionData.hash ? (
                                 <Badge type="success">Hashes Match Exactly</Badge>
                             ) : (
                                 <Badge type="warning">Hashes Differ Cryptographically</Badge>
                             )}
                         </div>
                     </div>
                 )}
              </Card>
          </div>
      </div>
    </div>
  );
}
