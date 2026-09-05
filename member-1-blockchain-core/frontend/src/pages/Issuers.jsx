import React, { useState, useEffect } from 'react';
import { Card, Badge, HashDisplay, Modal } from '../components/common/Components';
import { Plus, Users } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Issuers() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ instId: '', wallet: '' });
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    loadEvents();
  }, [blockchainService.provider]);

  const loadEvents = async () => {
    if (!blockchainService.provider) return;
    try {
      const authFilter = blockchainService.institutionRegistry.filters.IssuerAuthorized();
      const rawEvents = await blockchainService.institutionRegistry.queryFilter(authFilter, 0, "latest");
      
      const list = await Promise.all(rawEvents.map(async (e) => {
        const isAuth = await blockchainService.institutionRegistry.isAuthorizedIssuer(e.args[0], e.args[1]);
        return { instId: e.args[0], wallet: e.args[1], active: isAuth };
      }));
      
      // Deduplicate by instId + wallet to show current status
      const uniqueMap = new Map();
      list.forEach(item => {
         uniqueMap.set(`${item.instId}-${item.wallet}`, item);
      });
      
      setEvents(Array.from(uniqueMap.values()));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthorize = async (e) => {
    e.preventDefault();
    try {
      setStatus('Authorizing...');
      await blockchainService.authorizeIssuer(form.instId, form.wallet);
      setStatus('Success');
      setTimeout(() => { setShowModal(false); loadEvents(); setStatus(''); }, 2000);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div>
          <h1 className="page-title">Trusted Issuers</h1>
          <p className="page-subtitle">Manage blockchain authorities permitted to issue credentials.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Authorize Issuer
        </button>
      </div>

      <Card>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Institution ID</th>
                <th>Issuer Wallet</th>
                <th>Authorization Status</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem'}}>No issuers found</td></tr>}
              {events.map((e, idx) => (
                <tr key={idx}>
                  <td style={{fontWeight: 500}}>{e.instId}</td>
                  <td><HashDisplay value={e.wallet} /></td>
                  <td><Badge type={e.active ? "success" : "danger"}>{e.active ? "Authorized" : "Revoked"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Authorize New Issuer">
        {status && <div className={status === 'Success' ? 'badge badge-success' : 'badge badge-danger'} style={{marginBottom: '1rem', width: '100%', padding: '1rem', boxSizing: 'border-box'}}>{status}</div>}
        <form onSubmit={handleAuthorize}>
          <div className="form-group">
            <label className="form-label">Institution ID (e.g., INST-001)</label>
            <input className="form-input" required value={form.instId} onChange={e => setForm({...form, instId: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Issuer Wallet Address (0x...)</label>
            <input className="form-input" required value={form.wallet} onChange={e => setForm({...form, wallet: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Confirm Authorization</button>
        </form>
      </Modal>
    </div>
  );
}
