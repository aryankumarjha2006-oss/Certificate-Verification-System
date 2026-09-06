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

      <div className="grid-1-1">
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

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18}/> Security & Network</div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Smart Contract Network</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontWeight: 600 }}>{network || 'Not Connected'}</div>
                 <Badge type="success">Active</Badge>
               </div>
             </div>

             <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Wallet</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 {blockchainService.provider ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Wallet size={16} color="var(--primary)" />
                      <span className="mono" style={{ fontWeight: 600 }}>Connected</span>
                    </div>
                 ) : (
                    <div style={{ fontWeight: 600, color: 'var(--warning)' }}>Not Connected</div>
                 )}
               </div>
               <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                 CredChain uses Web3 Provider injection (e.g. MetaMask). Network switching must be done within your wallet extension.
               </p>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
