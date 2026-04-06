'use client'

import { useState, useEffect } from 'react'

const AIRPORTS = ['SFO', 'OAK', 'STS']

const MOCK_DEPARTURES = [
  { time: '4:55 PM', city: 'LOS ANGELES', airline: 'UNITED', flight: 'UA 1204', gate: 'B8', status: 'ON TIME' },
  { time: '5:10 PM', city: 'NEW YORK', airline: 'UNITED', flight: 'UA 1542', gate: 'B42', status: 'ON TIME' },
  { time: '5:25 PM', city: 'SEATTLE', airline: 'ALASKA', flight: 'AS 308', gate: 'D4', status: 'ON TIME' },
]

const MOCK_ARRIVALS = [
  { time: '5:30 PM', city: 'LOS ANGELES', airline: 'UNITED', flight: 'UA 1205', gate: 'A2', status: 'EN ROUTE' },
  { time: '6:00 PM', city: 'CHICAGO', airline: 'UNITED', flight: 'UA 629', gate: 'B5', status: 'ON TIME' },
  { time: '6:15 PM', city: 'DENVER', airline: 'UNITED', flight: 'UA 488', gate: 'C3', status: 'ON TIME' },
]

function statusColor(status) {
  if (status === 'EN ROUTE') return 'var(--accent)'          // #00d9a3
  if (status === 'DELAYED') return 'var(--accent-warm)'      // #ff9500
  if (status === 'CANCELLED') return 'var(--accent-red)'     // #ff3b30
  if (status === 'LANDED') return 'var(--text-secondary)'    // #6a9e94
  return 'var(--accent-green)'                                // #00cc66 ON TIME
}

export default function DeparturesWidget() {
  const [airport, setAirport] = useState('SFO')
  const [flightType, setFlightType] = useState('departures')
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/departures?airport=${airport}&type=${flightType}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data.error) {
          setError(data.error)
          setFlights(flightType === 'arrivals' ? MOCK_ARRIVALS : MOCK_DEPARTURES)
        } else {
          setFlights(data.flights?.length ? data.flights : (flightType === 'arrivals' ? MOCK_ARRIVALS : MOCK_DEPARTURES))
        }
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setFlights(flightType === 'arrivals' ? MOCK_ARRIVALS : MOCK_DEPARTURES)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [airport, flightType])

  const col = {
    fontFamily: 'var(--font-data)',
    letterSpacing: '0.04em',
  }

  const isDepartures = flightType === 'departures'

  return (
    <div className="card" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>✈</span>
          <span style={{
            fontFamily: 'var(--font-data)', fontSize: 29, fontWeight: 700,
            color: 'var(--text-primary)', letterSpacing: '0.02em',
          }}>Flights</span>
          {loading && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>Loading...</span>}
        </div>
        <span className="card-badge live">Live</span>
      </div>

      {/* Departures / Arrivals segmented control */}
      <div style={{
        display: 'flex', gap: 2, padding: 4, margin: '0 20px', marginBottom: 8,
        background: 'linear-gradient(90deg, var(--accent)20, var(--accent-secondary)20)',
        borderRadius: 8,
      }}>
        {['departures', 'arrivals'].map(type => (
          <button key={type} onClick={() => setFlightType(type)} style={{
            flex: 1,
            background: flightType === type
              ? (type === 'departures' ? 'var(--accent)' : 'var(--accent-secondary)')
              : 'transparent',
            color: flightType === type ? '#000' : 'var(--text-primary)',
            border: 'none', fontFamily: 'var(--font-data)', fontSize: 16,
            fontWeight: 700, letterSpacing: '0.06em', padding: '7px 0',
            borderRadius: 8, cursor: 'pointer', textTransform: 'uppercase',
            transition: 'all 0.2s ease',
          }}>
            {type === 'departures' ? '↗ Departures' : '↙ Arrivals'}
          </button>
        ))}
      </div>

      {/* Airport segmented control */}
      <div style={{
        display: 'flex', gap: 2, padding: 4, margin: '0 20px', marginBottom: 8,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}>
        {AIRPORTS.map(code => (
          <button key={code} onClick={() => setAirport(code)} style={{
            background: airport === code ? 'var(--accent)' : 'transparent',
            color: airport === code ? '#000' : 'var(--text-primary)',
            border: 'none',
            fontFamily: 'var(--font-data)', fontSize: 16,
            fontWeight: 700, letterSpacing: '0.06em', padding: '6px 0',
            borderRadius: 8, cursor: 'pointer', flex: 1,
            transition: 'all 0.2s ease',
          }}>
            {code}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 1fr 100px 60px 100px',
        gap: '0 8px',
        padding: '8px 20px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        {['TIME', isDepartures ? 'DESTINATION' : 'ORIGIN', 'AIRLINE', 'FLIGHT', 'GATE', 'STATUS'].map(h => (
          <span key={h} style={{
            fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700,
            color: 'var(--text-muted)', letterSpacing: '0.1em',
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {flights.map((d, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 1fr 100px 60px 100px',
            gap: '0 8px',
            padding: '8px 20px',
            borderBottom: '1px solid var(--border)',
            opacity: (d.status === 'LANDED') ? 0.35 : 1,
          }}>
            <span style={{ ...col, fontSize: 20, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{d.time}</span>
            <span style={{ ...col, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{d.city}</span>
            <span style={{ ...col, fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{d.airline}</span>
            <span style={{ ...col, fontSize: 20, fontWeight: 500, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{d.flight}</span>
            <span style={{ ...col, fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{d.gate}</span>
            <span style={{ ...col, fontSize: 18, fontWeight: 700, color: statusColor(d.status), whiteSpace: 'nowrap' }}>{d.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
