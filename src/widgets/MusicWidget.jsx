'use client'

import React, { useState, useRef, useEffect } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { Play, Pause, SkipBack, SkipForward, Music, LogOut, Shuffle, Repeat, Volume2, Repeat1, ChevronLeft } from 'lucide-react'
import useSpotify from '../hooks/useSpotify'

function formatMs(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function MusicWidget() {
  const { 
    session, currentTrack, isPlaying, togglePlay, next, previous, 
    playlists, isShuffle, repeatState, toggleShuffle, toggleRepeat, play,
    progressMs, durationMs, volume, setVolume, fetchPlaylistTracks,
  } = useSpotify()

  const [activeTab, setActiveTab] = useState('now-playing')
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const volumeRef = useRef(null)

  const openPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist)
    setLoadingTracks(true)
    setPlaylistTracks([])
    const tracks = await fetchPlaylistTracks(playlist.id)
    setPlaylistTracks(tracks)
    setLoadingTracks(false)
  }

  // 1) Not logged in
  if (!session) {
    return (
      <div className="card" style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        textAlign: 'center'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15), rgba(29, 185, 84, 0.05))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1DB954',
          boxShadow: '0 0 40px rgba(29, 185, 84, 0.1)'
        }}>
          <Music size={28} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>Spotify</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Connect your Premium account<br/>to control playback</div>
        </div>
        <button 
          onClick={() => signIn('spotify')}
          style={{
            background: '#1DB954',
            color: '#000',
            border: 'none',
            borderRadius: 24,
            padding: '12px 32px',
            fontFamily: 'var(--font)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(29, 185, 84, 0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(29, 185, 84, 0.5)' }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.35)' }}
        >
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
  const albumName = isPodcast ? currentTrack?.show?.name : currentTrack?.album?.name

  const progress = durationMs > 0 ? (progressMs / durationMs) * 100 : 0

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
          position: 'absolute', inset: -40, zIndex: 0,
          backgroundImage: `url(${imgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(50px) brightness(0.35) saturate(1.4)',
          opacity: 0.9
        }} />
      )}

      {/* Gradient overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
      }} />

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
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: 3,
            width: '100%',
            maxWidth: 220,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <button 
              onClick={() => setActiveTab('now-playing')}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'now-playing' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'now-playing' ? '#fff' : 'rgba(255,255,255,0.4)',
                fontFamily: 'var(--font)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>Playing</button>
            <button 
              onClick={() => setActiveTab('playlists')}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'playlists' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'playlists' ? '#fff' : 'rgba(255,255,255,0.4)',
                fontFamily: 'var(--font)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>Library</button>
          </div>

          <button 
            onClick={() => signOut()}
            style={{ position: 'absolute', right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 8 }}>
            <LogOut size={14} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* ═══ LIBRARY TAB ═══ */}
          {activeTab === 'playlists' && !selectedPlaylist && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {playlists.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', padding: 32 }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-data)', fontSize: 13, marginBottom: 12 }}>
                    No playlists found.
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-data)', fontSize: 11 }}>
                    Try logging out and reconnecting to grant playlist permissions.
                  </div>
                </div>
              ) : (
                playlists.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => openPlaylist(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      padding: '10px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} alt={p.name} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 6, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'var(--font)', fontWeight: 600, color: '#fff', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{p.tracks?.total || 0} tracks</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ═══ PLAYLIST DETAIL (TRACK LIST) ═══ */}
          {activeTab === 'playlists' && selectedPlaylist && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Playlist header with back button */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 12, 
                padding: '12px 20px', 
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0
              }}>
                <button 
                  onClick={() => { setSelectedPlaylist(null); setPlaylistTracks([]) }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <ChevronLeft size={20} />
                </button>
                {selectedPlaylist.images?.[0] && (
                  <img src={selectedPlaylist.images[0].url} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} alt="" />
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--font)', fontWeight: 700, color: '#fff', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPlaylist.name}</div>
                  <div style={{ fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{selectedPlaylist.tracks?.total || playlistTracks.length} tracks</div>
                </div>
                <button
                  onClick={() => {
                    play(selectedPlaylist.uri)
                    setActiveTab('now-playing')
                  }}
                  style={{
                    background: '#1DB954', color: '#000', border: 'none', borderRadius: 20,
                    padding: '6px 16px', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <Play size={14} fill="currentColor" /> Play
                </button>
              </div>

              {/* Track list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
                {loadingTracks ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-data)', fontSize: 13 }}>Loading tracks...</div>
                ) : (
                  playlistTracks.map((track, i) => (
                    <button
                      key={track.id + '-' + i}
                      onClick={() => {
                        play(selectedPlaylist.uri, track.uri)
                        setActiveTab('now-playing')
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: '100%', textAlign: 'left',
                        background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                        padding: '8px 4px', cursor: 'pointer', transition: 'background 0.15s',
                        borderRadius: 6
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      {track.album?.images?.[2] ? (
                        <img src={track.album.images[2].url} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} alt="" />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: 4, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontFamily: 'var(--font)', fontWeight: 500, color: '#fff', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</div>
                        <div style={{ fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artists?.map(a => a.name).join(', ')}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{formatMs(track.duration_ms)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ═══ NOW PLAYING TAB ═══ */}
          {activeTab === 'now-playing' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 28px 20px' }}>
              {!currentTrack ? (
                <div style={{ margin: 'auto', textAlign: 'center' }}>
                  <Music size={32} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
                  <p style={{ fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                    Open Spotify on a device<br/>to start controlling playback.
                  </p>
                </div>
              ) : (
                <>
                  {/* Large Album Art — Hero */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    {imgUrl ? (
                      <img 
                        src={imgUrl} 
                        alt="Album cover" 
                        style={{
                          width: '55%',
                          maxWidth: 200,
                          aspectRatio: '1',
                          borderRadius: 14,
                          boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.3)',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{ width: '55%', maxWidth: 200, aspectRatio: '1', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }} />
                    )}
                  </div>

                  {/* Title / Artist */}
                  <div style={{ textAlign: 'center', marginBottom: 16, overflow: 'hidden' }}>
                    <div style={{ 
                      fontFamily: 'var(--font)', 
                      fontWeight: 700, 
                      fontSize: 20, 
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.02em',
                      textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                      marginBottom: 4,
                    }}>
                      {title}
                    </div>
                    <div style={{ 
                      fontFamily: 'var(--font-data)', 
                      fontSize: 14, 
                      color: 'rgba(255,255,255,0.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {artistName}
                    </div>
                    {albumName && (
                      <div style={{ 
                        fontFamily: 'var(--font-data)', 
                        fontSize: 11, 
                        color: 'rgba(255,255,255,0.25)',
                        marginTop: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {albumName}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ 
                      height: 4, 
                      borderRadius: 2, 
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${progress}%`, 
                        background: '#fff',
                        borderRadius: 2,
                        transition: 'width 1s linear'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{formatMs(progressMs)}</span>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{formatMs(durationMs)}</span>
                    </div>
                  </div>

                  {/* Transport Controls */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 12
                  }}>
                    <button 
                      onClick={toggleShuffle}
                      style={{ background: 'none', border: 'none', color: isShuffle ? '#1DB954' : 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 8, transition: 'color 0.2s' }}>
                      <Shuffle size={18} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <button 
                        onClick={previous}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 8 }}>
                        <SkipBack size={24} fill="currentColor" />
                      </button>

                      <button 
                        onClick={togglePlay}
                        style={{ 
                          width: 52, height: 52, borderRadius: '50%',
                          background: '#fff', color: '#000', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
                          transition: 'transform 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
                      </button>

                      <button 
                        onClick={next}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 8 }}>
                        <SkipForward size={24} fill="currentColor" />
                      </button>
                    </div>

                    <button 
                      onClick={toggleRepeat}
                      style={{ background: 'none', border: 'none', color: repeatState !== 'off' ? '#1DB954' : 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 8, position: 'relative', transition: 'color 0.2s' }}>
                      {repeatState === 'track' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
                    <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                    <div 
                      ref={volumeRef}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const percent = Math.round((x / rect.width) * 100)
                        setVolume(percent)
                      }}
                      style={{ 
                        flex: 1, height: 4, borderRadius: 2, 
                        background: 'rgba(255,255,255,0.1)', 
                        cursor: 'pointer',
                        position: 'relative' 
                      }}
                    >
                      <div style={{ 
                        height: '100%', 
                        width: `${volume}%`, 
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: 2,
                        transition: 'width 0.15s'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${volume}%`,
                        transform: 'translate(-50%, -50%)',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        transition: 'left 0.15s'
                      }} />
                    </div>
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
