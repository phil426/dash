'use client'

export default function MusicWidget() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '450px',
          overflow: 'hidden',
          borderRadius: '10px',
        }}
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src="https://embed.music.apple.com/us/playlist/favorite-songs/pl.u-lxUmmN5o"
      />
    </div>
  )
}
