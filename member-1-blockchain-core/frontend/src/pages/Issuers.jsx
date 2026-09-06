import React, { useState, useEffect } from 'react';
import { Card, Badge, Modal } from '../components/common/Components';
import { LoadingState, EmptyState, TransactionStatus, Toast } from '../components/common/UIStates';
import { Plus, Search, Users } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Issuers() {
  const [issuers, setIssuers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ instId: '', wallet: '' });

  useEffect(() => {
    loadIssuers();
  }, [blockchainService.provider]);

  const loadIssuers = async () => {
    try {
      if (!blockchainService.provider) return;
      setLoading(true);
      const instReg = blockchainService.institutionRegistry;

      // Query registered institutions to resolve human-readable names
      const instFilter = instReg.filters.InstitutionRegistered();
      const instEvents = await instReg.queryFilter(instFilter, 0, "latest");
      const instNameMap = new Map();
      instEvents.forEach(e => {
        const h = typeof e.args[0] === 'string' ? e.args[0] : (e.args[0]?.hash || String(e.args[0] || ''));
        instNameMap.set(h, e.args[1] || 'Unknown Institution');
      });

      const authFilter = instReg.filters.IssuerAuthorized();
      const authEvents = await instReg.queryFilter(authFilter, 0, "latest");

      const revokedFilter = instReg.filters.IssuerRevoked();
      const revokedEvents = await instReg.queryFilter(revokedFilter, 0, "latest");

      const revokedSet = new Set(revokedEvents.map(e => {
        const rId = typeof e.args[0] === 'string' ? e.args[0] : (e.args[0]?.hash || String(e.args[0] || ''));
        const rWallet = typeof e.args[1] === 'string' ? e.args[1] : String(e.args[1] || '');
        return `${rId}-${rWallet}`;
      }));

      const loaded = authEvents.map(e => {
        const idRaw = e.args[0];
        const safeHash = typeof idRaw === 'string' ? idRaw : (idRaw?.hash || String(idRaw || ''));
        const displayName = instNameMap.get(safeHash) || (safeHash.length > 20 ? `${safeHash.substring(0, 10)}...${safeHash.substring(safeHash.length - 6)}` : safeHash);
        const wallet = typeof e.args[1] === 'string' ? e.args[1] : String(e.args[1] || '');
        const key = `${safeHash}-${wallet}`;
        return {
          instId: displayName,
          rawId: safeHash,
          wallet,
          status: revokedSet.has(key) ? 'REVOKED' : 'AUTHORIZED'
        };
      });

      // Deduplicate keeping latest status
      const uniqueMap = new Map();
      loaded.forEach(item => {
        uniqueMap.set(`${item.rawId}-${item.wallet}`, item);
      });

      setIssuers(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (e) => {
    e.preventDefault();
    try {
      setTxStatus('waiting-wallet');
      setIsModalOpen(false);

      const tx = await blockchainService.authorizeIssuer(formData.instId, formData.wallet);

      setTxStatus('submitted');
      setTxHash(tx.hash);

      await tx.wait();
      setTxStatus('confirmed');

      setToast({
        type: 'success',
        title: 'Issuer Authorized',
        message: `Wallet ${formData.wallet.substring(0,6)}... has been authorized for ${formData.instId}.`
      });

      loadIssuers();
    } catch (err) {
      console.error(err);
      setTxStatus('error');
    }
  };

  const filtered = (issuers || []).filter(iss => {
    const term = (searchTerm || '').toLowerCase();
    const matchInst = String(iss.instId || '').toLowerCase().includes(term);
    const matchWallet = String(iss.wallet || '').toLowerCase().includes(term);
    return matchInst || matchWallet;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Authorized Issuers</h1>
          <p className="page-subtitle">Manage personnel authorized to issue credentials on behalf of institutions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Authorize Issuer
        </button>
      </div>

      {toast && <Toast title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <TransactionStatus status={txStatus} hash={txHash} onClose={() => { setTxStatus(null); setTxHash(null); }} />

      <Card>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Institution ID or Wallet..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading issuers from blockchain..." />
        ) : filtered.length === 0 ? (
          <EmptyState
             icon={Users}
             title="No Issuers Found"
             description="There are no authorized issuers matching your criteria."
             action={<button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Authorize Issuer</button>}
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Institution ID</th>
                  <th>Issuer Wallet Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((iss, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{iss.instId}</td>
                    <td className="mono" style={{ fontSize: '0.9rem' }}>{iss.wallet}</td>
                    <td>
                      <Badge type={iss.status === 'AUTHORIZED' ? 'success' : 'danger'}>{iss.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Authorize Issuer">
        <form onSubmit={handleAuthorize}>
          <div className="form-group">
            <label className="form-label">Institution ID</label>
            <input className="form-input" required value={formData.instId} onChange={e => setFormData({...formData, instId: e.target.value})} placeholder="e.g. INST-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Issuer Wallet Address</label>
            <input className="form-input mono" required value={formData.wallet} onChange={e => setFormData({...formData, wallet: e.target.value})} placeholder="0x..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Authorize on Blockchain</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
