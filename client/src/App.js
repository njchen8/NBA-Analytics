// client/src/App.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter, Routes, Route, useNavigate,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPlayerData } from './utils/fetchData';
import ChartPage from './pages/ChartPage';

function Dashboard() {
  const [allRows, setAllRows]     = useState([]);
  const [uniqueRows, setUnique]   = useState([]);   // one per player
  const [term, setTerm]           = useState('');
  const navigate = useNavigate();

  /* ───────── load CSV once ───────── */
  useEffect(() => {
    fetchPlayerData().then(({ rows, unique }) => {
      setAllRows(rows);            // every game
      setUnique(unique);           // ~500 unique names
    });
  }, []);

  /* ───────── fast local filter ───── */
  const results = useMemo(() => {
    const t = term.toLowerCase().replace(/\s+/g, '');
    return uniqueRows.filter(p =>
      p.PLAYER_NAME.toLowerCase().replace(/\s+/g, '').includes(t)
    );
  }, [term, uniqueRows]);

  /* ───────── navigate in-app ─────── */
  const goToChart = (playerName) => {
    const rows = allRows
      .filter(r => r.PLAYER_NAME === playerName)
      .sort((a, b) => new Date(b.GAME_DATE) - new Date(a.GAME_DATE)); // newest first

    navigate(`/chart/${encodeURIComponent(playerName)}`, {
      state: { rows, name: playerName },
    });
  };

  return (
    <div style={{ padding: 32, maxWidth: 660, margin: '0 auto' }}>
      <h1>NBA Player Dashboard</h1>

      <input
        value={term}
        onChange={e => setTerm(e.target.value)}
        placeholder="Search players…"
        style={{ width: '100%', padding: 8, marginBottom: 8 }}
      />

      {term && results.map(p => (
        <motion.div
          key={p.PLAYER_NAME}
          whileHover={{ scale: 1.02 }}
          onClick={() => goToChart(p.PLAYER_NAME)}
          style={{
            padding: 12,
            borderBottom: '1px solid #eee',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {p.PLAYER_NAME}
        </motion.div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chart/:name" element={<ChartPage />} />
      </Routes>
    </BrowserRouter>
  );
}
