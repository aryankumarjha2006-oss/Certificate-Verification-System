import React, { useState, useEffect } from 'react';
import { Blocks } from 'lucide-react';
import '../../styles/components.css'; // ensure shimmer is loaded

export default function LoadingScreen() {
  const [stage, setStage] = useState(0);
  const stages = [
    "Initializing secure credential infrastructure...",
    "Connecting to blockchain...",
    "Loading smart contracts...",
    "Ready"
  ];

  useEffect(() => {
    // Simulate loading stages for the animation
    const intervals = [
      setTimeout(() => setStage(1), 800),
      setTimeout(() => setStage(2), 1600),
      setTimeout(() => setStage(3), 2400)
    ];
    return () => intervals.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'var(--bg-main)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      transition: 'opacity 0.5s'
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem'}}>
         <Blocks size={48} color="var(--primary)" />
         <h1 style={{fontSize: '2.5rem', margin: 0, letterSpacing: '-0.025em'}}>CredChain</h1>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '2rem', color: 'var(--primary)'
      }}>
        {/* Animated blockchain visual */}
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div style={{
              width: '40px', height: '40px',
              border: `2px solid ${i <= stage ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: i <= stage ? 'var(--accent-light)' : 'transparent',
              transition: 'all 0.3s'
            }}>
               <Blocks size={20} color={i <= stage ? 'var(--primary)' : 'var(--border)'} />
            </div>
            {i < 3 && (
              <div style={{
                width: '30px', height: '2px',
                backgroundColor: i < stage ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.3s'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <p style={{color: 'var(--text-muted)', fontSize: '1.1rem', transition: 'all 0.3s'}}>
        {stages[stage]}
      </p>
    </div>
  );
}
