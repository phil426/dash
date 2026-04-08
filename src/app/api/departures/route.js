import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const airport = searchParams.get('airport') || 'SFO'
  const type = searchParams.get('type') || 'departures' // 'departures' or 'arrivals'
  const apiKey = process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY

  if (!apiKey || apiKey === 'your_access_key_here') {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  const param = type === 'arrivals' ? 'arr_iata' : 'dep_iata'

  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&${param}=${airport}&limit=20`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'API error' }, { status: 500 })
    }

    const flights = (data.data || []).map(flight => {
      const dep = flight.departure
      const arr = flight.arrival

      // For departures: show departure time + arrival airport
      // For arrivals: show arrival time + departure airport
      const timeSource = type === 'arrivals' ? arr : dep
      const citySource = type === 'arrivals' ? dep : arr

      const schedTime = timeSource?.scheduled ? new Date(timeSource.scheduled) : null
      const timeStr = schedTime
        ? schedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' })
            .replace(/\s?(AM|PM)/i, (_, m) => m[0].toLowerCase())
        : '--:--'

      const delay = timeSource?.delay
      const now = new Date()
      const isTimePast = schedTime && schedTime < now

      // Determine status with context awareness
      let status = 'ON TIME'
      if (delay && delay > 15) status = 'DELAYED'

      // API-reported statuses take priority
      if (flight.flight_status === 'active') status = 'EN ROUTE'
      else if (flight.flight_status === 'landed') status = 'LANDED'
      else if (flight.flight_status === 'cancelled') status = 'CANCELLED'
      // If scheduled time is past but API still says scheduled/unknown, infer status
      else if (isTimePast) {
        status = type === 'arrivals' ? 'ARRIVED' : 'DEPARTED'
      }

      // Staleness safeguard: if API says EN ROUTE but scheduled time is 2+ hours past,
      // the data is likely stale (common with codeshares) — override status
      const hoursLate = schedTime ? (now - schedTime) / (1000 * 60 * 60) : 0
      if (status === 'EN ROUTE' && hoursLate > 2) {
        status = type === 'arrivals' ? 'ARRIVED' : 'DEPARTED'
      }

      // Extract city from airport name (e.g. "Denver International" → "DENVER")
      let cityName = 'UNKNOWN'
      const airportName = citySource?.airport
      if (airportName) {
        // Remove common suffixes like "International", "Airport", etc.
        cityName = airportName
          .replace(/\s*(International|Intl|Airport|Regional|Metropolitan|Municipal|Memorial|Executive|County|Field)\.?/gi, '')
          .trim()
          .toUpperCase()
      }
      // Fallback to IATA code
      if (!cityName || cityName === 'UNKNOWN' || cityName === '') {
        cityName = citySource?.iata || 'UNKNOWN'
      }

      const isPast = ['LANDED', 'CANCELLED', 'DEPARTED', 'ARRIVED'].includes(status) || isTimePast

      return {
        time: timeStr,
        city: cityName,
        dest: citySource?.iata || '---',
        airline: (flight.airline?.name || '').toUpperCase(),
        flight: flight.flight?.iata || `${flight.airline?.iata || ''} ${flight.flight?.number || ''}`.trim(),
        gate: (type === 'arrivals' ? arr?.gate : dep?.gate) || '--',
        terminal: (type === 'arrivals' ? arr?.terminal : dep?.terminal) || '',
        status,
        past: isPast,
      }
    })

    // Sort: upcoming flights first (by time), past flights at the bottom
    flights.sort((a, b) => {
      if (a.past !== b.past) return a.past ? 1 : -1
      return a.time.localeCompare(b.time)
    })

    return NextResponse.json({ flights, airport, type })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
