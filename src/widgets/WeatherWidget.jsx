'use client'

import { useState, useEffect } from 'react'

const CITIES = [
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'Oakland',       lat: 37.8044, lon: -122.2712 },
  { name: 'San Jose',      lat: 37.3382, lon: -121.8863 },
  { name: 'Petaluma',      lat: 38.2324, lon: -122.6367 },
  { name: 'Santa Rosa',    lat: 38.4404, lon: -122.7141 },
  { name: 'Berkeley',      lat: 37.8716, lon: -122.2727 },
  { name: 'Palo Alto',     lat: 37.4419, lon: -122.1430 },
  { name: 'Walnut Creek',  lat: 37.9101, lon: -122.0652 },
  { name: 'Fremont',       lat: 37.5485, lon: -121.9886 },
  { name: 'Concord',       lat: 37.9780, lon: -122.0311 },
  { name: 'Hayward',       lat: 37.6688, lon: -122.0808 },
  { name: 'Sunnyvale',     lat: 37.3688, lon: -122.0363 },
  { name: 'Redwood City',  lat: 37.4852, lon: -122.2364 },
  { name: 'Napa',          lat: 38.2975, lon: -122.2869 },
  { name: 'San Mateo',     lat: 37.5630, lon: -122.3255 },
  { name: 'Livermore',     lat: 37.6819, lon: -121.7680 },
  { name: 'Mountain View', lat: 37.3861, lon: -122.0839 },
  { name: 'Sausalito',     lat: 37.8591, lon: -122.4853 },
]

function codeToIcon(code) {
  if (code <= 1) return '☀️'
  if (code <= 3) return '⛅'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80) return '🌧️'
  return '☁️'
}

function codeToDesc(code) {
  if (code <= 1) return 'CLEAR'
  if (code <= 3) return 'PARTLY CLOUDY'
  if (code >= 45 && code <= 48) return 'FOGGY'
  if (code >= 51 && code <= 67) return 'RAIN'
  if (code >= 71 && code <= 77) return 'SNOW'
  if (code >= 80) return 'SHOWERS'
  return 'CLOUDY'
}

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const lats = CITIES.map(c => c.lat).join(',')
      const lons = CITIES.map(c => c.lon).join(',')
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Los_Angeles`
        )
        const data = await res.json()
        setWeatherData(Array.isArray(data) ? data : [data])
      } catch (e) {
        console.error('Weather fetch failed:', e)
      }
      setLoading(false)
    }
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const col = {
    fontFamily: 'var(--font-data)',
    letterSpacing: '0.04em',
  }

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌤️</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 29, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Bay Area Weather
          </span>
        </div>
        <span className="card-badge live">Live</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 50px 40px 1fr 70px 70px',
        padding: '8px 20px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        gap: 8,
      }}>
        {['CITY', 'TEMP', '', 'CONDITIONS', 'WIND', 'HUMID'].map(h => (
          <span key={h} style={{
            fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700,
            color: 'var(--text-muted)', letterSpacing: '0.1em',
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>Loading...</div>
        ) : (
          CITIES.map((city, i) => {
            const w = weatherData?.[i]
            if (!w) return null
            const temp = Math.round(w.current.temperature_2m)
            const code = w.current.weathercode
            const wind = Math.round(w.current.wind_speed_10m)
            const humidity = Math.round(w.current.relative_humidity_2m)

            return (
              <div key={city.name} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 50px 40px 1fr 70px 70px',
                padding: '10px 20px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ ...col, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {city.name.toUpperCase()}
                </span>
                <span style={{ ...col, fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                  {temp}°
                </span>
                <span style={{ fontSize: 22, textAlign: 'center' }}>
                  {codeToIcon(code)}
                </span>
                <span style={{ ...col, fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {codeToDesc(code)}
                </span>
                <span style={{ ...col, fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {wind} mph
                </span>
                <span style={{ ...col, fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {humidity}%
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
