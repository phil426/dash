'use client'

import { useState, useEffect } from 'react'

export default function TopBar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-time">{timeStr}</div>
          <div className="topbar-date">{dateStr}</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-driver">
          <div className="driver-avatar">P</div>
          <div className="driver-info">
            <span className="driver-name">Phil · Uber Premier</span>
            <span className="driver-rating">★ 4.98</span>
          </div>
        </div>
      </div>
    </header>
  )
}
