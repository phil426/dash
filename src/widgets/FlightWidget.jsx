'use client'

export default function FlightWidget() {
  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-label">Flight Tracker</span>
        <span className="card-badge" style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>On Time</span>
      </div>

      <div className="flight-info" style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>United · UA 1542</div>

        <div className="flight-route-visual">
          <div>
            <div className="flight-code">SFO</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>3:05 PM</div>
          </div>
          <div className="flight-line" />
          <div style={{ textAlign: 'right' }}>
            <div className="flight-code">JFK</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>11:22 PM</div>
          </div>
        </div>

        <div className="flight-detail-row">
          <span className="flight-detail-label">Gate</span>
          <span className="flight-detail-value">B42</span>
        </div>
        <div className="flight-detail-row">
          <span className="flight-detail-label">Terminal</span>
          <span className="flight-detail-value">Terminal 3</span>
        </div>
        <div className="flight-detail-row" style={{ borderBottom: 'none' }}>
          <span className="flight-detail-label">Duration</span>
          <span className="flight-detail-value">5h 17m</span>
        </div>
      </div>
    </div>
  )
}
