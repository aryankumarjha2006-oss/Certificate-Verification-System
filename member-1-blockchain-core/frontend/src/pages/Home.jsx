import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, FileCheck, CheckCircle, ArrowRight, ShieldCheck, Database, Layers } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { Badge } from '../components/common/Components';

export default function Home() {
  const navigate = useNavigate();
  const [networkStatus, setNetworkStatus] = React.useState('Checking...');
  const [walletStatus, setWalletStatus] = React.useState('Not Connected');
  const [contractStatus, setContractStatus] = React.useState('Checking...');

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const provider = new window.ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setNetworkStatus(network.name === 'unknown' ? 'Local Development' : network.name);

          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletStatus('Connected');
          }

          if (blockchainService.digitalCredential) {
            setContractStatus('Available');
          } else {
            setContractStatus('Unavailable (Connect Wallet)');
          }
        } else {
          setNetworkStatus('No Web3 Provider');
          setContractStatus('Unavailable');
        }
      } catch (err) {
        setNetworkStatus('Error');
      }
    };
    checkStatus();
  }, []);

  return (
    <div className="public-layout">
      <header className="public-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={32} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '1.75rem', letterSpacing: '-0.025em' }}>CredChain</h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/verify')}>
            <Search size={18} /> Verify Credential
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Open Admin Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </header>

      <main className="public-main">
        {/* Hero Section */}
        <section style={{ padding: '6rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4rem', background: 'linear-gradient(135deg, var(--bg-main) 0%, var(--bg-card) 100%)' }}>
          <div style={{ flex: 1, maxWidth: '600px' }}>
            <Badge type="primary" style={{ marginBottom: '1.5rem' }}>Enterprise Web3 Verification</Badge>
            <h1 style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--primary)', letterSpacing: '-0.025em' }}>
              Trust Every Credential.
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Blockchain-powered digital credentials with transparent, tamper-evident verification and complete lifecycle management.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => navigate('/verify')} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Verify a Credential
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Open Admin Dashboard
              </button>
            </div>

            {/* Trust Indicators */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                <CheckCircle size={18} color="var(--success)" /> Blockchain Verified
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                <CheckCircle size={18} color="var(--success)" /> Tamper-Evident
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {/* Elegant Abstract Blockchain Visual */}
            <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ padding: '1rem 2rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                <FileCheck size={24} color="var(--accent)" /> Credential
              </div>
              <div style={{ height: '30px', width: '2px', background: 'var(--border)' }}></div>
              <div style={{ padding: '1rem 2rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                <Database size={24} color="var(--secondary)" /> Cryptographic Hash
              </div>
              <div style={{ height: '30px', width: '2px', background: 'var(--border)' }}></div>
              <div style={{ padding: '1rem 2rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                <Layers size={24} color="var(--primary)" /> Blockchain Proof
              </div>
              <div style={{ height: '30px', width: '2px', background: 'var(--border)' }}></div>
              <div style={{ padding: '1rem 2rem', background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, color: 'var(--success-text)' }}>
                <ShieldCheck size={24} /> Verification
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '6rem 4rem', background: 'var(--bg-card)' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Product Features</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Comprehensive infrastructure for issuing and managing trusted credentials.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
             {[
               { icon: FileCheck, title: "Credential Issuance", desc: "Issue trusted digital credentials directly to the blockchain." },
               { icon: ShieldCheck, title: "Blockchain Verification", desc: "Verify credential integrity against cryptographic blockchain proofs." },
               { icon: Layers, title: "Credential Lifecycle", desc: "Manage issuance, expiration, revocation, and robust versioning." },
               { icon: CheckCircle, title: "Trusted Issuers", desc: "Control exactly which institutions and individuals can issue credentials." }
             ].map((f, i) => (
               <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <f.icon size={24} color="var(--primary)" />
                 </div>
                 <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{f.title}</h3>
                 <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
               </div>
             ))}
          </div>
        </section>

        {/* Live Status Section */}
        <section style={{ padding: '4rem', background: 'var(--bg-main)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
               <Database size={24} color="var(--primary)" />
               <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Live Blockchain Status</h3>
             </div>

             {networkStatus === 'Error' || networkStatus === 'No Web3 Provider' ? (
               <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <CheckCircle size={20} /> Blockchain connection unavailable
               </div>
             ) : (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                 <div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Network</div>
                   <div style={{ fontWeight: 600 }}>{networkStatus}</div>
                 </div>
                 <div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wallet</div>
                   <div style={{ fontWeight: 600 }}>{walletStatus}</div>
                 </div>
                 <div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Smart Contract</div>
                   <div style={{ fontWeight: 600 }}>{contractStatus}</div>
                 </div>
               </div>
             )}
          </div>
        </section>

        {/* Verification CTA */}
        <section style={{ padding: '6rem 4rem', textAlign: 'center', background: 'var(--bg-card)' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>Verify a Digital Credential</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Confirm that a credential matches its trusted blockchain record. Instant, transparent, and cryptographic verification.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/verify')} style={{ padding: '1.25rem 3rem', fontSize: '1.25rem' }}>
            Verify Credential
          </button>
        </section>
      </main>

      <footer className="public-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Shield size={24} color="var(--primary)" />
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>CredChain</span>
            </div>
            <p style={{ color: 'var(--text-muted)', maxWidth: '300px', marginBottom: '2rem' }}>Blockchain-Powered Digital Credential Trust Platform</p>
            <Badge type="neutral">Local Development Network</Badge>
          </div>
          <div style={{ display: 'flex', gap: '4rem' }}>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Navigation</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{cursor: 'pointer'}} onClick={()=>navigate('/')}>Home</span>
                <span style={{cursor: 'pointer'}} onClick={()=>navigate('/verify')}>Verify</span>
                <span style={{cursor: 'pointer'}} onClick={()=>navigate('/dashboard')}>Dashboard</span>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Technology</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <span>React</span>
                <span>Ethers.js</span>
                <span>Solidity</span>
                <span>Hardhat</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '4rem auto 0', paddingTop: '2rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
          Transactions are signed through your connected wallet. Private keys are never stored by CredChain.
        </div>
      </footer>
    </div>
  );
}
