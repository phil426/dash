'use client'

import { useState, useEffect } from 'react'

export default function TripWidget() {
  const [location, setLocation] = useState(null)
  const [address, setAddress] = useState('Resolving...')

  useEffect(() => {
    if (!('geolocation' in navigator)) return

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, altitude, speed, heading } = pos.coords
        setLocation({ latitude, longitude, altitude, speed, heading })

        // Reverse geocode with Nominatim (free, no key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          if (data.display_name) {
            const parts = data.display_name.split(',').slice(0, 3).join(',')
            setAddress(parts)
          }
        } catch (e) {
          setAddress('Address unavailable')
        }
      },
      () => setAddress('Location unavailable'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const lat = location?.latitude?.toFixed(5) || '37.77490'
  const lon = location?.longitude?.toFixed(5) || '-122.41940'
  const alt = location?.altitude ? `${Math.round(location.altitude)}m` : '—'
  const spd = location?.speed ? `${Math.round(location.speed * 2.237)} mph` : '—'

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-label">Location</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="glow-dot" style={{ width: 8, height: 8 }} />
          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>GPS</span>
        </span>
      </div>

      <div className="location-detail" style={{ flex: 1 }}>
        <div className="location-address">{address}</div>

        <div className="location-row">
          <span className="location-label">Latitude</span>
          <span className="location-value" style={{ fontFamily: 'monospace' }}>{lat}</span>
        </div>
        <div className="location-row">
          <span className="location-label">Longitude</span>
          <span className="location-value" style={{ fontFamily: 'monospace' }}>{lon}</span>
        </div>
        <div className="location-row">
          <span className="location-label">Altitude</span>
          <span className="location-value">{alt}</span>
        </div>
        <div className="location-row">
          <span className="location-label">Speed</span>
          <span className="location-value">{spd}</span>
        </div>
      </div>
    </div>
  )
}
