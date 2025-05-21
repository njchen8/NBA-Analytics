import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Papa from 'papaparse';

// Format date to "May 21, 2025" format
function formatDate(dateStr) {
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

export default function GamePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [game, setGame] = useState(state?.game || null);
  const [loading, setLoading] = useState(!state?.game);
  const [allPlayers, setAllPlayers] = useState([]);
  
  console.log('GamePage rendered:', { gameId, stateGame: state?.game });
  
  useEffect(() => {
    // Reset state when game ID changes
    if (!game && gameId) {
      console.log('Loading game data from CSV for gameId:', gameId);
      // Fetch the CSV and find the game by GAME_ID
      Papa.parse('/nba_players_game_logs_2018_25.csv', {
        header: true,
        download: true,
        dynamicTyping: true,
        complete: ({ data }) => {
          console.log('CSV data loaded, rows:', data.length);
          const found = data.find(row => String(row.GAME_ID) === String(gameId));
          console.log('Game found in CSV:', found ? 'Yes' : 'No');
          setGame(found || null);
          setLoading(false);
        },
      });
    } else {
      setLoading(false);
    }
  }, [game, gameId]);

  useEffect(() => {
    if (game && game.GAME_ID) {
      // Load all players for this GAME_ID
      Papa.parse('/nba_players_game_logs_2018_25.csv', {
        header: true,
        download: true,
        dynamicTyping: true,
        complete: ({ data }) => {
          const players = data.filter(row => String(row.GAME_ID) === String(game.GAME_ID));
          setAllPlayers(players);
        },
      });
    }
  }, [game]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading game data...</div>;
  }

  if (!game) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>No game data found.</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: 24, background: '#4dabf7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', padding: 0 }}>
      <div style={{ width: '100%', background: '#22223b', color: '#fff', padding: '18px 0 14px 0', marginBottom: 0, boxShadow: '0 2px 8px #22223b22', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 22, marginLeft: 36, letterSpacing: 1 }}>Game Details</div>
        <button onClick={() => navigate(-1)} style={{ marginRight: 36, background: '#4dabf7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #4dabf733', transition: 'all 0.15s' }}>Back</button>
      </div>
      <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 36, fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontWeight: 700, fontSize: 26, marginBottom: 8 }}>{game.MATCHUP} ({game.WL})</h2>
        <div style={{ color: '#888', marginBottom: 18 }}>{formatDate(game.GAME_DATE)}</div>
        <div style={{ fontSize: 15, marginBottom: 8, maxHeight: 420, overflowY: 'auto' }}>
          {Object.entries(game).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: 8, borderBottom: '1px solid #f1f1f1', padding: '2px 0' }}>
              <span style={{ minWidth: 140, color: '#888', fontWeight: 500 }}>{key}:</span>
              <span style={{ color: '#222' }}>{String(value)}</span>
            </div>
          ))}
        </div>
        {/* All Players in this Game */}
        <h3 style={{ fontWeight: 700, fontSize: 20, margin: '32px 0 12px 0', color: '#174734' }}>Players in this Game</h3>
        <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid #eee', borderRadius: 10, background: '#fafbfc', padding: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ color: '#888', fontWeight: 700 }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th>Team</th>
                <th>MIN</th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
                <th>FGM</th>
                <th>FGA</th>
                <th>FG%</th>
                <th>3PM</th>
                <th>3PA</th>
                <th>FTM</th>
                <th>FTA</th>
                <th>+/-</th>
              </tr>
            </thead>
            <tbody>
              {allPlayers.map(p => (
                <tr key={p.PLAYER_ID + p.TEAM_ABBREVIATION}>
                  <td style={{ fontWeight: 700, padding: 6 }}>{p.PLAYER_NAME}</td>
                  <td>{p.TEAM_ABBREVIATION}</td>
                  <td>{p.MIN}</td>
                  <td>{p.PTS}</td>
                  <td>{p.REB}</td>
                  <td>{p.AST}</td>
                  <td>{p.FGM}</td>
                  <td>{p.FGA}</td>
                  <td>{p.FG_PCT}</td>
                  <td>{p.FG3M}</td>
                  <td>{p.FG3A}</td>
                  <td>{p.FTM}</td>
                  <td>{p.FTA}</td>
                  <td>{p.PLUS_MINUS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
