import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, Building2, Users, Search, Activity, Settings as SettingsIcon, BarChart3, Copy, CheckCircle } from 'lucide-react';
import { Badge } from '../common/Components';

export function Sidebar() {
  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/credentials", icon: FileText, label: "Credentials" },
    { to: "/institutions", icon: Building2, label: "Institutions" },
    { to: "/issuers", icon: Users, label: "Issuers" },
    { to: "/verify", icon: Search, label: "Verification" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/activity", icon: Activity, label: "Audit Trail" },
    { to: "/settings", icon: SettingsIcon, label: "Settings" }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Shield size={24} color="var(--primary)" />
        CredChain
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => (
          <NavLink key={idx} to={item.to} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={18} /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Local Development</span>
        </div>
      </div>
    </aside>
  );
}

export function Header({ wallet, network, connect }) {
  const [copied, setCopied] = React.useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', width: '300px', border: '1px solid var(--border)' }}>
          <Search size={16} style={{ marginRight: '0.5rem' }} />
          <span style={{ fontSize: '0.9rem' }}>Global Search...</span>
        </div>
      </div>
      <div className="header-right">
        {wallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <Badge type="success">{network}</Badge>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
               <span className="mono" style={{ fontWeight: 500 }}>
                 {wallet.substring(0,6)}...{wallet.substring(38)}
               </span>
               <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}>
                 {copied ? <CheckCircle size={14} color="var(--success)" /> : <Copy size={14} />}
               </button>
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
