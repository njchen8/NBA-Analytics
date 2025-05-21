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

const teams = [
  { name: 'Boston Celtics', abbr: 'BOS', color: '#007A33', logo: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg' },
  { name: 'Los Angeles Lakers', abbr: 'LAL', color: '#552583', logo: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg' },
  { name: 'Golden State Warriors', abbr: 'GSW', color: '#1D428A', logo: 'https://cdn.nba.com/logos/nba/1610612744/global/L/logo.svg' },
  { name: 'Miami Heat', abbr: 'MIA', color: '#98002E', logo: 'https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg' },
  { name: 'Denver Nuggets', abbr: 'DEN', color: '#0E2240', logo: 'https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg' },
  { name: 'Dallas Mavericks', abbr: 'DAL', color: '#00538C', logo: 'https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg' },
  // ...add more teams
];

export default function TeamsPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <TopNav />
      <div style={{ maxWidth: 1200, margin: '60px auto 0 auto', padding: '0 32px' }}>
        <h2 style={{ fontWeight: 900, fontSize: 40, marginBottom: 32, color: '#ffd6a5', letterSpacing: 1 }}>NBA Teams</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {teams.map(team => (
            <div key={team.abbr} style={{ background: `linear-gradient(120deg, #b9fbc0 60%, ${team.color} 100%)`, color: '#23263a', borderRadius: 18, boxShadow: '0 4px 24px #0002', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 700, fontSize: 20, cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => navigate('/player-search')}
            >
              <img src={team.logo} alt={team.name} style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', marginBottom: 12, background: '#fff' }} />
              <span style={{ fontWeight: 900, fontSize: 22 }}>{team.name}</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#555', marginTop: 4 }}>{team.abbr}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
