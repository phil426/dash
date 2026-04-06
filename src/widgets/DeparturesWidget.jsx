'use client'

import { useState } from 'react'

const AIRPORTS = {
  SFO: {
    name: 'SAN FRANCISCO INTL',
    departures: [
      { time: '4:55P', dest: 'LAX', city: 'Los Angeles', flight: 'UA 1204', gate: 'B8', status: 'BOARD' },
      { time: '5:10P', dest: 'JFK', city: 'New York', flight: 'UA 1542', gate: 'B42', status: 'ON TIME' },
      { time: '5:25P', dest: 'SEA', city: 'Seattle', flight: 'AS 308', gate: 'D4', status: 'ON TIME' },
      { time: '5:40P', dest: 'ORD', city: 'Chicago', flight: 'UA 628', gate: 'E7', status: 'DELAY' },
      { time: '5:55P', dest: 'DEN', city: 'Denver', flight: 'UA 487', gate: 'F12', status: 'ON TIME' },
      { time: '6:10P', dest: 'HNL', city: 'Honolulu', flight: 'HA 12', gate: 'A3', status: 'ON TIME' },
      { time: '6:30P', dest: 'DFW', city: 'Dallas', flight: 'AA 1986', gate: 'D9', status: 'GONE' },
      { time: '6:45P', dest: 'NRT', city: 'Tokyo', flight: 'UA 837', gate: 'G2', status: 'ON TIME' },
      { time: '7:00P', dest: 'LHR', city: 'London', flight: 'BA 286', gate: 'A10', status: 'BOARD' },
      { time: '7:20P', dest: 'SIN', city: 'Singapore', flight: 'SQ 1', gate: 'G8', status: 'ON TIME' },
    ],
  },
  OAK: {
    name: 'OAKLAND INTL',
    departures: [
      { time: '5:00P', dest: 'LAX', city: 'Los Angeles', flight: 'WN 2341', gate: '25', status: 'BOARD' },
      { time: '5:20P', dest: 'PDX', city: 'Portland', flight: 'WN 1088', gate: '28', status: 'ON TIME' },
      { time: '5:35P', dest: 'LAS', city: 'Las Vegas', flight: 'WN 474', gate: '22', status: 'DELAY' },
      { time: '5:50P', dest: 'PHX', city: 'Phoenix', flight: 'WN 1512', gate: '30', status: 'ON TIME' },
      { time: '6:05P', dest: 'DEN', city: 'Denver', flight: 'WN 892', gate: '24', status: 'ON TIME' },
      { time: '6:25P', dest: 'SAN', city: 'San Diego', flight: 'WN 2204', gate: '27', status: 'GONE' },
      { time: '6:45P', dest: 'SEA', city: 'Seattle', flight: 'WN 317', gate: '31', status: 'ON TIME' },
      { time: '7:00P', dest: 'BUR', city: 'Burbank', flight: 'WN 1753', gate: '23', status: 'ON TIME' },
    ],
  },
  STS: {
    name: 'SONOMA COUNTY',
    departures: [
      { time: '5:15P', dest: 'LAX', city: 'Los Angeles', flight: 'AA 5921', gate: '3', status: 'BOARD' },
      { time: '6:00P', dest: 'SAN', city: 'San Diego', flight: 'AA 5843', gate: '2', status: 'ON TIME' },
      { time: '7:30P', dest: 'DFW', city: 'Dallas', flight: 'AA 5692', gate: '1', status: 'ON TIME' },
      { time: '8:45P', dest: 'PHX', city: 'Phoenix', flight: 'AA 5704', gate: '4', status: 'DELAY' },
    ],
  },
}

function StatusIndicator({ status }) {
  const color =
    status === 'BOARD' ? '#00d9a3' :
    status === 'ON TIME' ? '#00cc66' :
    status === 'DELAY' ? '#ff9500' :
    '#2f5650'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end',
    }}>
      <span style={{
        fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700,
        color, letterSpacing: '0.06em',
      }}>
        {status}
      </span>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: status === 'BOARD' ? 'pulse-badge 2s ease-in-out infinite' : 'none',
      }} />
    </span>
  )
}

export default function DeparturesWidget() {
  const [airport, setAirport] = useState('SFO')
  const info = AIRPORTS[airport]

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
        <span className="card-label">✈ Departures</span>
        <span className="card-badge live">Live</span>
      </div>

      {/* Airport tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px', marginBottom: 8 }}>
        {Object.keys(AIRPORTS).map(code => (
          <button key={code} onClick={() => setAirport(code)} style={{
            background: airport === code ? 'var(--accent)' : 'var(--bg-elevated)',
            color: airport === code ? '#000' : 'var(--text-secondary)',
            border: 'none', fontFamily: 'var(--font-data)', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.06em', padding: '5px 0',
            borderRadius: 6, cursor: 'pointer', flex: 1,
          }}>
            {code}
          </button>
        ))}
      </div>

      {/* Departure rows */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {info.departures.map((d, i) => (
          <div key={i} style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            opacity: d.status === 'GONE' ? 0.3 : 1,
          }}>
            {/* Top line: time + city + status */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 3,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 700,
                  color: 'var(--accent)', letterSpacing: '0.02em',
                }}>
                  {d.time}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                }}>
                  {d.city}
                </span>
              </div>
              <StatusIndicator status={d.status} />
            </div>
            {/* Bottom line: flight + dest code + gate */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}>
              <span>{d.flight}</span>
              <span>{d.dest}</span>
              <span style={{ marginLeft: 'auto' }}>Gate {d.gate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
