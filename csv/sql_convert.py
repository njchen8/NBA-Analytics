import pandas as pd
import sqlite3

CSV_FILE = "nba_players_game_logs_2018_25.csv"
DB_FILE = "nba_game_logs.db"
TABLE_NAME = "game_logs"

# Load CSV
df = pd.read_csv(CSV_FILE, low_memory=False)

# Convert GAME_DATE to consistent format
df["GAME_DATE"] = pd.to_datetime(df["GAME_DATE"]).dt.strftime("%Y-%m-%dT%H:%M:%S")

# Write to SQLite
conn = sqlite3.connect(DB_FILE)
df.to_sql(TABLE_NAME, conn, if_exists="replace", index=False)
conn.commit()
conn.close()

print(f"✅ Successfully converted {CSV_FILE} to {DB_FILE} ({TABLE_NAME} table)")
