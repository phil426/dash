# GetPhily Passenger Dashboard

A production-grade, full-screen Next.js dashboard mounted in the backseat of an Uber Premier vehicle. This interactive display provides real-time information and ambient media controls tailored specifically to the current ride. 

## Features
- **Spotify Music Controls**: Fully integrated authenticated playback controls, featuring real-time synchronized lyrics (via LRCLIB) and synced album art.
- **Live Flight Tracker**: SFO, OAK and STS departure info tracking via AviationStack with realtime gate and delay updates.
- **Weather / Conditions**: Current location GPS weather via Open-Meteo API.
- **Glassmorphism Design**: High-fidelity modern UI styling heavily optimized for landscape tablet displays with customized themes (Prius, Midnight Blue, Lavender, etc).

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **State Management**: React Hooks (no Redux)
- **Deployment**: Custom auto-deploy pipeline to Hostinger VPS
- **Authentication**: NextAuth.js (Spotify Provider)
- **Map Subsystem**: React-Leaflet w/ Protomaps (OSM)
- **Styling**: Vanilla CSS custom properties targeting high-DPI displays

## Architecture
The application runs entirely client-side once hydration completes, utilizing an aggressively optimized polling hook architecture (`useSpotify.js`) to limit 429 penalties. 

## Development Settings
```bash
# Clone the repository
git clone https://github.com/phil426/gp-backseat-dash.git
cd gp-backseat-dash

# Install dependencies
npm ci

# Start the local development server
npm run dev
```

See `AGENTS.md` for specific rules regarding automated contributions and deployments.
