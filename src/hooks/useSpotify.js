import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export default function useSpotify() {
  const { data: session } = useSession()
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progressMs, setProgressMs] = useState(0)

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
        if (res.status === 204 || res.status > 400) {
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
    // /me/player gives broader context, but currently-playing is usually faster for simple display
    const data = await fetchSpotifyObj('/me/player/currently-playing')
    if (data && data.item) {
      setCurrentTrack(data.item)
      setIsPlaying(data.is_playing)
      setProgressMs(data.progress_ms)
    } else {
      // Nothing is playing or private session
      setIsPlaying(false)
    }
  }, [fetchSpotifyObj])

  useEffect(() => {
    if (!session) return

    // Initial fetch
    fetchCurrentlyPlaying()

    // Poll every 1.5s to keep UI somewhat in sync
    const interval = setInterval(fetchCurrentlyPlaying, 1500)
    return () => clearInterval(interval)
  }, [session, fetchCurrentlyPlaying])

  const play = () => fetchSpotifyObj('/me/player/play', 'PUT')
  const pause = () => fetchSpotifyObj('/me/player/pause', 'PUT')
  const next = () => fetchSpotifyObj('/me/player/next', 'POST')
  const previous = () => fetchSpotifyObj('/me/player/previous', 'POST')
  
  const togglePlay = () => {
    if (isPlaying) pause()
    else play()
    // Optimistic UI update
    setIsPlaying(!isPlaying)
  }

  return {
    currentTrack,
    isPlaying,
    progressMs,
    play,
    pause,
    next,
    previous,
    togglePlay,
    session
  }
}
