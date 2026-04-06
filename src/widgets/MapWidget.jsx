'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapWidget() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const [status, setStatus] = useState('Locating...')
  const [address, setAddress] = useState('')
  const [speed, setSpeed] = useState(null)
  const [zoom, setZoom] = useState(15)

  function updateMarkerColor() {
    if (!markerRef.current) return
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00d9a3'
    const glowIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 16px; height: 16px; border-radius: 50%;
        background: ${accent};
        box-shadow: 0 0 16px ${accent}, 0 0 32px ${accent}66;
        border: 2px solid rgba(255,255,255,0.8);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    markerRef.current.setIcon(glowIcon)
  }

  // Map + Geolocation
  useEffect(() => {
    if (mapInstance.current) return

    const defaultPos = [37.7749, -122.4194]

    mapInstance.current = L.map(mapRef.current, {
      center: defaultPos,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
      tap: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current)

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00d9a3'
    const glowIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 16px; height: 16px; border-radius: 50%;
        background: ${accent};
        box-shadow: 0 0 16px ${accent}, 0 0 32px ${accent}66;
        border: 2px solid rgba(255,255,255,0.8);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    markerRef.current = L.marker(defaultPos, { icon: glowIcon }).addTo(mapInstance.current)

    mapInstance.current.on('zoomend', () => {
      setZoom(mapInstance.current.getZoom())
    })

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, speed: spd } = pos.coords
          const latlng = [latitude, longitude]
          markerRef.current.setLatLng(latlng)
          mapInstance.current.setView(latlng, mapInstance.current.getZoom(), { animate: true })
          setStatus('Live')
          setSpeed(spd)

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            )
            const data = await res.json()
            if (data.display_name) {
              setAddress(data.display_name.split(',').slice(0, 3).join(','))
            }
          } catch (e) {}
        },
        () => setStatus('San Francisco'),
        { enableHighAccuracy: true, maximumAge: 5000 }
      )
      return () => {
        navigator.geolocation.clearWatch(watchId)
        if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
      }
    } else {
      setStatus('San Francisco')
    }

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [])

  // Watch for theme changes and update marker
  useEffect(() => {
    const observer = new MutationObserver(() => updateMarkerColor())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  function handleZoom(dir) {
    if (!mapInstance.current) return
    if (dir === 'in') mapInstance.current.zoomIn()
    else mapInstance.current.zoomOut()
  }

  const speedNum = speed ? Math.round(speed * 2.237) : 0
  const speedMph = `${speedNum} mph`

  const zoomBtnStyle = {
    width: 36, height: 36, borderRadius: 8,
    border: '1px solid var(--border-light)',
    background: 'rgba(0,0,0,0.7)',
    color: 'var(--text-primary)',
    fontSize: 18, fontWeight: 700,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  }

  return (
    <div className="card hero" style={{ height: '100%' }}>
      <div className="map-container" ref={mapRef} />

      {/* Top-right: Address + Speed */}
      <div className="map-info-overlay">
        {address && (
          <div className="map-info-address">
            <div className="map-info-address-text">{address}</div>
          </div>
        )}
        <div className="map-info-speed">{speedMph}</div>

        {/* Speed indicator bar */}
        <div style={{
          width: 200, padding: '8px 14px',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)',
          borderRadius: 8, border: '1px solid rgba(0,217,163,0.1)',
        }}>
          <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
            {/* Filled track */}
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${Math.min((speedNum / 100) * 100, 100)}%`,
              borderRadius: 3,
              background: `linear-gradient(90deg, var(--accent), ${speedNum > 70 ? 'var(--accent-warm)' : 'var(--accent)'})`,
              transition: 'width 0.5s ease',
            }} />
            {/* Dot */}
            <div style={{
              position: 'absolute', top: '50%',
              left: `${Math.min((speedNum / 100) * 100, 100)}%`,
              transform: 'translate(-50%, -50%)',
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--accent)',
              border: '2px solid rgba(255,255,255,0.9)',
              boxShadow: '0 0 8px var(--accent)',
              transition: 'left 0.5s ease',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 4,
            fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--text-muted)',
            letterSpacing: '0.05em',
          }}>
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', right: 12, bottom: 48,
        display: 'flex', flexDirection: 'column', gap: 4, zIndex: 1000,
      }}>
        <button onClick={() => handleZoom('in')} style={zoomBtnStyle}>+</button>
        <button onClick={() => handleZoom('out')} style={zoomBtnStyle}>−</button>
      </div>

      {/* Bottom-left: Status pill */}
      <div className="map-overlay">
        <div className="map-pill">
          <span className="dot map-dot" /> {status}
        </div>
      </div>
    </div>
  )
}
