import React from 'react';
import { Copy, Check } from 'lucide-react';

export function Card({ title, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, color = "var(--primary)" }) {
  return (
    <div className="card stat-card" style={{flex: 1, minWidth: '200px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div className="stat-title">{title}</div>
        {Icon && <Icon size={20} color={color} opacity={0.8} />}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export function Badge({ children, type = "neutral" }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function HashDisplay({ value }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', width: 'fit-content'}}>
      <span className="mono" style={{color: 'var(--text-muted)'}}>
        {value.length > 20 ? `${value.substring(0, 10)}...${value.substring(value.length - 8)}` : value}
      </span>
      <button onClick={handleCopy} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)'}} title="Copy">
        {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{margin: 0, fontSize: '1.1rem'}}>{title}</h3>
          <button onClick={onClose} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)'}}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
