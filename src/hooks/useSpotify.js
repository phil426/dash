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
  const playlistsFetched = useRef(false)

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
    } else {
      setIsPlaying(false)
      setCurrentTrack(null)
    }
  }, [fetchSpotifyObj])

  const fetchPlaylists = useCallback(async () => {
    if (playlistsFetched.current) return
    const data = await fetchSpotifyObj('/me/playlists?limit=30')
    if (data && data.items) {
      setPlaylists(data.items.filter(Boolean))
      playlistsFetched.current = true
    }
  }, [fetchSpotifyObj])

  useEffect(() => {
    if (!session) return

    fetchCurrentlyPlaying()
    fetchPlaylists()

    const interval = setInterval(fetchCurrentlyPlaying, 2000)
    return () => clearInterval(interval)
  }, [session, fetchCurrentlyPlaying, fetchPlaylists])

  const play = (contextUri = null) => {
    const body = contextUri ? { context_uri: contextUri } : null
    return fetchSpotifyObj('/me/player/play', 'PUT', body)
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
    session
  }
}
