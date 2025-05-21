import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPlayerBio } from '../utils/fetchData';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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

function getMatchedGames(rowsA, rowsB) {
  // Only games where both players played for the same team, same date
  const gamesA = rowsA.map(r => ({
    date: r.GAME_DATE,
    team: r.TEAM_ABBREVIATION,
    PTS: Number(r.PTS) || 0,
    REB: Number(r.REB) || 0,
    AST: Number(r.AST) || 0,
  }));
  const gamesB = rowsB.map(r => ({
    date: r.GAME_DATE,
    team: r.TEAM_ABBREVIATION,
    PTS: Number(r.PTS) || 0,
    REB: Number(r.REB) || 0,
    AST: Number(r.AST) || 0,
  }));
  // Match by date and team
  const matched = [];
  gamesA.forEach(a => {
    const b = gamesB.find(b => b.date === a.date && b.team === a.team);
    if (b) matched.push({ a, b });
  });
  return matched;
}

function statCorrelations(rowsA, rowsB) {
  // Only if both players are on the same team (most recent game)
  if (!rowsA.length || !rowsB.length) return null;
  const matched = getMatchedGames(rowsA, rowsB);
  if (!matched.length) return null;
  const keys = ['PTS', 'REB', 'AST'];
  const corrs = {};
  keys.forEach(k1 => {
    keys.forEach(k2 => {
      const arrA = matched.map(m => m.a[k1]);
      const arrB = matched.map(m => m.b[k2]);
      const meanA = arrA.reduce((a, b) => a + b, 0) / arrA.length;
      const meanB = arrB.reduce((a, b) => a + b, 0) / arrB.length;
      const num = arrA.reduce((acc, v, i) => acc + (v - meanA) * (arrB[i] - meanB), 0);
      const den = Math.sqrt(arrA.reduce((acc, v) => acc + (v - meanA) ** 2, 0) * arrB.reduce((acc, v) => acc + (v - meanB) ** 2, 0));
      corrs[`${k1}-${k2}`] = den === 0 ? 0 : num / den;
    });
  });
  return { team: matched[0].a.team, corrs, count: matched.length };
}

export default function ComparePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { rowsA = [], rowsB = [], names = [] } = state || {};
  const [bioA, setBioA] = React.useState(null);
  const [bioB, setBioB] = React.useState(null);
  const [overlay, setOverlay] = React.useState(false);
  const [gameCount, setGameCount] = React.useState(20);
  // Stat toggles
  const [showPTS, setShowPTS] = React.useState(true);
  const [showREB, setShowREB] = React.useState(true);
  const [showAST, setShowAST] = React.useState(true);

  React.useEffect(() => {
    fetchPlayerBio().then(bioMap => {
      setBioA(bioMap.get(names[0]?.toUpperCase()));
      setBioB(bioMap.get(names[1]?.toUpperCase()));
    });
  }, [names]);

  // Get all available seasons from both players
  const allSeasons = useMemo(() => {
    const seasonsA = Array.from(new Set(rowsA.map(r => r.SEASON_YEAR)));
    const seasonsB = Array.from(new Set(rowsB.map(r => r.SEASON_YEAR)));
    return Array.from(new Set([...seasonsA, ...seasonsB])).sort();
  }, [rowsA, rowsB]);
  const [selectedSeason, setSelectedSeason] = React.useState('All');

  // Filter rows by selected season
  const filteredRowsA = useMemo(() => selectedSeason === 'All' ? rowsA : rowsA.filter(r => r.SEASON_YEAR === selectedSeason), [rowsA, selectedSeason]);
  const filteredRowsB = useMemo(() => selectedSeason === 'All' ? rowsB : rowsB.filter(r => r.SEASON_YEAR === selectedSeason), [rowsB, selectedSeason]);

  // Only use the most recent N games for each player (after season filter)
  const chartDataA = useMemo(() => filteredRowsA.slice(0, gameCount).reverse().map((r, i) => ({
    ...r,
    GAME_IDX: i + 1,
    PTS: Number(r.PTS) || 0,
    REB: Number(r.REB) || 0,
    AST: Number(r.AST) || 0,
  })), [filteredRowsA, gameCount]);
  const chartDataB = useMemo(() => filteredRowsB.slice(0, gameCount).reverse().map((r, i) => ({
    ...r,
    GAME_IDX: i + 1,
    PTS: Number(r.PTS) || 0,
    REB: Number(r.REB) || 0,
    AST: Number(r.AST) || 0,
  })), [filteredRowsB, gameCount]);

  // Stat tables for the selected games
  const statsA = getStatTable(filteredRowsA.slice(0, gameCount));
  const statsB = getStatTable(filteredRowsB.slice(0, gameCount));

  // Correlations for matched games in the selected window
  const corrs = useMemo(() => statCorrelations(filteredRowsA.slice(0, gameCount), filteredRowsB.slice(0, gameCount)), [filteredRowsA, filteredRowsB, gameCount]);

  // For overlay, align both players' games by GAME_IDX (shortest length)
  const overlayData = useMemo(() => {
    const minLen = Math.min(chartDataA.length, chartDataB.length);
    return Array.from({ length: minLen }, (_, i) => ({
      GAME_IDX: i + 1,
      [`A_PTS`]: chartDataA[i]?.PTS ?? null,
      [`A_REB`]: chartDataA[i]?.REB ?? null,
      [`A_AST`]: chartDataA[i]?.AST ?? null,
      [`B_PTS`]: chartDataB[i]?.PTS ?? null,
      [`B_REB`]: chartDataB[i]?.REB ?? null,
      [`B_AST`]: chartDataB[i]?.AST ?? null,
      [`A_GAME_ID`]: chartDataA[i]?.GAME_ID,
      [`B_GAME_ID`]: chartDataB[i]?.GAME_ID,
    }));
  }, [chartDataA, chartDataB]);

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', padding: 0, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', background: '#111', color: '#fff', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, fontSize: 18, marginLeft: 28, cursor: 'pointer', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}
          aria-label="Back to Search"
        >
          <span style={{ fontSize: 22, display: 'inline-block', transform: 'translateY(1px)' }}>←</span> Back to Search
        </button>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0 32px 0', display: 'flex', gap: 32 }}>
        {/* Player A Card */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img src={`https://cdn.nba.com/headshots/nba/latest/260x190/${rowsA[0]?.PLAYER_ID}.png`} alt={names[0]} style={{ width: 90, height: 66, borderRadius: 10, objectFit: 'cover', background: '#eee' }} />
          <div style={{ fontWeight: 800, fontSize: 26 }}>{names[0]}</div>
          <div style={{ color: '#888', fontSize: 16 }}>{bioA?.TEAM_NAME} | {bioA?.POSITION}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>PPG: <span style={{ color: '#174734' }}>{bioA?.HEADLINE_PTS || '-'}</span></div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>RPG: <span style={{ color: '#174734' }}>{bioA?.HEADLINE_REB || '-'}</span></div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>APG: <span style={{ color: '#174734' }}>{bioA?.HEADLINE_AST || '-'}</span></div>
        </div>
        {/* VS Divider */}
        <div style={{ alignSelf: 'center', fontWeight: 900, fontSize: 38, color: '#888', margin: '0 12px' }}>VS</div>
        {/* Player B Card */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img src={`https://cdn.nba.com/headshots/nba/latest/260x190/${rowsB[0]?.PLAYER_ID}.png`} alt={names[1]} style={{ width: 90, height: 66, borderRadius: 10, objectFit: 'cover', background: '#eee' }} />
          <div style={{ fontWeight: 800, fontSize: 26 }}>{names[1]}</div>
          <div style={{ color: '#888', fontSize: 16 }}>{bioB?.TEAM_NAME} | {bioB?.POSITION}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>PPG: <span style={{ color: '#174734' }}>{bioB?.HEADLINE_PTS || '-'}</span></div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>RPG: <span style={{ color: '#174734' }}>{bioB?.HEADLINE_REB || '-'}</span></div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>APG: <span style={{ color: '#174734' }}>{bioB?.HEADLINE_AST || '-'}</span></div>
        </div>
      </div>
      {/* Season Filter */}
      <div style={{ maxWidth: 1200, margin: '0 auto', marginTop: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Season:</span>
        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} style={{ fontSize: 16, borderRadius: 6, border: '1px solid #ccc', padding: 4, minWidth: 90 }}>
          <option value="All">All</option>
          {allSeasons.map(season => (
            <option key={season} value={season}>{season}</option>
          ))}
        </select>
        <span style={{ fontWeight: 600, fontSize: 16, marginLeft: 24 }}>Games Shown:</span>
        <input
          type="range"
          min={3}
          max={Math.max(filteredRowsA.length, filteredRowsB.length, 40)}
          value={gameCount}
          onChange={e => setGameCount(Number(e.target.value))}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <input
          type="number"
          min={3}
          max={Math.max(filteredRowsA.length, filteredRowsB.length, 40)}
          value={gameCount}
          onChange={e => setGameCount(Number(e.target.value))}
          style={{ width: 60, marginLeft: 8, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', padding: 4, textAlign: 'center' }}
        />
        <span style={{ color: '#888', fontSize: 14 }}>
          (Most recent games)
        </span>
      </div>
      {/* Charts Section (now above stat table) */}
      <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Game Log Charts</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500 }}>
            <input type="checkbox" checked={overlay} onChange={e => setOverlay(e.target.checked)} style={{ marginRight: 4 }} />
            Overlay Both Players
          </label>
          {/* Stat toggles */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
            <button
              onClick={() => setShowPTS(v => !v)}
              style={{
                background: showPTS ? '#ff6b6b' : '#f6f8fa',
                color: showPTS ? '#fff' : '#888',
                border: 'none',
                borderRadius: 8,
                padding: '6px 18px',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: showPTS ? '0 2px 8px #ff6b6b22' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              aria-pressed={showPTS}
            >PTS</button>
            <button
              onClick={() => setShowREB(v => !v)}
              style={{
                background: showREB ? '#4dabf7' : '#f6f8fa',
                color: showREB ? '#fff' : '#888',
                border: 'none',
                borderRadius: 8,
                padding: '6px 18px',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: showREB ? '0 2px 8px #4dabf722' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              aria-pressed={showREB}
            >REB</button>
            <button
              onClick={() => setShowAST(v => !v)}
              style={{
                background: showAST ? '#82ca9d' : '#f6f8fa',
                color: showAST ? '#fff' : '#888',
                border: 'none',
                borderRadius: 8,
                padding: '6px 18px',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: showAST ? '0 2px 8px #82ca9d22' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              aria-pressed={showAST}
            >AST</button>
          </div>
        </div>
        {overlay ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={overlayData} margin={{ left: 24, right: 24, top: 16, bottom: 8 }}>
              <XAxis dataKey="GAME_IDX" tick={{ fontSize: 13 }} label={{ value: 'Game', position: 'insideBottom', offset: -4 }} />
              <YAxis tick={{ fontSize: 13 }} label={{ value: 'Stat', angle: -90, position: 'insideLeft', offset: 0 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    // Find the overlayData point
                    const d = payload[0].payload;
                    // Show both players' game info for this index
                    return (
                      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px #0001', minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Game {d.GAME_IDX}</div>
                        {/* Player A info */}
                        {d.A_GAME_ID && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ fontWeight: 600, color: '#ff6b6b' }}>{names[0]}</div>
                            <div style={{ fontSize: 14, color: '#444' }}>PTS: {d.A_PTS}, REB: {d.A_REB}, AST: {d.A_AST}</div>
                            <div style={{ fontSize: 13, color: '#888' }}>
                              {filteredRowsA[chartDataA.length - d.GAME_IDX]?.GAME_DATE ? new Date(filteredRowsA[chartDataA.length - d.GAME_IDX].GAME_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              {filteredRowsA[chartDataA.length - d.GAME_IDX]?.MATCHUP ? ` | ${filteredRowsA[chartDataA.length - d.GAME_IDX].MATCHUP}` : ''}
                              {filteredRowsA[chartDataA.length - d.GAME_IDX]?.WL ? ` (${filteredRowsA[chartDataA.length - d.GAME_IDX].WL})` : ''}
                            </div>
                          </div>
                        )}
                        {/* Player B info */}
                        {d.B_GAME_ID && (
                          <div>
                            <div style={{ fontWeight: 600, color: '#b8860b' }}>{names[1]}</div>
                            <div style={{ fontSize: 14, color: '#444' }}>PTS: {d.B_PTS}, REB: {d.B_REB}, AST: {d.B_AST}</div>
                            <div style={{ fontSize: 13, color: '#888' }}>
                              {filteredRowsB[chartDataB.length - d.GAME_IDX]?.GAME_DATE ? new Date(filteredRowsB[chartDataB.length - d.GAME_IDX].GAME_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              {filteredRowsB[chartDataB.length - d.GAME_IDX]?.MATCHUP ? ` | ${filteredRowsB[chartDataB.length - d.GAME_IDX].MATCHUP}` : ''}
                              {filteredRowsB[chartDataB.length - d.GAME_IDX]?.WL ? ` (${filteredRowsB[chartDataB.length - d.GAME_IDX].WL})` : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {showPTS && (
                <Line type="linear" dataKey="A_PTS" name={`${names[0]} PTS`} stroke="#ff6b6b" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                  const game = overlayData[idx];
                  if (game && game.A_GAME_ID) navigate(`/game/${game.A_GAME_ID}`);
                }} />
              )}
              {showREB && (
                <Line type="linear" dataKey="A_REB" name={`${names[0]} REB`} stroke="#4dabf7" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                  const game = overlayData[idx];
                  if (game && game.A_GAME_ID) navigate(`/game/${game.A_GAME_ID}`);
                }} />
              )}
              {showAST && (
                <Line type="linear" dataKey="A_AST" name={`${names[0]} AST`} stroke="#82ca9d" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                  const game = overlayData[idx];
                  if (game && game.A_GAME_ID) navigate(`/game/${game.A_GAME_ID}`);
                }} />
              )}
              {showPTS && (
                <Line type="linear" dataKey="B_PTS" name={`${names[1]} PTS`} stroke="#b8860b" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                  const game = overlayData[idx];
                  if (game && game.B_GAME_ID) navigate(`/game/${game.B_GAME_ID}`);
                }} />
              )}
              {showREB && (
                <Line type="linear" dataKey="B_REB" name={`${names[1]} REB`} stroke="#8a2be2" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                  const game = overlayData[idx];
                  if (game && game.B_GAME_ID) navigate(`/game/${game.B_GAME_ID}`);
                }} />
              )}
              {showAST && (
                <Line type="linear" dataKey="B_AST" name={`${names[1]} AST`} stroke="#e67300" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                  const game = overlayData[idx];
                  if (game && game.B_GAME_ID) navigate(`/game/${game.B_GAME_ID}`);
                }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, textAlign: 'center' }}>{names[0]}</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartDataA} margin={{ left: 18, right: 18, top: 12, bottom: 8 }}>
                  <XAxis dataKey="GAME_IDX" tick={{ fontSize: 12 }} label={{ value: 'Game', position: 'insideBottom', offset: -4 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'Stat', angle: -90, position: 'insideLeft', offset: 0 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length && payload[0].payload) {
                        const d = payload[0].payload;
                        const idx = d.GAME_IDX - 1;
                        const row = filteredRowsA[chartDataA.length - d.GAME_IDX];
                        return (
                          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px #0001', minWidth: 170 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Game {d.GAME_IDX}</div>
                            <div style={{ fontSize: 15, color: '#ff6b6b', fontWeight: 600 }}>PTS: <span style={{ fontWeight: 700 }}>{d.PTS}</span></div>
                            <div style={{ fontSize: 15, color: '#4dabf7', fontWeight: 600 }}>REB: <span style={{ fontWeight: 700 }}>{d.REB}</span></div>
                            <div style={{ fontSize: 15, color: '#82ca9d', fontWeight: 600 }}>AST: <span style={{ fontWeight: 700 }}>{d.AST}</span></div>
                            <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
                              {row?.GAME_DATE ? new Date(row.GAME_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              {row?.MATCHUP ? ` | ${row.MATCHUP}` : ''}
                              {row?.WL ? ` (${row.WL})` : ''}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {showPTS && (
                    <Line type="linear" dataKey="PTS" stroke="#ff6b6b" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                      const game = chartDataA[idx];
                      if (game && game.GAME_ID) navigate(`/game/${game.GAME_ID}`);
                    }} />
                  )}
                  {showREB && (
                    <Line type="linear" dataKey="REB" stroke="#4dabf7" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                      const game = chartDataA[idx];
                      if (game && game.GAME_ID) navigate(`/game/${game.GAME_ID}`);
                    }} />
                  )}
                  {showAST && (
                    <Line type="linear" dataKey="AST" stroke="#82ca9d" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                      const game = chartDataA[idx];
                      if (game && game.GAME_ID) navigate(`/game/${game.GAME_ID}`);
                    }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, textAlign: 'center' }}>{names[1]}</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartDataB} margin={{ left: 18, right: 18, top: 12, bottom: 8 }}>
                  <XAxis dataKey="GAME_IDX" tick={{ fontSize: 12 }} label={{ value: 'Game', position: 'insideBottom', offset: -4 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'Stat', angle: -90, position: 'insideLeft', offset: 0 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length && payload[0].payload) {
                        const d = payload[0].payload;
                        const idx = d.GAME_IDX - 1;
                        const row = filteredRowsB[chartDataB.length - d.GAME_IDX];
                        return (
                          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px #0001', minWidth: 170 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Game {d.GAME_IDX}</div>
                            <div style={{ fontSize: 15, color: '#b8860b', fontWeight: 600 }}>PTS: <span style={{ fontWeight: 700 }}>{d.PTS}</span></div>
                            <div style={{ fontSize: 15, color: '#8a2be2', fontWeight: 600 }}>REB: <span style={{ fontWeight: 700 }}>{d.REB}</span></div>
                            <div style={{ fontSize: 15, color: '#e67300', fontWeight: 600 }}>AST: <span style={{ fontWeight: 700 }}>{d.AST}</span></div>
                            <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
                              {row?.GAME_DATE ? new Date(row.GAME_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              {row?.MATCHUP ? ` | ${row.MATCHUP}` : ''}
                              {row?.WL ? ` (${row.WL})` : ''}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {showPTS && (
                    <Line type="linear" dataKey="PTS" stroke="#b8860b" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                      const game = chartDataB[idx];
                      if (game && game.GAME_ID) navigate(`/game/${game.GAME_ID}`);
                    }} />
                  )}
                  {showREB && (
                    <Line type="linear" dataKey="REB" stroke="#8a2be2" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                      const game = chartDataB[idx];
                      if (game && game.GAME_ID) navigate(`/game/${game.GAME_ID}`);
                    }} />
                  )}
                  {showAST && (
                    <Line type="linear" dataKey="AST" stroke="#e67300" dot={{ r: 5 }} activeDot={{ r: 8 }} onClick={(_, idx) => {
                      const game = chartDataB[idx];
                      if (game && game.GAME_ID) navigate(`/game/${game.GAME_ID}`);
                    }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      {/* Stat Table */}
      <div style={{ maxWidth: 1200, margin: '0 auto', marginTop: 0, display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', marginBottom: 32 }}>
            <thead>
              <tr style={{ background: '#e3e6ea', color: '#174734', fontWeight: 700 }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Stat</th>
                <th style={{ textAlign: 'center', padding: 8 }}>{names[0]}</th>
                <th style={{ textAlign: 'center', padding: 8 }}>{names[1]}</th>
              </tr>
            </thead>
            <tbody>
              {['PTS', 'REB', 'AST'].map(stat => (
                <React.Fragment key={stat}>
                  <tr style={{ fontWeight: 700, background: '#f6f8fa' }}>
                    <td style={{ padding: 8 }}>{stat}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsA[stat].mean.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsB[stat].mean.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 8, color: '#888' }}>Variance</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsA[stat].variance.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsB[stat].variance.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 8, color: '#888' }}>Std Dev</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsA[stat].std.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsB[stat].std.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 8, color: '#888' }}>Min</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsA[stat].min}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsB[stat].min}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 8, color: '#888' }}>Max</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsA[stat].max}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{statsB[stat].max}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Correlations if same team */}
      {corrs && (
        <div style={{ maxWidth: 900, margin: '32px auto', background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px #0001', padding: 32 }}>
          <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: '#174734' }}>Stat Correlations (Same Team: {corrs.team}, Matched Games: {corrs.count})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 17 }}>
            <thead>
              <tr style={{ color: '#888', fontWeight: 700 }}>
                <th></th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
              </tr>
            </thead>
            <tbody>
              {['PTS', 'REB', 'AST'].map(k1 => (
                <tr key={k1}>
                  <td style={{ fontWeight: 700 }}>{k1}</td>
                  {['PTS', 'REB', 'AST'].map(k2 => (
                    <td key={k2} style={{ textAlign: 'center', color: Math.abs(corrs.corrs[`${k1}-${k2}`]) > 0.5 ? '#4dabf7' : '#888' }}>
                      {corrs.corrs[`${k1}-${k2}`].toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
