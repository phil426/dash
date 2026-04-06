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
  const [gForce, setGForce] = useState({ x: 0, y: 0, total: 0 })

  // Map + Geolocation
  useEffect(() => {
    if (mapInstance.current) return

    const defaultPos = [37.7749, -122.4194]

    mapInstance.current = L.map(mapRef.current, {
      center: defaultPos,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current)

    const glowIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 16px; height: 16px; border-radius: 50%;
        background: #00d9a3;
        box-shadow: 0 0 16px #00d9a3, 0 0 32px rgba(0,217,163,0.4);
        border: 2px solid rgba(255,255,255,0.8);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    markerRef.current = L.marker(defaultPos, { icon: glowIcon }).addTo(mapInstance.current)

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, speed: spd } = pos.coords
          const latlng = [latitude, longitude]
          markerRef.current.setLatLng(latlng)
          mapInstance.current.setView(latlng, 15, { animate: true })
          setStatus('Live')
          setSpeed(spd)

          // Reverse geocode
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            )
            const data = await res.json()
            if (data.display_name) {
              setAddress(data.display_name.split(',').slice(0, 3).join(','))
            }
          } catch (e) {
            // Address unavailable is fine
          }
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

  // Accelerometer / DeviceMotion
  useEffect(() => {
    let animFrame
    let lastX = 0, lastY = 0

    function handleMotion(e) {
      const accel = e.accelerationIncludingGravity || e.acceleration
      if (!accel) return

      // Normalize: divide by 9.81 to get g-forces, clamp to ±1g
      const gx = Math.max(-1, Math.min(1, (accel.x || 0) / 9.81))
      const gy = Math.max(-1, Math.min(1, (accel.y || 0) / 9.81))
      const total = Math.sqrt(gx * gx + gy * gy)

      // Smooth
      lastX = lastX * 0.7 + gx * 0.3
      lastY = lastY * 0.7 + gy * 0.3

      setGForce({ x: lastX, y: lastY, total })
    }

    if ('DeviceMotionEvent' in window) {
      // Request permission on iOS 13+
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(state => {
          if (state === 'granted') {
            window.addEventListener('devicemotion', handleMotion)
          }
        }).catch(() => {})
      } else {
        window.addEventListener('devicemotion', handleMotion)
      }
    }

    // Desktop fallback: gentle simulation
    if (!('DeviceMotionEvent' in window) || navigator.userAgent.includes('Macintosh')) {
      let t = 0
      const sim = () => {
        t += 0.02
        const gx = Math.sin(t * 0.7) * 0.05 + (Math.random() - 0.5) * 0.03
        const gy = Math.cos(t * 0.5) * 0.04 + (Math.random() - 0.5) * 0.02
        const total = Math.sqrt(gx * gx + gy * gy)
        setGForce({ x: gx, y: gy, total })
        animFrame = requestAnimationFrame(sim)
      }
      sim()
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      if (animFrame) cancelAnimationFrame(animFrame)
    }
  }, [])

  // Convert g-force to dot position (50% = center)
  const dotLeft = 50 + gForce.x * 40  // ±40% range
  const dotTop = 50 - gForce.y * 40   // inverted Y

  const speedMph = speed ? `${Math.round(speed * 2.237)} mph` : '0 mph'

  // G-force color: green when smooth, amber when moderate, red when aggressive
  const gTotal = gForce.total
  const gColor = gTotal < 0.15 ? '#00cc66' : gTotal < 0.4 ? '#ff9500' : '#ff3b30'

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
      </div>

      {/* Bottom-left: Status pill */}
      <div className="map-overlay">
        <div className="map-pill">
          <span className="dot map-dot" /> {status}
        </div>
      </div>

      {/* Bottom-right: G-Force gauge */}
      <div className="gforce-container">
        <div className="gforce-gauge">
          <div className="gforce-crosshair" />
          <div className="gforce-ring" />
          <div
            className="gforce-dot"
            style={{
              left: `${dotLeft}%`,
              top: `${dotTop}%`,
              background: gColor,
              boxShadow: `0 0 10px ${gColor}, 0 0 20px ${gColor}40`,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="gforce-label">G-Force</span>
          <span className="gforce-value" style={{ color: gColor }}>{gTotal.toFixed(2)}g</span>
        </div>
      </div>
    </div>
  )
}
