import { NextResponse } from 'next/server'

// ICAO codes for Bay Area airports
const IATA_TO_ICAO = {
  SFO: 'KSFO',
  OAK: 'KOAK',
  SJC: 'KSJC',
  STS: 'KSTS',
}

// Callsign prefix → airline name mapping
const AIRLINE_MAP = {
  UAL: 'UNITED', AAL: 'AMERICAN', DAL: 'DELTA', SWA: 'SOUTHWEST',
  ASA: 'ALASKA', JBU: 'JETBLUE', NKS: 'SPIRIT', FFT: 'FRONTIER',
  HAL: 'HAWAIIAN', SKW: 'SKYWEST', QXE: 'HORIZON AIR', RPA: 'REPUBLIC',
  ENY: 'ENVOY AIR', PDT: 'PIEDMONT', VOI: 'VOLARIS', AMX: 'AEROMEXICO',
  ACA: 'AIR CANADA', BAW: 'BRITISH AIRWAYS', DLH: 'LUFTHANSA',
  AFR: 'AIR FRANCE', KAL: 'KOREAN AIR', ANA: 'ANA', JAL: 'JAPAN AIRLINES',
  CPA: 'CATHAY PACIFIC', SIA: 'SINGAPORE', QFA: 'QANTAS', UAE: 'EMIRATES',
  THY: 'TURKISH', CSN: 'CHINA SOUTHERN', CCA: 'AIR CHINA', EVA: 'EVA AIR',
  LXJ: 'FLEXJET', EJA: 'NETJETS',
}

const ICAO_TO_IATA = {
  UAL: 'UA', AAL: 'AA', DAL: 'DL', SWA: 'WN', ASA: 'AS', JBU: 'B6',
  NKS: 'NK', FFT: 'F9', HAL: 'HA', SKW: 'OO', QXE: 'QX', BAW: 'BA',
  DLH: 'LH', AFR: 'AF', KAL: 'KE', ANA: 'NH', JAL: 'JL', CPA: 'CX',
  SIA: 'SQ', QFA: 'QF', UAE: 'EK', ACA: 'AC', EVA: 'BR', AMX: 'AM',
}

// In-memory cache to avoid hammering OpenSky on every request
const cache = {}
const CACHE_TTL = 3 * 60 * 1000 // 3 minutes

function parseCallsign(callsign) {
  const cs = (callsign || '').trim()
  const match = cs.match(/^([A-Z]{3})(\d+\w*)$/)
  if (match) {
    const prefix = match[1]
    const number = match[2]
    const airline = AIRLINE_MAP[prefix] || prefix
    const iataPrefix = ICAO_TO_IATA[prefix] || prefix.slice(0, 2)
    return { airline, flight: `${iataPrefix}${number}`, isPrivate: false }
  }
  if (cs.startsWith('N')) {
    return { airline: 'PRIVATE', flight: cs, isPrivate: true }
  }
  return { airline: cs || 'UNKNOWN', flight: cs, isPrivate: !cs }
}

async function fetchOpenSky(icao, type) {
  const cacheKey = `${icao}-${type}`
  const cached = cache[cacheKey]
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }

  const now = Math.floor(Date.now() / 1000)
  const twoHoursAgo = now - (2 * 60 * 60)

  const endpoint = type === 'arrivals'
    ? `https://opensky-network.org/api/flights/arrival?airport=${icao}&begin=${twoHoursAgo}&end=${now}`
    : `https://opensky-network.org/api/flights/departure?airport=${icao}&begin=${twoHoursAgo}&end=${now}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    clearTimeout(timeout)

    if (res.status === 404) return []
    if (!res.ok) throw new Error(`OpenSky returned ${res.status}`)

    const data = await res.json()
    if (!Array.isArray(data)) return []

    // Cache the raw result
    cache[cacheKey] = { data, timestamp: Date.now() }
    return data
  } catch (err) {
    clearTimeout(timeout)
    // If we have stale cache, return it rather than failing
    if (cached) {
      console.warn('[Departures] OpenSky failed, serving stale cache:', err.message)
      return cached.data
    }
    throw err
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const airport = (searchParams.get('airport') || 'SFO').toUpperCase()
  const type = searchParams.get('type') || 'departures'
  const icao = IATA_TO_ICAO[airport] || `K${airport}`

  try {
    const data = await fetchOpenSky(icao, type)

    const flights = data
      .map(f => {
        const { airline, flight, isPrivate } = parseCallsign(f.callsign)
        if (isPrivate) return null

        const departureTime = f.firstSeen ? new Date(f.firstSeen * 1000) : null
        const lastSeen = f.lastSeen ? new Date(f.lastSeen * 1000) : null
        const timeSource = type === 'arrivals' ? lastSeen : departureTime

        const timeStr = timeSource
          ? timeSource.toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true,
              timeZone: 'America/Los_Angeles'
            }).replace(/\s?(AM|PM)/i, (_, m) => m[0].toLowerCase())
          : '--:--'

        const otherAirport = type === 'arrivals'
          ? (f.estDepartureAirport || '')
          : (f.estArrivalAirport || '')
        const iata = otherAirport.startsWith('K') ? otherAirport.slice(1) : otherAirport

        const nowDate = new Date()
        const flightAge = lastSeen ? (nowDate - lastSeen) / (1000 * 60) : 999
        let status = 'EN ROUTE'
        if (flightAge > 30) status = type === 'arrivals' ? 'ARRIVED' : 'DEPARTED'

        return {
          time: timeStr,
          city: iata || '---',
          dest: iata || '---',
          airline,
          flight,
          gate: '--',
          terminal: '',
          status,
          past: ['ARRIVED', 'DEPARTED'].includes(status),
        }
      })
      .filter(Boolean)

    // De-duplicate by flight number
    const seen = new Set()
    const unique = flights.filter(f => {
      if (seen.has(f.flight)) return false
      seen.add(f.flight)
      return true
    })

    unique.sort((a, b) => {
      if (a.past !== b.past) return a.past ? 1 : -1
      return a.time.localeCompare(b.time)
    })

    return NextResponse.json({ flights: unique.slice(0, 25), airport, type })
  } catch (err) {
    const message = err.name === 'AbortError'
      ? 'OpenSky API request timed out'
      : `Flight data unavailable: ${err.message}`
    console.error('[Departures API]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
