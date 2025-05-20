from nba_api.stats.endpoints import commonplayerinfo
from nba_api.stats.endpoints import commonallplayers
import requests
import pandas as pd
import time
import os
import csv
from datetime import datetime

# NBA API Endpoint for Player Bio Stats
NBA_BIO_URL = "https://stats.nba.com/stats/leaguedashplayerbiostats"
NBA_PLAYER_LIST_URL = "https://stats.nba.com/stats/commonallplayers"

HEADERS = {
    "Host": "stats.nba.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.nba.com/stats/players/bio",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true"
}

SEASON = "2023-24"

# Static mapping of NBA team full names to primary color (hex)
TEAM_COLORS = {
    'Atlanta Hawks': '#E03A3E',
    'Boston Celtics': '#007A33',
    'Brooklyn Nets': '#000000',
    'Charlotte Hornets': '#1D1160',
    'Chicago Bulls': '#CE1141',
    'Cleveland Cavaliers': '#6F263D',
    'Dallas Mavericks': '#00538C',
    'Denver Nuggets': '#0E2240',
    'Detroit Pistons': '#C8102E',
    'Golden State Warriors': '#1D428A',
    'Houston Rockets': '#CE1141',
    'Indiana Pacers': '#002D62',
    'LA Clippers': '#C8102E',
    'Los Angeles Lakers': '#552583',
    'Memphis Grizzlies': '#5D76A9',
    'Miami Heat': '#98002E',
    'Milwaukee Bucks': '#174734',
    'Minnesota Timberwolves': '#0C2340',
    'New Orleans Pelicans': '#0C2340',
    'New York Knicks': '#006BB6',
    'Oklahoma City Thunder': '#007AC1',
    'Orlando Magic': '#0077C0',
    'Philadelphia 76ers': '#006BB6',
    'Phoenix Suns': '#1D1160',
    'Portland Trail Blazers': '#E03A3E',
    'Sacramento Kings': '#5A2D81',
    'San Antonio Spurs': '#C4CED4',
    'Toronto Raptors': '#CE1141',
    'Utah Jazz': '#002B5C',
    'Washington Wizards': '#002B5C',
}

def get_team_color(team_abbr):
    if not isinstance(team_abbr, str) or not team_abbr.strip():
        return '#174734'
    for full, color in TEAM_COLORS.items():
        if team_abbr in full or team_abbr == full.split()[-1]:
            return color
    return '#174734'

def fetch_all_players():
    # Get unique PLAYER_IDs from the game logs CSV
    game_logs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'nba_players_game_logs_2018_25.csv'))
    import pandas as pd
    df = pd.read_csv(game_logs_path, usecols=['Player_ID', 'Player_Name'])
    unique = df.drop_duplicates(subset=['Player_ID'])
    player_ids = list(zip(unique['Player_ID'], unique['Player_Name']))
    return player_ids


def fetch_player_info(player_id):
    # Fetch all info for a player using CommonPlayerInfo
    from nba_api.stats.endpoints import commonplayerinfo
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        data = info.get_normalized_dict()
        common = data['CommonPlayerInfo'][0] if data['CommonPlayerInfo'] else {}
        headline = data['PlayerHeadlineStats'][0] if data['PlayerHeadlineStats'] else {}
        seasons = data['AvailableSeasons']
        # Flatten headline and add prefix
        for k, v in headline.items():
            common[f'HEADLINE_{k}'] = v
        # Add available seasons as a comma-separated string
        common['AVAILABLE_SEASONS'] = ','.join([s['SEASON_ID'] for s in seasons]) if seasons else ''
        return common
    except Exception as e:
        print(f"Error fetching player {player_id}: {e}")
        return None


def main():
    print(f"Fetching NBA player info for all time using nba_api...")
    player_ids = fetch_all_players()
    print(f"Total players to fetch: {len(player_ids)}")
    all_data = []
    for i, (pid, pname) in enumerate(player_ids):
        info = fetch_player_info(pid)
        if info:
            # Add team color by team abbreviation
            info['TEAM_COLOR'] = get_team_color(info.get('TEAM_ABBREVIATION', ''))
            info['PLAYER_NAME'] = pname
            all_data.append(info)
            print(f"Fetched player {i+1}/{len(player_ids)}: {pname} (ID: {pid})")
        else:
            print(f"Failed to fetch player {i+1}/{len(player_ids)}: {pname} (ID: {pid})")
        time.sleep(3)  # avoid rate limits
        if (i+1) % 25 == 0:
            print(f"Fetched {i+1}/{len(player_ids)} players...")
    if not all_data:
        print("No player data fetched.")
        return
    # Get all unique keys for CSV header
    all_keys = set()
    for d in all_data:
        all_keys.update(d.keys())
    all_keys = list(all_keys)
    # Save to CSV
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'nba_players_info.csv'))
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=all_keys)
        writer.writeheader()
        for row in all_data:
            writer.writerow(row)
    print(f'nba_players_info.csv written at {output_path}')

if __name__ == '__main__':
    main()
