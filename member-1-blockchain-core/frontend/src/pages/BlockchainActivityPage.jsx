import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, HashDisplay, Modal } from '../components/common/Components';
import { LoadingState, EmptyState, ErrorState } from '../components/common/UIStates';
import { Activity, Search, Filter, ChevronLeft, ChevronRight, Eye, ExternalLink, ShieldCheck, Layers } from 'lucide-react';
import { blockchainService } from '../services/blockchain';

export default function BlockchainActivityPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [latestBlock, setLatestBlock] = useState(0);

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadAuditEvents(page, selectedEventType, searchTerm);
  }, [page, selectedEventType, searchTerm, blockchainService.provider]);

  const getAuthToken = async () => {
    let token = localStorage.getItem('token') || localStorage.getItem('credchain_token');
    if (!token) {
      try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        if (res.ok) {
          const data = await res.json();
          token = data.token;
          localStorage.setItem('token', token);
        }
      } catch (e) {
        console.warn('Auto-login for audit token failed:', e.message);
      }
    }
    return token;
  };

  const loadAuditEvents = async (pageNum, eventTypeFilter, search) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        page: pageNum,
        limit: limit,
        ...(eventTypeFilter !== 'ALL' && { eventType: eventTypeFilter }),
        ...(search.trim() !== '' && { search: search.trim() })
      });

      const res = await fetch(`http://localhost:3000/api/audit/events?${params.toString()}`, { headers });

      if (!res.ok) {
        throw new Error(`Audit API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setEvents(data.events || []);
      setPagination(data.pagination || { page: pageNum, limit: limit, total: 0, totalPages: 1 });
      setLatestBlock(data.latestBlock || 0);

    } catch (err) {
      console.error('Failed to load audit events from API:', err);
      // If contract provider is connected, attempt fallback directly to RPC contract logs
      if (blockchainService.provider) {
        await loadContractEventsFallback();
      } else {
        setError('The audit service could not be reached. Check that the backend and local blockchain are running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadContractEventsFallback = async () => {
    try {
      const instReg = blockchainService.institutionRegistry;
      const certRegAddress = await blockchainService.digitalCredential.certificateRegistry();
      const certReg = new window.ethers.Contract(certRegAddress, [
        "event CertificateIssued(string indexed certificateId, string certificateHash, address indexed issuer, uint256 expiryTimestamp, uint256 version)",
        "event CertificateRevoked(string indexed certificateId)"
      ], blockchainService.provider);

      const [e1, e2, e3, e4] = await Promise.all([
        instReg.queryFilter(instReg.filters.InstitutionRegistered(), 0, "latest"),
        instReg.queryFilter(instReg.filters.IssuerAuthorized(), 0, "latest"),
        certReg.queryFilter(certReg.filters.CertificateIssued(), 0, "latest"),
        certReg.queryFilter(certReg.filters.CertificateRevoked(), 0, "latest")
      ]);

      const parseArg = (val) => {
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object' && val.hash) return val.hash;
        return String(val ?? '');
      };

      const combined = [
        ...e1.map(e => ({ eventType: 'InstitutionRegistered', blockNumber: Number(e.blockNumber), transactionHash: String(e.transactionHash || ''), institutionId: parseArg(e.args[0]), issuer: e.args[2] })),
        ...e2.map(e => ({ eventType: 'IssuerAuthorized', blockNumber: Number(e.blockNumber), transactionHash: String(e.transactionHash || ''), institutionId: parseArg(e.args[0]), issuer: parseArg(e.args[1]) })),
        ...e3.map(e => ({ eventType: 'CertificateIssued', blockNumber: Number(e.blockNumber), transactionHash: String(e.transactionHash || ''), certificateId: parseArg(e.args[0]), issuer: parseArg(e.args[2]), version: Number(e.args[4] || 1) })),
        ...e4.map(e => ({ eventType: 'CertificateRevoked', blockNumber: Number(e.blockNumber), transactionHash: String(e.transactionHash || ''), certificateId: parseArg(e.args[0]) }))
      ];

      combined.sort((a,b) => b.blockNumber - a.blockNumber);
      setEvents(combined);
      setPagination({ page: 1, limit: combined.length, total: combined.length, totalPages: 1 });
      setLatestBlock(combined.length > 0 ? Math.max(...combined.map(e => e.blockNumber)) : 0);
    } catch (e) {
      setError('Unable to load blockchain events from network.');
    }
  };

  const getEventBadge = (name) => {
    switch (name) {
      case 'CertificateIssued':
        return <Badge type="success">Certificate Issued</Badge>;
      case 'CertificateRevoked':
        return <Badge type="danger">Certificate Revoked</Badge>;
      case 'CertificateVersionCreated':
        return <Badge type="primary">Version Created</Badge>;
      case 'InstitutionRegistered':
        return <Badge type="success">Institution Registered</Badge>;
      case 'InstitutionDeactivated':
        return <Badge type="danger">Institution Deactivated</Badge>;
      case 'IssuerAuthorized':
        return <Badge type="primary">Issuer Authorized</Badge>;
      case 'IssuerRevoked':
        return <Badge type="warning">Issuer Revoked</Badge>;
      default:
        return <Badge type="neutral">{name}</Badge>;
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '-';
    if (addr.length > 12) {
      return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    }
    return addr;
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Blockchain Audit Trail</h1>
          <p className="page-subtitle" style={{ maxWidth: '750px' }}>
            Chronological record of smart-contract events indexed from the blockchain. The blockchain is the authoritative source of event history; SQLite serves as an indexed query layer.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge type="primary">
            Showing {events.length} of {pagination.total} events
          </Badge>
          {latestBlock > 0 && (
            <Badge type="neutral">
              Latest Block: #{latestBlock}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '480px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Tx Hash, Cert ID, Institution, or Issuer..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select
              className="form-input"
              style={{ minWidth: '200px', cursor: 'pointer' }}
              value={selectedEventType}
              onChange={(e) => {
                setSelectedEventType(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Event Types</option>
              <option value="CertificateIssued">Certificate Issued</option>
              <option value="CertificateRevoked">Certificate Revoked</option>
              <option value="CertificateVersionCreated">Certificate Version Created</option>
              <option value="InstitutionRegistered">Institution Registered</option>
              <option value="InstitutionDeactivated">Institution Deactivated</option>
              <option value="IssuerAuthorized">Issuer Authorized</option>
              <option value="IssuerRevoked">Issuer Revoked</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <LoadingState message="Fetching blockchain audit events..." />
        ) : error ? (
          <ErrorState
            title="Unable to Load Audit Trail"
            message={error}
            onRetry={() => loadAuditEvents(page, selectedEventType, searchTerm)}
          />
        ) : events.length === 0 ? (
          pagination.total === 0 && selectedEventType === 'ALL' && searchTerm.trim() === '' ? (
            <EmptyState
              icon={Activity}
              title="No Blockchain Activity Yet"
              description="No blockchain events have been recorded yet. Issue a credential, register an institution, or authorize an issuer to generate activity."
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No Matching Events"
              description="No blockchain events match the current search or filters."
            />
          )
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event Type</th>
                    <th>Entity Reference</th>
                    <th>Issuer</th>
                    <th>Block</th>
                    <th>Transaction Hash</th>
                    <th>Version</th>
                    <th style={{ textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, idx) => {
                    const entity = e.certificateId || e.institutionId || '-';
                    const isCert = Boolean(e.certificateId);
                    return (
                      <tr
                        key={e.id || idx}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedEvent(e)}
                      >
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(e.timestamp)}
                        </td>
                        <td>{getEventBadge(e.eventType)}</td>
                        <td>
                          {isCert ? (
                            <Link
                              to={`/credentials/${entity}`}
                              onClick={(ev) => ev.stopPropagation()}
                              className="mono"
                              style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              {entity} <ExternalLink size={12} />
                            </Link>
                          ) : (
                            <span className="mono" style={{ fontWeight: 500 }}>{entity}</span>
                          )}
                        </td>
                        <td className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} title={e.issuer}>
                          {formatAddress(e.issuer)}
                        </td>
                        <td className="mono" style={{ fontSize: '0.85rem' }}>
                          #{e.blockNumber || 0}
                        </td>
                        <td onClick={(ev) => ev.stopPropagation()}>
                          <HashDisplay value={e.transactionHash} />
                        </td>
                        <td>
                          {e.version ? <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>v{e.version}</span> : '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setSelectedEvent(e);
                            }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Event Details Modal */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
      >
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Event Type</div>
                <div>{getEventBadge(selectedEvent.eventType)}</div>
              </div>
              {selectedEvent.version && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Version</div>
                  <Badge type="neutral">Version {selectedEvent.version}</Badge>
                </div>
              )}
            </div>

            {selectedEvent.certificateId && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Certificate ID</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{selectedEvent.certificateId}</span>
                  <Link to={`/credentials/${selectedEvent.certificateId}`} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    Credential Details <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            )}

            {selectedEvent.institutionId && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Institution ID</div>
                <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 500 }}>{selectedEvent.institutionId}</div>
              </div>
            )}

            {selectedEvent.issuer && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Issuer Address</div>
                <HashDisplay value={selectedEvent.issuer} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Block Number</div>
                <div className="mono" style={{ fontSize: '0.95rem' }}>#{selectedEvent.blockNumber || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Timestamp</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{formatDate(selectedEvent.timestamp)}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Transaction Hash</div>
              <HashDisplay value={selectedEvent.transactionHash} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
