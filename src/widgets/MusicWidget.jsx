'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { Play, Pause, SkipBack, SkipForward, Music, LogOut, Shuffle, Repeat, Repeat1, ChevronLeft, Mic2 } from 'lucide-react'
import useSpotify from '../hooks/useSpotify'

function formatMs(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/* ── Vertical Pill Slider (matches CabinWidget style) ── */
function VerticalVolumeSlider({ value, onChange }) {
  const ref = useRef(null)
  const PILL_H = 40
  const TRACK_W = 36

  const calc = (y) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    // Invert: top = 100, bottom = 0
    const pct = 1 - Math.max(0, Math.min(1, (y - r.top - PILL_H / 2) / (r.height - PILL_H)))
    onChange(Math.round(pct * 100))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Vol</span>
      <div
        ref={ref}
        onPointerDown={(e) => { e.preventDefault(); ref.current.setPointerCapture(e.pointerId); calc(e.clientY) }}
        onPointerMove={(e) => { if (ref.current?.hasPointerCapture(e.pointerId)) calc(e.clientY) }}
        onPointerUp={(e) => ref.current?.releasePointerCapture(e.pointerId)}
        onPointerCancel={(e) => ref.current?.releasePointerCapture(e.pointerId)}
        style={{
          position: 'relative',
          width: TRACK_W,
          flex: 1,
          minHeight: 120,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
          touchAction: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Fill from bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${value}%`,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }} />
        {/* Pill thumb */}
        <div style={{
          position: 'absolute',
          left: 4,
          bottom: `calc((100% - ${PILL_H}px) * ${value / 100})`,
          width: TRACK_W - 8,
          height: PILL_H,
          borderRadius: 6,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(255,255,255,0.3)',
          transition: 'bottom 0.05s linear',
          pointerEvents: 'none',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{value}%</span>
    </div>
  )
}

export default function MusicWidget() {
  const {
    session, currentTrack, isPlaying, togglePlay, next, previous,
    playlists, isShuffle, repeatState, toggleShuffle, toggleRepeat, play,
    progressMs, durationMs, volume, setVolume, fetchPlaylistTracks, syncedLyrics,
  } = useSpotify()

  const [activeTab, setActiveTab] = useState('now-playing')
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const lyricsContainerRef = useRef(null)

  const currentLineIndex = useMemo(() => {
    if (!syncedLyrics.length || syncedLyrics[0].time === -1) return -1
    const adjustedProgress = progressMs + 1000
    let idx = -1
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (syncedLyrics[i].time <= adjustedProgress) idx = i
      else break
    }
    return idx
  }, [syncedLyrics, progressMs])

  useEffect(() => {
    if (!lyricsContainerRef.current || currentLineIndex < 0) return
    const activeLine = lyricsContainerRef.current.children[currentLineIndex]
    if (activeLine) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentLineIndex])

  const openPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist)
    setLoadingTracks(true)
    setPlaylistTracks([])
    const tracks = await fetchPlaylistTracks(playlist.id)
    setPlaylistTracks(tracks)
    setLoadingTracks(false)
  }

  // Not logged in
  if (!session) {
    return (
      <div className="card" style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32, textAlign: 'center'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15), rgba(29, 185, 84, 0.05))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1DB954', boxShadow: '0 0 40px rgba(29, 185, 84, 0.1)'
        }}>
          <Music size={28} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 6 }}>Spotify</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Connect your Premium account<br />to control playback</div>
        </div>
        <button onClick={() => signIn('spotify')} style={{
          background: '#1DB954', color: '#000', border: 'none', borderRadius: 24,
          padding: '12px 32px', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(29, 185, 84, 0.35)'
        }}>Connect Spotify</button>
      </div>
    )
  }

  // Track properties
  const isPodcast = currentTrack?.type === 'episode'
  const imgUrl = isPodcast
    ? currentTrack?.show?.images?.[0]?.url || ''
    : currentTrack?.album?.images?.[0]?.url || ''
  const artistName = isPodcast
    ? currentTrack?.show?.publisher || ''
    : currentTrack?.artists?.map(a => a.name).join(', ') || ''
  const title = currentTrack?.name || ''
  const albumName = isPodcast ? currentTrack?.show?.name : currentTrack?.album?.name
  const progress = durationMs > 0 ? (progressMs / durationMs) * 100 : 0

  const iconBtn = (color = 'rgba(255,255,255,0.5)') => ({
    background: 'none', border: 'none', color, cursor: 'pointer', padding: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
  })

  return (
    <div className="card" style={{
      height: '100%', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', padding: 0
    }}>
      {/* Blurred background */}
      {imgUrl && (
        <div style={{
          position: 'absolute', inset: -40, zIndex: 0,
          backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(50px) brightness(0.35) saturate(1.4)', opacity: 0.9
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)' }} />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 20px 10px', position: 'relative', flexShrink: 0 }}>
          {activeTab === 'playlists' && (
            <button onClick={() => { if (selectedPlaylist) { setSelectedPlaylist(null); setPlaylistTracks([]) } else { setActiveTab('now-playing') } }}
              style={{
                position: 'absolute', left: 12, zIndex: 2,
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(10px)', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
          )}

          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3,
            width: '100%', maxWidth: 200, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {[{ id: 'now-playing', label: 'Playing' }, { id: 'playlists', label: 'Library' }].map(tab => (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === 'playlists') { setSelectedPlaylist(null); setPlaylistTracks([]) } }}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 1.2, cursor: 'pointer', transition: 'all 0.2s'
                }}>{tab.label}</button>
            ))}
          </div>

          <button onClick={() => signOut()} style={{ ...iconBtn('rgba(255,255,255,0.3)'), position: 'absolute', right: 16 }}>
            <LogOut size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* LIBRARY: Playlist List */}
          {activeTab === 'playlists' && !selectedPlaylist && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {playlists.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', padding: 32 }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-data)', fontSize: 13, marginBottom: 12 }}>No playlists found.</div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-data)', fontSize: 11 }}>Try logging out and reconnecting.</div>
                </div>
              ) : (
                playlists.map(p => (
                  <button key={p.id} onClick={() => openPlaylist(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)',
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s', width: '100%'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
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

          {/* LIBRARY: Playlist Detail */}
          {activeTab === 'playlists' && selectedPlaylist && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                {selectedPlaylist.images?.[0] && (
                  <img src={selectedPlaylist.images[0].url} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} alt="" />
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--font)', fontWeight: 700, color: '#fff', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPlaylist.name}</div>
                  <div style={{ fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{playlistTracks.length || selectedPlaylist.tracks?.total || 0} tracks</div>
                </div>
                <button onClick={() => { play(selectedPlaylist.uri); setActiveTab('now-playing') }}
                  style={{
                    background: '#1DB954', color: '#000', border: 'none', borderRadius: 20,
                    padding: '8px 20px', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6
                  }}>
                  <Play size={14} fill="currentColor" /> Play All
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
                {loadingTracks ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-data)', fontSize: 13 }}>Loading tracks...</div>
                ) : playlistTracks.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-data)', fontSize: 13, marginBottom: 16 }}>
                      Unable to load tracks. Your session needs updated permissions.
                    </div>
                    <button
                      onClick={() => { signOut({ redirect: false }).then(() => signIn('spotify')) }}
                      style={{
                        background: '#1DB954', color: '#000', border: 'none', borderRadius: 20,
                        padding: '10px 24px', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      Re-authenticate Spotify
                    </button>
                  </div>
                ) : (
                  playlistTracks.map((track, i) => (
                    <button key={track.id + '-' + i}
                      onClick={() => { play(selectedPlaylist.uri, track.uri); setActiveTab('now-playing') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                        background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                        padding: '8px 4px', cursor: 'pointer', transition: 'background 0.15s', borderRadius: 6
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 22, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      {track.album?.images?.[2] ? (
                        <img src={track.album.images[2].url} style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} alt="" />
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: 4, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
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

          {/* NOW PLAYING */}
          {activeTab === 'now-playing' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

              {/* Left: Main player content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: showLyrics ? 'flex-start' : 'center', padding: '8px 20px 16px 28px', overflow: 'hidden' }}>
                {!currentTrack ? (
                  <div style={{ margin: 'auto', textAlign: 'center' }}>
                    <Music size={32} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
                    <p style={{ fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                      Open Spotify on a device<br />to start controlling playback.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Album Art - full when no lyrics */}
                    {!showLyrics && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, flexShrink: 0 }}>
                        {imgUrl && <img src={imgUrl} alt="" style={{ width: '50%', maxWidth: 180, aspectRatio: '1', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', objectFit: 'cover' }} />}
                      </div>
                    )}

                    {/* Compact art when lyrics showing */}
                    {showLyrics && imgUrl && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, flexShrink: 0 }}>
                        <img src={imgUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Title / Artist */}
                    <div style={{ textAlign: 'center', marginBottom: showLyrics ? 6 : 14, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: showLyrics ? 15 : 20, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.5)', marginBottom: 3, transition: 'font-size 0.3s' }}>
                        {title}
                      </div>
                      <div style={{ fontFamily: 'var(--font-data)', fontSize: showLyrics ? 12 : 14, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'font-size 0.3s' }}>
                        {artistName}
                      </div>
                      {!showLyrics && albumName && (
                        <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {albumName}
                        </div>
                      )}
                    </div>

                    {/* Karaoke Lyrics */}
                    {showLyrics && syncedLyrics.length > 0 && (
                      <div ref={lyricsContainerRef}
                        style={{
                          flex: 1, overflowY: 'auto', marginBottom: 8, padding: '8px 4px',
                          maskImage: 'linear-gradient(transparent 0%, black 12%, black 88%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(transparent 0%, black 12%, black 88%, transparent 100%)',
                          scrollbarWidth: 'none',
                        }}>
                        {syncedLyrics.map((line, i) => (
                          <div key={i} style={{
                            fontFamily: 'var(--font)', fontSize: i === currentLineIndex ? 18 : 14,
                            fontWeight: i === currentLineIndex ? 700 : 400,
                            color: i === currentLineIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                            textAlign: 'left', paddingLeft: 24, paddingRight: 12, paddingTop: 5, paddingBottom: 5,
                            transition: 'all 0.3s ease',
                            transform: i === currentLineIndex ? 'scale(1.02)' : 'scale(1)',
                            transformOrigin: 'left center',
                            minHeight: line.text ? 'auto' : 20,
                          }}>
                            {line.text || '\u266a'}
                          </div>
                        ))}
                      </div>
                    )}

                    {showLyrics && syncedLyrics.length === 0 && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>No lyrics available</div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div style={{ marginBottom: 14, flexShrink: 0 }}>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#fff', borderRadius: 2, transition: 'width 1s linear' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{formatMs(progressMs)}</span>
                        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{formatMs(durationMs)}</span>
                      </div>
                    </div>

                    {/* Transport Controls - centered on play/pause */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                      {/* Left aux */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: 60, justifyContent: 'flex-end' }}>
                        <button onClick={toggleShuffle} style={iconBtn(isShuffle ? '#1DB954' : 'rgba(255,255,255,0.35)')}>
                          <Shuffle size={18} />
                        </button>
                      </div>

                      {/* Core transport */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={previous} style={iconBtn('rgba(255,255,255,0.7)')}>
                          <SkipBack size={28} fill="currentColor" />
                        </button>

                        <button onClick={togglePlay}
                          style={{
                            width: 60, height: 60, borderRadius: '50%',
                            background: '#fff', color: '#000', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
                            transition: 'transform 0.15s', margin: '0 4px'
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: 3 }} />}
                        </button>

                        <button onClick={next} style={iconBtn('rgba(255,255,255,0.7)')}>
                          <SkipForward size={28} fill="currentColor" />
                        </button>
                      </div>

                      {/* Right aux */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: 60, justifyContent: 'flex-start' }}>
                        <button onClick={toggleRepeat} style={iconBtn(repeatState !== 'off' ? '#1DB954' : 'rgba(255,255,255,0.35)')}>
                          {repeatState === 'track' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                        </button>

                        <button onClick={() => setShowLyrics(prev => !prev)} style={iconBtn(showLyrics ? '#1DB954' : 'rgba(255,255,255,0.35)')}>
                          <Mic2 size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right: Vertical Volume Slider */}
              {currentTrack && (
                <div style={{ width: 56, flexShrink: 0, padding: '12px 10px 16px 0', display: 'flex' }}>
                  <VerticalVolumeSlider value={volume} onChange={setVolume} />
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
