import { NextRequest, NextResponse } from 'next/server'

const MAIN_DOMAIN = process.env.NODE_ENV === 'production' 
  ? 'devlogr.com' 
  : 'localhost:3000'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || MAIN_DOMAIN
  
  console.log(`Middleware: ${hostname}${url.pathname}`)
  const subdomain = getSubdomain(hostname)
  const isCustomDomain = !hostname.includes(MAIN_DOMAIN.replace(':3000', ''))
  
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.includes('.') ||
    url.pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  if (url.pathname.startsWith('/api/')) {
    console.log(`Proxying API call: ${BACKEND_URL}${url.pathname}`)
    const backendUrl = new URL(url.pathname + url.search, BACKEND_URL)
    return NextResponse.rewrite(backendUrl)
  }

  if (isCustomDomain || subdomain) {
    const domain = isCustomDomain ? hostname : subdomain
    console.log(`domain detected: ${domain}`)
    
    url.pathname = `/profile/${domain}`
    console.log(`Rewriting to: ${url.pathname}`)
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

function getSubdomain(hostname: string): string | null {
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.')
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0]
    }
    return null
  }
  
  const parts = hostname.split('.')
  if (parts.length > 2) {
    return parts[0]
  }
  
  return null
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 