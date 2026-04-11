'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom car marker icon with pulse
const carIcon = new L.DivIcon({
  className: '',
  html: `<div style="position:relative; width:20px; height:20px;">
    <div style="
      position:absolute; inset:-8px; border-radius:50%;
      border: 2px solid rgba(0,217,163,0.5);
      animation: mapPulse 2s ease-out infinite;
    "></div>
    <div style="
      width:20px; height:20px; border-radius:50%;
      background:#00d9a3; border:3px solid #fff;
      box-shadow: 0 0 16px rgba(0,217,163,0.6), 0 2px 8px rgba(0,0,0,0.4);
      position:relative; z-index:1;
    "></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Component that smoothly pans map to follow position
function MapFollower({ position, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, zoom, { animate: true, duration: 0.5 })
    }
  }, [position, zoom, map])
  return null
}

export default function MapWidget() {
  const [position, setPosition] = useState(null)
  const [speed, setSpeed] = useState(0)
  const [heading, setHeading] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [error, setError] = useState(null)
  const watchId = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
        // Speed is in m/s, convert to mph
        const speedMph = pos.coords.speed != null ? pos.coords.speed * 2.237 : 0
        setSpeed(Math.round(speedMph))
        setHeading(pos.coords.heading || 0)
        setAccuracy(Math.round(pos.coords.accuracy))
        setError(null)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    )

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])

  // Default to SF if no position yet
  const center = position || [37.7749, -122.4194]

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
      <MapContainer
        center={center}
        zoom={16}
        style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-xl)' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        <MapFollower position={position} zoom={16} />

        {position && (
          <>
            {/* Accuracy circle */}
            <Circle
              center={position}
              radius={Math.min(accuracy, 200)}
              pathOptions={{
                color: '#00d9a3',
                fillColor: '#00d9a3',
                fillOpacity: 0.08,
                weight: 1,
                opacity: 0.3,
              }}
            />
            {/* Car marker */}
            <Marker position={position} icon={carIcon}>
              <Popup>
                <span style={{ fontFamily: 'system-ui', fontSize: 12 }}>
                  {speed} mph &middot; ±{accuracy}m
                </span>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Speed HUD overlay */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
        display: 'flex', gap: 8,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {speed}
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            mph
          </span>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: error ? '#ef4444' : '#00d9a3',
            boxShadow: error ? '0 0 6px #ef4444' : '0 0 6px #00d9a3',
          }} />
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            {error ? 'No signal' : `±${accuracy}m`}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {!position && !error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 24, height: 24, border: '3px solid rgba(255,255,255,0.15)',
              borderTopColor: '#00d9a3', borderRadius: '50%',
              animation: 'spin 1s linear infinite', margin: '0 auto 12px',
            }} />
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Acquiring GPS...
            </div>
          </div>
        </div>
      )}

      {/* Permission denied */}
      {error && !position && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        }}>
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Location Required
            </div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Allow location access in your<br />browser to enable the live map.
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes mapPulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .leaflet-container { background: #1a1a2e !important; }
      `}</style>
    </div>
  )
}
