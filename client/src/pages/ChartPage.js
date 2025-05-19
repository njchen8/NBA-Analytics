// client/src/pages/ChartPage.js
import React, { useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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
  
  // Early return if no valid coordinates or payload
  if (!cx || !cy || !payload) return null;
  
  return (
    <g>
      {/* Invisible larger hit area */}
      <circle
        cx={cx}
        cy={cy}
        r={15}  // Large invisible hit area
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (payload && payload.GAME_ID) {
            navigate(`/game/${payload.GAME_ID}`, { state: { game: payload } });
          }
        }}
      />
      {/* Visible dot (same size as before) */}      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#fff"
        stroke={stroke || '#ff6b6b'}
        strokeWidth={2}
        style={{ pointerEvents: 'none' }} /* This ensures clicks pass through to the larger circle */
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

  // slice newest→oldest then reverse for left-to-right chronological
  const data = useMemo(() => rows.slice(0, count).reverse().map((row, idx) => ({ ...row, GAME_IDX: idx + 1 })), [rows, count]);
  const isLoading = !rows.length;

  // Metrics
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

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', padding: 0 }}>
      {/* Top Bar */}
      <div style={{ width: '100%', background: '#22223b', color: '#fff', padding: '18px 0 14px 0', marginBottom: 0, boxShadow: '0 2px 8px #22223b22', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 22, marginLeft: 36, letterSpacing: 1 }}>{name} Stats</div>
        <button onClick={() => navigate('/')} style={{ marginRight: 36, background: '#4dabf7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #4dabf733', transition: 'all 0.15s' }}>Back to Main</button>
      </div>
      {/* Main Content Layout */}
      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '32px 0 32px 0', gap: 32 }}>
        {/* Chart Area */}
        <div style={{ flex: 2, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32, fontFamily: 'Inter, sans-serif', minWidth: 0 }}>
          <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8 }}>{name} <span style={{fontWeight:400, color:'#888'}}>– last {count} game{count > 1 ? 's' : ''}</span></h2>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ fontWeight: 500, fontSize: 16 }}>
              Games:
              <input
                type="range"
                min="1"
                max={Math.min(30, rows.length)}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                style={{ width: 200, margin: '0 12px', verticalAlign: 'middle' }}
              />
              <input
                type="number"
                min="1"
                max={Math.min(30, rows.length)}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                style={{ width: 60, fontSize: 16, padding: 4, borderRadius: 6, border: '1px solid #ddd' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 18, display: 'flex', gap: 18, alignItems: 'center' }}>
            <span style={{ fontWeight: 500, fontSize: 15 }}>Overlay:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={showPTS} onChange={e => setShowPTS(e.target.checked)} />
              <span style={{ color: '#ff6b6b', fontWeight: 600 }}>PTS</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={showREB} onChange={e => setShowREB(e.target.checked)} />
              <span style={{ color: '#4dabf7', fontWeight: 600 }}>REB</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={showAST} onChange={e => setShowAST(e.target.checked)} />
              <span style={{ color: '#82ca9d', fontWeight: 600 }}>AST</span>
            </label>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 60, fontSize: 20 }}>
              Loading data...
            </div>
          ) : (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 24, right: 24, left: 0, bottom: 8 }}>
                  <XAxis dataKey="GAME_IDX" tickLine={false} tickFormatter={i => `Game ${i}`} interval={0} height={60}
                    tick={{ fontSize: Math.max(10, 18 - Math.floor(data.length / 4)) }}
                  />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" iconType="circle" height={36} />
                  {showPTS && (
                    <Line
                      type="linear"
                      dataKey="PTS"
                      stroke="#ff6b6b"
                      dot={<ClickableDot stroke="#ff6b6b" />}
                      activeDot={{ 
                        r: 10,  // Visible radius
                        fill: '#ff6b6b', 
                        stroke: '#fff', 
                        strokeWidth: 2, 
                        cursor: 'pointer',
                        onClick: (data) => {
                          if (data && data.payload && data.payload.GAME_ID) {
                            navigate(`/game/${data.payload.GAME_ID}`, { state: { game: data.payload } });
                          }
                        }
                      }}
                      strokeWidth={3}
                      isAnimationActive={false}
                      name="PTS"
                      style={{ touchAction: 'none' }} // Improves touch interactions
                    />
                  )}
                  {showREB ? (
                    <Line
                      type="linear"
                      dataKey="REB"
                      stroke="#4dabf7"
                      dot={<ClickableDot stroke="#4dabf7" />}
                      activeDot={{ 
                        r: 10, 
                        fill: '#4dabf7', 
                        stroke: '#fff', 
                        strokeWidth: 2, 
                        cursor: 'pointer',
                        onClick: (data) => {
                          if (data && data.payload && data.payload.GAME_ID) {
                            navigate(`/game/${data.payload.GAME_ID}`, { state: { game: data.payload } });
                          }
                        }
                      }}
                      strokeWidth={2}
                      isAnimationActive={false}
                      name="REB"
                      style={{ touchAction: 'none' }}
                    />
                  ) : null}
                  {showAST ? (
                    <Line
                      type="linear"
                      dataKey="AST"
                      stroke="#82ca9d"
                      dot={<ClickableDot stroke="#82ca9d" />}
                      activeDot={{ 
                        r: 10, 
                        fill: '#82ca9d', 
                        stroke: '#fff', 
                        strokeWidth: 2, 
                        cursor: 'pointer',
                        onClick: (data) => {
                          if (data && data.payload && data.payload.GAME_ID) {
                            navigate(`/game/${data.payload.GAME_ID}`, { state: { game: data.payload } });
                          }
                        }
                      }}
                      strokeWidth={2}
                      isAnimationActive={false}
                      name="AST"
                      style={{ touchAction: 'none' }}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <GameInfoModal open={!!modalGame} onClose={() => setModalGame(null)} game={modalGame} />
        </div>
        {/* Sidebar */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 340, background: '#f8f9fa', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: 28, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 18, height: 'fit-content', marginTop: 8 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, marginBottom: 8, color: '#22223b' }}>Key Metrics</h3>
          <div style={{ fontSize: 15, color: '#222', marginBottom: 8 }}>
            <b>Win %:</b> {winPct.toFixed(1)}%<br />
            <b>Avg PTS:</b> {statsPTS.mean.toFixed(1)}<br />
            <b>Avg REB:</b> {statsREB.mean.toFixed(1)}<br />
            <b>Avg AST:</b> {statsAST.mean.toFixed(1)}<br />
            <b>PTS Min/Max:</b> {statsPTS.min} / {statsPTS.max}<br />
            <b>REB Min/Max:</b> {statsREB.min} / {statsREB.max}<br />
            <b>AST Min/Max:</b> {statsAST.min} / {statsAST.max}<br />
          </div>
          <div style={{ fontSize: 15, color: '#222', marginBottom: 8 }}>
            <b>Variance (PTS/REB/AST):</b><br />
            {statsPTS.variance.toFixed(2)} / {statsREB.variance.toFixed(2)} / {statsAST.variance.toFixed(2)}<br />
            <b>Std Dev (PTS/REB/AST):</b><br />
            {statsPTS.std.toFixed(2)} / {statsREB.std.toFixed(2)} / {statsAST.std.toFixed(2)}
          </div>
          <div style={{ fontSize: 15, color: '#222', marginBottom: 8 }}>
            <b>Correlations:</b><br />
            PTS-AST: <span style={{ color: Math.abs(corrPTS_AST) > 0.5 ? '#4dabf7' : '#888' }}>{corrPTS_AST.toFixed(2)}</span><br />
            PTS-REB: <span style={{ color: Math.abs(corrPTS_REB) > 0.5 ? '#4dabf7' : '#888' }}>{corrPTS_REB.toFixed(2)}</span><br />
            AST-REB: <span style={{ color: Math.abs(corrAST_REB) > 0.5 ? '#4dabf7' : '#888' }}>{corrAST_REB.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 15, color: '#222', marginBottom: 8 }}>
            <b>Games Played:</b> {data.length}
          </div>
        </div>
      </div>
    </div>
  );
}
