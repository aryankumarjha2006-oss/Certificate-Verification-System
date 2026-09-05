import React from 'react';
import { Card, Badge, HashDisplay } from '../components/common/Components';
import { Shield, Settings as SettingsIcon, Link as LinkIcon, Database } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Settings() {
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');
  
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform Settings</h1>
        <p className="page-subtitle">Configure network, security, and appearance.</p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
        
        <Card title={
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <LinkIcon size={18} /> Network Configuration
          </div>
        }>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <div>
               <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem'}}>RPC Node URL</div>
               <div className="mono" style={{background: 'var(--bg-main)', padding: '0.5rem', borderRadius: 'var(--radius-sm)'}}>http://127.0.0.1:8545</div>
             </div>
             <div>
               <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem'}}>Network Name</div>
               <div className="mono" style={{background: 'var(--bg-main)', padding: '0.5rem', borderRadius: 'var(--radius-sm)'}}>Localhost</div>
             </div>
          </div>
        </Card>

        <Card title={
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Database size={18} /> Contract Addresses
          </div>
        }>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <div>
               <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem'}}>Digital Credential (Facade)</div>
               <HashDisplay value={blockchainService.digitalCredential?.target || "Not Connected"} />
             </div>
             <div>
               <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem'}}>Institution Registry</div>
               <HashDisplay value={blockchainService.institutionRegistry?.target || "Not Connected"} />
             </div>
          </div>
        </Card>

        <Card title={
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Shield size={18} /> Security & Trust
          </div>
        }>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span>Wallet Signing</span>
               <Badge type="success">✓ Enabled</Badge>
             </div>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span>Private Key Storage</span>
               <Badge type="success">✓ Never Stored</Badge>
             </div>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span>Blockchain Verification</span>
               <Badge type="success">✓ Deterministic</Badge>
             </div>
             
             <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem'}}>
               Transactions are signed through your connected wallet locally. This application never requests or stores your private key.
             </p>
          </div>
        </Card>

        <Card title={
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <SettingsIcon size={18} /> Appearance
          </div>
        }>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <span>Dark Mode</span>
             <button className="btn btn-secondary" onClick={toggleTheme}>
               {theme === 'dark' ? 'Disable' : 'Enable'}
             </button>
          </div>
        </Card>

      </div>
    </div>
  );
}
