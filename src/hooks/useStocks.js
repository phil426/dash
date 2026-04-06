import { useState, useEffect, useRef } from 'react'

const API_KEY = '7EUXETJ5VVO4O3JZ'
const BASE_URL = 'https://www.alphavantage.co/query'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const REQUEST_DELAY = 1200 // 1.2s between requests to stay under 5/min

// Global cache shared across component instances
const priceCache = {}

async function fetchQuote(symbol) {
  // Check cache first
  const cached = priceCache[symbol]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const res = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    )
    const json = await res.json()

    // Check for rate limit or error
    if (json['Note'] || json['Information']) {
      console.warn('Alpha Vantage rate limit hit:', json['Note'] || json['Information'])
      return cached?.data || null
    }

    const quote = json['Global Quote']
    if (!quote || !quote['05. price']) {
      return cached?.data || null
    }

    const data = {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
      volume: parseInt(quote['06. volume']),
      latestDay: quote['07. latest trading day'],
    }

    // Cache it
    priceCache[symbol] = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    console.error(`Failed to fetch ${symbol}:`, err)
    return cached?.data || null
  }
}

// Staggered batch fetch — 1 request per second
async function fetchBatch(symbols) {
  const results = {}
  for (const symbol of symbols) {
    results[symbol] = await fetchQuote(symbol)
    // Stagger to respect rate limit
    if (symbols.indexOf(symbol) < symbols.length - 1) {
      await new Promise(r => setTimeout(r, REQUEST_DELAY))
    }
  }
  return results
}

export function useStocks(symbols) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    async function load() {
      setLoading(true)
      const results = await fetchBatch(symbols)
      if (mountedRef.current) {
        setPrices(results)
        setLoading(false)
      }
    }

    load()

    // Refresh every 5 minutes
    const interval = setInterval(load, CACHE_DURATION)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [symbols.join(',')])

  return { prices, loading }
}
