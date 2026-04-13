import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

const rateLimitedUntil = { current: 0 }
const globalIsFetching = { current: false }

export default function useSpotify() {
  const { data: session } = useSession()
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progressMs, setProgressMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [playlists, setPlaylists] = useState([])
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatState, setRepeatState] = useState('off')
  const [volume, setVolumeState] = useState(50)
  const [syncedLyrics, setSyncedLyrics] = useState([])
  const [artistImage, setArtistImage] = useState(null)
  const playlistsFetched = useRef(false)
  const lastTrackId = useRef(null)
  // ── 2nd/3rd order sync: interpolation + drift correction ──
  const [interpolatedProgress, setInterpolatedProgress] = useState(0)
  const pollAnchor = useRef({ progress: 0, wallTime: 0, playing: false })

  const driftHistory = useRef([]) // recent drift samples for smoothing
  const driftOffset = useRef(0)   // smoothed correction in ms
  const rafId = useRef(null)
  const [apiError, setApiError] = useState(null)

  // A generic fetch wrapper for Spotify API
  const fetchSpotifyObj = useCallback(
    async (endpoint, method = 'GET', body = null) => {
      if (!session?.user?.accessToken) return null

      // Respect rate limit backoff
      if (Date.now() < rateLimitedUntil.current) {
        setApiError('Rate limited by Spotify. Please wait...')
        return null
      }

      try {
        const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : null,
        })
        
        // 204 No Content typically returned for playback commands
        if (res.status === 204) {
          setApiError(null)
          return null
        }

        // Handle rate limiting with backoff
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '30', 10)
          rateLimitedUntil.current = Date.now() + retryAfter * 1000
          setApiError(`Rate limited for ${retryAfter}s`)
          console.warn(`Spotify rate limited, backing off for ${retryAfter}s`)
          return null
        }

        // Handle errors gracefully
        if (res.status >= 400) {
          const err = await res.json().catch(() => null)
          setApiError(err?.error?.message || `API Error ${res.status}`)
          console.warn(`Spotify API error [${res.status}] ${endpoint}:`, err?.error?.message || err)
          return null
        }
        
        setApiError(null)
        return await res.json()
      } catch (err) {
        setApiError(err.message || 'Network error')
        console.error('Spotify API error', err)
        return null
      }
    },
    [session]
  )

  const fetchCurrentlyPlaying = useCallback(async () => {
    const data = await fetchSpotifyObj('/me/player?additional_types=track,episode')
    console.log('[Spotify Debug] /me/player response:', data)
    if (data && data.item) {
      setCurrentTrack(data.item)
      setIsPlaying(data.is_playing)
      setProgressMs(data.progress_ms)
      setDurationMs(data.item.duration_ms || 0)
      setIsShuffle(data.shuffle_state)
      setRepeatState(data.repeat_state)
      if (data.device) {
        setVolumeState(data.device.volume_percent)
      }

      // ── 2nd order: set the interpolation anchor ──
      const now = performance.now()
      const prevAnchor = pollAnchor.current

      // ── 3rd order: compute drift from last prediction ──
      if (prevAnchor.wallTime > 0 && prevAnchor.playing) {
        const elapsed = now - prevAnchor.wallTime
        const predicted = prevAnchor.progress + elapsed
        const actual = data.progress_ms
        const drift = actual - predicted // positive = we were behind, negative = ahead

        // Only count drift for same track, small drifts (not seeks)
        if (Math.abs(drift) < 3000 && data.item.id === lastTrackId.current) {
          driftHistory.current.push(drift)
          // Keep last 5 samples for smoothing
          if (driftHistory.current.length > 5) driftHistory.current.shift()
          // Weighted average: recent samples count more
          const weights = driftHistory.current.map((_, i) => i + 1)
          const totalWeight = weights.reduce((a, b) => a + b, 0)
          driftOffset.current = driftHistory.current.reduce((sum, d, i) => sum + d * weights[i], 0) / totalWeight
        } else {
          // Seek detected or track change — reset drift
          driftHistory.current = []
          driftOffset.current = 0
        }
      }

      pollAnchor.current = {
        progress: data.progress_ms + driftOffset.current,
        wallTime: now,
        playing: data.is_playing,
      }

      // Fetch lyrics + artist image only when track changes
      if (data.item.id !== lastTrackId.current) {
        lastTrackId.current = data.item.id
        driftHistory.current = []
        driftOffset.current = 0
        fetchLyrics(data.item)
        fetchArtistImage(data.item)
      }
    } else {
      setIsPlaying(false)
      setCurrentTrack(null)
      pollAnchor.current = { progress: 0, wallTime: 0, playing: false }
    }
  }, [fetchSpotifyObj])

  const fetchLyrics = async (track) => {
    setSyncedLyrics([])
    if (!track) return

    const artistName = track.artists?.[0]?.name || ''
    const trackName = track.name || ''
    const durationSec = Math.round((track.duration_ms || 0) / 1000)

    try {
      const res = await fetch(
        `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}&duration=${durationSec}`
      )
      if (!res.ok) return

      const data = await res.json()
      const lrc = data.syncedLyrics || data.plainLyrics
      if (!lrc) return

      if (data.syncedLyrics) {
        // Parse LRC format: [mm:ss.xx] text
        const lines = data.syncedLyrics.split('\n').map(line => {
          const match = line.match(/^\[(\d+):(\d+\.?\d*)\]\s*(.*)$/)
          if (!match) return null
          const minutes = parseInt(match[1], 10)
          const seconds = parseFloat(match[2])
          return {
            time: (minutes * 60 + seconds) * 1000,
            text: match[3] || ''
          }
        }).filter(Boolean)
        setSyncedLyrics(lines)
      } else if (data.plainLyrics) {
        // Fallback: unsynced lyrics, just show all lines
        const lines = data.plainLyrics.split('\n').map((text, i) => ({
          time: -1, // unsynced
          text
        }))
        setSyncedLyrics(lines)
      }
    } catch (err) {
      console.warn('LRCLIB lyrics fetch failed', err)
    }
  }

  const fetchArtistImage = async (track) => {
    setArtistImage(null)
    const artistId = track?.artists?.[0]?.id
    if (!artistId) return
    try {
      const data = await fetchSpotifyObj(`/artists/${artistId}`)
      if (data?.images?.[0]?.url) {
        setArtistImage(data.images[0].url)
      }
    } catch (err) {
      console.warn('Artist image fetch failed', err)
    }
  }

  const fetchPlaylists = useCallback(async () => {
    if (playlistsFetched.current) return
    const data = await fetchSpotifyObj('/me/playlists?limit=30')
    if (data && data.items) {
      setPlaylists(data.items.filter(Boolean))
      playlistsFetched.current = true
    }
  }, [fetchSpotifyObj])

  const fetchPlaylistTracks = useCallback(async (playlistId) => {
    // Extract tracks from playlist item wrappers.
    // Handles both old `track` field and new `item` field (Feb 2026 API change).
    const extractTracks = (items) => {
      if (!items || !Array.isArray(items)) return []
      return items
        .map(wrapper => {
          const t = wrapper?.track || wrapper?.item || wrapper
          if (!t || !t.name) return null
          if (t.type && t.type !== 'track') return null
          return t
        })
        .filter(Boolean)
    }

    // Attempt 1: Full playlist object — works for ALL playlists (owned, followed, public)
    let data = await fetchSpotifyObj(`/playlists/${playlistId}?market=from_token`)
    console.log('[Spotify] full playlist response:', data ? `total=${data?.tracks?.total}, items=${data?.tracks?.items?.length}` : 'null')
    let tracks = extractTracks(data?.tracks?.items)
    if (tracks.length > 0) {
      console.log(`[Spotify] ✓ Got ${tracks.length} tracks via full playlist object`)
      return tracks
    }

    // Attempt 2: /items endpoint — fallback for owned/collaborative playlists
    data = await fetchSpotifyObj(`/playlists/${playlistId}/items?limit=50&market=from_token&additional_types=track`)
    console.log('[Spotify] /items response:', data ? `total=${data?.total}, items=${data?.items?.length}` : 'null')
    tracks = extractTracks(data?.items)
    if (tracks.length > 0) {
      console.log(`[Spotify] ✓ Got ${tracks.length} tracks via /items endpoint`)
      return tracks
    }

    console.warn('[Spotify] All playlist track fetch attempts returned 0 tracks for', playlistId)
    return []
  }, [fetchSpotifyObj])
  const pollInterval = useRef(null)

  const throttledFetch = useCallback(async () => {
    if (globalIsFetching.current) return
    globalIsFetching.current = true
    try {
      await fetchCurrentlyPlaying()
    } finally {
      globalIsFetching.current = false
    }
  }, [fetchCurrentlyPlaying])

  useEffect(() => {
    if (!session) return

    throttledFetch()
    fetchPlaylists()

    pollInterval.current = setInterval(throttledFetch, 1000)
    return () => clearInterval(pollInterval.current)
  }, [session, throttledFetch, fetchPlaylists])

  // ── 2nd order: rAF-driven interpolation loop ──
  useEffect(() => {
    const tick = () => {
      const anchor = pollAnchor.current
      if (anchor.wallTime > 0) {
        const elapsed = anchor.playing ? (performance.now() - anchor.wallTime) : 0
        setInterpolatedProgress(Math.max(0, anchor.progress + elapsed))
      }
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  const play = (contextUri = null, offsetUri = null) => {
    const body = {}
    if (contextUri) body.context_uri = contextUri
    if (offsetUri) body.offset = { uri: offsetUri }
    return fetchSpotifyObj('/me/player/play', 'PUT', Object.keys(body).length ? body : null)
  }
  const pause = () => fetchSpotifyObj('/me/player/pause', 'PUT')
  const next = () => fetchSpotifyObj('/me/player/next', 'POST')
  const previous = () => fetchSpotifyObj('/me/player/previous', 'POST')
  
  const toggleShuffle = () => {
    fetchSpotifyObj(`/me/player/shuffle?state=${!isShuffle}`, 'PUT')
    setIsShuffle(!isShuffle)
  }

  const toggleRepeat = () => {
    const nextState = repeatState === 'off' ? 'context' : repeatState === 'context' ? 'track' : 'off'
    fetchSpotifyObj(`/me/player/repeat?state=${nextState}`, 'PUT')
    setRepeatState(nextState)
  }

  const setVolume = (percent) => {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)))
    fetchSpotifyObj(`/me/player/volume?volume_percent=${clamped}`, 'PUT')
    setVolumeState(clamped)
  }
  
  const togglePlay = () => {
    if (isPlaying) pause()
    else play()
    setIsPlaying(!isPlaying)
  }

  return {
    currentTrack,
    isPlaying,
    progressMs: interpolatedProgress, // use interpolated for display + lyrics
    rawProgressMs: progressMs,         // raw polled value if needed
    durationMs,
    playlists,
    isShuffle,
    repeatState,
    volume,
    play,
    pause,
    next,
    previous,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    fetchPlaylistTracks,
    syncedLyrics,
    artistImage,
    session,
    apiError
  }
}
