'use client'

import { useState, useEffect } from 'react'

const AIRPORTS = ['SFO', 'OAK', 'STS']

function generateMockFlights(type) {
  const now = new Date()
  const fmt = (offset) => {
    const d = new Date(now.getTime() + offset * 60000)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' })
  }
  if (type === 'arrivals') {
    return [
      { time: fmt(-15), dest: 'LAX', airline: 'UNITED', flight: 'UA 1205', gate: 'A2', status: 'ARRIVED', past: true },
      { time: fmt(12),  dest: 'ORD', airline: 'UNITED', flight: 'UA 629',  gate: 'B5', status: 'EN ROUTE' },
      { time: fmt(35),  dest: 'DEN', airline: 'SOUTHWEST', flight: 'WN 488', gate: 'C3', status: 'ON TIME' },
      { time: fmt(52),  dest: 'JFK', airline: 'DELTA', flight: 'DL 417', gate: 'A8', status: 'ON TIME' },
      { time: fmt(78),  dest: 'SEA', airline: 'ALASKA', flight: 'AS 221', gate: 'D1', status: 'ON TIME' },
      { time: fmt(110), dest: 'PHX', airline: 'AMERICAN', flight: 'AA 956', gate: '--', status: 'DELAYED' },
    ]
  }
  return [
    { time: fmt(-10), dest: 'LAX', airline: 'UNITED', flight: 'UA 1204', gate: 'B8', status: 'DEPARTED', past: true },
    { time: fmt(8),   dest: 'JFK', airline: 'UNITED', flight: 'UA 1542', gate: 'B42', status: 'ON TIME' },
    { time: fmt(25),  dest: 'SEA', airline: 'ALASKA', flight: 'AS 308',  gate: 'D4', status: 'ON TIME' },
    { time: fmt(40),  dest: 'ORD', airline: 'AMERICAN', flight: 'AA 720', gate: 'A14', status: 'ON TIME' },
    { time: fmt(65),  dest: 'DEN', airline: 'SOUTHWEST', flight: 'WN 112', gate: 'C7', status: 'DELAYED' },
    { time: fmt(90),  dest: 'ATL', airline: 'DELTA', flight: 'DL 883', gate: 'B3', status: 'ON TIME' },
  ]
}

function statusColor(status) {
  if (status === 'EN ROUTE') return 'var(--accent)'          // #00d9a3
  if (status === 'DELAYED') return 'var(--accent-warm)'      // #ff9500
  if (status === 'CANCELLED') return 'var(--accent-red)'     // #ff3b30
  if (status === 'LANDED' || status === 'ARRIVED') return 'var(--text-secondary)'
  if (status === 'DEPARTED') return 'var(--text-secondary)'
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
          setFlights(generateMockFlights(flightType))
        } else {
          setFlights(data.flights?.length ? data.flights : generateMockFlights(flightType))
        }
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setFlights(generateMockFlights(flightType))
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
        gridTemplateColumns: '80px 50px 1fr 70px 40px 75px',
        gap: '0 4px',
        padding: '10px 10px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        {['TIME', isDepartures ? 'DEST' : 'ORIGIN', 'AIRLINE', 'FLIGHT', 'GATE', 'STATUS'].map(h => (
          <span key={h} style={{
          fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700,
            color: 'var(--text-secondary)', letterSpacing: '0.1em',
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {flights.map((d, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '80px 50px 1fr 70px 40px 75px',
            gap: '0 4px',
            padding: '10px 10px',
            borderBottom: '1px solid var(--border)',
            opacity: d.past ? 0.3 : 1,
          }}>
            <span style={{ ...col, fontSize: 15, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{d.time}</span>
            <span style={{ ...col, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{d.dest}</span>
            <span style={{ ...col, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{d.airline}</span>
            <span style={{ ...col, fontSize: 15, fontWeight: 500, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{d.flight}</span>
            <span style={{ ...col, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{d.gate}</span>
            <span style={{ ...col, fontSize: 14, fontWeight: 700, color: statusColor(d.status), whiteSpace: 'nowrap' }}>{d.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
