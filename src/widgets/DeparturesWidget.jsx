'use client'

import { useState, useEffect } from 'react'

const AIRPORTS = ['SFO', 'OAK', 'STS']

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
          setFlights([])
        } else {
          setFlights(data.flights || [])
        }
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setFlights([])
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
        {error ? (
          <span className="card-badge" style={{ background: 'rgba(255,59,48,0.15)', color: '#ff6b6b' }}>Offline</span>
        ) : (
          <span className="card-badge live">Live</span>
        )}
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
        {flights.length === 0 && !loading ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', padding: 40, textAlign: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 40, opacity: 0.3 }}>✈</span>
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: 16, fontWeight: 700,
              color: 'var(--text-secondary)', letterSpacing: '0.04em',
            }}>
              Flight Data Unavailable
            </div>
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: 12,
              color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 260,
            }}>
              Real-time flight information is temporarily unavailable.
              Please check the airport website for accurate schedules.
            </div>
          </div>
        ) : (
          flights.map((d, i) => (
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
          ))
        )}
      </div>
    </div>
  )
}
