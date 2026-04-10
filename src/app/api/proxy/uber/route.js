import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) return new NextResponse('Missing url parameter', { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })

    let html = await res.text()
    
    // Inject a <base> tag so relative CSS/JS files load from m.uber.com instead of localhost
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head><base href="https://m.uber.com/" />')
    } else if (html.includes('<HEAD>')) {
      html = html.replace('<HEAD>', '<HEAD><base href="https://m.uber.com/" />')
    }

    const response = new NextResponse(html, {
      status: res.status,
      statusText: res.statusText,
    })

    // Copy over headers but strip security/framing restrictions
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (![
        'x-frame-options', 
        'content-security-policy', 
        'strict-transport-security', 
        'content-encoding', 
        'transfer-encoding'
      ].includes(lowerKey)) {
        response.headers.set(key, value)
      }
    })

    // Force allow iframe
    response.headers.set('Access-Control-Allow-Origin', '*')

    return response
  } catch (error) {
    return new NextResponse('Proxy error: ' + error.message, { status: 500 })
  }
}
