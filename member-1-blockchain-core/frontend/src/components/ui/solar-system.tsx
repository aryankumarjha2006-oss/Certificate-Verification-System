'use client';

import React, { useState } from "react";
import { Orbit as OrbitIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * TYPE DEFINITIONS & CUSTOMIZATION CONTRACTS
 * ============================================================================
 */

export interface SolarSystemItem {
  id: string;          // Unique identifier (e.g. "solidity", "react")
  label: string;       // Text label shown next to the icon (e.g. "Solidity")
  category?: string;   // Category (e.g. "Smart Contracts", "Security", "Backend")
  type?: string;       // Short role description (e.g. "EVM Language")
  badge?: string;      // Badge text (e.g. "^0.8.20", "SHA-256")
  desc?: string;       // Comprehensive architectural explanation
  color: string;       // HEX or CSS color for active glowing highlights
  svg: React.ReactNode;// SVG icon node
}

export interface OrbitConfig {
  id: string;              // Unique ring identifier (e.g. "core", "app", "ui")
  name: string;            // Readable name for the ring
  radiusClass: string;     // CSS variable or absolute size (e.g. "var(--radius-inner)")
  radiusPx: number;        // Absolute size in pixels
  speed: number;           // Base duration in seconds for one full 360-degree rotation
  items: SolarSystemItem[];// Array of planet items revolving on this ring
}

export interface SolarSystemProps extends React.HTMLAttributes<HTMLDivElement> {
  centerLogo?: string | React.ReactNode;
  centerLogoAlt?: string;
  orbits?: OrbitConfig[];
  isPaused?: boolean;
  speedMultiplier?: number;
  onSelectItem?: (item: SolarSystemItem) => void;
  selectedItemId?: string | null;
}

/**
 * ============================================================================
 * CREDCHAIN OFFICIAL TECHNOLOGY ICONS
 * High-precision, authentic vector logos for CredChain technologies.
 * ============================================================================
 */
export const CredChainIcons = {
  // 1. Solidity
  solidity: (
    <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.33 2.5L6.5 12.5h5.83l5.84-10H12.33z" fill="#94A3B8" />
      <path d="M18.17 2.5l-5.84 10h5.84l5.83-10h-5.83z" fill="#CBD5E1" />
      <path d="M24 12.5l-5.83 10H12.33l5.84-10H24z" fill="#94A3B8" />
      <path d="M12.33 12.5L6.5 22.5h5.83l5.84-10H12.33z" fill="#64748B" />
      <path d="M18.17 22.5l-5.84 10h5.84l5.83-10h-5.83z" fill="#94A3B8" />
      <path d="M12.33 22.5L6.5 32.5h5.83l5.84-10H12.33z" fill="#475569" />
    </svg>
  ),

  // 2. Hardhat
  hardhat: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#EAB308" fillOpacity="0.2" stroke="#EAB308" strokeWidth="1.5" />
      <path d="M12 6L6 9.5v5L12 18l6-3.5v-5L12 6z" fill="#FACC15" />
      <path d="M12 6v12M6 9.5l12 0M6 14.5l12-7" stroke="#854D0E" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),

  // 3. OpenZeppelin
  openzeppelin: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 18.5L16.5 6M7.5 18.5L20 6" stroke="#4E5EE4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="5" cy="18.5" r="2" fill="#4E5EE4" />
      <circle cx="19" cy="6" r="2" fill="#4E5EE4" />
    </svg>
  ),

  // 4. SHA-256 / Cryptography
  sha256: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.8" />
      <path d="M9.5 11.5L11 13l3.5-3.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="7" stroke="#10B981" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  ),

  // 5. Node.js
  nodejs: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" fill="#22C55E" fillOpacity="0.15" stroke="#22C55E" strokeWidth="1.5" />
      <path d="M12 6.5v11M7.5 9l9 6M7.5 15l9-6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // 6. Express.js
  express: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="4" fill="#38BDF8" fillOpacity="0.15" stroke="#38BDF8" strokeWidth="1.5" />
      <path d="M6 9h3a2 2 0 012 2v0a2 2 0 01-2 2H6m0-4v8m0-4h4M14 9l4 6m0-6l-4 6" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // 7. SQLite
  sqlite: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="6" rx="8" ry="3" fill="#0284C7" fillOpacity="0.2" stroke="#0284C7" strokeWidth="1.5" />
      <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="#0284C7" strokeWidth="1.5" />
      <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="#0284C7" strokeWidth="1.5" />
    </svg>
  ),

  // 8. JWT (JSON Web Tokens)
  jwt: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="#EC4899" fillOpacity="0.15" stroke="#EC4899" strokeWidth="1.5" />
      <path d="M12 3a9 9 0 019 9h-9V3z" fill="#EC4899" />
      <path d="M8 12h8M12 8v8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  // 9. Ethers.js
  ethers: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 12l8 4 8-4-8-10z" fill="#3B82F6" />
      <path d="M4 12l8 10 8-10-8 4-8-4z" fill="#2563EB" />
      <path d="M12 2v14M12 16v6" stroke="#93C5FD" strokeWidth="1" />
    </svg>
  ),

  // 10. React 19
  react: (
    <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="1">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),

  // 11. Vite
  vite: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.5 3L12 21 4.5 3" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3l-4 7h4l-3 6" fill="#FACC15" stroke="#FACC15" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // 12. jsPDF
  jspdf: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#EF4444" fillOpacity="0.15" stroke="#EF4444" strokeWidth="1.5" />
      <path d="M14 2v6h6M8 13h8M8 17h5" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  // 13. QR Code Engine
  qrcode: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#A855F7" strokeWidth="1.8" />
      <rect x="5" y="5" width="3" height="3" fill="#A855F7" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#A855F7" strokeWidth="1.8" />
      <rect x="16" y="5" width="3" height="3" fill="#A855F7" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#A855F7" strokeWidth="1.8" />
      <rect x="5" y="16" width="3" height="3" fill="#A855F7" />
      <path d="M14 14h3v3h-3v-3zM18 18h3v3h-3v-3zM14 18h2v3h-2z" fill="#A855F7" />
    </svg>
  ),

  // 14. Ethereum / EVM
  ethereum: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1.5L4.5 12.5 12 16.5l7.5-4L12 1.5z" fill="#818CF8" />
      <path d="M4.5 12.5L12 22.5l7.5-10-7.5 4-7.5-4z" fill="#6366F1" />
      <path d="M12 1.5v15M12 16.5v6" stroke="#C7D2FE" strokeWidth="0.8" />
    </svg>
  )
};

/**
 * ============================================================================
 * DEFAULT CREDCHAIN ORBITS CONFIGURATION
 * Verified authentic technologies organizing CredChain's 3-tier architecture.
 * ============================================================================
 */
export const CREDCHAIN_ORBITS: OrbitConfig[] = [
  {
    id: "blockchain-core",
    name: "Layer 1: Blockchain & Cryptography",
    radiusClass: "var(--radius-inner)",
    radiusPx: 175,
    speed: 22,
    items: [
      {
        id: "solidity",
        label: "Solidity",
        category: "Smart Contracts",
        type: "EVM Smart Contracts (^0.8.20)",
        badge: "Smart Contracts",
        desc: "Core smart contract language powering InstitutionRegistry, CertificateRegistry, and DigitalCredential facade with custom errors and lifecycle events.",
        color: "#94A3B8",
        svg: CredChainIcons.solidity,
      },
      {
        id: "hardhat",
        label: "Hardhat",
        category: "Blockchain Tooling",
        type: "EVM Dev Node & Runner",
        badge: "Testing & Node",
        desc: "Local Ethereum network runtime (Chain ID 31337), Solidity compiler, and automated 33-test Mocha/Chai testing environment.",
        color: "#EAB308",
        svg: CredChainIcons.hardhat,
      },
      {
        id: "openzeppelin",
        label: "OpenZeppelin",
        category: "Contract Security",
        type: "Access Control Library",
        badge: "Security Standard",
        desc: "Industry-standard cryptographic contract security foundation providing Ownable RBAC for platform institution governance.",
        color: "#4E5EE4",
        svg: CredChainIcons.openzeppelin,
      },
      {
        id: "sha256",
        label: "SHA-256",
        category: "Cryptography",
        type: "Cryptographic Proof Anchor",
        badge: "256-bit Digest",
        desc: "Deterministic in-memory buffer hashing generating immutable 256-bit proofs of document integrity without exposing student PII on-chain.",
        color: "#10B981",
        svg: CredChainIcons.sha256,
      },
    ],
  },
  {
    id: "application-backend",
    name: "Layer 2: Backend & Integration",
    radiusClass: "var(--radius-mid)",
    radiusPx: 285,
    speed: 34,
    items: [
      {
        id: "nodejs",
        label: "Node.js",
        category: "Backend Runtime",
        type: "Server Execution Engine",
        badge: "ESM Runtime",
        desc: "High-throughput asynchronous server runtime powering REST controllers, in-memory PDF parsing, and crypto operations.",
        color: "#22C55E",
        svg: CredChainIcons.nodejs,
      },
      {
        id: "express",
        label: "Express.js",
        category: "Backend Framework",
        type: "REST API Server",
        badge: "REST Architecture",
        desc: "RESTful HTTP application server managing certificate issuance, zero-auth public verification, analytics, and unified audit trails.",
        color: "#38BDF8",
        svg: CredChainIcons.express,
      },
      {
        id: "sqlite",
        label: "SQLite",
        category: "Database & Indexer",
        type: "Off-Chain Relational Store",
        badge: "Offline Indexing",
        desc: "Relational database maintaining student PII metadata, synchronized historical blockchain events, and verification telemetry logs.",
        color: "#0284C7",
        svg: CredChainIcons.sqlite,
      },
      {
        id: "jwt",
        label: "JWT Auth",
        category: "Application Security",
        type: "Stateless Bearer Tokens",
        badge: "Authentication",
        desc: "Cryptographically signed JSON Web Tokens securing administrative and institutional credential issuance and revocation routes.",
        color: "#EC4899",
        svg: CredChainIcons.jwt,
      },
      {
        id: "ethers",
        label: "Ethers.js v6",
        category: "Web3 Integration",
        type: "Blockchain Client SDK",
        badge: "RPC Connector",
        desc: "Web3 integration library executing institutional wallet transactions, ABI decoding, and real-time blockchain event synchronization.",
        color: "#3B82F6",
        svg: CredChainIcons.ethers,
      },
    ],
  },
  {
    id: "presentation-frontend",
    name: "Layer 3: Frontend & Verification",
    radiusClass: "var(--radius-outer)",
    radiusPx: 395,
    speed: 50,
    items: [
      {
        id: "react",
        label: "React 19",
        category: "Frontend UI",
        type: "Component Architecture",
        badge: "Web Platform",
        desc: "Modern reactive user interface powering the 11-page CredChain administrative dashboard, verification flows, and credential details.",
        color: "#61DAFB",
        svg: CredChainIcons.react,
      },
      {
        id: "vite",
        label: "Vite",
        category: "Frontend Tooling",
        type: "Bundler & Dev Server",
        badge: "Build Tool",
        desc: "Lightning-fast frontend development server and Rollup/Vite production bundler compiling client assets with sub-second HMR.",
        color: "#A855F7",
        svg: CredChainIcons.vite,
      },
      {
        id: "jspdf",
        label: "jsPDF",
        category: "Document Engine",
        type: "Client PDF Compilation",
        badge: "Certificate Generation",
        desc: "Client-side PDF compiler rendering professional A4 landscape certificates with embedded QR codes and synchronous SHA-256 digests.",
        color: "#EF4444",
        svg: CredChainIcons.jspdf,
      },
      {
        id: "qrcode",
        label: "QR Code Engine",
        category: "Verification Flow",
        type: "Dynamic QR Data URLs",
        badge: "Zero-PII Payload",
        desc: "Generates high-resolution verification QR codes encoding clean public verification URLs without leaking student personal details.",
        color: "#8B5CF6",
        svg: CredChainIcons.qrcode,
      },
    ],
  },
];

export const SolarSystem = React.forwardRef<HTMLDivElement, SolarSystemProps>(
  (
    {
      centerLogo,
      centerLogoAlt = "CredChain Protocol Core",
      orbits = CREDCHAIN_ORBITS,
      isPaused = false,
      speedMultiplier = 1,
      onSelectItem,
      selectedItemId,
      className,
      ...props
    },
    ref
  ) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Cosmic dust particle animations coordinates
    const dustItems = [
      { delay: "-4s", radius: "165px", color: "#38bdf8" },
      { delay: "-11s", radius: "260px", color: "#818cf8" },
      { delay: "-19s", radius: "340px", color: "#3b82f6" },
      { delay: "-28s", radius: "395px", color: "#10b981" },
      { delay: "-7s", radius: "200px", color: "#ec4899" },
      { delay: "-15s", radius: "365px", color: "#facc15" },
      { delay: "-23s", radius: "430px", color: "#a855f7" },
    ];

    const activeHighlightId = selectedItemId || hoveredId;

    return (
      <div
        ref={ref}
        className={cn(
          "solar-system-root relative flex items-center justify-center w-full max-w-[940px] h-[340px] md:h-[480px] perspective-[1200px] select-none overflow-visible",
          className
        )}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '940px',
          height: '460px',
          perspective: '1200px',
          userSelect: 'none',
          overflow: 'visible'
        }}
        {...props}
      >
        {/* Dynamic Injected CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --radius-inner: 175px;
            --radius-mid: 285px;
            --radius-outer: 395px;
          }

          @media (max-width: 900px) {
            :root {
              --radius-inner: 130px;
              --radius-mid: 210px;
              --radius-outer: 290px;
            }
          }

          @media (max-width: 600px) {
            :root {
              --radius-inner: 85px;
              --radius-mid: 140px;
              --radius-outer: 195px;
            }
          }

          @keyframes custom-orbitMove {
            0% {
              transform: translate(-50%, -50%) rotateZ(0deg) translateX(var(--orbit-radius));
            }
            100% {
              transform: translate(-50%, -50%) rotateZ(-360deg) translateX(var(--orbit-radius));
            }
          }

          @keyframes custom-billboardCancel {
            0% {
              transform: translate(-50%, -50%) rotateZ(0deg) rotateY(10deg) rotateX(-65deg);
            }
            100% {
              transform: translate(-50%, -50%) rotateZ(360deg) rotateY(10deg) rotateX(-65deg);
            }
          }

          @keyframes custom-sun-pulse {
            0% { transform: scale(0.92); opacity: 0.75; }
            100% { transform: scale(1.08); opacity: 1; }
          }

          @keyframes custom-spin-clockwise {
            0% { transform: rotateX(65deg) rotateY(-10deg) rotateZ(0deg); }
            100% { transform: rotateX(65deg) rotateY(-10deg) rotateZ(360deg); }
          }
          @keyframes custom-spin-counter {
            0% { transform: rotateX(65deg) rotateY(-10deg) rotateZ(0deg); }
            100% { transform: rotateX(65deg) rotateY(-10deg) rotateZ(-360deg); }
          }

          .animate-custom-orbit {
            animation: custom-orbitMove var(--orbit-duration) linear infinite;
            animation-play-state: var(--orbit-play-state);
          }
          .animate-custom-billboard {
            animation: custom-billboardCancel var(--orbit-duration) linear infinite;
            animation-play-state: var(--orbit-play-state);
          }
          .animate-custom-sun-pulse {
            animation: custom-sun-pulse 4s ease-in-out infinite alternate;
          }
          .animate-custom-spin-cw {
            animation: custom-spin-clockwise 20s linear infinite;
          }
          .animate-custom-spin-ccw {
            animation: custom-spin-counter 30s linear infinite;
          }

          .orbit-logo-card {
            position: absolute;
            left: 50%;
            top: 50%;
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 0.45rem 0.85rem;
            background: rgba(15, 23, 42, 0.82);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 9999px;
            font-weight: 600;
            color: #ffffff;
            white-space: nowrap;
            user-select: none;
            cursor: pointer;
            pointer-events: auto;
            transition: border-color 0.25s, color 0.25s, background 0.25s, box-shadow 0.25s, transform 0.25s;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          [data-theme="light"] .orbit-logo-card {
            background: rgba(15, 23, 42, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
          }

          .orbit-logo-card:hover, .orbit-logo-card.active-card {
            transform: translate(-50%, -50%) rotateZ(0deg) rotateY(10deg) rotateX(-65deg) scale(1.08) !important;
          }
        `}} />

        {/* Tiltable Orbit Container (handles 3D tilt coordinates) */}
        <div 
          className="orbit-stage-container"
          style={{
            position: 'absolute',
            width: '940px',
            height: '940px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: "rotateX(65deg) rotateY(-10deg)",
            transformStyle: "preserve-3d",
            pointerEvents: 'none'
          }}
        >
          {/* Central Core Sun Engine */}
          <div 
            className="central-sun-core"
            style={{
              position: 'absolute',
              width: '130px',
              height: '130px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              pointerEvents: 'none',
              transform: "rotateY(10deg) rotateX(-65deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Glowing Aura */}
            <div 
              className="animate-custom-sun-pulse"
              style={{
                position: 'absolute',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(37, 99, 235, 0.2) 60%, transparent 80%)',
                filter: 'blur(10px)',
                zIndex: 10
              }} 
            />
            
            {/* Sun Core Logo */}
            <div 
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                border: '2px solid rgba(56, 189, 248, 0.5)',
                boxShadow: '0 0 35px rgba(56, 189, 248, 0.45)',
                zIndex: 20,
                background: 'linear-gradient(135deg, #0F172A 0%, #0284C7 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                position: 'relative'
              }}
            >
              {centerLogo ? (
                typeof centerLogo === 'string' ? (
                  <img src={centerLogo} alt={centerLogoAlt} style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                ) : (
                  centerLogo
                )
              ) : (
                <>
                  <OrbitIcon size={26} color="#38BDF8" style={{ animation: 'spin 12s linear infinite' }} />
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.05em', color: '#FFFFFF', marginTop: '2px' }}>
                    PROTOCOL
                  </span>
                </>
              )}
            </div>

            {/* Orbit Core Dash Rings */}
            <div 
              className="animate-custom-spin-cw"
              style={{
                position: 'absolute',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '1px dashed rgba(56, 189, 248, 0.35)',
                pointerEvents: 'none'
              }} 
            />
            <div 
              className="animate-custom-spin-ccw"
              style={{
                position: 'absolute',
                width: '185px',
                height: '185px',
                borderRadius: '50%',
                border: '1px dashed rgba(56, 189, 248, 0.18)',
                pointerEvents: 'none'
              }} 
            />
          </div>

          {/* Cosmic Dust Particles */}
          {dustItems.map((dust, idx) => (
            <div
              key={idx}
              className="animate-custom-orbit"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                opacity: 0.45,
                pointerEvents: 'none',
                background: dust.color,
                boxShadow: `0 0 8px ${dust.color}`,
                animationDelay: dust.delay,
                animationPlayState: isPaused ? "paused" : "running",
                animationDuration: `${24 / speedMultiplier}s`,
                ["--orbit-radius" as any]: dust.radius,
                ["--orbit-duration" as any]: `${24 / speedMultiplier}s`,
                ["--orbit-play-state" as any]: isPaused ? "paused" : "running",
              }}
            />
          ))}

          {/* Orbit Rings & Technology Nodes */}
          {orbits.map((orbit) => {
            return (
              <React.Fragment key={orbit.id}>
                {/* Visual Dashed Ring Line */}
                <div
                  style={{
                    position: 'absolute',
                    borderRadius: '50%',
                    border: '1px dashed rgba(148, 163, 184, 0.25)',
                    pointerEvents: 'none',
                    width: `calc(2 * ${orbit.radiusClass})`,
                    height: `calc(2 * ${orbit.radiusClass})`,
                    boxShadow: "inset 0 0 25px rgba(255, 255, 255, 0.01), 0 0 25px rgba(255, 255, 255, 0.01)",
                    ["--orbit-radius" as any]: orbit.radiusClass,
                  }}
                />

                {/* Orbit Items */}
                {orbit.items.map((item, idx, arr) => {
                  const delayValue = -(orbit.speed / arr.length) * idx;
                  const durationValue = orbit.speed / speedMultiplier;
                  const isHovered = activeHighlightId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="animate-custom-orbit"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '0px',
                        height: '0px',
                        pointerEvents: 'none',
                        animationDelay: `${delayValue}s`,
                        animationDuration: `${durationValue}s`,
                        animationPlayState: isPaused ? "paused" : "running",
                        ["--orbit-radius" as any]: orbit.radiusClass,
                        ["--orbit-duration" as any]: `${durationValue}s`,
                        ["--orbit-play-state" as any]: isPaused ? "paused" : "running",
                        zIndex: isHovered ? 30 : 10,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* Laser Beam connecting Center with Planet on hover */}
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '50%',
                          height: '1.5px',
                          transformOrigin: 'right',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          transition: 'opacity 0.3s ease',
                          zIndex: 0,
                          width: orbit.radiusClass,
                          opacity: isHovered ? 1 : 0,
                          background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.15) 20%, ${item.color} 80%, ${item.color} 100%)`,
                          boxShadow: `0 0 8px ${item.color}, 0 0 16px ${item.color}40`,
                        }}
                      />

                      {/* Planet Logo Card */}
                      <div
                        onClick={() => onSelectItem && onSelectItem(item)}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`orbit-logo-card animate-custom-billboard ${isHovered ? 'active-card' : ''}`}
                        style={{
                          animationDelay: `${delayValue}s`,
                          animationDuration: `${durationValue}s`,
                          animationPlayState: isPaused ? "paused" : "running",
                          borderColor: isHovered ? item.color : undefined,
                          boxShadow: isHovered 
                            ? `0 0 25px rgba(0, 0, 0, 0.7), 0 0 18px ${item.color}50`
                            : undefined,
                          ["--orbit-duration" as any]: `${durationValue}s`,
                          ["--orbit-play-state" as any]: isPaused ? "paused" : "running",
                        }}
                        title={`${item.label}: ${item.desc || item.type || ''}`}
                      >
                        {/* Icon Container */}
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.25s ease',
                            transform: isHovered ? "scale(1.15)" : "scale(1)",
                            color: item.color,
                          }}
                        >
                          {item.svg}
                        </div>
                        {/* Label Text */}
                        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
);

SolarSystem.displayName = "SolarSystem";
