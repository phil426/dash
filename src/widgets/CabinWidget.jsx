'use client'

import { useState, useRef, useId } from 'react'
import { Turtle, Rabbit, Snowflake, Flame, VolumeX, Volume2, Smile, Meh } from 'lucide-react'

const sliders = [
  { key: 'speed',  label: 'Speed',        leftIcon: Turtle,    rightIcon: Rabbit,  colors: ['#00cc66', '#ff9500'], graduated: true  },
  { key: 'temp',   label: 'Temperature',  leftIcon: Snowflake, rightIcon: Flame,   colors: ['#00b4d8', '#ff3b30'], graduated: false },
  { key: 'volume', label: 'Music Volume', leftIcon: VolumeX,   rightIcon: Volume2, colors: ['#818cf8', '#ff69b4'], graduated: true  },
  { key: 'convo',  label: 'Conversation', leftIcon: Meh,       rightIcon: Smile,   colors: ['#00d9a3', '#00cc66'], graduated: false },
]

const defaults = { speed: 75, temp: 50, volume: 75, convo: 25 }

const SEGMENTS = 12

/* ── Gradient-Stroked Icon ── */
function GradientIcon({ Icon, colors, opacity = 1 }) {
  const rawId = useId()
  const id = 'gi' + rawId.replace(/:/g, '')
  return (
    <div style={{ position: 'relative', width: 31, height: 31, flexShrink: 0, opacity, transition: 'opacity 0.3s' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
      </svg>
      <Icon
        size={22} strokeWidth={1.6}
        style={{ stroke: `url(#${id})`, color: 'transparent' }}
      />
    </div>
  )
}

function lerp(a, b, t) { return a + (b - a) * t }
function hexToRgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]
}
function interpolate(c1, c2, t) {
  const [r1,g1,b1] = hexToRgb(c1), [r2,g2,b2] = hexToRgb(c2)
  return `rgb(${Math.round(lerp(r1,r2,t))},${Math.round(lerp(g1,g2,t))},${Math.round(lerp(b1,b2,t))})`
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Graduated Bar — Segmented Step Control
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function GraduatedBar({ value, colors, onChange }) {
  const ref = useRef(null)

  const calc = (x) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const seg = Math.ceil(Math.max(0, Math.min(1, (x - r.left) / r.width)) * SEGMENTS)
    onChange(Math.round((seg / SEGMENTS) * 100))
  }

  const activeSegs = Math.round((value / 100) * SEGMENTS)

  return (
    <div
      ref={ref}
      onPointerDown={(e) => { e.preventDefault(); ref.current.setPointerCapture(e.pointerId); calc(e.clientX) }}
      onPointerMove={(e) => { if (ref.current?.hasPointerCapture(e.pointerId)) calc(e.clientX) }}
      onPointerUp={(e) => ref.current?.releasePointerCapture(e.pointerId)}
      onPointerCancel={(e) => ref.current?.releasePointerCapture(e.pointerId)}
      style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36, touchAction: 'none', cursor: 'pointer' }}
    >
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const isActive = i < activeSegs
        const segColor = interpolate(colors[0], colors[1], i / (SEGMENTS - 1))
        return (
          <div
            key={i}
            style={{
              flex: 1, height: 6, borderRadius: 3,
              background: isActive ? segColor : 'rgba(255,255,255,0.06)',
              boxShadow: isActive ? `0 0 6px ${segColor}60, 0 0 0 0.5px ${segColor}40` : 'inset 0 1px 1px rgba(0,0,0,0.3)',
              transition: 'background 0.1s, box-shadow 0.1s',
            }}
          />
        )
      })}
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Premium Slider — Automotive HMI Grade
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Slider({ value, colors, onChange }) {
  const ref = useRef(null)
  const t = value / 100
  const activeColor = interpolate(colors[0], colors[1], t)

  const calc = (x) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (x - r.left) / r.width))
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
        position: 'relative', height: 36, touchAction: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
      }}
    >
      {/* ── Track ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.04)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
      }} />

      {/* ── Fill ── */}
      <div style={{
        position: 'absolute', left: 0, height: 6, borderRadius: 3,
        width: `${value}%`,
        background: `linear-gradient(90deg, ${colors[0]}dd, ${activeColor})`,
        boxShadow: `0 0 12px ${activeColor}20`,
        transition: 'width 0.05s linear',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 60%)',
          borderRadius: 3,
        }} />
      </div>

      {/* ── Thumb ── */}
      <div style={{
        position: 'absolute',
        left: `calc(${value}% - 14px)`,
        width: 28, height: 28, borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}) border-box`,
        border: '1px solid transparent',
        boxShadow: `
          0 2px 8px rgba(0,0,0,0.45),
          0 0 12px ${activeColor}30
        `,
        transition: 'left 0.05s linear',
        pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Inner fill */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: activeColor,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
        }} />
      </div>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Preference Row
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PrefRow({ slider, value, onChange, isLast }) {
  const t = value / 100
  const activeColor = interpolate(slider.colors[0], slider.colors[1], t)
  const LeftIcon = slider.leftIcon
  const RightIcon = slider.rightIcon

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Label row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 8, padding: '0 2px',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.14em', color: 'var(--text-secondary)',
          fontFamily: 'var(--font)',
        }}>{slider.label}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          color: activeColor, fontFamily: 'var(--font-data)',
          opacity: 0.7,
        }}>{value}%</span>
      </div>

      {/* Slider with flanking icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <GradientIcon Icon={LeftIcon} colors={slider.colors} opacity={0.5 + (1 - t) * 0.5} />

        <div style={{ flex: 1 }}>
          {slider.graduated
            ? <GraduatedBar value={value} colors={slider.colors} onChange={onChange} />
            : <Slider value={value} colors={slider.colors} onChange={onChange} />
          }
        </div>

        <GradientIcon Icon={RightIcon} colors={[...slider.colors].reverse()} opacity={0.5 + t * 0.5} />
      </div>

      {/* Divider */}
      {!isLast && (
        <div style={{
          height: 1, marginTop: 10,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent)',
        }} />
      )}
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Widget
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function CabinWidget() {
  const [values, setValues] = useState(defaults)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: 'var(--font)',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 8, marginBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: 'var(--text-primary)',
        }}>Preferences</span>
        <span className="card-badge">Interactive</span>
      </div>

      {/* ── Rows ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {sliders.map((s, i) => (
          <PrefRow
            key={s.key}
            slider={s}
            value={values[s.key]}
            onChange={(v) => setValues(p => ({ ...p, [s.key]: v }))}
            isLast={i === sliders.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
