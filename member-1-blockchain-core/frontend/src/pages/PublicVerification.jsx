import React, { useState, useEffect } from 'react';
import { Card, HashDisplay } from '../components/common/Components';
import { Search, CheckCircle, XCircle, AlertTriangle, Clock, Shield, ArrowLeft, Upload, FileText } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';

export default function PublicVerification() {
  const [searchParams] = useSearchParams();
  const [certId, setCertId] = useState(searchParams.get('id') || searchParams.get('certId') || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const idFromUrl = searchParams.get('id') || searchParams.get('certId');
    if (idFromUrl) {
      setCertId(idFromUrl);
    }
  }, [searchParams]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certId.trim()) {
      alert('Please enter a Credential ID');
      return;
    }
    if (!selectedFile) {
      alert('Please select a certificate PDF file');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append('certificateId', certId.trim());
      formData.append('pdf', selectedFile);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/certificates/verify`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok && data.error && !data.status) {
        throw new Error(data.error || 'Verification request failed');
      }

      const statusText = data.status || 'NOT_FOUND';
      let version = data.version != null ? data.version.toString() : '-';
      let details = null;

      if (['VALID', 'TAMPERED', 'REVOKED', 'EXPIRED'].includes(statusText) && blockchainService.digitalCredential) {
        try {
          const certRegAddress = await blockchainService.digitalCredential.certificateRegistry();
          const certReg = new ethers.Contract(certRegAddress, [
            "function certificates(string) view returns (string, string, address, uint256, uint8, uint256)"
          ], blockchainService.provider);

          const cert = await certReg.certificates(certId.trim());
          if (cert && cert[0] === certId.trim()) {
            details = {
              id: cert[0],
              hash: cert[1],
              issuer: cert[2],
              expiry: cert[3].toString(),
              status: cert[4],
              version: cert[5].toString()
            };
          }
        } catch (err) {
          console.log("Could not fetch details", err);
        }
      }

      setResult({ status: statusText, version, details, certificateId: data.certificateId || certId.trim() });

    } catch (err) {
      console.error('Verification error:', err);
      setResult({ status: 'ERROR', message: err.message });
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
               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
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
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ border: 'none', background: 'transparent' }}>
          <ArrowLeft size={18} /> Back to Home
        </button>
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
                <input className="form-input" required placeholder="e.g. CERT-2026-001" value={certId} onChange={e => setCertId(e.target.value)} style={{ padding: '1rem', fontSize: '1rem' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Certificate PDF</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.75rem',
                  textAlign: 'center',
                  background: 'var(--bg-main)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    required
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none' }}>
                    {selectedFile ? (
                      <>
                        <FileText size={36} color="var(--primary)" />
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>{selectedFile.name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({(selectedFile.size / 1024).toFixed(1)} KB) — Click to change file</span>
                      </>
                    ) : (
                      <>
                        <Upload size={36} color="var(--text-muted)" />
                        <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '1.05rem' }}>Choose Certificate PDF</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click to browse or drag and drop candidate PDF</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }} disabled={loading}>
                {loading ? 'Verifying certificate...' : 'Verify Credential'}
              </button>
            </form>
          </Card>

          {getStatusDisplay()}
        </div>
      </main>
    </div>
  );
}
