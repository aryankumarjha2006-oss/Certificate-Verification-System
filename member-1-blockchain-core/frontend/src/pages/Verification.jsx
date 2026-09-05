import React, { useState } from 'react';
import { Card, HashDisplay } from '../components/common/Components';
import { Search, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Verification() {
  const [form, setForm] = useState({ certId: '', hash: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setResult(null);

      const statusNum = await blockchainService.verifyCertificate(form.certId, form.hash);
      const statuses = ["NOT_FOUND", "VALID", "TAMPERED", "REVOKED", "EXPIRED"];
      const statusText = statuses[statusNum];

      // Get additional info if valid
      let version = "-";
      if (statusNum === 1) { // VALID
          version = await blockchainService.getCertificateVersionCount(form.certId);
      }

      setResult({ status: statusText, version: version?.toString() || "-" });

    } catch (err) {
      console.error(err);
      setResult({ status: "ERROR", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!result) return null;

    const displays = {
      VALID: {
        icon: <CheckCircle size={48} color="var(--success)" />,
        title: "Credential Verified",
        desc: "Blockchain proof matches the submitted credential exactly.",
        color: "var(--success)", bg: "var(--success-bg)"
      },
      TAMPERED: {
        icon: <AlertTriangle size={48} color="var(--warning)" />,
        title: "Integrity Check Failed",
        desc: "The submitted credential hash does not match the blockchain record.",
        color: "var(--warning)", bg: "var(--warning-bg)"
      },
      REVOKED: {
        icon: <XCircle size={48} color="var(--danger)" />,
        title: "Credential Revoked",
        desc: "This credential has been permanently revoked by an authorized issuer.",
        color: "var(--danger)", bg: "var(--danger-bg)"
      },
      EXPIRED: {
        icon: <Clock size={48} color="var(--warning)" />,
        title: "Credential Expired",
        desc: "This credential is no longer within its validity period.",
        color: "var(--warning)", bg: "var(--warning-bg)"
      },
      NOT_FOUND: {
        icon: <Search size={48} color="var(--text-muted)" />,
        title: "Credential Not Found",
        desc: "No trusted blockchain record exists for this credential.",
        color: "var(--text-muted)", bg: "var(--border-subtle)"
      }
    };

    const d = displays[result.status] || displays.NOT_FOUND;

    return (
      <div style={{marginTop: '2rem', padding: '2rem', borderRadius: 'var(--radius-lg)', background: d.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: `1px solid ${d.color}`}}>
        <div style={{marginBottom: '1rem'}}>{d.icon}</div>
        <h2 style={{color: d.color, margin: '0 0 0.5rem 0'}}>{d.title}</h2>
        <p style={{color: 'var(--text-main)', margin: 0, opacity: 0.9}}>{d.desc}</p>

        {result.status === "VALID" && (
          <div style={{marginTop: '2rem', width: '100%', maxWidth: '400px', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'left'}}>
             <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Trust Summary</h4>
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}><span>Blockchain Verified</span> <span style={{color: 'var(--success)', fontWeight: 'bold'}}>✓</span></div>
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}><span>Issuer Authorized</span> <span style={{color: 'var(--success)', fontWeight: 'bold'}}>✓</span></div>
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}><span>Hash Match</span> <span style={{color: 'var(--success)', fontWeight: 'bold'}}>✓</span></div>
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}><span>Credential Active</span> <span style={{color: 'var(--success)', fontWeight: 'bold'}}>✓</span></div>
             <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Version</span> <span>{result.version}</span></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
      <div className="page-header" style={{textAlign: 'center', marginBottom: '3rem'}}>
        <h1 className="page-title">Verify a Digital Credential</h1>
        <p className="page-subtitle">Confirm that a credential matches the trusted blockchain record deterministically.</p>
      </div>

      <Card>
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label">Credential ID</label>
            <input className="form-input" required placeholder="e.g. CERT-001" value={form.certId} onChange={e => setForm({...form, certId: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Credential Hash</label>
            <input className="form-input" required placeholder="0x..." value={form.hash} onChange={e => setForm({...form, hash: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem', padding: '0.8rem'}} disabled={loading}>
            {loading ? 'Verifying on Blockchain...' : 'Verify Credential'}
          </button>
        </form>
      </Card>

      {getStatusDisplay()}
    </div>
  );
}
