import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, HashDisplay } from '../components/common/Components';
import { 
  Award, Shield, CheckCircle2, AlertTriangle, Loader2, Download, 
  Eye, Calendar, User, FileText, Building2, Hash, 
  RefreshCw, XCircle, QrCode
} from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { createCanonicalCredentialPayload, generateCredentialHash } from '../utils/crypto';
import { generateQrCodeDataUrl, downloadCertificatePdf, getCertificatePdfBlobUrl } from '../utils/certificatePdf';
import { useNavigate } from 'react-router-dom';

export default function GenerateCertificate({ wallet: propWallet, connect: propConnect }) {
  const navigate = useNavigate();

  // State
  const [wallet, setWallet] = useState(propWallet || null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authorizedInstitutions, setAuthorizedInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');

  // Form inputs
  const [formData, setFormData] = useState(() => ({
    studentName: '',
    certificateId: `CERT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    purpose: 'Successful Completion of Blockchain Technology Course',
    customPurpose: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryOption: 'never', // 'never' or 'custom'
    expiryDate: ''
  }));

  // Flow & Progress State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); 
  // 1: Form Validation & Hash Generation, 2: Waiting for Wallet, 3: Mining Transaction, 4: Generating PDF, 5: Complete
  const [stepMessage, setStepMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Completed Certificate Data
  const [completedCert, setCompletedCert] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const checkIssuerAuthorization = useCallback(async () => {
    try {
      setLoadingAuth(true);
      setErrorMessage(null);

      // Check connected wallet
      let userWallet = propWallet || null;
      if (!userWallet && blockchainService.signer) {
        userWallet = await blockchainService.signer.getAddress();
      } else if (!userWallet && window.ethereum?.selectedAddress) {
        userWallet = window.ethereum.selectedAddress;
      }

      setWallet(userWallet);

      if (!userWallet) {
        setAuthorizedInstitutions([]);
        setLoadingAuth(false);
        return;
      }

      const authorized = await blockchainService.getAuthorizedInstitutionsForIssuer(userWallet);
      setAuthorizedInstitutions(authorized);

      if (authorized.length > 0) {
        setSelectedInstId(authorized[0].id);
      }
    } catch (err) {
      console.error('Error checking issuer authorization:', err);
    } finally {
      setLoadingAuth(false);
    }
  }, [propWallet]);

  // Check authorization on mount or wallet change
  useEffect(() => {
    checkIssuerAuthorization();
  }, [checkIssuerAuthorization]);

  const selectedInst = authorizedInstitutions.find(i => i.id === selectedInstId) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet) {
      alert('Please connect your MetaMask wallet before generating a certificate.');
      return;
    }

    if (!selectedInst) {
      setErrorMessage('Your wallet is not authorized to issue credentials for any active institution.');
      return;
    }

    if (!formData.studentName.trim()) {
      alert('Student Name is required.');
      return;
    }

    if (!formData.certificateId.trim()) {
      alert('Certificate ID is required.');
      return;
    }

    const finalPurpose = formData.purpose === 'Custom...'
      ? formData.customPurpose.trim()
      : formData.purpose;

    if (!finalPurpose) {
      alert('Please select or specify the purpose of the certificate.');
      return;
    }

    // Calculate expiry timestamp
    let expiryTimestamp = 0;
    if (formData.expiryOption === 'custom' && formData.expiryDate) {
      expiryTimestamp = Math.floor(new Date(formData.expiryDate).getTime() / 1000);
      if (expiryTimestamp <= Math.floor(Date.now() / 1000)) {
        alert('Expiry date must be in the future.');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setCompletedCert(null);

      // Step 1: Form Validation & Canonical Hashing
      setCurrentStep(1);
      setStepMessage('Generating deterministic cryptographic hash from canonical credential payload...');
      await new Promise(r => setTimeout(r, 600));

      const canonicalData = {
        certificateId: formData.certificateId.trim(),
        institutionId: selectedInst.id,
        institutionName: selectedInst.name,
        studentName: formData.studentName.trim(),
        purpose: finalPurpose,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryOption === 'custom' ? formData.expiryDate : 'Never'
      };

      const canonicalPayload = createCanonicalCredentialPayload(canonicalData);
      const certHash = generateCredentialHash(canonicalPayload);

      // Step 2: Waiting for Wallet Confirmation
      setCurrentStep(2);
      setStepMessage('Waiting for MetaMask transaction signature...');

      // Step 3: Submitting to Blockchain and Waiting for Mining
      setCurrentStep(3);
      setStepMessage('Submitting transaction to blockchain network and awaiting block confirmation...');

      const proof = await blockchainService.issueCertificateWithProof(
        selectedInst.id,
        canonicalData.certificateId,
        certHash,
        expiryTimestamp
      );

      setStepMessage(`Transaction mined in Block #${proof.blockNumber}! Generating official certificate PDF...`);

      // Step 4: Generate Public Verification URL and QR Code
      setCurrentStep(4);
      const verificationUrl = `${window.location.origin}/verify?id=${encodeURIComponent(canonicalData.certificateId)}&hash=${encodeURIComponent(certHash)}`;
      const qrDataUrl = await generateQrCodeDataUrl(verificationUrl);
      setQrCodeUrl(qrDataUrl);

      // Prepare final Certificate Object with real blockchain proof
      const finalCertificateData = {
        ...canonicalData,
        certificateHash: certHash,
        transactionHash: proof.transactionHash,
        blockNumber: proof.blockNumber,
        blockHash: proof.blockHash,
        issuerWallet: wallet,
        verificationUrl,
        minedTimestamp: proof.minedTimestamp
      };

      // Generate Blob URL for in-app preview
      const blobUrl = getCertificatePdfBlobUrl(finalCertificateData, qrDataUrl);
      setPreviewBlobUrl(blobUrl);

      // Cache metadata locally for list & details views
      blockchainService.saveCertificateMetadata(finalCertificateData);

      // Step 5: Complete!
      setCompletedCert(finalCertificateData);
      setCurrentStep(5);
      setStepMessage('Certificate successfully anchored to blockchain and official PDF generated!');

    } catch (err) {
      console.error('Certificate generation failed:', err);
      let msg = err.reason || err.message || 'Unknown blockchain error occurred';
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        msg = 'Transaction rejected by user in MetaMask.';
      } else if (msg.includes('CertificateAlreadyExists')) {
        msg = `Certificate ID "${formData.certificateId}" already exists on-chain. Please choose a unique ID.`;
      } else if (msg.includes('UnauthorizedIssuer')) {
        msg = 'Your wallet is not authorized to issue certificates for this institution.';
      }
      setErrorMessage(msg);
      setCurrentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (completedCert && qrCodeUrl) {
      downloadCertificatePdf(completedCert, qrCodeUrl, `${completedCert.certificateId}_certificate.pdf`);
    }
  };

  const handleReset = () => {
    setCompletedCert(null);
    setQrCodeUrl('');
    setPreviewBlobUrl('');
    setCurrentStep(0);
    setErrorMessage(null);
    setFormData({
      studentName: '',
      certificateId: `CERT-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      purpose: 'Successful Completion of Blockchain Technology Course',
      customPurpose: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryOption: 'never',
      expiryDate: ''
    });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            color: 'var(--text-inverse)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Award size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Generate Digital Certificate</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
              Issue verifiable cryptographic academic credentials directly to the blockchain with tamper-evident PDF generation.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          color: 'var(--danger-text)'
        }}>
          <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Issuance Failed</strong>
            <span style={{ fontSize: '0.9rem' }}>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Loading Auth State */}
      {loadingAuth ? (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
            <Loader2 size={36} className="spin" color="var(--primary)" />
            <span style={{ color: 'var(--text-muted)' }}>Verifying issuer blockchain permissions...</span>
          </div>
        </Card>
      ) : !wallet ? (
        /* Wallet Not Connected Card */
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Shield size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Wallet Not Connected</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
              Please connect your authorized institution issuer wallet to access the certificate generation system.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={async () => {
                if (propConnect) {
                  await propConnect();
                } else {
                  await blockchainService.connectWallet();
                }
                checkIssuerAuthorization();
              }}
            >
              Connect Wallet
            </button>
          </div>
        </Card>
      ) : authorizedInstitutions.length === 0 ? (
        /* Unauthorized Wallet Alert */
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <XCircle size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Unauthorized Issuer Wallet
            </h3>
            <p style={{ color: 'var(--danger-text)', fontWeight: 600, fontSize: '1.05rem', margin: '0 auto 0.75rem', maxWidth: '600px' }}>
              "Your wallet is not authorized to issue credentials for this institution."
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto 1.5rem' }}>
              Connected Wallet: <code style={{ wordBreak: 'break-all' }}>{wallet}</code>
              <br />
              Only authorized institution representatives or registered institution wallets can perform cryptographic certificate issuance.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/issuers')}>
                View Authorized Issuers
              </button>
              <button className="btn btn-secondary" onClick={checkIssuerAuthorization}>
                <RefreshCw size={16} /> Re-check Authorization
              </button>
            </div>
          </div>
        </Card>
      ) : completedCert ? (
        /* Success Screen with Real Blockchain Proof & Download */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Certificate Successfully Issued & Anchored</h2>
                  <Badge type="success">BLOCKCHAIN VERIFIED</Badge>
                </div>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                  Cryptographic proof has been confirmed on-chain in Block #{completedCert.blockNumber}.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => setShowPreviewModal(true)}>
                  <Eye size={18} /> View Certificate
                </button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={18} /> Download PDF
                </button>
              </div>
            </div>

            {/* Blockchain Proof Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Certificate ID</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{completedCert.certificateId}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Name</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{completedCert.studentName}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Institution</span>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>{completedCert.institutionName}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Block Number</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem', color: 'var(--primary)' }}>
                  Block #{completedCert.blockNumber}
                </div>
              </div>
            </div>

            {/* Cryptographic Hashes Details */}
            <div style={{
              marginTop: '1.5rem',
              background: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    1. Certificate Content Hash (SHA-256)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deterministic Payload Hash</span>
                </div>
                <HashDisplay value={completedCert.certificateHash} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    2. Blockchain Transaction Hash
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-Chain Receipt</span>
                </div>
                <HashDisplay value={completedCert.transactionHash} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    3. Blockchain Block Hash
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mined Block Identifier</span>
                </div>
                <HashDisplay value={completedCert.blockHash} />
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={handleReset}>
                <RefreshCw size={16} /> Issue Another Certificate
              </button>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/verify?id=${encodeURIComponent(completedCert.certificateId)}&hash=${encodeURIComponent(completedCert.certificateHash)}`)}
                >
                  <QrCode size={16} /> Verify Credential
                </button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={16} /> Download Certificate PDF
                </button>
              </div>
            </div>
          </Card>

          {/* Inline PDF Preview Card */}
          {previewBlobUrl && (
            <Card title="Generated Certificate Preview">
              <div style={{ width: '100%', height: '540px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <iframe 
                  src={previewBlobUrl} 
                  title="Certificate PDF Preview" 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* Certificate Generation Form */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Main Form Area */}
          <div style={{ gridColumn: 'span 2' }}>
            <Card>
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="var(--primary)" /> Credential Information
                </h3>

                {/* Institution (Read-Only / Derived) */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} color="var(--primary)" /> Issuing Institution / College
                  </label>
                  {authorizedInstitutions.length === 1 ? (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedInst.name}</span>
                      <Badge type="info">{selectedInst.id}</Badge>
                    </div>
                  ) : (
                    <select
                      className="form-input"
                      value={selectedInstId}
                      onChange={e => setSelectedInstId(e.target.value)}
                    >
                      {authorizedInstitutions.map(inst => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.id})
                        </option>
                      ))}
                    </select>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Automatically bound to your authorized institution identity on-chain.
                  </span>
                </div>

                {/* Student Name */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={16} color="var(--primary)" /> Student Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    required
                    value={formData.studentName}
                    onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </div>

                {/* Certificate ID */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Hash size={16} color="var(--primary)" /> Unique Certificate ID *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CERT-2026-001"
                      required
                      value={formData.certificateId}
                      onChange={e => setFormData({ ...formData, certificateId: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setFormData({
                        ...formData,
                        certificateId: `CERT-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`
                      })}
                      title="Generate new ID"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Must be unique in the CertificateRegistry smart contract.
                  </span>
                </div>

                {/* Purpose / Course */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={16} color="var(--primary)" /> Certificate Purpose / Degree *
                  </label>
                  <select
                    className="form-input"
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    style={{ marginBottom: formData.purpose === 'Custom...' ? '0.75rem' : '0' }}
                  >
                    <option value="Successful Completion of Blockchain Technology Course">
                      Successful Completion of Blockchain Technology Course
                    </option>
                    <option value="Bachelor of Technology in Computer Science & Engineering">
                      Bachelor of Technology in Computer Science & Engineering
                    </option>
                    <option value="Internship Completion Certificate">
                      Internship Completion Certificate
                    </option>
                    <option value="Academic Excellence & Merit Award">
                      Academic Excellence & Merit Award
                    </option>
                    <option value="Advanced Web3 & Smart Contracts Masterclass">
                      Advanced Web3 & Smart Contracts Masterclass
                    </option>
                    <option value="Custom...">Custom Purpose / Course...</option>
                  </select>

                  {formData.purpose === 'Custom...' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type custom certificate purpose..."
                      required
                      value={formData.customPurpose}
                      onChange={e => setFormData({ ...formData, customPurpose: e.target.value })}
                    />
                  )}
                </div>

                {/* Dates Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={16} color="var(--primary)" /> Issue Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.issueDate}
                      onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={16} color="var(--primary)" /> Expiry Date
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="expiryOption"
                          value="never"
                          checked={formData.expiryOption === 'never'}
                          onChange={() => setFormData({ ...formData, expiryOption: 'never', expiryDate: '' })}
                        />
                        Never Expires
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="expiryOption"
                          value="custom"
                          checked={formData.expiryOption === 'custom'}
                          onChange={() => setFormData({ ...formData, expiryOption: 'custom' })}
                        />
                        Custom Date
                      </label>
                    </div>

                    {formData.expiryOption === 'custom' && (
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={formData.expiryDate}
                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                {/* Progress Indicators if processing */}
                {isProcessing && (
                  <div style={{
                    padding: '1.25rem',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <Loader2 size={20} className="spin" color="var(--primary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{stepMessage}</span>
                    </div>

                    {/* Step progress pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { num: 1, label: 'Deterministic Hash' },
                        { num: 2, label: 'MetaMask Sign' },
                        { num: 3, label: 'Block Mining' },
                        { num: 4, label: 'Generate PDF' }
                      ].map(s => (
                        <div key={s.num} style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: currentStep >= s.num ? 'var(--primary)' : 'var(--border-subtle)',
                          color: currentStep >= s.num ? 'var(--text-inverse)' : 'var(--text-muted)',
                          fontWeight: currentStep === s.num ? 700 : 500
                        }}>
                          {s.num}. {s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="spin" /> Processing Blockchain Issuance...
                    </>
                  ) : (
                    <>
                      <Award size={20} /> Generate & Issue Certificate
                    </>
                  )}
                </button>
              </form>
            </Card>
          </div>

          {/* Information & Architecture Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card title="Security & Integrity">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Shield size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>Zero Circular Dependency</strong>
                    Canonical credential data is hashed before blockchain transmission, ensuring cryptographic purity.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>Real Block Provenance</strong>
                    Block number, block hash, and transaction hash are captured from the actual mined block receipt.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <QrCode size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>Instant QR Verification</strong>
                    Every certificate embeds a public verification QR code that requires zero wallet connection to audit.
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Active Issuer Identity">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Connected Wallet:</span>
                  <div style={{ marginTop: '0.2rem' }}>
                    <HashDisplay value={wallet} />
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Authorized Institutions:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {authorizedInstitutions.map(inst => (
                      <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{inst.name}</span>
                        <Badge type="success">Authorized</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PDF Modal Preview */}
      {showPreviewModal && previewBlobUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '1000px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                Certificate Preview ({completedCert?.certificateId})
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={16} /> Download
                </button>
                <button className="btn btn-secondary" onClick={() => setShowPreviewModal(false)}>
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#525659' }}>
              <iframe
                src={previewBlobUrl}
                title="Full Certificate Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
