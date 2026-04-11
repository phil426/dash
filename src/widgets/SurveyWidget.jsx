'use client'

import { useState } from 'react'

const QUESTIONS = [
  {
    id: 'cleanliness',
    text: 'How would you rate the cleanliness of the vehicle?',
    options: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
  },
  {
    id: 'driving',
    text: 'How comfortable was the driving experience?',
    options: ['Uncomfortable', 'Bumpy', 'Okay', 'Smooth', 'Very Smooth'],
  },
  {
    id: 'communication',
    text: 'How was the driver\'s communication?',
    options: ['Poor', 'Minimal', 'Adequate', 'Friendly', 'Outstanding'],
  },
  {
    id: 'route',
    text: 'Was the route taken efficient?',
    options: ['Very Slow', 'Indirect', 'Okay', 'Good', 'Optimal'],
  },
  {
    id: 'overall',
    text: 'How would you rate your overall experience?',
    options: ['1 ★', '2 ★★', '3 ★★★', '4 ★★★★', '5 ★★★★★'],
  },
]

function ResultsView({ answers }) {
  const avgScore = Object.values(answers).reduce((a, b) => a + b, 0) / Object.values(answers).length
  const stars = Math.round(avgScore + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '32px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 12, letterSpacing: '0.1em' }}>
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
        </div>
        <div style={{
          fontFamily: 'var(--font-data)', fontSize: 36, color: 'var(--accent)',
          fontWeight: 700, marginBottom: 8,
        }}>
          {stars}.0 / 5.0
        </div>
        <div style={{ fontSize: 20, color: 'var(--text-secondary)', fontWeight: 500 }}>
          Thank you for your feedback!
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {QUESTIONS.map(q => {
          const val = answers[q.id]
          const label = q.options[val]
          const pct = ((val + 1) / q.options.length) * 100

          return (
            <div key={q.id}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 16, color: 'var(--text-primary)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{q.text.replace('How would you rate ', '').replace('How was ', '').replace('Was the ', '').replace('How comfortable was ', '').replace('?', '')}</span>
                <span style={{
                  fontFamily: 'var(--font-data)', fontSize: 16, color: 'var(--accent)',
                  fontWeight: 700,
                }}>{label}</span>
              </div>
              <div style={{
                height: 10, borderRadius: 5,
                background: 'var(--accent-dim)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 5,
                  width: `${pct}%`,
                  background: pct >= 80 ? 'var(--accent)' : pct >= 60 ? '#ff9500' : '#ff3b30',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '16px 48px', borderRadius: 8,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', fontSize: 18, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font)',
          transition: 'all 0.2s ease',
        }}
      >
        Take Again
      </button>
    </div>
  )
}

export default function SurveyWidget() {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [current, setCurrent] = useState(0)

  const allAnswered = Object.keys(answers).length === QUESTIONS.length

  if (submitted) {
    return (
      <div style={{ height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{
            fontFamily: 'var(--font-data)', fontSize: 29, fontWeight: 700,
            color: 'var(--text-primary)',
          }}>📋 Survey Results</span>
        </div>
        <ResultsView answers={answers} />
      </div>
    )
  }

  const q = QUESTIONS[current]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 29, fontWeight: 700,
          color: 'var(--text-primary)',
        }}>📋 Ride Survey</span>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 14, color: 'var(--text-secondary)',
          fontWeight: 700,
        }}>{current + 1} / {QUESTIONS.length}</span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4, borderRadius: 2, background: 'var(--accent-dim)',
        marginBottom: 20, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${((current + 1) / QUESTIONS.length) * 100}%`,
          background: 'var(--accent)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'auto', minHeight: 0 }}>
        <div style={{
          fontSize: 20, fontWeight: 700, color: 'var(--text-primary)',
          marginBottom: 20, lineHeight: 1.3,
        }}>
          {q.text}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            const isSelected = answers[q.id] === i
            return (
              <button
                key={i}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border-light)',
                  background: isSelected ? 'var(--accent)' : 'var(--bg-card-hover)',
                  color: isSelected ? '#000' : 'var(--text-primary)',
                  fontSize: 15, fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 20px var(--accent-dim)' : 'none',
                  minHeight: 44,
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation - pinned to bottom */}
      <div style={{ display: 'flex', marginTop: 16, gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => setCurrent(p => Math.max(0, p - 1))}
          disabled={current === 0}
          style={{
            flex: 1,
            padding: '14px 16px', borderRadius: 8,
            background: 'var(--bg-card-hover)',
            border: '2px solid var(--border-light)',
            color: current === 0 ? 'rgba(255,255,255,0.25)' : '#fff',
            fontSize: 16, fontWeight: 700,
            cursor: current === 0 ? 'default' : 'pointer',
            fontFamily: 'var(--font)',
            minHeight: 52,
            transition: 'all 0.2s ease',
          }}
        >
          ← Back
        </button>

        {current < QUESTIONS.length - 1 ? (
          <button
            onClick={() => { if (answers[q.id] !== undefined) setCurrent(p => p + 1) }}
            style={{
              flex: 2,
              padding: '14px 16px', borderRadius: 8,
              background: answers[q.id] !== undefined ? 'var(--accent)' : 'var(--bg-card)',
              border: answers[q.id] !== undefined ? '2px solid var(--accent)' : '2px solid var(--border-light)',
              color: answers[q.id] !== undefined ? '#000' : 'rgba(255,255,255,0.4)',
              fontSize: 16, fontWeight: 700,
              cursor: answers[q.id] !== undefined ? 'pointer' : 'default',
              fontFamily: 'var(--font)',
              transition: 'all 0.2s ease',
              minHeight: 52,
              boxShadow: answers[q.id] !== undefined ? '0 0 24px var(--accent-dim)' : 'none',
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => { if (allAnswered) setSubmitted(true) }}
            style={{
              flex: 2,
              padding: '14px 16px', borderRadius: 8,
              background: allAnswered ? 'var(--accent)' : 'var(--bg-card)',
              border: allAnswered ? '2px solid var(--accent)' : '2px solid var(--border-light)',
              color: allAnswered ? '#000' : 'rgba(255,255,255,0.4)',
              fontSize: 16, fontWeight: 700,
              cursor: allAnswered ? 'pointer' : 'default',
              fontFamily: 'var(--font)',
              transition: 'all 0.2s ease',
              boxShadow: allAnswered ? '0 0 24px var(--accent-dim)' : 'none',
              minHeight: 52,
            }}
          >
            Submit ✓
          </button>
        )}
      </div>
    </div>
  )
}
