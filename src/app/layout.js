import './globals.css'

export const metadata = {
  title: 'Dash · Uber Premier',
  description: 'Prius-styled Uber Premier passenger command center',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
