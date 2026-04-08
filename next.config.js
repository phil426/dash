/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/map-tiles',
        destination: 'https://build.protomaps.com/20260405.pmtiles',
      },
    ]
  },
}

module.exports = nextConfig
