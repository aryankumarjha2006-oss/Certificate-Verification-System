import React, { useState } from 'react';
import { Card, Badge } from '../components/common/Components';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Bell, Shield, Wallet } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function Settings({ network }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage application preferences and security settings.</p>
      </div>

      <div className="grid-1-1" style={{ gap: '2rem' }}>
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Monitor size={18}/> Appearance</div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.75rem' }}>Theme Preference</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleThemeChange('light')}
                  style={{ flex: 1 }}
                >
                  <Sun size={18} /> Light Mode
                </button>
                <button
                  className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleThemeChange('dark')}
                  style={{ flex: 1 }}
                >
                  <Moon size={18} /> Dark Mode
                </button>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Bell size={20} color="var(--text-muted)" />
                  <span style={{ fontWeight: 500 }}>Browser Notifications</span>
                </div>
                <Badge type="neutral">Disabled</Badge>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Get notified when a blockchain transaction is confirmed.</p>
            </div>
          </div>
        </Card>

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18}/> Security & Blockchain Architecture</div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Blockchain Network</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontWeight: 600 }}>{network || 'Hardhat Local (Chain ID: 31337)'}</div>
                 <Badge type="success">Active</Badge>
               </div>
             </div>

             <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signing Pipeline Mode</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontWeight: 600 }}>Managed Institutional Signing</div>
                 <Badge type="info">Primary</Badge>
               </div>
               <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                 Backend service signs blockchain transactions with accredited institutional authority wallets. MetaMask extension is optional.
               </p>
             </div>

             <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configured Smart Contracts</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-muted)' }}>InstitutionRegistry:</span>
                   <span className="mono">{blockchainService?.institutionRegistry?.target || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-muted)' }}>DigitalCredential (Facade):</span>
                   <span className="mono">{blockchainService?.digitalCredential?.target || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'}</span>
                 </div>
               </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
