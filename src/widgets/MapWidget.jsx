'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as protomapsL from 'protomaps-leaflet'

/**
 * Reads the current theme's accent color and derives a full map palette.
 * Roads, labels and features are all tinted with the accent hue.
 */
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hsl(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`
}

function buildTheme() {
  const style = getComputedStyle(document.documentElement)
  const accent = style.getPropertyValue('--accent').trim() || '#00d9a3'
  const [hue] = hexToHSL(accent)

  return {
    // Transparent background — lets the dashboard gradient show through
    background: 'transparent',
    earth: hsl(hue, 8, 6),
    park_a: hsl(hue, 12, 7),
    park_b: hsl(hue, 14, 8),
    hospital: hsl(hue, 6, 7),
    industrial: hsl(hue, 4, 6),
    school: hsl(hue, 6, 7),
    wood_a: hsl(hue, 10, 7),
    wood_b: hsl(hue, 10, 7),
    pedestrian: hsl(hue, 6, 8),
    scrub_a: hsl(hue, 8, 7),
    scrub_b: hsl(hue, 8, 7),
    glacier: hsl(hue, 10, 8),
    sand: hsl(hue, 6, 7),
    beach: hsl(hue, 8, 8),
    aerodrome: hsl(hue, 6, 6),
    runway: hsl(hue, 8, 16),
    water: hsl(hue, 25, 10),
    zoo: hsl(hue, 8, 7),
    military: hsl(hue, 6, 7),
    // Tunnels
    tunnel_other_casing: hsl(hue, 5, 4),
    tunnel_minor_casing: hsl(hue, 5, 4),
    tunnel_link_casing: hsl(hue, 5, 4),
    tunnel_major_casing: hsl(hue, 5, 4),
    tunnel_highway_casing: hsl(hue, 5, 4),
    tunnel_other: hsl(hue, 15, 16),
    tunnel_minor: hsl(hue, 15, 16),
    tunnel_link: hsl(hue, 18, 22),
    tunnel_major: hsl(hue, 18, 22),
    tunnel_highway: hsl(hue, 20, 28),
    pier: hsl(hue, 8, 12),
    buildings: hsl(hue, 6, 5),
    // Road casings
    minor_service_casing: hsl(hue, 5, 4),
    minor_casing: hsl(hue, 5, 4),
    link_casing: hsl(hue, 5, 4),
    major_casing_late: hsl(hue, 5, 4),
    highway_casing_late: hsl(hue, 5, 4),
    // Roads — BRIGHT, accent-tinted
    other: hsl(hue, 14, 30),
    minor_service: hsl(hue, 14, 30),
    minor_a: hsl(hue, 18, 40),
    minor_b: hsl(hue, 16, 35),
    link: hsl(hue, 18, 40),
    major_casing_early: hsl(hue, 5, 4),
    major: hsl(hue, 22, 50),
    highway_casing_early: hsl(hue, 5, 4),
    highway: hsl(hue, 30, 60),
    railway: hsl(hue, 10, 14),
    boundaries: hsl(hue, 25, 35),
    // Bridges
    bridges_other_casing: hsl(hue, 5, 6),
    bridges_minor_casing: hsl(hue, 5, 4),
    bridges_link_casing: hsl(hue, 5, 4),
    bridges_major_casing: hsl(hue, 5, 4),
    bridges_highway_casing: hsl(hue, 5, 4),
    bridges_other: hsl(hue, 14, 30),
    bridges_minor: hsl(hue, 16, 35),
    bridges_link: hsl(hue, 18, 40),
    bridges_major: hsl(hue, 22, 50),
    bridges_highway: hsl(hue, 30, 60),
    // Labels
    roads_label_minor: hsl(hue, 16, 50),
    roads_label_minor_halo: hsl(hue, 8, 4),
    roads_label_major: hsl(hue, 20, 65),
    roads_label_major_halo: hsl(hue, 8, 4),
    ocean_label: hsl(hue, 20, 35),
    subplace_label: hsl(hue, 14, 48),
    subplace_label_halo: hsl(hue, 8, 4),
    city_label: hsl(hue, 20, 75),
    city_label_halo: hsl(hue, 8, 4),
    state_label: hsl(hue, 16, 40),
    state_label_halo: hsl(hue, 8, 4),
    country_label: hsl(hue, 16, 55),
    address_label: hsl(hue, 14, 42),
    address_label_halo: hsl(hue, 8, 4),
    pois: {
      blue: accent,
      green: accent,
      lapis: accent,
      pink: accent,
      red: accent,
      slategray: hsl(hue, 8, 40),
      tangerine: accent,
      turquoise: accent,
    },
    landcover: {
      grassland: hsl(hue, 12, 5),
      barren: hsl(hue, 4, 6),
      urban_area: hsl(hue, 4, 5),
      farmland: hsl(hue, 10, 6),
      glacier: hsl(hue, 8, 7),
      scrub: hsl(hue, 10, 6),
      forest: hsl(hue, 14, 6),
    },
  }
}

const PMTILES_URL = 'https://build.protomaps.com/20260405.pmtiles'

export default function MapWidget() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const tileLayerRef = useRef(null)
  const followMode = useRef(true)
  const lastPos = useRef(null)
  const recenterTimer = useRef(null)
  const [status, setStatus] = useState('Locating...')
  const [address, setAddress] = useState('')
  const [speed, setSpeed] = useState(null)
  const [heading, setHeading] = useState(null)
  const [isFollowing, setIsFollowing] = useState(true)

  const lastGeocode = useRef(0)
  const reverseGeocode = useCallback(async (lat, lon) => {
    const now = Date.now()
    if (now - lastGeocode.current < 10000) return
    lastGeocode.current = now
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.highway || ''
        const area = data.address.city || data.address.town || data.address.village || ''
        setAddress(road ? `${road}, ${area}` : area || data.display_name?.split(',').slice(0, 2).join(', '))
      }
    } catch (e) {}
  }, [])

  function getAccentColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00d9a3'
  }

  function createMarkerIcon(accent, hdg, spd) {
    const isMoving = spd !== null && spd > 0.5 && hdg !== null && hdg !== undefined
    if (isMoving) {
      return L.divIcon({
        className: '',
        html: `<div style="
          width: 0; height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-bottom: 28px solid ${accent};
          filter: drop-shadow(0 0 10px ${accent}) drop-shadow(0 0 20px ${accent}55);
          transform: rotate(${hdg}deg);
          transform-origin: center 70%;
        "></div>`,
        iconSize: [24, 28],
        iconAnchor: [12, 20],
      })
    }
    return L.divIcon({
      className: '',
      html: `<div style="
        width: 20px; height: 20px; border-radius: 50%;
        background: ${accent};
        box-shadow: 0 0 18px ${accent}, 0 0 36px ${accent}55;
        border: 3px solid #fff;
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  }

  function startRecenterTimer() {
    if (recenterTimer.current) clearTimeout(recenterTimer.current)
    recenterTimer.current = setTimeout(() => {
      if (lastPos.current && mapInstance.current) {
        followMode.current = true
        setIsFollowing(true)
        mapInstance.current.flyTo(lastPos.current, mapInstance.current.getZoom(), { duration: 0.8 })
      }
    }, 6000)
  }

  /** Add or replace the Protomaps tile layer with current theme colors */
  function applyMapTheme() {
    if (!mapInstance.current) return
    // Remove old layer
    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current)
    }
    const theme = buildTheme()
    const rules = protomapsL.paintRules(theme, '')
    const labels = protomapsL.labelRules(theme, 'en')
    tileLayerRef.current = protomapsL.leafletLayer({
      url: PMTILES_URL,
      paintRules: rules,
      labelRules: labels,
      backgroundColor: theme.background,
    })
    tileLayerRef.current.addTo(mapInstance.current)
    // Make sure marker stays on top
    if (markerRef.current) markerRef.current.setZIndexOffset(1000)
  }

  useEffect(() => {
    if (mapInstance.current) return

    const defaultPos = [37.7749, -122.4194]

    mapInstance.current = L.map(mapRef.current, {
      center: defaultPos,
      zoom: 16,
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

    // Apply initial theme
    applyMapTheme()

    const accent = getAccentColor()
    markerRef.current = L.marker(defaultPos, { icon: createMarkerIcon(accent, null, null) })
      .addTo(mapInstance.current)

    mapInstance.current.on('dragstart', () => {
      followMode.current = false
      setIsFollowing(false)
      startRecenterTimer()
    })
    mapInstance.current.on('zoomstart', () => {
      if (!followMode.current) startRecenterTimer()
    })

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed: spd, heading: hdg } = pos.coords
          const latlng = [latitude, longitude]
          lastPos.current = latlng

          const accent = getAccentColor()
          markerRef.current.setLatLng(latlng)
          markerRef.current.setIcon(createMarkerIcon(accent, hdg, spd))

          if (followMode.current && mapInstance.current) {
            mapInstance.current.panTo(latlng, { animate: true, duration: 1 })
          }

          setStatus('Live')
          setSpeed(spd)
          setHeading(hdg)
          reverseGeocode(latitude, longitude)
        },
        () => setStatus('San Francisco'),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      )
      return () => {
        navigator.geolocation.clearWatch(watchId)
        if (recenterTimer.current) clearTimeout(recenterTimer.current)
        if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
      }
    } else {
      setStatus('San Francisco')
    }

    return () => {
      if (recenterTimer.current) clearTimeout(recenterTimer.current)
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [])

  // Re-theme map + marker when theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyMapTheme()
      if (markerRef.current) {
        markerRef.current.setIcon(createMarkerIcon(getAccentColor(), heading, speed))
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [heading, speed])

  function handleZoom(dir) {
    if (!mapInstance.current) return
    if (dir === 'in') mapInstance.current.zoomIn()
    else mapInstance.current.zoomOut()
  }

  const speedNum = speed ? Math.round(speed * 2.237) : 0

  const ctrlBtn = {
    width: 40, height: 40, borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    fontSize: 20, fontWeight: 700,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }

  return (
    <div className="card hero" style={{ height: '100%', position: 'relative' }}>
      <div className="map-container" ref={mapRef} />

      {/* Top center: Street name */}
      {address && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, maxWidth: '70%',
        }}>
          <div style={{
            padding: '8px 18px',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600,
            color: '#fff', textAlign: 'center',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '0.02em',
          }}>{address}</div>
        </div>
      )}

      {/* Bottom left: Speed readout */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{
          padding: '10px 20px',
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{
            fontFamily: 'var(--font-data)', fontSize: 42, fontWeight: 800,
            color: '#fff', lineHeight: 1, letterSpacing: '-0.02em',
          }}>{speedNum}</span>
          <span style={{
            fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 600,
            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em',
          }}>MPH</span>
        </div>

        <div style={{
          padding: '5px 14px',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 600,
          color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: status === 'Live' ? 'var(--accent)' : 'var(--accent-warm)',
            boxShadow: status === 'Live' ? '0 0 6px var(--accent)' : 'none',
          }} />
          {status}
          {!isFollowing && (
            <span style={{ color: 'var(--accent)', marginLeft: 4 }}>· Re-centering...</span>
          )}
        </div>
      </div>

      {/* Bottom right: Controls */}
      <div style={{
        position: 'absolute', right: 14, bottom: 16,
        display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1000,
      }}>
        <button onClick={() => handleZoom('in')} style={ctrlBtn}>+</button>
        <button onClick={() => handleZoom('out')} style={ctrlBtn}>−</button>
      </div>
    </div>
  )
}
