import { useState, useEffect } from 'react'

const REGIONS = {
  'San Francisco': [
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
    { name: 'Daly City',     lat: 37.6879, lon: -122.4702 },
  ],
  'North Bay': [
    { name: 'San Rafael',  lat: 37.9735, lon: -122.5311 },
    { name: 'Novato',      lat: 38.1074, lon: -122.5697 },
    { name: 'Petaluma',    lat: 38.2324, lon: -122.6367 },
    { name: 'Santa Rosa',  lat: 38.4404, lon: -122.7141 },
  ],
  'East Bay': [
    { name: 'Oakland',      lat: 37.8044, lon: -122.2712 },
    { name: 'Berkeley',     lat: 37.8716, lon: -122.2727 },
    { name: 'Walnut Creek', lat: 37.9101, lon: -122.0652 },
    { name: 'Fremont',      lat: 37.5485, lon: -121.9886 },
  ],
  'Peninsula': [
    { name: 'San Mateo',     lat: 37.5630, lon: -122.3255 },
    { name: 'Redwood City',  lat: 37.4852, lon: -122.2364 },
    { name: 'Palo Alto',     lat: 37.4419, lon: -122.1430 },
    { name: 'Mountain View', lat: 37.3861, lon: -122.0839 },
  ],
  'South Bay': [
    { name: 'San Jose',     lat: 37.3382, lon: -121.8863 },
    { name: 'Santa Clara',  lat: 37.3541, lon: -121.9552 },
    { name: 'Sunnyvale',    lat: 37.3688, lon: -122.0363 },
    { name: 'Cupertino',    lat: 37.3230, lon: -122.0322 },
  ],
}

const ALL_CITIES = Object.values(REGIONS).flat()

const weatherIcons = { clear: '☀️', clouds: '☁️', fog: '🌫️', rain: '🌧️', partly: '⛅' }

function codeToIcon(code) {
  if (code <= 1) return weatherIcons.clear
  if (code <= 3) return weatherIcons.partly
  if (code >= 45 && code <= 48) return weatherIcons.fog
  if (code >= 51 && code <= 67) return weatherIcons.rain
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80) return weatherIcons.rain
  return weatherIcons.clouds
}

function codeToDesc(code) {
  if (code <= 1) return 'Clear Sky'
  if (code <= 3) return 'Partly Cloudy'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 67) return 'Rainy'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80) return 'Showers'
  return 'Cloudy'
}

export default function WeatherWidget() {
  const [region, setRegion] = useState('San Francisco')
  const [selectedCity, setSelectedCity] = useState(0)
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Batch fetch ALL cities in one call
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const lats = ALL_CITIES.map(c => c.lat).join(',')
      const lons = ALL_CITIES.map(c => c.lon).join(',')
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weathercode&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America/Los_Angeles&forecast_days=1`
        )
        const data = await res.json()
        // data is an array when multiple locations
        setWeatherData(Array.isArray(data) ? data : [data])
      } catch (e) {
        console.error('Weather batch fetch failed:', e)
      }
      setLoading(false)
    }
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Map city to its global index in ALL_CITIES
  function getCityGlobalIndex(cityObj) {
    return ALL_CITIES.findIndex(c => c.name === cityObj.name)
  }

  const regionCities = REGIONS[region]
  const activeCityObj = regionCities[selectedCity] || regionCities[0]
  const globalIdx = getCityGlobalIndex(activeCityObj)
  const cityWeather = weatherData?.[globalIdx]

  const currentHour = new Date().getHours()

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-label">Bay Area Weather</span>
        <span className="card-badge live">Live</span>
      </div>

      {/* Region Tabs */}
      <div className="tab-bar">
        {Object.keys(REGIONS).map(r => (
          <button
            key={r}
            className={`tab-btn ${region === r ? 'active' : ''}`}
            onClick={() => { setRegion(r); setSelectedCity(0) }}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading forecast...</div>
      ) : cityWeather ? (
        <>
          {/* Current conditions for selected city */}
          <div className="weather-current">
            <div>
              <div className="weather-temp">{Math.round(cityWeather.current.temperature_2m)}°</div>
              <div className="weather-desc">{codeToDesc(cityWeather.current.weathercode)}</div>
            </div>
            <div className="weather-icon-large">{codeToIcon(cityWeather.current.weathercode)}</div>
          </div>

          {/* City pills within region */}
          <div className="city-pills">
            {regionCities.map((city, i) => {
              const idx = getCityGlobalIndex(city)
              const temp = weatherData?.[idx]?.current?.temperature_2m
              return (
                <button
                  key={city.name}
                  className={`city-pill ${selectedCity === i ? 'active' : ''}`}
                  onClick={() => setSelectedCity(i)}
                >
                  {city.name} {temp != null ? `${Math.round(temp)}°` : ''}
                </button>
              )
            })}
          </div>

          {/* Hourly forecast */}
          <div className="weather-hourly" style={{ flex: 1 }}>
            {(() => {
              const hours = []
              for (let i = currentHour; i < Math.min(currentHour + 8, 24); i++) {
                hours.push({
                  hour: i,
                  temp: Math.round(cityWeather.hourly.temperature_2m[i]),
                  code: cityWeather.hourly.weathercode[i],
                  isNow: i === currentHour,
                })
              }
              return hours.map((h, i) => (
                <div key={i} className={`weather-hour ${h.isNow ? 'now' : ''}`}>
                  <span className="weather-hour-time">
                    {h.isNow ? 'Now' : `${h.hour % 12 || 12}${h.hour >= 12 ? 'p' : 'a'}`}
                  </span>
                  <span className="weather-hour-icon">{codeToIcon(h.code)}</span>
                  <span className="weather-hour-temp">{h.temp}°</span>
                </div>
              ))
            })()}
          </div>

          <div className="weather-location">📍 {activeCityObj.name}, CA</div>
        </>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data for this location</div>
      )}
    </div>
  )
}
