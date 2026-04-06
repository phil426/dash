'use client'

export default function MusicWidget() {
  return (
    <div className="card hero" style={{ height: '100%', padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="music-wrapper" style={{ flex: 1, minHeight: 0 }}>
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          frameBorder="0"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          src="https://embed.music.apple.com/us/playlist/favorite-songs/pl.u-lxUmmN5o"
          style={{ width: 'calc(100% + 20px)', height: '100%', border: 0, display: 'block' }}
          loading="lazy"
        />
      </div>
    </div>
  )
}
