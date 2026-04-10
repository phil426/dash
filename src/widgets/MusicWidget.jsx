'use client'

import React from 'react'
import { signIn } from 'next-auth/react'
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react'
import useSpotify from '../hooks/useSpotify'

export default function MusicWidget() {
  const { session, currentTrack, isPlaying, togglePlay, next, previous } = useSpotify()

  // 1) Not logged in
  if (!session) {
    return (
      <div className="card" style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center'
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(29, 185, 84, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1DB954'
        }}>
          <Music size={24} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: 18, color: '#fff', marginBottom: 4 }}>Spotify Premium</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-muted)' }}>Connect to control playback</div>
        </div>
        <button 
          onClick={() => signIn('spotify')}
          style={{
            background: '#1DB954',
            color: '#000',
            border: 'none',
            borderRadius: 20,
            padding: '10px 24px',
            fontFamily: 'var(--font)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(29, 185, 84, 0.3)'
          }}>
          Connect Spotify
        </button>
      </div>
    )
  }

  // 2) Logged in but no active track playing
  if (!currentTrack) {
    return (
      <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-data)', color: 'var(--text-muted)', fontSize: 14 }}>
          Open Spotify on a device to start controlling playback.
        </p>
      </div>
    )
  }

  // 3) Active playback
  const imgUrl = currentTrack.album?.images?.[0]?.url || ''
  const artistName = currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
  const title = currentTrack.name || 'Unknown Track'

  return (
    <div className="card" style={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: 0
    }}>
      {/* Blurred background extracted from album art */}
      <div style={{
        position: 'absolute', inset: -20, zIndex: 0,
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(30px) brightness(0.4)',
        opacity: 0.8
      }} />

      {/* Main Content Overlay */}
      <div style={{ 
        position: 'relative', zIndex: 1, 
        padding: 24, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        
        {/* Top: Album Art + Meta */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {imgUrl ? (
            <img 
              src={imgUrl} 
              alt="Album cover" 
              style={{
                width: 72, height: 72, 
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.1)' }} />
          )}

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ 
              fontFamily: 'var(--font)', 
              fontWeight: 700, 
              fontSize: 20, 
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 4,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              {title}
            </div>
            <div style={{ 
              fontFamily: 'var(--font-data)', 
              fontSize: 14, 
              color: 'rgba(255,255,255,0.6)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {artistName}
            </div>
          </div>
        </div>

        {/* Bottom: Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 24,
          paddingTop: 16
        }}>
          <button 
            onClick={previous}
            style={{ 
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', 
              cursor: 'pointer', padding: 8 
            }}>
            <SkipBack size={28} fill="currentColor" />
          </button>

          <button 
            onClick={togglePlay}
            style={{ 
              width: 56, height: 56, borderRadius: '50%',
              background: '#fff', color: '#000', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
            }}>
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: 4 }} />}
          </button>

          <button 
            onClick={next}
            style={{ 
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', 
              cursor: 'pointer', padding: 8 
            }}>
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  )
}
