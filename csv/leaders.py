# Script to fetch all-time NBA leaders and write to CSV
import csv
from nba_api.stats.endpoints import alltimeleadersgrids

# Fetch all-time leaders (top 10 by default)
leaders = alltimeleadersgrids.AllTimeLeadersGrids(topx=10)

# Map of stat name to DataSet attribute
stat_map = {
    'ASTLeaders': leaders.ast_leaders,
    'BLKLeaders': leaders.blk_leaders,
    'DREBLeaders': leaders.dreb_leaders,
    'FG3ALeaders': leaders.fg3_a_leaders,
    'FG3MLeaders': leaders.fg3_m_leaders,
    'FG3_PCTLeaders': leaders.fg3_pct_leaders,
    'FGALeaders': leaders.fga_leaders,
    'FGMLeaders': leaders.fgm_leaders,
    'FG_PCTLeaders': leaders.fg_pct_leaders,
    'FTALeaders': leaders.fta_leaders,
    'FTMLeaders': leaders.ftm_leaders,
    'FT_PCTLeaders': leaders.ft_pct_leaders,
    'GPLeaders': leaders.g_p_leaders,
    'OREBLeaders': leaders.oreb_leaders,
    'PFLeaders': leaders.pf_leaders,
    'PTSLeaders': leaders.pts_leaders,
    'REBLeaders': leaders.reb_leaders,
    'STLLeaders': leaders.stl_leaders,
    'TOVLeaders': leaders.tov_leaders,
}

# Write each stat category to its own CSV file
for stat_name, dataset in stat_map.items():
    filename = f"nba_alltime_{stat_name.lower()}.csv"
    # Use .data['headers'] and .data['rowSet'] for nba_api DataSet objects
    headers = dataset.data['headers']
    # Fallback: try 'data' if 'rowSet' is not present
    if 'rowSet' in dataset.data:
        rows = dataset.data['rowSet']
    elif 'data' in dataset.data:
        rows = dataset.data['data']
    else:
        raise KeyError(f"No row data found for {stat_name}")
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    print(f"Wrote {filename}")
