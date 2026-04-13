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
  UAL: 'UNITED',
  AAL: 'AMERICAN',
  DAL: 'DELTA',
  SWA: 'SOUTHWEST',
  ASA: 'ALASKA',
  JBU: 'JETBLUE',
  NKS: 'SPIRIT',
  FFT: 'FRONTIER',
  HAL: 'HAWAIIAN',
  SKW: 'SKYWEST',
  QXE: 'HORIZON AIR',
  RPA: 'REPUBLIC',
  ENY: 'ENVOY AIR',
  PDT: 'PIEDMONT',
  CPZ: 'COMPASS',
  VOI: 'VOLARIS',
  AMX: 'AEROMEXICO',
  ACA: 'AIR CANADA',
  BAW: 'BRITISH AIRWAYS',
  DLH: 'LUFTHANSA',
  AFR: 'AIR FRANCE',
  KAL: 'KOREAN AIR',
  ANA: 'ANA',
  JAL: 'JAPAN AIRLINES',
  CPA: 'CATHAY PACIFIC',
  SIA: 'SINGAPORE AIRLINES',
  QFA: 'QANTAS',
  UAE: 'EMIRATES',
  THY: 'TURKISH AIRLINES',
  CSN: 'CHINA SOUTHERN',
  CCA: 'AIR CHINA',
  EVA: 'EVA AIR',
  LXJ: 'FLEXJET',
  EJA: 'NETJETS',
  TCF: 'XOJET',
}

function parseCallsign(callsign) {
  const cs = (callsign || '').trim()
  // Extract airline prefix (first 3 letters) and flight number
  const match = cs.match(/^([A-Z]{3})(\d+\w*)$/)
  if (match) {
    const prefix = match[1]
    const number = match[2]
    const airline = AIRLINE_MAP[prefix] || prefix
    // Convert ICAO callsign to IATA-style flight number
    const iataPrefix = prefix === 'UAL' ? 'UA' : prefix === 'AAL' ? 'AA' : prefix === 'DAL' ? 'DL'
      : prefix === 'SWA' ? 'WN' : prefix === 'ASA' ? 'AS' : prefix === 'JBU' ? 'B6'
      : prefix === 'NKS' ? 'NK' : prefix === 'FFT' ? 'F9' : prefix === 'HAL' ? 'HA'
      : prefix === 'SKW' ? 'OO' : prefix === 'QXE' ? 'QX' : prefix === 'BAW' ? 'BA'
      : prefix === 'DLH' ? 'LH' : prefix === 'AFR' ? 'AF' : prefix === 'KAL' ? 'KE'
      : prefix === 'ANA' ? 'NH' : prefix === 'JAL' ? 'JL' : prefix === 'CPA' ? 'CX'
      : prefix === 'SIA' ? 'SQ' : prefix === 'QFA' ? 'QF' : prefix === 'UAE' ? 'EK'
      : prefix === 'ACA' ? 'AC' : prefix === 'EVA' ? 'BR' : prefix === 'AMX' ? 'AM'
      : prefix.slice(0, 2)
    return { airline, flight: `${iataPrefix}${number}`, isPrivate: false }
  }
  // N-number = private/charter
  if (cs.startsWith('N')) {
    return { airline: 'PRIVATE', flight: cs, isPrivate: true }
  }
  return { airline: cs || 'UNKNOWN', flight: cs, isPrivate: false }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const airport = (searchParams.get('airport') || 'SFO').toUpperCase()
  const type = searchParams.get('type') || 'departures'

  const icao = IATA_TO_ICAO[airport] || `K${airport}`

  // OpenSky uses unix timestamps — get flights from last 2 hours
  const now = Math.floor(Date.now() / 1000)
  const twoHoursAgo = now - (2 * 60 * 60)

  const endpoint = type === 'arrivals'
    ? `https://opensky-network.org/api/flights/arrival?airport=${icao}&begin=${twoHoursAgo}&end=${now}`
    : `https://opensky-network.org/api/flights/departure?airport=${icao}&begin=${twoHoursAgo}&end=${now}`

  try {
    const res = await fetch(endpoint, { next: { revalidate: 120 } })

    if (!res.ok) {
      // OpenSky returns 404 if no flights found, 503 if overloaded
      if (res.status === 404) {
        return NextResponse.json({ flights: [], airport, type })
      }
      return NextResponse.json({ error: `OpenSky API returned ${res.status}` }, { status: 500 })
    }

    const data = await res.json()

    if (!Array.isArray(data)) {
      return NextResponse.json({ flights: [], airport, type })
    }

    const flights = data
      .map(f => {
        const { airline, flight, isPrivate } = parseCallsign(f.callsign)

        // Skip private/charter flights (N-numbers)
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

        // Determine destination/origin airport
        const otherAirport = type === 'arrivals'
          ? (f.estDepartureAirport || '')
          : (f.estArrivalAirport || '')

        // Convert ICAO to display (remove K prefix for US airports)
        const iata = otherAirport.startsWith('K') ? otherAirport.slice(1) : otherAirport

        // Determine status
        const nowDate = new Date()
        const flightAge = lastSeen ? (nowDate - lastSeen) / (1000 * 60) : 999
        let status = 'EN ROUTE'
        if (flightAge > 30) {
          status = type === 'arrivals' ? 'ARRIVED' : 'DEPARTED'
        } else if (flightAge > 5) {
          status = 'EN ROUTE'
        }

        const isPast = ['ARRIVED', 'DEPARTED'].includes(status)

        return {
          time: timeStr,
          city: iata || '---',
          dest: iata || '---',
          airline,
          flight,
          gate: '--',
          terminal: '',
          status,
          past: isPast,
        }
      })
      .filter(Boolean)

    // De-duplicate by flight number (OpenSky sometimes returns duplicates)
    const seen = new Set()
    const unique = flights.filter(f => {
      if (seen.has(f.flight)) return false
      seen.add(f.flight)
      return true
    })

    // Sort: active flights first, then by time
    unique.sort((a, b) => {
      if (a.past !== b.past) return a.past ? 1 : -1
      return a.time.localeCompare(b.time)
    })

    return NextResponse.json({ flights: unique.slice(0, 25), airport, type })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
