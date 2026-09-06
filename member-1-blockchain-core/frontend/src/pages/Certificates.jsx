import React, { useState, useEffect } from 'react';
import { Card, Badge, HashDisplay, Modal } from '../components/common/Components';
import { LoadingState, EmptyState, TransactionStatus, Toast } from '../components/common/UIStates';
import { Plus, Search, Eye, Ban, History, FileCheck } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { useNavigate } from 'react-router-dom';

export default function Certificates() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Transaction State
  const [txStatus, setTxStatus] = useState(null); // 'waiting-wallet', 'submitted', 'confirmed', 'error'
  const [txHash, setTxHash] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null); // { title, message, type }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ instId: '', certId: '', hash: '', expiry: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadCredentials();
  }, [blockchainService.provider]);

  const loadCredentials = async () => {
    try {
      if (!blockchainService.provider) return;
      setLoading(true);
      const data = await blockchainService.getAllEvents();

      // We map the issued events, check if they are in revoked
      const revokedSet = new Set(data.revoked.map(r => r.certId));

      const enriched = data.issued.map(cert => ({
        ...cert,
        status: revokedSet.has(cert.certId) ? 'REVOKED' : 'ACTIVE',
        issueDate: new Date(Number(cert.timestamp) * 1000).toLocaleDateString()
      }));

      setCredentials(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      setTxStatus('waiting-wallet');
      setIsModalOpen(false);

      const expiryTimestamp = formData.expiry ? Math.floor(new Date(formData.expiry).getTime() / 1000) : 0;

      // Start transaction
      const tx = await blockchainService.digitalCredential.issueCertificate(
        formData.instId,
        formData.certId,
        formData.hash,
        expiryTimestamp
      );

      setTxStatus('submitted');
      setTxHash(tx.hash);

      await tx.wait();
      setTxStatus('confirmed');

      setToast({
        type: 'success',
        title: 'Credential Issued Successfully',
        message: `ID: ${formData.certId}`
      });

      loadCredentials();
    } catch (err) {
      console.error(err);
      setTxStatus('error');
    }
  };

  const handleRevoke = async (certId) => {
    const instId = prompt(`Enter Institution ID to revoke credential ${certId}:`);
    if (!instId) return;

    try {
      setTxStatus('waiting-wallet');
      const tx = await blockchainService.digitalCredential.revokeCertificate(instId, certId);

      setTxStatus('submitted');
      setTxHash(tx.hash);

      await tx.wait();
      setTxStatus('confirmed');

      setToast({
        type: 'success',
        title: 'Credential Revoked',
        message: `ID: ${certId}`
      });

      loadCredentials();
    } catch (err) {
      console.error(err);
      setTxStatus('error');
    }
  };

  const filtered = credentials.filter(c =>
    c.certId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Credentials</h1>
          <p className="page-subtitle">Manage issuance, revocation, and versions of digital credentials.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Issue Credential
        </button>
      </div>

      {toast && (
        <Toast title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <TransactionStatus
        status={txStatus}
        hash={txHash}
        onClose={() => { setTxStatus(null); setTxHash(null); }}
      />

      <Card>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Credential ID or Issuer Address..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading credentials from blockchain..." />
        ) : filtered.length === 0 ? (
          <EmptyState
             icon={FileCheck}
             title="No Credentials Found"
             description="There are no credentials matching your criteria."
             action={
               <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Issue Credential</button>
             }
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Credential ID</th>
                  <th>Issuer</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cert, idx) => (
                  <tr key={idx}>
                    <td className="mono" style={{ fontWeight: 500 }}>{cert.certId}</td>
                    <td className="mono" style={{ fontSize: '0.85rem' }}>{cert.issuer.substring(0, 10)}...</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{cert.issueDate}</td>
                    <td>
                      <Badge type={cert.status === 'ACTIVE' ? 'success' : 'danger'}>{cert.status}</Badge>
                    </td>
                    <td style={{textAlign: 'right', whiteSpace: 'nowrap'}}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => navigate(`/credentials/${cert.certId}`)} title="View Details">
                          <Eye size={16} />
                        </button>
                        {cert.status === 'ACTIVE' && (
                          <button className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => handleRevoke(cert.certId)} title="Revoke">
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue New Credential">
        <form onSubmit={handleIssue}>
          <div className="form-group">
            <label className="form-label">Institution ID</label>
            <input className="form-input" required value={formData.instId} onChange={e => setFormData({...formData, instId: e.target.value})} placeholder="e.g. INST-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Credential ID</label>
            <input className="form-input" required value={formData.certId} onChange={e => setFormData({...formData, certId: e.target.value})} placeholder="e.g. CERT-2026-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Document Hash (SHA-256)</label>
            <input className="form-input mono" required value={formData.hash} onChange={e => setFormData({...formData, hash: e.target.value})} placeholder="0x..." />
          </div>
          <div className="form-group">
            <label className="form-label">Expiration Date (Optional)</label>
            <input type="datetime-local" className="form-input" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Issue on Blockchain</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
