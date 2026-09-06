import React, { useEffect, useRef, useState } from 'react';

const NODES = [
  { x: 50, y: 50 }, { x: 20, y: 30 }, { x: 80, y: 30 },
  { x: 20, y: 70 }, { x: 80, y: 70 }, { x: 50, y: 14 },
  { x: 50, y: 86 }, { x: 8,  y: 50 }, { x: 92, y: 50 },
];
const EDGES = [
  [0,1],[0,2],[0,3],[0,4],[1,5],[2,5],[3,6],[4,6],[1,7],[3,7],[2,8],[4,8],
];

export default function BlockchainLoader({ progress, onComplete, coinSrc, size = 380 }) {
  const [waveOffset, setWaveOffset] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef(0);
  const calledRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      setWaveOffset(o => (o + 0.5) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !calledRef.current) {
      calledRef.current = true;
      setDone(true);
      if (onComplete) onComplete();
    }
  }, [progress, onComplete]);

  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const fillY = 100 - clampedProgress;
  const w = waveOffset;
  const activeNodes = Math.min(1 + Math.floor(clampedProgress / 12), NODES.length);
  const coinSize = size * 0.447;

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#0a0800',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(212,160,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,160,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }} />

      {/* Radial ambient glow */}
      <div style={{
        position: 'absolute', width: 800, height: 800,
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, rgba(212,140,0,0.1) 0%, transparent 60%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Scanline */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg,transparent,rgba(255,180,0,0.2),rgba(255,200,0,0.5),rgba(255,180,0,0.2),transparent)',
        animation: 'btcl-scanline 5s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Composition */}
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Node network */}
        <svg viewBox="0 0 100 100" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible',
        }}>
          <defs>
            <filter id="btcl-nodeGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {EDGES.map(([a, b], i) => {
            const na = NODES[a], nb = NODES[b];
            const active = a < activeNodes && b < activeNodes;
            return (
              <line key={i}
                x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke={active ? '#d4a000' : '#2a1f00'}
                strokeWidth={active ? 0.35 : 0.25}
                strokeOpacity={active ? 0.65 : 0.3}
                strokeDasharray={active ? '2 1.5' : '1 2'}
                style={active ? { animation: `btcl-dashFlow ${1.4 + i * 0.18}s linear infinite` } : {}}
              />
            );
          })}
          {NODES.map((n, i) => {
            const active = i < activeNodes;
            return (
              <g key={i} filter={active ? 'url(#btcl-nodeGlow)' : undefined}>
                {active && (
                  <circle cx={n.x} cy={n.y} r={4}
                    fill="none" stroke="#f5c400" strokeWidth={0.4} strokeOpacity={0.2}
                    style={{ animation: `btcl-pulseRing ${1.8 + i * 0.35}s ease-out infinite`, transformOrigin: `${n.x}px ${n.y}px` }}
                  />
                )}
                {i > 0 && (
                  <circle cx={n.x} cy={n.y} r={1.6}
                    fill={active ? '#f5c400' : '#2a1f00'}
                    stroke={active ? '#ffd700' : '#3a2a00'}
                    strokeWidth={0.4}
                    style={active ? { animation: `btcl-nodePing ${2 + i * 0.4}s ease-in-out infinite`, transformOrigin: `${n.x}px ${n.y}px` } : {}}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Orbital rings */}
        {[
          { size: size * 0.947, color: '#c8960080', speed: '14s', rev: false },
          { size: size * 0.821, color: '#ffd70055', speed: '10s', rev: true  },
          { size: size * 0.695, color: '#b8720050', speed: '18s', rev: false },
        ].map((r, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: r.size, height: r.size,
            top: '50%', left: '50%',
            borderRadius: '50%',
            border: `1px dashed ${r.color}`,
            boxShadow: `0 0 8px ${r.color}`,
            animation: `${r.rev ? 'btcl-spinR' : 'btcl-spin'} ${r.speed} linear infinite`,
          }} />
        ))}

        {/* Ripples */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: size * 0.289 + i * size * 0.145,
            height: size * 0.289 + i * size * 0.145,
            top: '50%', left: '50%',
            borderRadius: '50%',
            border: '1px solid rgba(212,160,0,0.15)',
            animation: `btcl-ripple ${2.6 + i * 0.75}s ease-out ${i * 0.9}s infinite`,
          }} />
        ))}

        {/* Coin with liquid fill */}
        <div style={{
          position: 'absolute',
          width: coinSize, height: coinSize,
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 0 2px #c89600, 0 0 20px rgba(200,150,0,0.6), 0 0 50px rgba(200,130,0,0.3)',
        }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block' }}>
            <defs>
              <clipPath id="btcl-coinClip"><circle cx="50" cy="50" r="50" /></clipPath>
              <linearGradient id="btcl-goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ffe066" />
                <stop offset="30%"  stopColor="#ffd700" />
                <stop offset="60%"  stopColor="#c89600" />
                <stop offset="100%" stopColor="#8b6000" />
              </linearGradient>
              <linearGradient id="btcl-liquidGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ffe566" stopOpacity="0.98" />
                <stop offset="40%"  stopColor="#ffd000" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#a07000" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="btcl-coinBg" x1="0.3" y1="0" x2="0.7" y2="1">
                <stop offset="0%"   stopColor="#1a1000" />
                <stop offset="100%" stopColor="#0a0800" />
              </linearGradient>
              <filter id="btcl-coinGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="btcl-liquidGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <circle cx="50" cy="50" r="50" fill="url(#btcl-coinBg)" />

            <g clipPath="url(#btcl-coinClip)">
              {/* Main liquid wave */}
              <path
                d={`M -5 ${fillY} C ${10+Math.sin(w*.04)*6} ${fillY-5},${25+Math.cos(w*.03)*5} ${fillY+5},${40+Math.sin(w*.035)*4} ${fillY-3} C ${55+Math.cos(w*.04)*5} ${fillY-8},${70+Math.sin(w*.03)*6} ${fillY+4},${85+Math.cos(w*.035)*4} ${fillY-2} C ${95+Math.sin(w*.04)*3} ${fillY-5},100 ${fillY},105 ${fillY} L 105 105 L -5 105 Z`}
                fill="url(#btcl-liquidGold)"
                filter="url(#btcl-liquidGlow)"
              />
              {/* Depth wave */}
              <path
                d={`M -5 ${fillY+2} C ${15+Math.cos(w*.035)*5} ${fillY-3},${30+Math.sin(w*.04)*4} ${fillY+6},${50+Math.cos(w*.03)*6} ${fillY+1} C ${68+Math.sin(w*.04)*5} ${fillY-4},${85+Math.cos(w*.035)*4} ${fillY+5},105 ${fillY+2} L 105 105 L -5 105 Z`}
                fill="rgba(255,200,0,0.25)"
              />
              {/* Shimmer streak */}
              <rect
                x={`${(w % 100) - 20}`} y={fillY} width="18" height={100 - fillY}
                fill="rgba(255,255,200,0.12)"
                style={{ filter: 'blur(4px)' }}
              />
            </g>

            {/* Coin image blended over liquid */}
            <image
              href={coinSrc}
              x="0" y="0" width="100" height="100"
              clipPath="url(#btcl-coinClip)"
              style={{ mixBlendMode: 'multiply', opacity: 0.88 }}
            />

            {/* Gold rim */}
            <circle cx="50" cy="50" r="49"
              fill="none" stroke="url(#btcl-goldGrad)" strokeWidth="2"
              filter="url(#btcl-coinGlow)"
            />
          </svg>
        </div>

        {/* Completion burst */}
        {done && [0,1,2,3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: coinSize + 10 + i * 55, height: coinSize + 10 + i * 55,
            top: '50%', left: '50%',
            borderRadius: '50%',
            border: '1.5px solid rgba(255,215,0,0.5)',
            animation: `btcl-burst 1.4s ease-out ${i * 0.18}s forwards`,
            opacity: 0,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes btcl-spin    { from{transform:translate(-50%,-50%) rotate(0deg)}   to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes btcl-spinR   { from{transform:translate(-50%,-50%) rotate(360deg)} to{transform:translate(-50%,-50%) rotate(0deg)} }
        @keyframes btcl-pulseRing { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(2.4);opacity:0} }
        @keyframes btcl-nodePing  { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        @keyframes btcl-dashFlow  { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
        @keyframes btcl-ripple    { 0%{transform:translate(-50%,-50%) scale(0.9);opacity:0.8} 100%{transform:translate(-50%,-50%) scale(1.7);opacity:0} }
        @keyframes btcl-scanline  { from{transform:translateY(-2px)} to{transform:translateY(100vh)} }
        @keyframes btcl-burst     { 0%{transform:translate(-50%,-50%) scale(0.85);opacity:1} 100%{transform:translate(-50%,-50%) scale(2);opacity:0} }
      `}</style>
    </div>
  );
}
