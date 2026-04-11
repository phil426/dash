import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

export default function useSpotify() {
  const { data: session } = useSession()
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progressMs, setProgressMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [playlists, setPlaylists] = useState([])
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatState, setRepeatState] = useState('off') // 'off', 'track', 'context'
  const [volume, setVolumeState] = useState(50)
  const [syncedLyrics, setSyncedLyrics] = useState([]) // [{time: ms, text: string}]
  const playlistsFetched = useRef(false)
  const lastTrackId = useRef(null)

  // A generic fetch wrapper for Spotify API
  const fetchSpotifyObj = useCallback(
    async (endpoint, method = 'GET', body = null) => {
      if (!session?.user?.accessToken) return null

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
          return null
        }

        // Handle errors gracefully
        if (res.status >= 400) {
          const err = await res.json().catch(() => null)
          console.warn('Spotify API error:', res.status, err)
          return null
        }
        
        return await res.json()
      } catch (err) {
        console.error('Spotify API error', err)
        return null
      }
    },
    [session]
  )

  const fetchCurrentlyPlaying = useCallback(async () => {
    const data = await fetchSpotifyObj('/me/player?additional_types=track,episode')
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

      // Fetch lyrics only when track changes
      if (data.item.id !== lastTrackId.current) {
        lastTrackId.current = data.item.id
        fetchLyrics(data.item)
      }
    } else {
      setIsPlaying(false)
      setCurrentTrack(null)
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

  const fetchPlaylists = useCallback(async () => {
    if (playlistsFetched.current) return
    const data = await fetchSpotifyObj('/me/playlists?limit=30')
    if (data && data.items) {
      setPlaylists(data.items.filter(Boolean))
      playlistsFetched.current = true
    }
  }, [fetchSpotifyObj])

  const fetchPlaylistTracks = useCallback(async (playlistId) => {
    // Use /items endpoint (not deprecated /tracks) with explicit market
    let data = await fetchSpotifyObj(`/playlists/${playlistId}/items?limit=50&additional_types=track&market=US`)
    console.log('Playlist items response:', data)
    
    if (data && data.items && data.items.length > 0) {
      return data.items.filter(item => item?.track).map(item => item.track)
    }

    // Fallback: fetch the full playlist object which embeds tracks
    console.log('Trying full playlist fallback...')
    data = await fetchSpotifyObj(`/playlists/${playlistId}?market=US`)
    console.log('Full playlist response:', data)
    
    if (data && data.tracks && data.tracks.items) {
      return data.tracks.items.filter(item => item?.track).map(item => item.track)
    }

    return []
  }, [fetchSpotifyObj])

  useEffect(() => {
    if (!session) return

    fetchCurrentlyPlaying()
    fetchPlaylists()

    const interval = setInterval(fetchCurrentlyPlaying, 1000)
    return () => clearInterval(interval)
  }, [session, fetchCurrentlyPlaying, fetchPlaylists])

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
    progressMs,
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
    session
  }
}
