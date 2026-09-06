import React, { useState, useEffect } from 'react';
import { Card, Badge, Modal } from '../components/common/Components';
import { LoadingState, EmptyState, TransactionStatus, Toast } from '../components/common/UIStates';
import { Plus, Search, Building2 } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', wallet: '' });

  useEffect(() => {
    loadInstitutions();
  }, [blockchainService.provider]);

  const loadInstitutions = async () => {
    try {
      if (!blockchainService.provider) return;
      setLoading(true);
      const loaded = await blockchainService.getAllRegisteredInstitutions();
      setInstitutions(loaded.map(i => ({
        id: i.id,
        name: i.name,
        wallet: i.wallet,
        status: i.isActive ? 'ACTIVE' : 'INACTIVE'
      })));
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setTxStatus('waiting-wallet');
      setIsModalOpen(false);

      const tx = await blockchainService.registerInstitution(formData.id, formData.name, formData.wallet);

      setTxStatus('submitted');
      setTxHash(tx.hash);

      await tx.wait();
      setTxStatus('confirmed');

      setToast({
        type: 'success',
        title: 'Institution Registered',
        message: `${formData.name} (${formData.id}) has been registered.`
      });

      loadInstitutions();
    } catch (err) {
      console.error(err);
      setTxStatus('error');
    }
  };

  const filtered = institutions.filter(inst => {
    const search = (searchTerm || "").toLowerCase();
    const safeName = (inst.name || "").toLowerCase();
    const safeId = (inst.id || "").toLowerCase();
    const safeWallet = (inst.wallet || "").toLowerCase();

    return safeName.includes(search) || safeId.includes(search) || safeWallet.includes(search);
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Trusted Institutions</h1>
          <p className="page-subtitle">Manage accredited organizations capable of issuing credentials.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Register Institution
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
              placeholder="Search institutions..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading institutions from blockchain..." />
        ) : filtered.length === 0 ? (
          <EmptyState
             icon={Building2}
             title="No Institutions Found"
             description="There are no institutions matching your criteria."
             action={<button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Register Institution</button>}
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Institution ID</th>
                  <th>Name</th>
                  <th>Wallet Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{inst.id}</td>
                    <td>{inst.name}</td>
                    <td className="mono" style={{ fontSize: '0.85rem' }}>{inst.wallet}</td>
                    <td><Badge type="success">{inst.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Institution">
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Institution ID</label>
            <input className="form-input" required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="e.g. INST-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Institution Name</label>
            <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Global Tech University" />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Wallet Address</label>
            <input className="form-input mono" required value={formData.wallet} onChange={e => setFormData({...formData, wallet: e.target.value})} placeholder="0x..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register on Blockchain</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
