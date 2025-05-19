// client/src/pages/ChartPage.js
import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function ChartPage() {
  const { state } = useLocation();          // rows + name passed via navigate
  const { rows = [], name = 'Unknown' } = state || {};

  /* ───── slider for # games ───── */
  const [count, setCount] = useState(10);   // default 10 games

  // slice newest→oldest then reverse for left-to-right chronological
  const data = useMemo(
    () => rows.slice(0, count).reverse(),
    [rows, count],
  );

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h2>{name} – last {count} game{count > 1 ? 's' : ''}</h2>

      {/* slider & numeric input are synced */}
      <label>
        Games:
        <input
          type="range"
          min="1"
          max={Math.min(30, rows.length)}
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          style={{ width: 200, margin: '0 12px' }}
        />
        <input
          type="number"
          min="1"
          max={Math.min(30, rows.length)}
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          style={{ width: 60 }}
        />
      </label>

      {/* straight-line series with dots */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <XAxis dataKey="GAME_DATE" tickLine={false} />
          <YAxis axisLine={false} />
          <Tooltip />
          <Legend verticalAlign="top" />
          <Line type="linear" dataKey="PTS" stroke="#ff6b6b" dot={{ r: 3 }} />
          <Line type="linear" dataKey="REB" stroke="#4dabf7" dot={{ r: 3 }} />
          <Line type="linear" dataKey="AST" stroke="#82ca9d" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
