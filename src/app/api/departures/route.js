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
        ? schedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }).toUpperCase()
        : '--:--'

      const delay = timeSource?.delay
      let status = 'ON TIME'
      if (delay && delay > 15) status = 'DELAYED'
      if (flight.flight_status === 'active') status = 'EN ROUTE'
      if (flight.flight_status === 'landed') status = 'LANDED'
      if (flight.flight_status === 'cancelled') status = 'CANCELLED'

      // Extract city from timezone (e.g. "America/Los_Angeles" → "Los Angeles")
      let cityName = 'UNKNOWN'
      const tz = citySource?.timezone
      if (tz) {
        cityName = tz.split('/').pop().replace(/_/g, ' ').toUpperCase()
      }
      // Fallback to IATA code if timezone parsing gives nothing useful
      if (!cityName || cityName === 'UNKNOWN') {
        cityName = citySource?.iata || 'UNKNOWN'
      }

      return {
        time: timeStr,
        city: cityName,
        dest: citySource?.iata || '---',
        airline: (flight.airline?.name || '').toUpperCase(),
        flight: flight.flight?.iata || `${flight.airline?.iata || ''} ${flight.flight?.number || ''}`.trim(),
        gate: (type === 'arrivals' ? arr?.gate : dep?.gate) || '--',
        terminal: (type === 'arrivals' ? arr?.terminal : dep?.terminal) || '',
        status,
      }
    })

    flights.sort((a, b) => a.time.localeCompare(b.time))

    return NextResponse.json({ flights, airport, type })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
