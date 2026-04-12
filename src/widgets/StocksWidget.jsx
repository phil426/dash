'use client'

import { useState, useEffect } from 'react'

const TICKER_ROWS = [
  {
    label: 'Indexes',
    speed: 25,
    tickers: [
      { sym: 'S&P 500', name: 'S&P 500', price: 5243.77, pct: 0.3 },
      { sym: 'DJIA', name: 'Dow Jones', price: 39412.50, pct: 0.2 },
      { sym: 'NASDAQ', name: 'Nasdaq Comp', price: 16384.47, pct: 0.6 },
      { sym: 'Russell', name: 'Russell 2000', price: 2074.40, pct: -0.5 },
      { sym: 'VIX', name: 'Volatility', price: 14.82, pct: -3.1 },
      { sym: 'DXY', name: 'US Dollar', price: 104.26, pct: 0.1 },
      { sym: '10Y', name: '10Y Yield', price: 4.42, pct: 0.8 },
      { sym: 'CRUDE', name: 'WTI Crude', price: 78.44, pct: 1.2 },
      { sym: 'GOLD', name: 'Gold', price: 2342.60, pct: 0.4 },
    ],
  },
  {
    label: 'Bay Area Tech',
    speed: 40,
    tickers: [
      { sym: 'AAPL', name: 'Apple', price: 183.63, pct: 1.2 },
      { sym: 'META', name: 'Meta', price: 496.10, pct: -0.4 },
      { sym: 'GOOGL', name: 'Alphabet', price: 154.21, pct: 0.8 },
      { sym: 'CRM', name: 'Salesforce', price: 272.45, pct: 1.1 },
      { sym: 'CSCO', name: 'Cisco', price: 49.82, pct: 0.3 },
      { sym: 'NFLX', name: 'Netflix', price: 628.74, pct: 2.1 },
      { sym: 'ADBE', name: 'Adobe', price: 524.30, pct: -0.6 },
      { sym: 'UBER', name: 'Uber', price: 76.43, pct: 1.2 },
      { sym: 'INTU', name: 'Intuit', price: 632.18, pct: 0.4 },
      { sym: 'NOW', name: 'ServiceNow', price: 782.55, pct: 1.5 },
      { sym: 'PANW', name: 'Palo Alto', price: 298.40, pct: 0.9 },
      { sym: 'WDAY', name: 'Workday', price: 264.12, pct: -0.3 },
      { sym: 'PYPL', name: 'PayPal', price: 63.28, pct: 0.7 },
      { sym: 'EBAY', name: 'eBay', price: 47.92, pct: 0.2 },
      { sym: 'SNPS', name: 'Synopsys', price: 568.90, pct: 1.3 },
      { sym: 'CDNS', name: 'Cadence', price: 298.76, pct: 0.8 },
      { sym: 'AMAT', name: 'Applied Matl', price: 199.44, pct: 1.7 },
      { sym: 'KLAC', name: 'KLA Corp', price: 712.30, pct: 0.5 },
      { sym: 'LRCX', name: 'Lam Research', price: 942.18, pct: 1.1 },
      { sym: 'FTNT', name: 'Fortinet', price: 72.54, pct: -0.8 },
    ],
  },
  {
    label: 'AI',
    speed: 28,
    tickers: [
      { sym: 'NVDA', name: 'Nvidia', price: 894.32, pct: 2.1 },
      { sym: 'MSFT', name: 'Microsoft', price: 420.72, pct: 0.5 },
      { sym: 'AMD', name: 'AMD', price: 178.44, pct: 1.8 },
      { sym: 'AVGO', name: 'Broadcom', price: 1324.60, pct: 1.3 },
      { sym: 'PLTR', name: 'Palantir', price: 24.18, pct: 3.2 },
      { sym: 'SMCI', name: 'Super Micro', price: 782.90, pct: -2.4 },
      { sym: 'ARM', name: 'ARM Holdings', price: 138.62, pct: 1.9 },
      { sym: 'MRVL', name: 'Marvell', price: 72.34, pct: 1.1 },
      { sym: 'TSM', name: 'TSMC', price: 148.90, pct: 0.7 },
      { sym: 'SNOW', name: 'Snowflake', price: 162.44, pct: -1.2 },
      { sym: 'AI', name: 'C3.ai', price: 28.62, pct: 2.8 },
      { sym: 'PATH', name: 'UiPath', price: 22.10, pct: -0.9 },
    ],
  },
  {
    label: 'Crypto',
    speed: 32,
    tickers: [
      { sym: 'BTC', name: 'Bitcoin', price: 69842, pct: 1.4 },
      { sym: 'ETH', name: 'Ethereum', price: 3521, pct: 2.1 },
      { sym: 'SOL', name: 'Solana', price: 148.62, pct: 3.8 },
      { sym: 'DOGE', name: 'Dogecoin', price: 0.1644, pct: -1.2 },
      { sym: 'ADA', name: 'Cardano', price: 0.4582, pct: 0.9 },
      { sym: 'XRP', name: 'Ripple', price: 0.5124, pct: -0.6 },
      { sym: 'AVAX', name: 'Avalanche', price: 36.82, pct: 2.4 },
      { sym: 'DOT', name: 'Polkadot', price: 7.42, pct: 1.1 },
      { sym: 'MATIC', name: 'Polygon', price: 0.7218, pct: -0.3 },
      { sym: 'LINK', name: 'Chainlink', price: 14.92, pct: 1.7 },
    ],
  },
  {
    label: 'Bonds',
    speed: 22,
    tickers: [
      { sym: 'TLT', name: '20+ Yr Treasury', price: 92.34, pct: -0.4 },
      { sym: 'IEF', name: '7-10 Yr Treasury', price: 96.18, pct: -0.2 },
      { sym: 'SHY', name: '1-3 Yr Treasury', price: 81.76, pct: 0.0 },
      { sym: 'BND', name: 'Total Bond', price: 73.42, pct: -0.1 },
      { sym: 'AGG', name: 'Agg Bond', price: 99.84, pct: -0.2 },
      { sym: 'HYG', name: 'High Yield', price: 77.62, pct: 0.3 },
      { sym: 'LQD', name: 'Invest Grade', price: 110.28, pct: -0.1 },
      { sym: 'TIPS', name: 'Inflation Prot', price: 108.94, pct: 0.1 },
    ],
  },
]

function formatPrice(price) {
  if (price >= 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  if (price < 1) return price.toFixed(4)
  return price.toFixed(2)
}

function TickerRow({ row, tickOffset }) {
  const items = row.tickers.map(t => ({
    ...t,
    price: t.price + (tickOffset[t.sym] || 0),
  }))
  const doubled = [...items, ...items]

  return (
    <div className="ticker-row-wrap">
      <span className="ticker-row-label">{row.label}</span>
      <div className="ticker-track">
        <div className="ticker-scroll" style={{ animationDuration: `${row.speed}s` }}>
          {doubled.map((t, i) => (
            <div className="ticker-item" key={`${t.sym}-${i}`}>
              <span className="ticker-sym">{t.sym}</span>
              <span className="ticker-price">${formatPrice(t.price)}</span>
              <span className={`ticker-change ${t.pct >= 0 ? 'up' : 'down'}`}>
                {t.pct >= 0 ? '▲' : '▼'} {Math.abs(t.pct).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Sport score ticker rows ─── */

function SportsGameRow({ league }) {
  if (!league?.games?.length) return null

  const items = league.games
  const doubled = [...items, ...items]

  return (
    <div className="ticker-row-wrap">
      <span className="ticker-row-label sport-label">
        {league.emoji} {league.label}
      </span>
      <div className="ticker-track">
        <div className="ticker-scroll" style={{ animationDuration: '35s' }}>
          {doubled.map((g, i) => {
            const stateClass =
              g.state === 'in' ? 'sport-live' :
              g.state === 'post' ? 'sport-final' : 'sport-pre'
            return (
              <div className={`ticker-item sport-game ${stateClass}`} key={`${g.away}-${g.home}-${i}`}>
                <span className="sport-team">{g.away}</span>
                <span className="sport-score">{g.awayScore}</span>
                <span className="sport-at">@</span>
                <span className="sport-score">{g.homeScore}</span>
                <span className="sport-team">{g.home}</span>
                <span className="sport-detail">{g.detail}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GolfRow({ league }) {
  if (!league?.players?.length) return null

  const doubled = [...league.players, ...league.players]

  return (
    <div className="ticker-row-wrap">
      <span className="ticker-row-label sport-label">
        {league.emoji} {league.eventName || league.label}
      </span>
      <div className="ticker-track">
        <div className="ticker-scroll" style={{ animationDuration: '40s' }}>
          {doubled.map((p, i) => (
            <div className="ticker-item sport-game sport-golf" key={`${p.name}-${i}`}>
              <span className="golf-pos">T{p.pos}</span>
              <span className="sport-team">{p.name}</span>
              <span className={`golf-score ${String(p.score).startsWith('-') ? 'under-par' : ''}`}>
                {p.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StocksWidget() {
  const [ticks, setTicks] = useState({})
  const [sports, setSports] = useState(null)

  // Market tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(prev => {
        const next = { ...prev }
        for (const row of TICKER_ROWS) {
          for (const t of row.tickers) {
            next[t.sym] = (prev[t.sym] || 0) + (Math.random() - 0.48) * (t.price * 0.001)
          }
        }
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // ESPN scores fetch
  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch('/api/scores')
        if (res.ok) {
          const data = await res.json()
          setSports(data)
        }
      } catch (e) {
        console.error('Sports scores fetch failed:', e)
      }
    }
    fetchScores()
    const interval = setInterval(fetchScores, 120_000) // refresh every 2 min
    return () => clearInterval(interval)
  }, [])

  const sportsOrder = ['nba', 'mlb', 'nhl', 'epl', 'mls', 'golf']

  return (
    <div className="card" style={{ height: '100%', padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 24px', marginBottom: 8 }}>
        <div className="card-header" style={{ padding: 0 }}>
          <span className="card-label">Markets & Scores</span>
          <span className="card-badge live">Live</span>
        </div>
      </div>

      <div className="ticker-rows">
        {TICKER_ROWS.map((row) => (
          <TickerRow key={row.label} row={row} tickOffset={ticks} />
        ))}

        {/* Sports scores separator */}
        {sports && Object.keys(sports).length > 0 && (
          <div className="sports-divider">
            <span className="sports-divider-line" />
            <span className="sports-divider-text">SCORES</span>
            <span className="sports-divider-line" />
          </div>
        )}

        {/* Sports tickers */}
        {sports && sportsOrder.map(key => {
          const league = sports[key]
          if (!league) return null
          if (key === 'golf') return <GolfRow key={key} league={league} />
          return <SportsGameRow key={key} league={league} />
        })}
      </div>
    </div>
  )
}
