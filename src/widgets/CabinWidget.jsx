'use client'

import { useState } from 'react'

const sliders = [
  { key: 'time',    label: 'Time Sensitivity', left: 'No Hurry', right: 'In a Rush',    colors: ['#00cc66', '#ff9500'], defaultVal: 3 },
  { key: 'temp',    label: 'Temperature',      left: 'Cool',     right: 'Warm',          colors: ['#00b4d8', '#ff3b30'], defaultVal: 2 },
  { key: 'volume',  label: 'Music Volume',     left: 'Silent',   right: 'High',          colors: ['#818cf8', '#ff69b4'], defaultVal: 3 },
  { key: 'convo',   label: 'Conversation',     left: 'Private',  right: 'Chatty',        colors: ['#00d9a3', '#00cc66'], defaultVal: 1 },
]

const STEPS = 5

function SegmentedControl({ value, colors, onChange }) {
  return (
    <div style={{
      display: 'flex',
      background: `linear-gradient(90deg, ${colors[0]}20, ${colors[1]}20)`,
      borderRadius: 8,
      padding: 4,
      gap: 2,
    }}>
      {Array.from({ length: STEPS }, (_, i) => {
        const pct = i / (STEPS - 1)
        const isSelected = i === value

        // Interpolate color for selected state
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
          <button
            key={i}
            onClick={() => onChange(i)}
            style={{
              flex: 1,
              height: 35,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              background: isSelected ? color : 'transparent',
              boxShadow: isSelected ? `0 0 10px ${color}40` : 'none',
              color: isSelected ? '#000' : 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-data)',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              padding: 0,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="cabin-label">Cabin Comfort</span>
        <span className="card-badge">Interactive</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {sliders.map(s => {
          const v = values[s.key]
          return (
            <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 19, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-primary)',
                }}>{s.label}</span>
              </div>

              <SegmentedControl
                value={v}
                colors={s.colors}
                onChange={(step) => setValues(prev => ({ ...prev, [s.key]: step }))}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 12, color: s.colors[0], textTransform: 'uppercase',
                  letterSpacing: '0.08em', fontWeight: 600,
                }}>{s.left}</span>
                <span style={{
                  fontSize: 12, color: s.colors[1], textTransform: 'uppercase',
                  letterSpacing: '0.08em', fontWeight: 600,
                }}>{s.right}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
