// client/src/pages/ChartPage.js
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { fetchPlayerData, fetchPlayerBio } from '../utils/fetchData';

function GameInfoModal({ open, onClose, game }) {
  if (!open || !game) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 520, maxHeight: '80vh', boxShadow: '0 4px 24px #0002', position: 'relative', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
        <h3 style={{ margin: 0, marginBottom: 8 }}>{game.MATCHUP} ({game.WL})</h3>
        <div style={{ color: '#888', marginBottom: 12 }}>{game.GAME_DATE}</div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          {Object.entries(game).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: 8, borderBottom: '1px solid #f1f1f1', padding: '2px 0' }}>
              <span style={{ minWidth: 120, color: '#888', fontWeight: 500 }}>{key}:</span>
              <span style={{ color: '#222' }}>{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Custom dot for clickable points (navigates to GamePage)
function ClickableDot(props) {
  const navigate = useNavigate();
  const { cx, cy, payload, stroke } = props;
  // Get count from props if passed, or fallback to a default
  const count = props.count || 10;
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null;
  // Dot size logic: 1-15 games: 7.5, 16-30: 6, 31-60: 5, 61+: 4
  let dotRadius = 7.5;
  if (count > 60) dotRadius = 4;
  else if (count > 30) dotRadius = 5;
  else if (count > 15) dotRadius = 6;
  // Hit area is always a bit larger for easy clicking
  let hitRadius = Math.max(dotRadius + 6, 12);
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={hitRadius}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (payload && payload.GAME_ID) {
            navigate(`/game/${payload.GAME_ID}`, { state: { game: payload } });
          }
        }}
      />
      <circle
        cx={cx}
        cy={cy}
        r={dotRadius}
        fill="#fff"
        stroke={stroke || '#ff6b6b'}
        strokeWidth={3}
        style={{ filter: 'drop-shadow(0 1.5px 4px #0002)' }}
        pointerEvents="none"
      />
    </g>
  );
}

// Custom Tooltip to show opponent (MATCHUP), win/loss, and date
function formatDate(dateStr) {
  // Handles YYYY-MM-DD or MM/DD/YYYY
  if (!dateStr) return '';
  let d;
  if (dateStr.includes('-')) {
    d = new Date(dateStr);
  } else if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/');
    d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  const navigate = useNavigate();
  
  if (active && payload && payload.length && payload[0].payload) {
    const game = payload[0].payload;
    return (
      <div 
        style={{ 
          background: '#fff', 
          border: '1px solid #eee', 
          borderRadius: 8, 
          padding: 12, 
          boxShadow: '0 2px 8px #0001', 
          minWidth: 120,
          cursor: 'pointer'
        }}
        onClick={() => {
          if (game && game.GAME_ID) {
            navigate(`/game/${game.GAME_ID}`, { state: { game } });
          }
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Game {game.GAME_IDX}</div>
        <div style={{ fontSize: 14, color: '#444', marginBottom: 2 }}>{game.MATCHUP} ({game.WL})</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{formatDate(game.GAME_DATE)}</div>
        <div style={{ color: '#ff6b6b', fontWeight: 600 }}>PTS : {game.PTS}</div>
        <div style={{ color: '#4dabf7', fontWeight: 600 }}>REB : {game.REB}</div>
        <div style={{ color: '#82ca9d', fontWeight: 600 }}>AST : {game.AST}</div>
      </div>
    );
  }
  return null;
}

const chartTabs = [
  { key: 'line', label: 'Line Chart' },
  { key: 'bar', label: 'Bar Chart' },
  { key: 'area', label: 'Area Chart' },
  { key: 'pie', label: 'Pie Chart' },
];

const COLORS = ['#ff6b6b', '#4dabf7', '#82ca9d'];

function calcStats(data, key) {
  const arr = data.map(d => Number(d[key]) || 0);
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  const std = Math.sqrt(variance);
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  return { mean, variance, std, min, max };
}

function correlation(data, key1, key2) {
  const arr1 = data.map(d => Number(d[key1]) || 0);
  const arr2 = data.map(d => Number(d[key2]) || 0);
  const mean1 = arr1.reduce((a, b) => a + b, 0) / arr1.length;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / arr2.length;
  const num = arr1.reduce((acc, v, i) => acc + (v - mean1) * (arr2[i] - mean2), 0);
  const den = Math.sqrt(arr1.reduce((acc, v) => acc + (v - mean1) ** 2, 0) * arr2.reduce((acc, v) => acc + (v - mean2) ** 2, 0));
  return den === 0 ? 0 : num / den;
}

export default function ChartPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { rows = [], name = 'Unknown' } = state || {};
  const [count, setCount] = useState(10);
  const [modalGame, setModalGame] = useState(null);
  const [showAST, setShowAST] = useState(true);
  const [showREB, setShowREB] = useState(true);
  const [showPTS, setShowPTS] = useState(true);
  const [playerBio, setPlayerBio] = useState(null);
  const [teamColor, setTeamColor] = useState('#174734');

  // Helper: fallback team color map (NBA.com official)
  const TEAM_COLORS = useMemo(() => ({
    'ATL': '#E03A3E', 'BOS': '#007A33', 'BKN': '#000000', 'CHA': '#1D1160', 'CHI': '#CE1141',
    'CLE': '#6F263D', 'DAL': '#00538C', 'DEN': '#0E2240', 'DET': '#C8102E', 'GSW': '#1D428A',
    'HOU': '#CE1141', 'IND': '#002D62', 'LAC': '#C8102E', 'LAL': '#552583', 'MEM': '#5D76A9',
    'MIA': '#98002E', 'MIL': '#174734', 'MIN': '#0C2340', 'NOP': '#0C2340', 'NYK': '#006BB6',
    'OKC': '#007AC1', 'ORL': '#0077C0', 'PHI': '#006BB6', 'PHX': '#1D1160', 'POR': '#E03A3E',
    'SAC': '#5A2D81', 'SAS': '#C4CED4', 'TOR': '#CE1141', 'UTA': '#002B5C', 'WAS': '#002B5C',
  }), []);

  // Always get team color from most recent game log's TEAM_ABBREVIATION
  useEffect(() => {
    let isMounted = true;
    fetchPlayerBio().then(bioMap => {
      const bio = bioMap.get(name.trim().toUpperCase());
      // Find most recent game (first in rows)
      let teamAbbr = rows && rows.length > 0 ? rows[0].TEAM_ABBREVIATION : undefined;
      let color = '#174734';
      if (teamAbbr && TEAM_COLORS[teamAbbr]) {
        color = TEAM_COLORS[teamAbbr];
      }
      if (isMounted) {
        setPlayerBio(bio);
        setTeamColor(color);
      }
    });
    return () => { isMounted = false; };
  }, [name, rows, TEAM_COLORS]);

  // Get all available seasons for this player
  const allSeasons = useMemo(() => Array.from(new Set(rows.map(r => r.SEASON_YEAR))).sort(), [rows]);
  const [selectedSeason, setSelectedSeason] = useState('All');

  // Filter rows by selected season
  const filteredRows = useMemo(() => selectedSeason === 'All' ? rows : rows.filter(r => r.SEASON_YEAR === selectedSeason), [rows, selectedSeason]);

  // slice newest→oldest then reverse for left-to-right chronological
  const data = useMemo(() => filteredRows.slice(0, count).reverse().map((row, idx) => ({ ...row, GAME_IDX: idx + 1 })), [filteredRows, count]);

  // Metrics (use filtered data)
  const statsPTS = useMemo(() => calcStats(data, 'PTS'), [data]);
  const statsAST = useMemo(() => calcStats(data, 'AST'), [data]);
  const statsREB = useMemo(() => calcStats(data, 'REB'), [data]);
  const corrPTS_AST = useMemo(() => correlation(data, 'PTS', 'AST'), [data]);
  const corrPTS_REB = useMemo(() => correlation(data, 'PTS', 'REB'), [data]);
  const corrAST_REB = useMemo(() => correlation(data, 'AST', 'REB'), [data]);
  const winPct = useMemo(() => {
    const wins = data.filter(d => d.WL === 'W').length;
    return data.length ? (wins / data.length) * 100 : 0;
  }, [data]);

  // Stat summary table for PTS, REB, AST
  function getStatSummary(arr) {
    if (!arr.length) return { mean: 0, variance: 0, std: 0, min: 0, max: 0 };
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { mean, variance, std, min, max };
  }
  function getStatTable(rows) {
    return {
      PTS: getStatSummary(rows.map(r => Number(r.PTS) || 0)),
      REB: getStatSummary(rows.map(r => Number(r.REB) || 0)),
      AST: getStatSummary(rows.map(r => Number(r.AST) || 0)),
    };
  }
  const statsTable = getStatTable(data);
  const isLoading = !rows.length;

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', padding: 0 }}>
      {/* Header Bar for Navigation (not sticky, scrolls away) */}
      <div style={{ width: '100%', background: '#111', color: '#fff', padding: '0 0 0 0', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            marginLeft: 28,
            cursor: 'pointer',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          aria-label="Back to Search"
        >
          <span style={{ fontSize: 22, display: 'inline-block', transform: 'translateY(1px)' }}>←</span> Back to Search
        </button>
      </div>
      {/* Top Bar (Player Banner, sticky) */}
      <div style={{ width: '100%', background: teamColor, color: '#fff', padding: 0, marginBottom: 0, boxShadow: '0 2px 8px #22223b22' }}>
        {/* Player Banner Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: teamColor, minHeight: 240, position: 'relative', padding: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            maxWidth: 1200,
            margin: '0 auto',
            gap: 36,
            position: 'relative',
            padding: '0 32px',
          }}>
            {/* Player Image + Team Logo Stack */}
            <div style={{ position: 'relative', width: 200, height: 200, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Team Logo (background, large, faded) */}
              {playerBio?.TEAM_ID && (
                <img
                  src={`https://cdn.nba.com/logos/nba/${playerBio.TEAM_ID}/global/L/logo.svg`}
                  alt={playerBio.TEAM_ABBREVIATION}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 170,
                    height: 170,
                    opacity: 0.13,
                    zIndex: 1,
                    filter: 'drop-shadow(0 2px 12px #0002)',
                  }}
                />
              )}
              {/* Player Profile Picture (large, circular, above logo) */}
              {playerBio?.PLAYER_ID && (
                <img
                  src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${playerBio.PLAYER_ID}.png`}
                  alt={name}
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    background: '#fff',
                    boxShadow: '0 6px 32px #0003',
                    zIndex: 2,
                    border: '6px solid #fff',
                  }}
                />
              )}
            </div>
            {/* Player Info/Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#e3e6ea', marginBottom: 2, letterSpacing: 1 }}>
                {playerBio?.JERSEY ? `#${playerBio.JERSEY}` : ''}
              </div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1, textAlign: 'left', marginBottom: 6 }}>{name.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#e3e6ea', marginTop: 2, marginBottom: 0, textAlign: 'left' }}>
                {playerBio?.TEAM_NAME ? `${playerBio.TEAM_NAME}` : ''}{playerBio?.POSITION ? ` | ${playerBio.POSITION}` : ''}
              </div>
              {/* Headline Stats */}
              <div style={{ display: 'flex', gap: 48, marginTop: 24, justifyContent: 'flex-start', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
                <div style={{ position: 'absolute', left: 0, top: -22, fontSize: 13, color: '#e3e6ea', fontWeight: 700, letterSpacing: 1, marginBottom: 2, textAlign: 'left', width: 80 }}>
                  Season Stats
                </div>
                {['PPG', 'RPG', 'APG'].map((label, i) => (
                  <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 15, color: '#e3e6ea', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>
                      {label === 'PPG' && playerBio?.HEADLINE_PTS ? Number(playerBio.HEADLINE_PTS).toFixed(1) :
                        label === 'RPG' && playerBio?.HEADLINE_REB ? Number(playerBio.HEADLINE_REB).toFixed(1) :
                        label === 'APG' && playerBio?.HEADLINE_AST ? Number(playerBio.HEADLINE_AST).toFixed(1) :
                        '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Player Info Grid */}
        <div style={{ display: 'flex', justifyContent: 'center', background: teamColor, borderTop: '1px solid #e3e6ea', borderBottom: '1px solid #e3e6ea', padding: 0 }}>
          <div style={{ display: 'flex', gap: 48, padding: '18px 0', color: '#fff', fontSize: 16, fontWeight: 500 }}>
            {[
              { label: 'HEIGHT', value: playerBio?.HEIGHT || '-' },
              { label: 'WEIGHT', value: playerBio?.WEIGHT ? `${playerBio.WEIGHT} lb` : '-' },
              { label: 'COUNTRY', value: playerBio?.COUNTRY || '-' },
              { label: 'COLLEGE', value: playerBio?.SCHOOL || '-' },
              { label: 'AGE', value: playerBio?.BIRTHDATE ? `${Math.floor((new Date() - new Date(playerBio.BIRTHDATE)) / (365.25*24*60*60*1000))}` : '-' },
              { label: 'DRAFT', value: playerBio?.DRAFT_YEAR && playerBio?.DRAFT_ROUND && playerBio?.DRAFT_NUMBER ? `${playerBio.DRAFT_YEAR} R${playerBio.DRAFT_ROUND} Pick ${playerBio.DRAFT_NUMBER}` : '-' },
            ].map(({ label, value }) => (
              <div key={label} style={{ minWidth: 110, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#e3e6ea', fontWeight: 400 }}>{label}</div>
                <div style={{ fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content Layout */}
      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '32px 0 32px 0', gap: 32, alignItems: 'flex-start' }}>
        {/* Chart Area (left) */}
        <div style={{
          flex: 2,
          background: 'linear-gradient(135deg, #f8fafc 60%, #e3e6ea 100%)',
          borderRadius: 22,
          boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
          padding: 36,
          fontFamily: 'Inter, sans-serif',
          minWidth: 0,
          marginBottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1.5px solid #e3e6ea',
        }}>
          <h2 style={{ fontWeight: 800, fontSize: 30, marginBottom: 10, textAlign: 'center', color: '#22223b', letterSpacing: 1 }}>{name}</h2>
          {/* Season and Recent Games Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18, justifyContent: 'center', background: 'rgba(245,247,250,0.85)', borderRadius: 10, padding: '10px 18px', boxShadow: '0 2px 8px #0001' }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Season:</span>
            <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} style={{ fontSize: 16, borderRadius: 8, border: '1.5px solid #e3e6ea', padding: 6, minWidth: 90, background: '#fff', fontWeight: 600 }}>
              <option value="All">All</option>
              {allSeasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
            <span style={{ fontWeight: 600, fontSize: 16, marginLeft: 24 }}>Games:</span>
            <input
              type="range"
              min="1"
              max={filteredRows.length}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              style={{ width: 200, margin: '0 12px', verticalAlign: 'middle', accentColor: teamColor, background: 'transparent' }}
            />
            <input
              type="number"
              min="1"
              max={filteredRows.length}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              style={{ width: 60, fontSize: 16, padding: 4, borderRadius: 8, border: '1.5px solid #e3e6ea', background: '#fff', fontWeight: 600 }}
            />
            <span style={{ color: '#888', fontSize: 14 }}>
              (Most recent games)
            </span>
          </div>
          {/* Stat Toggles */}
          <div style={{ marginBottom: 18, display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center', background: 'rgba(245,247,250,0.85)', borderRadius: 10, padding: '8px 18px', boxShadow: '0 2px 8px #0001' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 15 }}>
              <input type="checkbox" checked={showPTS} onChange={e => setShowPTS(e.target.checked)} style={{ accentColor: '#ff6b6b' }} />
              <span style={{ color: '#ff6b6b', fontWeight: 700 }}>PTS</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 15 }}>
              <input type="checkbox" checked={showREB} onChange={e => setShowREB(e.target.checked)} style={{ accentColor: '#4dabf7' }} />
              <span style={{ color: '#4dabf7', fontWeight: 700 }}>REB</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 15 }}>
              <input type="checkbox" checked={showAST} onChange={e => setShowAST(e.target.checked)} style={{ accentColor: '#82ca9d' }} />
              <span style={{ color: '#82ca9d', fontWeight: 700 }}>AST</span>
            </label>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 60, fontSize: 20 }}>
              Loading data...
            </div>
          ) : (
            <div style={{ width: '100%', height: 340, background: 'linear-gradient(120deg, #f8fafc 70%, #e3e6ea 100%)', borderRadius: 18, boxShadow: '0 2px 12px #0001', padding: 12, marginBottom: 0, border: '1.5px solid #e3e6ea' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 16, right: 24, left: 24, bottom: 8 }}>
                  <XAxis
                    dataKey="GAME_IDX"
                    tickLine={false}
                    tick={{ fontSize: 13 }}
                    label={{ value: 'Game', position: 'insideBottom', offset: -4 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13 }}
                    label={{ value: 'Stat', angle: -90, position: 'insideLeft', offset: 0 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0].payload) {
                        const game = payload[0].payload;
                        return (
                          <div style={{ background: '#fff', border: '1.5px solid #e3e6ea', borderRadius: 10, padding: 14, boxShadow: '0 2px 12px #0001', minWidth: 170 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#22223b' }}>Game {game.GAME_IDX}</div>
                            <div style={{ fontSize: 15, color: '#ff6b6b', fontWeight: 700 }}>PTS: <span style={{ fontWeight: 800 }}>{game.PTS}</span></div>
                            <div style={{ fontSize: 15, color: '#4dabf7', fontWeight: 700 }}>REB: <span style={{ fontWeight: 800 }}>{game.REB}</span></div>
                            <div style={{ fontSize: 15, color: '#82ca9d', fontWeight: 700 }}>AST: <span style={{ fontWeight: 800 }}>{game.AST}</span></div>
                            <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
                              {game.GAME_DATE ? formatDate(game.GAME_DATE) : ''}
                              {game.MATCHUP ? ` | ${game.MATCHUP}` : ''}
                              {game.WL ? ` (${game.WL})` : ''}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 15, fontWeight: 700, paddingTop: 8 }} iconType="circle"/>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ea" />
                  {showPTS && (
                    <Line
                      type="linear"
                      dataKey="PTS"
                      stroke="#ff6b6b"
                      dot={<ClickableDot stroke="#ff6b6b" count={count} />}
                      activeDot={{ r: 8, fill: '#ff6b6b', stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }}
                      strokeWidth={3}
                      isAnimationActive={false}
                      name="PTS"
                      style={{ touchAction: 'none' }}
                    />
                  )}
                  {showREB && (
                    <Line
                      type="linear"
                      dataKey="REB"
                      stroke="#4dabf7"
                      dot={<ClickableDot stroke="#4dabf7" count={count} />}
                      activeDot={{ r: 8, fill: '#4dabf7', stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }}
                      strokeWidth={3}
                      isAnimationActive={false}
                      name="REB"
                      style={{ touchAction: 'none' }}
                    />
                  )}
                  {showAST && (
                    <Line
                      type="linear"
                      dataKey="AST"
                      stroke="#82ca9d"
                      dot={<ClickableDot stroke="#82ca9d" count={count} />}
                      activeDot={{ r: 8, fill: '#82ca9d', stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }}
                      strokeWidth={3}
                      isAnimationActive={false}
                      name="AST"
                      style={{ touchAction: 'none' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <GameInfoModal open={!!modalGame} onClose={() => setModalGame(null)} game={modalGame} />
        </div>
        {/* Stat Summary Table (right) */}
        <div style={{
          flex: 1,
          minWidth: 340,
          maxWidth: 420,
          marginLeft: 0,
          background: 'linear-gradient(135deg, #f8fafc 60%, #e3e6ea 100%)',
          borderRadius: 22,
          boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
          padding: 28,
          border: '1.5px solid #e3e6ea',
        }}>
          <h3 style={{ fontWeight: 800, fontSize: 24, marginBottom: 16, color: '#22223b', textAlign: 'left', letterSpacing: 0.5 }}>Stat Summary Table</h3>
          <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 4px 24px #0002', background: 'linear-gradient(90deg, #f8fafc 60%, #f1f3f6 100%)', border: 'none', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 16, minWidth: 340, borderRadius: 14, overflow: 'hidden', background: 'transparent' }}>
              <thead>
                <tr style={{ background: 'rgba(245,247,250,0.98)', color: '#1a1a1a', fontWeight: 800, fontSize: 16, letterSpacing: 0.5, borderBottom: '2px solid #e3e6ea' }}>
                  <th style={{ padding: '14px 8px', textAlign: 'center' }}>Stat</th>
                  <th style={{ padding: '14px 8px', textAlign: 'center' }}>Mean</th>
                  <th style={{ padding: '14px 8px', textAlign: 'center' }}>Variance</th>
                  <th style={{ padding: '14px 8px', textAlign: 'center' }}>Std Dev</th>
                  <th style={{ padding: '14px 8px', textAlign: 'center' }}>Min</th>
                  <th style={{ padding: '14px 8px', textAlign: 'center' }}>Max</th>
                </tr>
              </thead>
              <tbody>
                {['PTS', 'REB', 'AST'].map(stat => (
                  <tr key={stat} style={{ fontWeight: 700 }}>
                    <td style={{ padding: 8, fontWeight: 800 }}>{stat}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsTable[stat].mean.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsTable[stat].variance.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsTable[stat].std.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsTable[stat].min}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsTable[stat].max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Correlation Table */}
          <div style={{ marginTop: 32, maxWidth: 420 }}>
            <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 10, color: '#22223b', letterSpacing: 0.5 }}>Correlation Table</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(90deg, #f8fafc 60%, #f1f3f6 100%)', boxShadow: '0 2px 8px #0001', border: '1.5px solid #e3e6ea' }}>
              <thead>
                <tr style={{ background: '#e3e6ea', color: '#1a1a1a', fontWeight: 800 }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Stat Pair</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Correlation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 8, textAlign: 'center' }}>PTS & REB</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{corrPTS_REB.toFixed(3)}</td>
                </tr>
                <tr>
                  <td style={{ padding: 8, textAlign: 'center' }}>PTS & AST</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{corrPTS_AST.toFixed(3)}</td>
                </tr>
                <tr>
                  <td style={{ padding: 8, textAlign: 'center' }}>REB & AST</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{corrAST_REB.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Stats Table */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 32px 32px' }}>
        <h3 style={{ fontWeight: 800, fontSize: 24, marginBottom: 16, color: '#22223b', letterSpacing: 0.5 }}>Game Log Table</h3>
        <div style={{ overflowX: 'auto', borderRadius: 18, boxShadow: '0 6px 32px #0002', background: 'linear-gradient(90deg, #f8fafc 60%, #f1f3f6 100%)', border: '1.5px solid #e3e6ea', marginTop: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 16, minWidth: 1100, borderRadius: 18, overflow: 'hidden', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(245,247,250,0.98)', color: '#1a1a1a', fontWeight: 800, fontSize: 16, letterSpacing: 0.5, borderBottom: '2px solid #e3e6ea' }}>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>Date</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>Matchup</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>Home/Away</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>W/L</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>PTS</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>REB</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>AST</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>PRA</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>FG%</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>FT%</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>MIN</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>FGA</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>FGM</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>FTA</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>FTM</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>STL</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>BLK</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', borderRight: '1.5px solid #e3e6ea', background: 'rgba(245,247,250,0.98)' }}>PF</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', background: 'rgba(245,247,250,0.98)' }}>+/-</th>
              </tr>
            </thead>
            <tbody>
              {/* Data rows */}
              {data.map((g, idx) => {
                const pra = (Number(g.PTS) || 0) + (Number(g.REB) || 0) + (Number(g.AST) || 0);
                const fgPct = g.FGA ? ((g.FGM / g.FGA) * 100).toFixed(1) : '-';
                const ftPct = g.FTA ? ((g.FTM / g.FTA) * 100).toFixed(1) : '-';
                // Home/Away: if MATCHUP includes '@' it's away, else home
                const homeAway = g.MATCHUP && g.MATCHUP.includes('@') ? 'Away' : 'Home';
                return (
                  <tr key={g.GAME_ID || idx} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.98)' : '#f6f8fa', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => g.GAME_ID && navigate(`/game/${g.GAME_ID}`, { state: { game: g } })}
                    onMouseOver={e => e.currentTarget.style.background = '#e3e6ea'}
                    onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.98)' : '#f6f8fa'}
                  >
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{formatDate(g.GAME_DATE)}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.MATCHUP}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{homeAway}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.WL}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.PTS}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.REB}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.AST}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{pra}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{fgPct}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{ftPct}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.MIN ? Math.round(Number(g.MIN)) : '-'}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.FGA}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.FGM}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.FTA}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.FTM}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.STL}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.BLK}</td>
                    <td style={{ padding: 7, textAlign: 'center', borderRight: '1.5px solid #e3e6ea' }}>{g.PF}</td>
                    <td style={{ padding: 7, textAlign: 'center' }}>{g['PLUS_MINUS']}</td>
                  </tr>
                );
              })}
              {/* Average row as last row in table, no color coding */}
              {data.length > 0 && (
                <tr style={{ background: '#e3e6ea', fontWeight: 800 }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: 7, borderRight: '1.5px solid #e3e6ea', color: '#222' }}>Average</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.PTS) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.REB) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.AST) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + ((Number(g.PTS)||0)+(Number(g.REB)||0)+(Number(g.AST)||0)), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (g.FGA ? (g.FGM / g.FGA) * 100 : 0), 0) / data.filter(g => g.FGA).length || 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (g.FTA ? (g.FTM / g.FTA) * 100 : 0), 0) / data.filter(g => g.FTA).length || 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (g.MIN ? Math.round(Number(g.MIN)) : 0), 0) / data.filter(g => g.MIN).length || 0).toFixed(0)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.FGA) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.FGM) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.FTA) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.FTM) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.STL) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.BLK) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7, borderRight: '1.5px solid #e3e6ea' }}>{(data.reduce((a, g) => a + (Number(g.PF) || 0), 0) / data.length).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: 7 }}>{(data.reduce((a, g) => a + (Number(g['PLUS_MINUS']) || 0), 0) / data.length).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
