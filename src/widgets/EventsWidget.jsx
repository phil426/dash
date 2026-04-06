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
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-label">Upcoming Events</span>
        <span className="card-badge">Bay Area</span>
      </div>

      <div className="tab-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`tab-btn ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="events-list" style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>No events in this category</div>
        ) : (
          filtered.map((e, i) => (
            <div className="event-item" key={i}>
              <div className="event-date-badge">
                <span className="event-date-month">{e.month}</span>
                <span className="event-date-day">{e.day}</span>
              </div>
              <div className="event-details">
                <span className="event-name">{e.name}</span>
                <span className="event-venue">{e.venue}</span>
                <span className="event-time">{e.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
