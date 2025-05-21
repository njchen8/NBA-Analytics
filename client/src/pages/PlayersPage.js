import React from 'react';
import { useNavigate } from 'react-router-dom';

function TopNav() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 48px 12px 48px', background: 'rgba(20,20,30,0.98)', borderBottom: '2px solid #23263a', position: 'sticky', top: 0, zIndex: 100 }}>
      <span onClick={() => navigate('/')} style={{ fontWeight: 900, fontSize: 32, letterSpacing: 2, fontFamily: 'monospace', color: '#ffd6a5', cursor: 'pointer', userSelect: 'none' }}>
        NBA Impact Dashboard 🏀
      </span>
      <div style={{ display: 'flex', gap: 32, fontSize: 18, fontWeight: 600 }}>
        <span style={{ opacity: 0.8, cursor: 'pointer' }} onClick={() => navigate('/players')}>Players</span>
        <span style={{ opacity: 0.8, cursor: 'pointer' }} onClick={() => navigate('/teams')}>Teams</span>
        <span style={{ opacity: 0.8, cursor: 'pointer' }}>Trends</span>
        <span style={{ opacity: 0.8, cursor: 'pointer' }}>About</span>
      </div>
    </div>
  );
}

export default function PlayersPage() {
  const navigate = useNavigate();
  // Placeholder: Replace with real player grid or search later
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <TopNav />
      <div style={{ maxWidth: 1200, margin: '60px auto 0 auto', padding: '0 32px' }}>
        <h2 style={{ fontWeight: 900, fontSize: 40, marginBottom: 32, color: '#ffd6a5', letterSpacing: 1 }}>All NBA Players</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {/* Example player cards, replace with dynamic data */}
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} style={{ background: 'linear-gradient(120deg, #ffd6a5 60%, #b4c5e4 100%)', color: '#23263a', borderRadius: 18, boxShadow: '0 4px 24px #0002', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 700, fontSize: 20, cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => navigate('/player-search')}
            >
              <img src={`https://cdn.nba.com/headshots/nba/latest/260x190/1629029.png`} alt="Player" style={{ width: 80, height: 60, borderRadius: 10, objectFit: 'cover', marginBottom: 12, background: '#fff' }} />
              <span style={{ fontWeight: 900, fontSize: 22 }}>Player Name</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#555', marginTop: 4 }}>Team</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
