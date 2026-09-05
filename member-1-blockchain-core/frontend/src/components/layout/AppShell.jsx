import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, Building2, Users, Search, Activity, Settings as SettingsIcon } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Shield size={24} color="var(--accent)" />
        CredChain
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/credentials" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={18} /> Credentials
        </NavLink>
        <NavLink to="/institutions" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Building2 size={18} /> Institutions
        </NavLink>
        <NavLink to="/issuers" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={18} /> Issuers
        </NavLink>
        <NavLink to="/verification" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Search size={18} /> Verification
        </NavLink>
        <NavLink to="/activity" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={18} /> Audit Trail
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <SettingsIcon size={18} /> Settings
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Network</div>
        <div style={{fontWeight: '500'}}>Local Development</div>
      </div>
    </aside>
  );
}

export function Header({ wallet, network, connect }) {
  return (
    <header className="header">
      <div className="header-left">
        {/* Search placeholder */}
        <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', width: '300px'}}>
          <Search size={16} style={{marginRight: '0.5rem'}} />
          <span style={{fontSize: '0.9rem'}}>Search credentials...</span>
        </div>
      </div>
      <div className="header-right">
        {wallet ? (
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <div className="badge badge-success" style={{textTransform: 'none'}}>{network}</div>
             <div className="mono" style={{background: 'var(--bg-main)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', fontWeight: 500}}>
               {wallet.substring(0,6)}...{wallet.substring(38)}
             </div>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={connect}>Connect Wallet</button>
        )}
      </div>
    </header>
  );
}

export function AppShell({ children, wallet, network, connect }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-wrapper">
        <Header wallet={wallet} network={network} connect={connect} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
