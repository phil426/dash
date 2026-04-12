# Dash — Project Rules for AI Agents

## Critical: Do NOT Replace Real Data with Mock Data

This is a **production dashboard** deployed at `https://getphily.io`. All widgets use **live, real data sources**. When editing any widget or component:

1. **NEVER replace dynamic/API-driven data with hardcoded or mock data.**
2. **NEVER overwrite a widget file entirely** — always make targeted edits to the specific lines you need to change.
3. Before editing a widget, **read the entire file first** to understand its data flow.
4. If a widget has a fallback to mock/generated data (for error handling), **do not remove the real data fetch** — only modify the UI/presentation layer.

### Widget Data Sources (DO NOT TOUCH)

| Widget | Data Source | Notes |
|--------|------------|-------|
| `DeparturesWidget.jsx` | `/api/departures` → AviationStack API | Real-time flight data for SFO/OAK/STS. Has mock fallback on API error — this is intentional. |
| `MusicWidget.jsx` | Spotify Web API via `useSpotify.js` hook | OAuth-authenticated. Playlists, playback, lyrics (LRCLIB). |
| `WeatherWidget.jsx` | Open-Meteo API | Real-time weather for current GPS location. |
| `MapWidget.jsx` | Leaflet + Protomaps + Geolocation API | Real-time GPS position and speed. |
| `StocksWidget.jsx` | Financial API | Live market data. |
| `SurveyWidget.jsx` | Local state | Passenger feedback form. |
| `CabinWidget.jsx` | Local state | Cabin comfort preferences (speed, temp, volume, conversation). |

### Files That Should NEVER Be Overwritten Whole

- `src/hooks/useSpotify.js` — Contains drift correction, lyrics sync, and playlist fetching logic
- `src/widgets/DeparturesWidget.jsx` — Live flight data with API integration
- `src/components/Dashboard.jsx` — Main layout and tab routing
- `src/app/api/departures/route.js` — Server-side flight API proxy
- `src/app/api/auth/[...nextauth]/route.js` — Spotify OAuth configuration

## Deployment

- **Live site**: `https://getphily.io` (Hostinger)
- **Deploy command**: `git push hostinger main:master --force`
- See `.agents/workflows/deploy-dash.md` for full deploy steps
- `NEXTAUTH_URL` is set to `https://getphily.io` (production only)
- Spotify credentials are set in production environment variables, NOT in `.env.local`

## Architecture

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS with CSS custom properties (no Tailwind)
- **State**: React hooks, no external state library
- **Fonts**: `var(--font)` = display font, `var(--font-data)` = monospace/data font

## Code Style

- All widget components are in `src/widgets/`
- Shared hooks in `src/hooks/`
- API routes in `src/app/api/`
- Use inline styles for widget-specific styling (matches existing pattern)
- Use CSS classes from `globals.css` for shared styles
