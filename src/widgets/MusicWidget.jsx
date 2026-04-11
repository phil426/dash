'use client'

import React, { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { Play, Pause, SkipBack, SkipForward, Music, LogOut, Shuffle, Repeat } from 'lucide-react'
import useSpotify from '../hooks/useSpotify'

export default function MusicWidget() {
  const { 
    session, currentTrack, isPlaying, togglePlay, next, previous, 
    playlists, isShuffle, repeatState, toggleShuffle, toggleRepeat, play,
  } = useSpotify()

  const [activeTab, setActiveTab] = useState('now-playing') // 'now-playing' | 'playlists'

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
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-muted)' }}>Connect to control playback & access library</div>
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

  // Define track properties safely
  const isPodcast = currentTrack?.type === 'episode'
  const imgUrl = isPodcast 
    ? currentTrack?.show?.images?.[0]?.url || '' 
    : currentTrack?.album?.images?.[0]?.url || ''
  
  const artistName = isPodcast
    ? currentTrack?.show?.publisher || 'Unknown Publisher'
    : currentTrack?.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
    
  const title = currentTrack?.name || (isPodcast ? 'Unknown Episode' : 'Unknown Track')

  return (
    <div className="card" style={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: 0
    }}>
      {/* Blurred background extracted from album art */}
      {imgUrl && (
        <div style={{
          position: 'absolute', inset: -20, zIndex: 0,
          backgroundImage: `url(${imgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(30px) brightness(0.4)',
          opacity: 0.8
        }} />
      )}

      {/* Main Content Overlay */}
      <div style={{ 
        position: 'relative', zIndex: 1, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Header / Segmented Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '16px 24px 0 24px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 20,
            padding: 4,
            width: '100%',
            maxWidth: 240,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <button 
              onClick={() => setActiveTab('now-playing')}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 16,
                border: 'none',
                background: activeTab === 'now-playing' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'now-playing' ? '#fff' : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font)',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>Now Playing</button>
            <button 
              onClick={() => setActiveTab('playlists')}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 16,
                border: 'none',
                background: activeTab === 'playlists' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'playlists' ? '#fff' : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font)',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>Library</button>
          </div>

          <button 
            onClick={() => signOut()}
            style={{ position: 'absolute', right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 8 }}>
            <LogOut size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {activeTab === 'playlists' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {playlists.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: 14 }}>
                  No playlists found or loading...
                </div>
              ) : (
                playlists.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      play(p.uri)
                      setActiveTab('now-playing')
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.02)',
                      padding: 12,
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} alt={p.name} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(255,255,255,0.1)' }} />
                    )}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'var(--font)', fontWeight: 600, color: '#fff', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{p.tracks?.total || 0} tracks</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'now-playing' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 24 }}>
              {!currentTrack ? (
                <div style={{ margin: 'auto', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-data)', color: 'var(--text-muted)', fontSize: 14 }}>
                    Open Spotify on a device to start controlling playback.
                  </p>
                </div>
              ) : (
                <>
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
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    paddingTop: 24,
                    paddingBottom: 8
                  }}>
                    {/* Shuffle */}
                    <button 
                      onClick={toggleShuffle}
                      style={{ background: 'none', border: 'none', color: isShuffle ? '#1DB954' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 8 }}>
                      <Shuffle size={20} />
                    </button>

                    {/* Main Transports */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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

                    {/* Repeat */}
                    <button 
                      onClick={toggleRepeat}
                      style={{ background: 'none', border: 'none', color: repeatState !== 'off' ? '#1DB954' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 8, position: 'relative' }}>
                      <Repeat size={20} />
                      {repeatState === 'track' && (
                        <span style={{ position: 'absolute', top: 4, right: 2, background: '#1DB954', color: '#000', fontSize: 9, fontWeight: 800, borderRadius: '50%', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
