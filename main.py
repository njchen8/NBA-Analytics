from fastapi import FastAPI, Query
import sqlite3
import pandas as pd
from typing import Optional

app = FastAPI()
DB_FILE = "nba_game_logs.db"

def run_query(query, params=()):
    with sqlite3.connect(DB_FILE) as conn:
        df = pd.read_sql_query(query, conn, params=params)
    return df.to_dict(orient="records")

@app.get("/players")
def get_players():
    query = "SELECT DISTINCT PLAYER_NAME FROM game_logs ORDER BY PLAYER_NAME"
    return run_query(query)

@app.get("/player/games")
def get_player_games(
    name: str,
    limit: int = 10,
    vs_team: Optional[str] = None,
    stat: Optional[str] = None,
    order: str = "DESC"
):
    query = f"""
        SELECT GAME_DATE, TEAM_ABBREVIATION, MATCHUP, {stat if stat else '*'}
        FROM game_logs
        WHERE PLAYER_NAME = ?
    """
    params = [name]

    if vs_team:
        query += " AND MATCHUP LIKE ?"
        params.append(f"%{vs_team}%")

    query += f" ORDER BY GAME_DATE {order} LIMIT ?"
    params.append(limit)

    return run_query(query, params)
