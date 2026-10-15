import React, { useState } from 'react';
import { 
  SolarSystem, 
  CREDCHAIN_ORBITS 
} from '../components/ui/solar-system';
import { 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Database, 
  Lock, 
  Play, 
  Pause, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  Server,
  Globe
} from 'lucide-react';
import { Badge } from '../components/common/Components';

export default function TechnologyStack() {
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedTech, setSelectedTech] = useState(CREDCHAIN_ORBITS[0].items[0]);
  const [activeLayerFilter, setActiveLayerFilter] = useState('ALL');

  // Filter orbits based on activeLayerFilter
  const filteredOrbits = activeLayerFilter === 'ALL' 
    ? CREDCHAIN_ORBITS 
    : CREDCHAIN_ORBITS.filter(o => o.id === activeLayerFilter);

  const totalTechCount = CREDCHAIN_ORBITS.reduce((acc, orbit) => acc + orbit.items.length, 0);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Badge type="primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
              <Layers size={12} style={{ marginRight: '4px' }} /> SYSTEM ARCHITECTURE
            </Badge>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              13 Verified Technologies Across 3 Architectural Tiers
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Technology Stack
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '720px', lineHeight: 1.5 }}>
            Interactive astronomical model representing the verified blockchain, cryptographic, application, and frontend technologies powering CredChain.
          </p>
        </div>

        {/* Orbit Controls Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title={isPaused ? "Resume Orbit Revolution" : "Pause Orbit Revolution"}
          >
            {isPaused ? <Play size={14} color="var(--success)" /> : <Pause size={14} />}
            <span>{isPaused ? "Play" : "Pause"}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '2px' }}>SPEED:</span>
            {[0.5, 1, 2].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setSpeedMultiplier(speed)}
                style={{
                  background: speedMultiplier === speed ? 'var(--secondary)' : 'transparent',
                  color: speedMultiplier === speed ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layer Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'ALL', label: `All Systems (${totalTechCount})`, icon: Layers },
          { id: 'blockchain-core', label: 'Layer 1: Blockchain & Cryptography', icon: Lock },
          { id: 'application-backend', label: 'Layer 2: Backend & Signing', icon: Server },
          { id: 'presentation-frontend', label: 'Layer 3: Frontend & Verification', icon: Globe },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveLayerFilter(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              border: activeLayerFilter === tab.id ? '1px solid var(--secondary)' : '1px solid transparent',
              background: activeLayerFilter === tab.id ? 'var(--accent-light)' : 'transparent',
              color: activeLayerFilter === tab.id ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Solar System Stage Container */}
      <div 
        className="card" 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2.5rem 1rem 3rem 1rem', 
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.25) 0%, var(--bg-card) 75%)',
          minHeight: '480px'
        }}
      >
        {/* Subtle Background Orbit Grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 1px 1px, var(--text-main) 1px, transparent 0)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

        {/* Floating Layer Legend */}
        <div style={{ position: 'absolute', top: '1.25rem', left: '1.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.35rem', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8' }} />
            <span>Inner: Blockchain Core</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38BDF8' }} />
            <span>Mid: Application & Indexer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#61DAFB' }} />
            <span>Outer: Frontend & Proofs</span>
          </div>
        </div>

        {/* Live Solar System Visualization */}
        <SolarSystem 
          orbits={filteredOrbits}
          isPaused={isPaused}
          speedMultiplier={speedMultiplier}
          onSelectItem={(item) => setSelectedTech(item)}
          selectedItemId={selectedTech?.id}
        />

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', zIndex: 10 }}>
          <Sparkles size={14} color="var(--secondary)" />
          <span>Hover or click any technology node to inspect its architectural specifications.</span>
        </div>
      </div>

      {/* Selected Technology Inspector Card */}
      {selectedTech && (
        <div 
          className="card" 
          style={{ 
            borderLeft: `4px solid ${selectedTech.color || 'var(--secondary)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: `0 0 15px ${selectedTech.color}25`
                }}
              >
                {selectedTech.svg}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedTech.label}
                  </h3>
                  {selectedTech.badge && (
                    <Badge type="info" style={{ fontSize: '0.72rem' }}>
                      {selectedTech.badge}
                    </Badge>
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {selectedTech.category} • {selectedTech.type}
                </span>
              </div>
            </div>

            <Badge type="primary" style={{ padding: '0.4rem 0.75rem' }}>
              <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> VERIFIED IN REPOSITORY
            </Badge>
          </div>

          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            {selectedTech.desc}
          </p>
        </div>
      )}

      {/* 3-Tier Architectural Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Tier 1 Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>
              <Lock size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Layer 1: Blockchain Core</h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Member 1 Responsibility</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Solidity smart contracts (<span className="mono">InstitutionRegistry</span>, <span className="mono">CertificateRegistry</span>, <span className="mono">DigitalCredential</span> facade) deployed to EVM environments with Hardhat testing suites and OpenZeppelin access controls.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
            <span className="badge badge-neutral">Solidity ^0.8.20</span>
            <span className="badge badge-neutral">Hardhat ^2.22.0</span>
            <span className="badge badge-neutral">OpenZeppelin ^5.0.0</span>
            <span className="badge badge-neutral">SHA-256 Digest</span>
          </div>
        </div>

        {/* Tier 2 Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
              <Server size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Layer 2: Application & Signing</h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Member 2 Responsibility</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Express.js RESTful API handling in-memory buffer hashing, server-side managed institutional wallet signing (<span className="mono">getInstitutionSigner</span>), JWT authorization, SQLite telemetry, and real-time blockchain event synchronization.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
            <span className="badge badge-neutral">Node.js ESM</span>
            <span className="badge badge-neutral">Express ^4.19.2</span>
            <span className="badge badge-neutral">Ethers.js v6.17</span>
            <span className="badge badge-neutral">SQLite3 ^5.1.7</span>
          </div>
        </div>

        {/* Tier 3 Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(97, 218, 251, 0.1)', color: '#61DAFB' }}>
              <Globe size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Layer 3: Frontend & Proofs</h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Presentation & Verifier Layer</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            React 19 / Vite administrative platform and zero-friction public verification portal with client-side jsPDF rendering, dynamic QR code generation, and Web Crypto cryptographic hashing.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
            <span className="badge badge-neutral">React 19</span>
            <span className="badge badge-neutral">Vite ^6.1.0</span>
            <span className="badge badge-neutral">jsPDF ^4.2.1</span>
            <span className="badge badge-neutral">QRCode ^1.5.4</span>
          </div>
        </div>

      </div>

    </div>
  );
}
