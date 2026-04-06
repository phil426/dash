const games = [
  { home: 'GSW', away: 'LAL', homeScore: 112, awayScore: 108, status: 'Final', homeWin: true },
  { home: 'SF 49ers', away: 'SEA', homeScore: 24, awayScore: 10, status: 'Final', homeWin: true },
  { home: 'SF Giants', away: 'LAD', homeScore: 4, awayScore: 6, status: 'Bot 7th', homeWin: false },
]

export default function SportsWidget() {
  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-label">Bay Area Sports</span>
        <span className="card-badge live">Live</span>
      </div>

      <div className="sports-list" style={{ flex: 1 }}>
        {games.map((g, i) => (
          <div key={i} className={`sport-game ${g.homeWin ? 'win' : g.status.includes('Final') ? 'loss' : 'live'}`}>
            <div className="sport-teams">
              <div className={`sport-team ${g.homeWin ? 'winner' : 'loser'}`}>
                <span>{g.home}</span>
                <span className="sport-score" style={{ color: g.homeWin ? 'var(--accent)' : 'var(--text-muted)' }}>{g.homeScore}</span>
              </div>
              <div className={`sport-team ${!g.homeWin ? 'winner' : 'loser'}`}>
                <span>{g.away}</span>
                <span className="sport-score" style={{ color: !g.homeWin ? 'var(--accent)' : 'var(--text-muted)' }}>{g.awayScore}</span>
              </div>
            </div>
            <div className="sport-status">{g.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
