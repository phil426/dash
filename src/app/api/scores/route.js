import { NextResponse } from 'next/server'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const LEAGUES = [
  { key: 'nba',  path: 'basketball/nba/scoreboard',  emoji: '🏀', label: 'NBA' },
  { key: 'mlb',  path: 'baseball/mlb/scoreboard',    emoji: '⚾', label: 'MLB' },
  { key: 'nhl',  path: 'hockey/nhl/scoreboard',      emoji: '🏒', label: 'NHL' },
  { key: 'golf', path: 'golf/pga/scoreboard',        emoji: '⛳', label: 'PGA' },
]

function parseTeamGame(event) {
  const comp = event.competitions?.[0]
  if (!comp) return null

  const home = comp.competitors?.find(c => c.homeAway === 'home')
  const away = comp.competitors?.find(c => c.homeAway === 'away')
  if (!home || !away) return null

  const status = comp.status || event.status
  const state = status?.type?.state // 'pre', 'in', 'post'
  const detail = status?.type?.shortDetail || ''

  return {
    away: away.team?.abbreviation || '???',
    awayScore: away.score || '0',
    home: home.team?.abbreviation || '???',
    homeScore: home.score || '0',
    state,
    detail,
  }
}

function parseGolf(event) {
  const comp = event.competitions?.[0]
  if (!comp) return []

  const eventName = event.shortName || event.name || 'PGA Event'
  const competitors = (comp.competitors || []).slice(0, 10) // top 10

  return competitors.map(c => ({
    name: c.athlete?.shortName || c.athlete?.displayName || '???',
    score: c.score || 'E',
    pos: c.order || 0,
  }))
}

export async function GET() {
  const results = {}

  await Promise.all(
    LEAGUES.map(async (league) => {
      try {
        const res = await fetch(`${ESPN_BASE}/${league.path}`, {
          next: { revalidate: 120 },
          headers: { 'User-Agent': 'Dash/1.0' },
        })
        const data = await res.json()

        if (league.key === 'golf') {
          const event = data.events?.[0]
          if (event) {
            results[league.key] = {
              emoji: league.emoji,
              label: league.label,
              eventName: event.shortName || event.name,
              players: parseGolf(event),
            }
          }
        } else {
          const games = (data.events || [])
            .map(parseTeamGame)
            .filter(Boolean)

          if (games.length > 0) {
            results[league.key] = {
              emoji: league.emoji,
              label: league.label,
              games,
            }
          }
        }
      } catch (err) {
        // Silently skip failed leagues
        console.error(`ESPN ${league.key} fetch failed:`, err.message)
      }
    })
  )

  return NextResponse.json(results)
}
