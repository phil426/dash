'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { PiMusicNoteFill, PiMapPinFill, PiCloudSunFill, PiAirplaneTiltFill, PiChartLineUpFill, PiClipboardTextFill } from 'react-icons/pi'
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import WeatherWidget from '../widgets/WeatherWidget'
import MusicWidget from '../widgets/MusicWidget'
import CabinWidget from '../widgets/CabinWidget'
import StocksWidget from '../widgets/StocksWidget'
import DeparturesWidget from '../widgets/DeparturesWidget'
import SurveyWidget from '../widgets/SurveyWidget'
import { SpotifyProvider } from '../hooks/useSpotify'

const MapWidget = dynamic(() => import('../widgets/MapWidget'), { ssr: false })

const TABS = [
  { id: 'music',    icon: PiMusicNoteFill,       label: 'Music' },
  { id: 'map',      icon: PiMapPinFill,          label: 'Map' },
  { id: 'weather',  icon: PiCloudSunFill,        label: 'Weather' },
  { id: 'flights',  icon: PiAirplaneTiltFill,    label: 'Flights' },
  { id: 'stocks',   icon: PiChartLineUpFill,     label: 'Tickers' },
  { id: 'survey',   icon: PiClipboardTextFill,   label: 'Survey' },
]

function TabContent({ activeTab }) {
  return (
    <>
      {/* Music always mounted so playback never stops */}
      <div style={{ display: activeTab === 'music' ? 'block' : 'none', height: '100%' }}>
        <MusicWidget />
      </div>
      {activeTab === 'map' && <MapWidget />}
      {activeTab === 'weather' && <WeatherWidget />}
      {activeTab === 'flights' && <DeparturesWidget />}
      {activeTab === 'stocks' && <StocksWidget />}
      {activeTab === 'survey' && <SurveyWidget />}
    </>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('music')
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState('default')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const THEMES = [
    { id: 'default',  label: 'Prius',        color: '#00d9a3' },
    { id: 'midnight', label: 'Midnight Blue', color: '#818cf8' },
    { id: 'rose',     label: 'Rose Gold',     color: '#f472b6' },
    { id: 'amber',    label: 'Amber',         color: '#f59e0b' },
    { id: 'arctic',   label: 'Arctic',        color: '#38bdf8' },
    { id: 'crimson',  label: 'Crimson',       color: '#ef4444' },
    { id: 'lavender', label: 'Lavender',      color: '#a78bfa' },
    { id: 'emerald',  label: 'Emerald',       color: '#10b981' },
    { id: 'sunset',   label: 'Sunset',        color: '#fb923c' },
  ]

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })

  return (
    <SpotifyProvider>
    <main className="dash-shell">
      {/* Version */}
      <span style={{
        position: 'fixed', top: 8, right: 12, zIndex: 9999,
        fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 500,
        color: 'var(--text-muted)', opacity: 0.4, letterSpacing: '0.05em',
        pointerEvents: 'none',
      }}>v2.1</span>
      {/* ── Left Panel (collapsible) ── */}
      <div className={`left-panel ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="left-panel-header">
          <div className="lp-time">{mounted ? timeStr : '\u00A0'}</div>
          <div className="lp-date">{mounted ? dateStr : '\u00A0'}</div>
          <div className="lp-driver">
            <div className="lp-driver-avatar">P</div>
            <div className="lp-driver-info">
              <span className="lp-driver-name">Phil · Uber Premier</span>
              <span className="lp-driver-rating">★ 4.98</span>
            </div>
          </div>
        </div>

        <div className="left-panel-cabin">
          <CabinWidget />
        </div>

        {/* Collapse / Expand toggle */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(p => !p)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>

      {/* ── Right Panel ── */}
      <div className="right-panel">
        <div className="content-area">
          <TabContent activeTab={activeTab} />
        </div>

        <div className="nav-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={30} />
                <span className="nav-tab-label">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Theme Drawer (top) ── */}
      <button
        className="theme-toggle"
        onClick={() => setDrawerOpen(p => !p)}
        style={drawerOpen ? { top: 56 } : {}}
      >
        <ChevronDown
          size={16}
          strokeWidth={2}
          style={{
            transition: 'transform 0.3s ease',
            transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div className={`theme-drawer ${drawerOpen ? 'open' : ''}`}>
        <span className="theme-drawer-title">Theme</span>
        <div className="theme-drawer-list">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`theme-swatch ${theme === t.id ? 'active' : ''}`}
              onClick={() => setTheme(t.id)}
            >
              <div
                className="theme-swatch-dot"
                style={{ background: t.color, color: t.color }}
              />
              <span className="theme-swatch-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
    </SpotifyProvider>
  )
}
