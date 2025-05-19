// src/utils/fetchData.js
import Papa from 'papaparse';

export const fetchPlayerData = () =>
  new Promise((resolve) => {
    Papa.parse('/nba_players_game_logs_2018_25.csv', {
      header: true,
      download: true,
      dynamicTyping: true,
      complete: ({ data }) => {
        const rows   = data.filter(r => r.PLAYER_NAME && !isNaN(r.PTS));
        const map    = new Map();                  // ← O(N) dedupe
        rows.forEach(r => map.set(r.PLAYER_NAME, r));
        const unique = Array.from(map.values());   // ~ 500 players
        resolve({ rows, unique });
      },
    });
  });
