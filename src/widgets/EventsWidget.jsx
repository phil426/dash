'use client'

import { useState } from 'react'

const ALL_EVENTS = [
  { month: 'APR', day: '8',  name: 'Warriors vs Lakers',      venue: 'Chase Center',     time: '7:30 PM', cat: 'Sports' },
  { month: 'APR', day: '10', name: 'Metallica World Tour',     venue: 'Oracle Park',      time: '7:00 PM', cat: 'Music' },
  { month: 'APR', day: '12', name: 'Giants Opening Weekend',   venue: 'Oracle Park',      time: '1:05 PM', cat: 'Sports' },
  { month: 'APR', day: '14', name: 'AI Summit SF',             venue: 'Moscone West',     time: '9:00 AM', cat: 'Tech' },
  { month: 'APR', day: '15', name: 'SF Jazz Festival',         venue: 'SFJAZZ Center',    time: '8:00 PM', cat: 'Music' },
  { month: 'APR', day: '17', name: 'SF 49ers Fan Fest',        venue: 'Levi\'s Stadium',  time: '10:00 AM', cat: 'Sports' },
  { month: 'APR', day: '19', name: 'Bay to Breakers 5K',       venue: 'The Embarcadero',  time: '8:00 AM', cat: 'Sports' },
  { month: 'APR', day: '20', name: 'Outside Lands Pre-Party',  venue: 'Golden Gate Park',  time: '4:00 PM', cat: 'Music' },
  { month: 'APR', day: '22', name: 'TechCrunch Disrupt',       venue: 'Moscone Center',   time: '9:00 AM', cat: 'Tech' },
  { month: 'APR', day: '25', name: 'React Summit Bay Area',    venue: 'SVN West',         time: '10:00 AM', cat: 'Tech' },
]

const CATEGORIES = ['All', 'Sports', 'Music', 'Tech']

export default function EventsWidget() {
  const [category, setCategory] = useState('All')

  const filtered = category === 'All'
    ? ALL_EVENTS
    : ALL_EVENTS.filter(e => e.cat === category)

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 16px', overflow: 'hidden' }}>
      {/* Header row with title + category pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexShrink: 0 }}>
        <span className="card-label" style={{ marginRight: 'auto' }}>Upcoming Events</span>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              background: category === cat ? 'var(--accent)' : 'var(--bg-elevated)',
              color: category === cat ? '#000' : 'var(--text-muted)',
              border: 'none', fontFamily: 'var(--font-data)', fontSize: 9,
              fontWeight: 700, letterSpacing: '0.06em', padding: '3px 10px',
              borderRadius: 100, cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Horizontal scrollable event cards */}
      <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden', minHeight: 0 }}>
        {filtered.map((e, i) => (
          <div key={i} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '4px 8px', borderRadius: 8, background: 'rgba(0,217,163,0.08)',
              lineHeight: 1,
            }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 8, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em' }}>{e.month}</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{e.day}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{e.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.venue} · {e.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
