// client/src/App.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter, Routes, Route, useNavigate,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPlayerData } from './utils/fetchData';
import ChartPage from './pages/ChartPage';
import GamePage from './pages/GamePage';
import ComparePage from './pages/ComparePage';
import PlayersPage from './pages/PlayersPage';
import TeamsPage from './pages/TeamsPage';

function HomePage() {
  // Placeholder stats and images
  const stats = [
    { label: 'Players Analyzed', value: 512, color: '#ffb4a2' },
    { label: 'Games Tracked', value: 9842, color: '#b4c5e4' },
    { label: 'Teams', value: 30, color: '#b9fbc0' },
    { label: 'Seasons', value: '2018–2025', color: '#ffd6a5' },
    { label: 'Total Points', value: '1,234,567', color: '#f7b801' }, // overarching stat
  ];
  const highlights = [
    { title: 'Top Scorer', name: 'Luka Doncic', img: 'https://cdn.nba.com/headshots/nba/latest/260x190/1629029.png', stat: 'PTS: 32.4', color: '#b4c5e4' },
    { title: 'Rebound King', name: 'Nikola Jokic', img: 'https://cdn.nba.com/headshots/nba/latest/260x190/203999.png', stat: 'REB: 13.1', color: '#b9fbc0' },
    { title: 'Assist Leader', name: 'Tyrese Haliburton', img: 'https://cdn.nba.com/headshots/nba/latest/260x190/1630169.png', stat: 'AST: 11.2', color: '#ffd6a5' },
    { title: 'Triple-Double King', name: 'Domantas Sabonis', img: 'https://cdn.nba.com/headshots/nba/latest/260x190/1627734.png', stat: 'TD: 26', color: '#f7b801' },
  ];
  const navigate = useNavigate();

  // Main leaderboard stat categories
  const leaderboardStats = [
    {
      label: 'Points',
      csv: 'nba_alltime_ptsleaders.csv',
      color: '#ffb4a2',
      icon: '🏀',
    },
    {
      label: 'Assists',
      csv: 'nba_alltime_astleaders.csv',
      color: '#ffd6a5',
      icon: '🎯',
    },
    {
      label: 'Rebounds',
      csv: 'nba_alltime_rebleaders.csv',
      color: '#b9fbc0',
      icon: '🛡️',
    },
    {
      label: 'Steals',
      csv: 'nba_alltime_stlleaders.csv',
      color: '#b4c5e4',
      icon: '🦅',
    },
    {
      label: 'Blocks',
      csv: 'nba_alltime_blkleaders.csv',
      color: '#f7b801',
      icon: '⛔',
    },
  ];

  const [leaderboard, setLeaderboard] = useState(null); // {label, rows: []}
  // Store top player for each stat
  const [topPlayers, setTopPlayers] = useState({}); // { Points: {PLAYER_NAME, ...}, ... }

  // Fetch top player for each stat on mount
  useEffect(() => {
    async function fetchTopPlayers() {
      const results = {};
      for (const stat of leaderboardStats) {
        try {
          const res = await fetch(process.env.PUBLIC_URL + '/' + stat.csv);
          const text = await res.text();
          const [header, ...rows] = text.trim().split('\n');
          const headers = header.split(',');
          if (rows.length > 0) {
            const vals = rows[0].split(',');
            const obj = {};
            headers.forEach((h, i) => (obj[h] = vals[i]));
            results[stat.label] = obj;
          }
        } catch (e) {
          // If fetch fails, skip
        }
      }
      setTopPlayers(results);
    }
    fetchTopPlayers();
    // eslint-disable-next-line
  }, []);

  // Fetch leaderboard CSV on demand
  const handleLeaderboardClick = async (stat) => {
    const res = await fetch(process.env.PUBLIC_URL + '/' + stat.csv);
    const text = await res.text();
    // Remove any empty lines and trim whitespace
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    const [header, ...rows] = lines;
    const headers = header.split(',').map(h => h.trim());
    const data = rows.slice(0, 5).map(row => {
      const vals = row.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = vals[i]);
      return obj;
    });
    setLeaderboard({ label: stat.label, headers, data });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '36px 48px 18px 48px', background: 'rgba(20,20,30,0.98)', borderBottom: '2px solid #23263a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontWeight: 900, fontSize: 38, letterSpacing: 2, fontFamily: 'monospace', color: '#fff', cursor: 'pointer' }} onClick={() => navigate('/')}>NBA Impact <span style={{ color: '#ffd6a5' }}>Dashboard</span> <span role="img" aria-label="basketball">🏀</span></span>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 18, fontWeight: 600 }}>
          <span style={{ opacity: 0.8, cursor: 'pointer' }} onClick={() => navigate('/players')}>Players</span>
          <span style={{ opacity: 0.8, cursor: 'pointer' }} onClick={() => navigate('/teams')}>Teams</span>
          <span style={{ opacity: 0.8, cursor: 'pointer' }}>Trends</span>
          <span style={{ opacity: 0.8, cursor: 'pointer' }}>About</span>
        </div>
      </div>
      {/* Hero Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 48px 24px 48px', background: 'linear-gradient(90deg, #23263a 60%, #181a20 100%)', borderBottom: '1px solid #23263a' }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 44, margin: 0, color: '#fff', letterSpacing: 1 }}>NBA Analytics, Reimagined</h2>
          <p style={{ fontSize: 22, color: '#ffd6a5', margin: '16px 0 0 0', fontWeight: 600 }}>Modern, interactive, and visually stunning stats for every player and team.</p>
        </div>
        <img src="https://cdn.nba.com/logos/leagues/logo-nba.svg" alt="NBA" style={{ width: 120, height: 120, opacity: 0.18, marginRight: 32 }} />
      </div>
      {/* Leaderboard Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 28, padding: '48px 48px 0 48px', maxWidth: 1400, margin: '0 auto' }}>
        {leaderboardStats.map((stat, i) => (
          <div key={stat.label} style={{ background: stat.color, color: '#222', borderRadius: 18, boxShadow: '0 4px 24px #0002', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 120, fontWeight: 800, fontSize: 28, position: 'relative', transition: 'transform 0.15s', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            onClick={() => handleLeaderboardClick(stat)}
          >
            <span style={{ fontSize: 44, fontWeight: 900 }}>{stat.icon}</span>
            <span style={{ fontSize: 22, fontWeight: 700, opacity: 0.9, marginTop: 8 }}>{stat.label}</span>
            {/* Show top 1 player and value from fetched state */}
            {topPlayers[stat.label] ? (
              <span style={{ fontSize: 18, fontWeight: 800, marginTop: 8, color: '#174734', textAlign: 'center', lineHeight: 1.2 }}>
                {topPlayers[stat.label]['PLAYER_NAME'] ? `${topPlayers[stat.label]['PLAYER_NAME']} ` : ''}
                <span style={{ color: '#23263a', fontWeight: 900 }}>
                  {/* Print only the correct stat value, not rank or trailing chars */}
                  {(() => {
                    // Map stat label to CSV stat column
                    const statColMap = {
                      'Points': 'PTS',
                      'Assists': 'AST',
                      'Rebounds': 'REB',
                      'Steals': 'STL',
                      'Blocks': 'BLK',
                    };
                    const col = statColMap[stat.label];
                    // Fallback: find first column that's not PLAYER_ID, PLAYER_NAME, IS_ACTIVE_FLAG, or *_RANK
                    if (col && topPlayers[stat.label][col]) {
                      return topPlayers[stat.label][col];
                    } else {
                      const keys = Object.keys(topPlayers[stat.label]);
                      const statKey = keys.find(k => !['PLAYER_ID','PLAYER_NAME','IS_ACTIVE_FLAG'].includes(k) && !k.endsWith('_RANK'));
                      return statKey ? topPlayers[stat.label][statKey] : '';
                    }
                  })()}
                </span>
              </span>
            ) : (
              <span style={{ fontSize: 16, fontWeight: 600, marginTop: 8, color: '#888' }}>Loading…</span>
            )}
            <span style={{ fontSize: 15, fontWeight: 600, opacity: 0.7, marginTop: 4 }}>All-Time Leaders</span>
          </div>
        ))}
      </div>
      {/* Leaderboard Modal */}
      {leaderboard && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.35)' }} onClick={() => setLeaderboard(null)}>
          <div style={{ background: '#fff', color: '#23263a', borderRadius: 22, boxShadow: '0 8px 48px #0005', padding: 40, minWidth: 420, maxWidth: 540, minHeight: 320, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLeaderboard(null)} style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', fontSize: 28, color: '#888', cursor: 'pointer' }}>&times;</button>
            <h2 style={{ fontWeight: 900, fontSize: 32, marginBottom: 18, color: '#23263a', letterSpacing: 1 }}>{leaderboard.label} - All-Time Top 5</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 18, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(90deg, #f8fafc 60%, #f1f3f6 100%)', boxShadow: '0 2px 8px #0001', border: '1.5px solid #e3e6ea', marginBottom: 12 }}>
              <thead>
                <tr style={{ background: '#e3e6ea', color: '#1a1a1a', fontWeight: 800 }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Rank</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Player Name</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>{(() => {
                    // Map stat label to full name
                    const statFull = {
                      'Points': 'Points',
                      'Assists': 'Assists',
                      'Rebounds': 'Rebounds',
                      'Steals': 'Steals',
                      'Blocks': 'Blocks',
                    };
                    return statFull[leaderboard.label] || leaderboard.label;
                  })()}</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Currently Playing</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.data.map((row, idx) => {
                  // Map stat label to CSV stat column and rank column
                  const statColMap = {
                    'Points': { stat: 'PTS', rank: 'PTS_RANK' },
                    'Assists': { stat: 'AST', rank: 'AST_RANK' },
                    'Rebounds': { stat: 'REB', rank: 'REB_RANK' },
                    'Steals': { stat: 'STL', rank: 'STL_RANK' },
                    'Blocks': { stat: 'BLK', rank: 'BLK_RANK' },
                  };
                  const statCols = statColMap[leaderboard.label] || {};
                  return (
                    <tr key={row.PLAYER_NAME || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f6f8fa', transition: 'background 0.2s' }}>
                      <td style={{ padding: 10, textAlign: 'center', fontWeight: 700, color: '#23263a', fontSize: 18 }}>{row[statCols.rank] || idx + 1}</td>
                      <td style={{ padding: 10, textAlign: 'center', fontWeight: 800, color: '#174734', fontSize: 20 }}>{row['PLAYER_NAME']}</td>
                      <td style={{ padding: 10, textAlign: 'center', fontWeight: 700, color: '#23263a', fontSize: 18 }}>{row[statCols.stat]}</td>
                      <td style={{ padding: 10, textAlign: 'center', fontWeight: 700, color: row['IS_ACTIVE_FLAG'] === 'Y' ? '#1a7f37' : '#b91c1c', fontSize: 18 }}>{row['IS_ACTIVE_FLAG'] === 'Y' ? 'Yes' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ color: '#888', fontSize: 15, marginTop: 8 }}>All stats shown are career totals. Top 5 all-time leaders for {leaderboard.label.toLowerCase()}.</div>
          </div>
        </div>
      )}
      {/* Highlights and CTA Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 28,
        padding: '38px 48px 0 48px',
        maxWidth: 1400,
        margin: '0 auto',
        alignItems: 'center',
      }}>
        <HighlightCard {...highlights[1]} />
        <HighlightCard {...highlights[0]} />
        {/* Centered CTA, double width, same height as other boxes */}
        <div style={{
          background: 'linear-gradient(120deg, #ffd6a5 60%, #b4c5e4 100%)',
          color: '#222',
          borderRadius: 22,
          boxShadow: '0 4px 24px #0002',
          padding: '0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 160,
          height: 160,
          fontWeight: 800,
          fontSize: 24,
          gridColumn: '3 / span 2',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Ready to Explore?</span>
          <div style={{ display: 'flex', gap: 18, marginTop: 8, justifyContent: 'center' }}>
            <button onClick={() => navigate('/player-search')} style={{ background: '#23263a', color: '#fff', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 17, border: 'none', boxShadow: '0 2px 8px #0001', transition: 'background 0.15s', textAlign: 'center', minWidth: 110, cursor: 'pointer' }}>
              Player Search
            </button>
            <button onClick={() => navigate('/compare-players')} style={{ background: '#174734', color: '#fff', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 17, border: 'none', boxShadow: '0 2px 8px #0001', transition: 'background 0.15s', textAlign: 'center', minWidth: 110, cursor: 'pointer' }}>
              Compare Players
            </button>
          </div>
        </div>
        <HighlightCard {...highlights[2]} />
        <HighlightCard {...highlights[3]} />
      </div>
      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#fff', opacity: 0.5, fontSize: 15, marginTop: 64, padding: 32 }}>
        NBA Analytics Dashboard &copy; {new Date().getFullYear()} 
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: color,
      color: '#222',
      borderRadius: 18,
      boxShadow: '0 4px 24px #0002',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      minHeight: 120,
      fontWeight: 800,
      fontSize: 28,
      position: 'relative',
      transition: 'transform 0.15s',
      cursor: 'pointer',
    }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span style={{ fontSize: 44, fontWeight: 900 }}>{value}</span>
      <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.8, marginTop: 8 }}>{label}</span>
    </div>
  );
}
function HighlightCard({ title, name, img, stat, color }) {
  return (
    <div style={{
      background: color,
      color: '#222',
      borderRadius: 18,
      boxShadow: '0 4px 24px #0002',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: 160,
      fontWeight: 700,
      fontSize: 20,
      position: 'relative',
      transition: 'transform 0.15s',
      cursor: 'pointer',
    }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{title}</span>
      <img src={img} alt={name} style={{ width: 64, height: 48, borderRadius: 10, objectFit: 'cover', marginBottom: 8, boxShadow: '0 2px 8px #0001', background: '#fff' }} />
      <span style={{ fontWeight: 900, fontSize: 20 }}>{name}</span>
      <span style={{ fontWeight: 700, fontSize: 16, color: '#555', marginTop: 4 }}>{stat}</span>
    </div>
  );
}

// Top navigation bar for all pages
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

// Autofill search logic for player names
function usePlayerOptions() {
  const [allRows, setAllRows] = useState([]);
  const [uniqueRows, setUnique] = useState([]);
  useEffect(() => {
    fetchPlayerData().then(({ rows, unique }) => {
      setAllRows(rows);
      setUnique(unique);
    });
  }, []);
  return uniqueRows;
}

function PlayerSearchPage() {
  const uniqueRows = usePlayerOptions();
  const [term, setTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const results = React.useMemo(() => {
    const t = term.toLowerCase().replace(/\s+/g, '');
    const prefixMatches = uniqueRows.filter(p =>
      p.PLAYER_NAME.toLowerCase().replace(/\s+/g, '').startsWith(t)
    );
    const otherMatches = uniqueRows.filter(p =>
      !p.PLAYER_NAME.toLowerCase().replace(/\s+/g, '').startsWith(t) &&
      p.PLAYER_NAME.toLowerCase().replace(/\s+/g, '').includes(t)
    );
    return [...prefixMatches, ...otherMatches];
  }, [term, uniqueRows]);

  // When user selects a player, fetch all game logs and pass as state to ChartPage
  function handleSelectPlayer(player) {
    fetchPlayerData().then(({ rows }) => {
      const playerRows = rows.filter(r => r.PLAYER_NAME === player.PLAYER_NAME);
      navigate(`/chart/${encodeURIComponent(player.PLAYER_NAME)}`, {
        state: { rows: playerRows, name: player.PLAYER_NAME },
      });
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <TopNav />
      <div style={{ maxWidth: 700, margin: '80px auto', background: 'linear-gradient(120deg, #f6e7cb 60%, #c7d2fe 100%)', borderRadius: 22, boxShadow: '0 6px 32px #0003', padding: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: 36, marginBottom: 32, color: '#23263a' }}>Find Your Favorite NBA Player</h2>
        <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
          <input
            value={term}
            onChange={e => { setTerm(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
            placeholder="Search players…"
            style={{ width: '100%', padding: 22, fontSize: 22, borderRadius: 12, border: '1.5px solid #b4c5e4', marginBottom: 0, boxShadow: '0 2px 12px #b4c5e422', background: '#fff', color: '#23263a', fontWeight: 600 }}
            autoComplete="off"
          />
          {showDropdown && term && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 60, background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px #0002', zIndex: 10, maxHeight: 260, overflowY: 'auto', border: '1.5px solid #b4c5e4' }}>
              {results.length === 0 && (
                <div style={{ padding: 16, color: '#888', fontSize: 18 }}>No players found</div>
              )}
              {results.map(p => (
                <div
                  key={p.PLAYER_NAME}
                  onMouseDown={() => handleSelectPlayer(p)}
                  style={{ padding: 16, cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', color: '#23263a', fontWeight: 600 }}
                >
                  <img src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.PLAYER_ID}.png`} alt={p.PLAYER_NAME} style={{ width: 32, height: 24, borderRadius: 5, objectFit: 'cover', background: '#eee' }} />
                  <span>{p.PLAYER_NAME}</span>
                  <span style={{ color: '#888', fontSize: 15, marginLeft: 8 }}>{p.TEAM_ABBREVIATION}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ color: '#555', fontSize: 18, marginTop: 32 }}>Type a player's name to view their stats and game logs.</div>
      </div>
    </div>
  );
}

function ComparePlayersPage() {
  const uniqueRows = usePlayerOptions();
  const [terms, setTerms] = useState(['', '']);
  const [showDropdown, setShowDropdown] = useState([false, false]);
  const navigate = useNavigate();
  const results = terms.map((term, idx) => {
    const t = term.toLowerCase().replace(/\s+/g, '');
    const prefixMatches = uniqueRows.filter(p =>
      p.PLAYER_NAME.toLowerCase().replace(/\s+/g, '').startsWith(t)
    );
    const otherMatches = uniqueRows.filter(p =>
      !p.PLAYER_NAME.toLowerCase().replace(/\s+/g, '').startsWith(t) &&
      p.PLAYER_NAME.toLowerCase().replace(/\s+/g, '').includes(t)
    );
    return [...prefixMatches, ...otherMatches];
  });
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '80px auto', background: 'linear-gradient(120deg, #f6e7cb 60%, #c7d2fe 100%)', borderRadius: 22, boxShadow: '0 6px 32px #0003', padding: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: 36, marginBottom: 32, color: '#23263a' }}>Compare NBA Players Side by Side</h2>
        <div style={{ display: 'flex', gap: 28, marginBottom: 32, width: '100%', justifyContent: 'center' }}>
          {[0, 1].map(idx => (
            <div key={idx} style={{ flex: 1, minWidth: 0, maxWidth: 320, position: 'relative' }}>
              <input
                value={terms[idx]}
                onChange={e => setTerms(t => { const arr = [...t]; arr[idx] = e.target.value; return arr; })}
                onFocus={() => setShowDropdown(d => { const arr = [...d]; arr[idx] = true; return arr; })}
                onBlur={() => setTimeout(() => setShowDropdown(d => { const arr = [...d]; arr[idx] = false; return arr; }), 120)}
                placeholder={`Player ${idx + 1}…`}
                style={{ width: '100%', padding: 22, fontSize: 22, borderRadius: 12, border: '1.5px solid #b4c5e4', boxShadow: '0 2px 12px #b4c5e422', background: '#fff', color: '#23263a', fontWeight: 600 }}
                autoComplete="off"
              />
              {showDropdown[idx] && terms[idx] && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: 60, background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px #0002', zIndex: 10, maxHeight: 260, overflowY: 'auto', border: '1.5px solid #b4c5e4' }}>
                  {results[idx].length === 0 && (
                    <div style={{ padding: 16, color: '#888', fontSize: 18 }}>No players found</div>
                  )}
                  {results[idx].map(p => (
                    <div
                      key={p.PLAYER_NAME}
                      onMouseDown={() => setTerms(t => { const arr = [...t]; arr[idx] = p.PLAYER_NAME; return arr; })}
                      style={{ padding: 16, cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', color: '#23263a', fontWeight: 600 }}
                    >
                      <img src={`https://cdn.nba.com/headshots/nba/latest/260x190/${p.PLAYER_ID}.png`} alt={p.PLAYER_NAME} style={{ width: 32, height: 24, borderRadius: 5, objectFit: 'cover', background: '#eee' }} />
                      <span>{p.PLAYER_NAME}</span>
                      <span style={{ color: '#888', fontSize: 15, marginLeft: 8 }}>{p.TEAM_ABBREVIATION}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button style={{ background: '#174734', color: '#fff', borderRadius: 12, padding: '16px 0', fontWeight: 800, fontSize: 20, border: 'none', boxShadow: '0 2px 12px #17473422', width: '100%', maxWidth: 400, cursor: 'pointer', marginBottom: 8 }}>
          Compare
        </button>
        <div style={{ color: '#555', fontSize: 18, marginTop: 18 }}>Enter two players to compare their stats, trends, and more.</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chart/:name" element={<ChartPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/compare/:nameA/:nameB" element={<ComparePage />} />
        <Route path="/player-search" element={<PlayerSearchPage />} />
        <Route path="/compare-players" element={<ComparePlayersPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/teams" element={<TeamsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
