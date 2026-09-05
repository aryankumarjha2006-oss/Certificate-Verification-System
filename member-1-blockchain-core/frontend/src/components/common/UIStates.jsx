import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, Loader2, Copy } from 'lucide-react';
import { Card } from './Components';

export function LoadingState({ message = "Loading data..." }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={20} style={{ animation: 'spin 2s linear infinite' }} />
        <span>{message}</span>
      </div>
      {/* Skeletons */}
      <div className="skeleton" style={{ height: '40px', width: '100%' }}></div>
      <div className="skeleton" style={{ height: '40px', width: '100%' }}></div>
      <div className="skeleton" style={{ height: '40px', width: '80%' }}></div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title = "No Data", description = "There is nothing to show here yet.", action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
      background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)'
    }}>
      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
        <Icon size={32} color="var(--text-muted)" />
      </div>
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: action ? '1.5rem' : 0 }}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "An Error Occurred", message = "Something went wrong.", onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
      background: 'var(--danger-bg)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--danger)'
    }}>
      <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
      <h3 style={{ color: 'var(--danger-text)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--danger-text)', opacity: 0.9, marginBottom: onRetry ? '1.5rem' : 0, maxWidth: '400px' }}>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>Try Again</button>
      )}
    </div>
  );
}

export function TransactionStatus({ status, hash, onClose }) {
  if (!status) return null;

  // status: 'waiting-wallet', 'submitted', 'confirmed', 'error'
  const steps = [
    { key: 'waiting-wallet', label: 'Waiting for Wallet', active: status === 'waiting-wallet', done: ['submitted', 'confirmed'].includes(status) },
    { key: 'submitted', label: 'Transaction Submitted', active: status === 'submitted', done: status === 'confirmed' },
    { key: 'confirmed', label: 'Transaction Confirmed', active: false, done: status === 'confirmed' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Transaction Status</h3>
          {['confirmed', 'error'].includes(status) && (
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.25rem' }}>
              <XCircle size={20} />
            </button>
          )}
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {status === 'error' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--danger)' }}>
              <XCircle size={32} />
              <div>
                <strong>Transaction Failed</strong>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>The transaction was rejected or failed.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.done ? 'var(--success-bg)' : (step.active ? 'var(--accent-light)' : 'var(--bg-main)'),
                    color: step.done ? 'var(--success)' : (step.active ? 'var(--accent)' : 'var(--border)'),
                    border: `2px solid ${step.done ? 'var(--success)' : (step.active ? 'var(--accent)' : 'var(--border)')}`
                  }}>
                    {step.done ? <CheckCircle size={16} /> : (step.active ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} /> : <span>{idx+1}</span>)}
                  </div>
                  <span style={{ fontWeight: step.active || step.done ? 600 : 400, color: step.active || step.done ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {hash && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Transaction Hash</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: '0.85rem' }}>{hash.substring(0, 10)}...{hash.substring(hash.length - 8)}</span>
                <button onClick={() => navigator.clipboard.writeText(hash)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                  <Copy size={14} /> Copy
                </button>
              </div>
            </div>
          )}

          {status === 'confirmed' && (
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Continue
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Toast({ title, message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
    error: { icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
    info: { icon: Info, color: 'var(--accent)', bg: 'var(--accent-light)' }
  };

  const Icon = config[type].icon;

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
      background: 'var(--bg-card)', border: `1px solid var(--border)`,
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
      display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem',
      maxWidth: '400px', animation: 'modal-enter 0.3s ease-out'
    }}>
      <div style={{ color: config[type].color, marginTop: '2px' }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>{title}</h4>
        {message && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{message}</p>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
        <XCircle size={16} />
      </button>
    </div>
  );
}
