'use client'

export default function MapWidget() {
  return (
    <div className="card hero" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <iframe
        src="/api/proxy/uber?url=https://m.uber.com/go/share?effect=&share_token=s3asO2QYshM"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 12,
          pointerEvents: 'auto',
          background: '#000',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Uber Live Trip"
      />
    </div>
  )
}
