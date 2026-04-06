'use client'

import { useState } from 'react'

const sliders = [
  { key: 'time',    label: 'Time Sensitivity', left: 'No Hurry', right: 'In a Rush',    colors: ['#00cc66', '#ff9500'], defaultVal: 60 },
  { key: 'temp',    label: 'Temperature',      left: 'Cool',     right: 'Warm',          colors: ['#00b4d8', '#ff3b30'], defaultVal: 50 },
  { key: 'volume',  label: 'Music Volume',     left: 'Silent',   right: 'High',          colors: ['#818cf8', '#ff9500'], defaultVal: 70 },
  { key: 'convo',   label: 'Conversation',     left: 'Private',  right: 'Chatty',        colors: ['#00d9a3', '#00cc66'], defaultVal: 40 },
]

// Segmented gauge bar — like the Prius ECO/PWR indicator
function SegmentedGauge({ value, colors, onChange }) {
  const segments = 20
  const filledCount = Math.round((value / 100) * segments)

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        height: 10,
        cursor: 'pointer',
        padding: '2px 0',
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
        onChange(Math.max(0, Math.min(100, pct)))
      }}
    >
      {Array.from({ length: segments }, (_, i) => {
        const pct = i / segments
        const isFilled = i < filledCount
        // Interpolate color
        const r1 = parseInt(colors[0].slice(1, 3), 16)
        const g1 = parseInt(colors[0].slice(3, 5), 16)
        const b1 = parseInt(colors[0].slice(5, 7), 16)
        const r2 = parseInt(colors[1].slice(1, 3), 16)
        const g2 = parseInt(colors[1].slice(3, 5), 16)
        const b2 = parseInt(colors[1].slice(5, 7), 16)
        const r = Math.round(r1 + (r2 - r1) * pct)
        const g = Math.round(g1 + (g2 - g1) * pct)
        const b = Math.round(b1 + (b2 - b1) * pct)
        const color = `rgb(${r}, ${g}, ${b})`

        return (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 2,
              background: isFilled ? color : 'rgba(0, 217, 163, 0.06)',
              boxShadow: isFilled ? `0 0 6px ${color}40` : 'none',
              transition: 'all 0.15s ease',
            }}
          />
        )
      })}
    </div>
  )
}

export default function CabinWidget() {
  const [values, setValues] = useState(
    Object.fromEntries(sliders.map(s => [s.key, s.defaultVal]))
  )

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-label">Cabin Comfort</span>
        <span className="card-badge">Interactive</span>
      </div>

      <div className="cabin-sliders" style={{ flex: 1 }}>
        {sliders.map(s => {
          const v = values[s.key]
          return (
            <div className="cabin-row" key={s.key}>
              <div className="cabin-row-header">
                <span className="cabin-row-label">{s.label}</span>
                <span className="cabin-row-value">{v}%</span>
              </div>
              <SegmentedGauge
                value={v}
                colors={s.colors}
                onChange={(pct) => setValues(prev => ({ ...prev, [s.key]: pct }))}
              />
              <div className="cabin-hints">
                <span className="cabin-hint">{s.left}</span>
                <span className="cabin-hint">{s.right}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
