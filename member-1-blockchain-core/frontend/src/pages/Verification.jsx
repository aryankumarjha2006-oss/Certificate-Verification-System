import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Components';
import { Search, CheckCircle, XCircle, AlertTriangle, Clock, Upload, FileText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Verification() {
  const [searchParams] = useSearchParams();
  const [certId, setCertId] = useState(searchParams.get('id') || searchParams.get('certId') || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
    if (!selectedFile) {
      alert('Please select a certificate PDF file');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      if (certId.trim()) {
        formData.append('certificateId', certId.trim());
      }
      formData.append('pdf', selectedFile);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/certificates/verify`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.requiresManualId) {
        setResult({
          status: 'MANUAL_ID_REQUIRED',
          message: data.message || 'Credential ID could not be detected from this PDF. Enter it manually.'
        });
        return;
      }

      if (!response.ok && data.error && !data.status) {
        throw new Error(data.error || 'Verification request failed');
      }

      setResult({
        status: data.status || 'NOT_FOUND',
        version: data.version != null ? data.version.toString() : '-',
        certificateId: data.certificateId || certId.trim()
      });

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
      },
      MANUAL_ID_REQUIRED: {
        icon: <AlertTriangle size={48} color="var(--warning)" />,
        title: "Credential ID Required",
        desc: result.message || "Credential ID could not be detected from this PDF. Please enter it manually in the input above.",
        color: "var(--warning)", bg: "var(--warning-bg)"
      },
      ERROR: {
        icon: <AlertTriangle size={48} color="var(--danger)" />,
        title: "Verification Error",
        desc: result.message || "Failed to complete verification.",
        color: "var(--danger)", bg: "var(--danger-bg)"
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
            <label className="form-label" style={{ fontWeight: 600 }}>Credential ID <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional - Auto-detected from PDF)</span></label>
            <input className="form-input" placeholder="e.g. CERT-001 (Leave empty to auto-detect from QR)" value={certId} onChange={e => setCertId(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Certificate PDF</label>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
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
                    <FileText size={32} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedFile.name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({(selectedFile.size / 1024).toFixed(1)} KB) — Click to change file</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Choose Certificate PDF</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click to browse or drag and drop candidate PDF</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem', padding: '0.8rem'}} disabled={loading}>
            {loading ? 'Verifying certificate...' : 'Verify Credential'}
          </button>
        </form>
      </Card>

      {getStatusDisplay()}
    </div>
  );
}
