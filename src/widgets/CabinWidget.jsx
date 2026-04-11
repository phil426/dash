'use client'

import { useState, useRef } from 'react'
import useSpotify from '../hooks/useSpotify'

const sliders = [
  { key: 'speed',  label: 'Speed',        left: 'Slow',    right: 'Fast',    colors: ['#b5cc00', '#b5cc00'], defaultVal: 50 },
  { key: 'temp',   label: 'Temperature',  left: 'Cool',    right: 'Warm',    colors: ['#888', '#ff3b30'],    defaultVal: 38 },
  { key: 'volume', label: 'Music Volume', left: 'Silent',  right: 'High',    colors: ['#ff69b4', '#ff69b4'], defaultVal: 65 },
  { key: 'convo',  label: 'Conversation', left: 'Private', right: 'Chatty',  colors: ['#00d9a3', '#00d9a3'], defaultVal: 20 },
]

function PillSlider({ value, colors, onChange }) {
  const ref = useRef(null)
  const PILL_W = 54
  const TRACK_H = 36

  const calc = (x) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (x - r.left - PILL_W / 2) / (r.width - PILL_W)))
    onChange(Math.round(pct * 100))
  }

  return (
    <div
      ref={ref}
      onPointerDown={(e) => { e.preventDefault(); ref.current.setPointerCapture(e.pointerId); calc(e.clientX) }}
      onPointerMove={(e) => { if (ref.current?.hasPointerCapture(e.pointerId)) calc(e.clientX) }}
      onPointerUp={(e) => ref.current?.releasePointerCapture(e.pointerId)}
      onPointerCancel={(e) => ref.current?.releasePointerCapture(e.pointerId)}
      style={{
        position: 'relative',
        height: TRACK_H,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
        touchAction: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Pill thumb */}
      <div style={{
        position: 'absolute',
        top: 4,
        left: `calc((100% - ${PILL_W}px) * ${value / 100})`,
        width: PILL_W,
        height: TRACK_H - 8,
        borderRadius: 6,
        background: colors[0],
        boxShadow: `0 2px 8px ${colors[0]}60`,
        transition: 'left 0.05s linear',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

export default function CabinWidget() {
  const { volume: spotifyVolume, setVolume: setSpotifyVolume, session } = useSpotify()

  const [values, setValues] = useState(
    Object.fromEntries(sliders.map(s => [s.key, s.defaultVal]))
  )

  // Sync initial Spotify volume to local state
  const handleChange = (key, pct) => {
    setValues(prev => ({ ...prev, [key]: pct }))
    // If this is the Music Volume slider and Spotify is connected, sync it
    if (key === 'volume' && session) {
      setSpotifyVolume(pct)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span className="cabin-label">Preferences</span>
        <span className="card-badge">Interactive</span>
      </div>

      {/* Slider rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {sliders.map(s => {
          // For volume, use Spotify's actual volume if connected
          const v = (s.key === 'volume' && session && spotifyVolume != null)
            ? spotifyVolume
            : values[s.key]
          return (
            <div key={s.key}>
              {/* Row label */}
              <div style={{
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'var(--text-primary)',
                marginBottom: 6,
              }}>{s.label}</div>

              {/* Track */}
              <PillSlider
                value={v}
                colors={s.colors}
                onChange={(pct) => handleChange(s.key, pct)}
              />

              {/* Sub-labels */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 4, paddingLeft: 2, paddingRight: 2,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: s.colors[0], opacity: 0.7,
                }}>{s.left}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: s.colors[1], opacity: 0.7,
                }}>{s.right}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
