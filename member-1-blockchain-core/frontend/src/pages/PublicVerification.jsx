import React, { useState } from 'react';
import { Card, HashDisplay } from '../components/common/Components';
import { Search, CheckCircle, XCircle, AlertTriangle, Clock, Shield, ArrowLeft, Sun, Moon } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PublicVerification({ theme, toggleTheme }) {
  const [form, setForm] = useState({ certId: '', hash: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.state?.from === 'home') {
      navigate('/');
    } else {
      navigate('/dashboard');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setResult(null);

      const rawStatus = await blockchainService.verifyCertificate(form.certId, form.hash);
      const statuses = ["NOT_FOUND", "VALID", "TAMPERED", "REVOKED", "EXPIRED"];
      const statusText = typeof rawStatus === 'number' ? (statuses[rawStatus] || "NOT_FOUND") : (rawStatus || "NOT_FOUND");

      let version = "-";
      let details = null;
      if (statusText !== "NOT_FOUND") {
          try {
              const vCount = await blockchainService.getCertificateVersionCount(form.certId);
              version = vCount?.toString() || "-";
              const cert = await blockchainService.getCertificate(form.certId);
              if (cert && cert.certificateId === form.certId) {
                  details = {
                      id: cert.certificateId,
                      hash: cert.certificateHash,
                      issuer: cert.issuer,
                      expiry: cert.expiryTimestamp.toString(),
                      status: cert.status,
                      version: cert.version.toString()
                  };
              }
          } catch(err) {
              console.log("Could not fetch details", err);
          }
      }

      setResult({ status: statusText, version: version?.toString() || "-", details });

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
        icon: <CheckCircle size={56} color="var(--success)" />,
        title: "CREDENTIAL VERIFIED",
        desc: "Blockchain proof securely matches the submitted credential.",
        color: "var(--success)", bg: "var(--success-bg)"
      },
      TAMPERED: {
        icon: <AlertTriangle size={56} color="var(--warning)" />,
        title: "CREDENTIAL INTEGRITY FAILED",
        desc: "Submitted hash does not match the trusted blockchain record.",
        color: "var(--warning)", bg: "var(--warning-bg)"
      },
      REVOKED: {
        icon: <XCircle size={56} color="var(--danger)" />,
        title: "CREDENTIAL REVOKED",
        desc: "This credential has been revoked by an authorized issuer.",
        color: "var(--danger)", bg: "var(--danger-bg)"
      },
      EXPIRED: {
        icon: <Clock size={56} color="var(--warning)" />,
        title: "CREDENTIAL EXPIRED",
        desc: "This credential is no longer within its validity period.",
        color: "var(--warning)", bg: "var(--warning-bg)"
      },
      NOT_FOUND: {
        icon: <Search size={56} color="var(--text-muted)" />,
        title: "CREDENTIAL NOT FOUND",
        desc: "No trusted blockchain record exists for this credential ID.",
        color: "var(--text-muted)", bg: "var(--border-subtle)"
      }
    };

    const d = displays[result.status] || displays.NOT_FOUND;

    return (
      <div style={{marginTop: '3rem', animation: 'modal-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1)'}}>
        <div style={{padding: '3rem', borderRadius: 'var(--radius-xl)', background: d.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: `2px solid ${d.color}`, boxShadow: 'var(--shadow-md)'}}>
          <div style={{marginBottom: '1.5rem'}}>{d.icon}</div>
          <h2 style={{color: d.color, margin: '0 0 1rem 0', letterSpacing: '0.05em'}}>{d.title}</h2>
          <p style={{color: 'var(--text-main)', margin: 0, fontSize: '1.1rem'}}>{d.desc}</p>
        </div>

        {result.status === "VALID" && result.details && (
          <div style={{marginTop: '2rem', width: '100%', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'left', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'}}>
             <h3 style={{margin: '0 0 1.5rem 0'}}>Blockchain Proof</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
               <div className="grid-1-1" style={{gap: '1.5rem'}}>
                 <div>
                    <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Credential ID</div>
                    <div style={{fontWeight: 600, fontSize: '1.1rem'}}>{result.details.id}</div>
                 </div>
                 <div>
                    <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Version</div>
                    <div style={{fontWeight: 600, fontSize: '1.1rem'}}>{result.details.version}</div>
                 </div>
               </div>

               <div>
                  <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Issuer</div>
                  <HashDisplay value={result.details.issuer} />
               </div>

               <div>
                  <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem'}}>Trusted Blockchain Hash</div>
                  <HashDisplay value={result.details.hash} />
               </div>

               <hr style={{border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0'}} />

               <h4 style={{margin: '0', color: 'var(--text-muted)'}}>Trust Checklist</h4>
               <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 500}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} color="var(--success)"/> Blockchain Record Found</span>
                    <span style={{color: 'var(--success)'}}>Verified</span>
                 </div>
                 <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 500}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} color="var(--success)"/> Issuer Authorized</span>
                    <span style={{color: 'var(--success)'}}>Verified</span>
                 </div>
                 <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 500}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} color="var(--success)"/> Hash Match</span>
                    <span style={{color: 'var(--success)'}}>Verified</span>
                 </div>
                 <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 500}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} color="var(--success)"/> Credential Status Valid</span>
                    <span style={{color: 'var(--success)'}}>Verified</span>
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="public-layout">
      <header className="public-header" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={32} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '1.75rem', letterSpacing: '-0.025em' }}>CredChain</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleBack} style={{ border: 'none', background: 'transparent' }}>
            <ArrowLeft size={18} /> Back to Home
          </button>
        </div>
      </header>

      <main className="public-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: '650px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '-0.025em' }}>Verify a Digital Credential</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
              Confirm the authenticity and current status of a digital credential using its cryptographic blockchain proof.
            </p>
          </div>

          <Card className="modal-enter" style={{ padding: '2.5rem' }}>
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Credential ID</label>
                <input className="form-input" required placeholder="e.g. CERT-2026-001" value={form.certId} onChange={e => setForm({...form, certId: e.target.value})} style={{ padding: '1rem', fontSize: '1rem' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Document Hash (SHA-256)</label>
                <input className="form-input mono" required placeholder="0x..." value={form.hash} onChange={e => setForm({...form, hash: e.target.value})} style={{ padding: '1rem', fontSize: '1rem' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }} disabled={loading}>
                {loading ? 'Verifying on Blockchain...' : 'Verify Credential'}
              </button>
            </form>
          </Card>

          {getStatusDisplay()}
        </div>
      </main>
    </div>
  );
}
