import React, { useState, useEffect } from 'react';
import { Card, Badge, HashDisplay, Modal } from '../components/common/Components';
import { Plus, Search, Eye, AlertTriangle } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Certificates() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ instId: '', certId: '', hash: '' });
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    loadEvents();
  }, [blockchainService.provider]);

  const loadEvents = async () => {
    if (!blockchainService.provider) return;
    const data = await blockchainService.getAllEvents();
    // In a real app we would map revoked status properly onto the full list
    setEvents(data.issued);
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      setStatus('Issuing...');
      await blockchainService.issueCertificate(form.instId, form.certId, form.hash, 0);
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
          <h1 className="page-title">Credentials Inventory</h1>
          <p className="page-subtitle">Manage digital credentials and their lifecycle.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Issue Credential
        </button>
      </div>

      <Card>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
           <div className="form-input" style={{display: 'flex', alignItems: 'center', width: '300px', padding: '0.5rem 1rem'}}>
             <Search size={16} color="var(--text-muted)" style={{marginRight: '0.5rem'}} />
             <input type="text" placeholder="Search by ID or Hash..." style={{border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-main)'}} />
           </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Credential ID</th>
                <th>Issuer</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No credentials found</td></tr>}
              {events.map((e, idx) => (
                <tr key={idx}>
                  <td style={{fontWeight: 500}}>{e.certId}</td>
                  <td><HashDisplay value={e.issuer} /></td>
                  <td>-</td>
                  <td><Badge type="success">Active</Badge></td>
                  <td>
                    <button className="btn btn-secondary" style={{padding: '0.4rem 0.6rem'}}><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue New Credential">
        {status && <div className={status === 'Success' ? 'badge badge-success' : 'badge badge-danger'} style={{marginBottom: '1rem', width: '100%', padding: '1rem', boxSizing: 'border-box'}}>{status}</div>}
        <form onSubmit={handleIssue}>
          <div className="form-group">
            <label className="form-label">Institution ID</label>
            <input className="form-input" required value={form.instId} onChange={e => setForm({...form, instId: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Credential ID</label>
            <input className="form-input" required value={form.certId} onChange={e => setForm({...form, certId: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Document Hash (0x...)</label>
            <input className="form-input" required value={form.hash} onChange={e => setForm({...form, hash: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Confirm Issuance</button>
        </form>
      </Modal>
    </div>
  );
}
