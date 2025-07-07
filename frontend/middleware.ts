import { NextRequest, NextResponse } from 'next/server'

// Configuration
const MAIN_DOMAIN = process.env.NODE_ENV === 'production' 
  ? 'devlogr.com' 
  : 'localhost:3000'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || MAIN_DOMAIN
  
  console.log(`🌐 Middleware: ${hostname}${url.pathname}`)
  
  // Extract subdomain or check for custom domain
  const subdomain = getSubdomain(hostname)
  const isCustomDomain = !hostname.includes(MAIN_DOMAIN.replace(':3000', ''))
  
  // Skip middleware for Next.js internals and API routes to backend
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.includes('.') ||
    url.pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Handle custom domain or subdomain routing
  if (isCustomDomain || subdomain) {
    const domain = isCustomDomain ? hostname : subdomain
    console.log(`👤 User domain detected: ${domain}`)
    
    // Rewrite to user profile page
    url.pathname = `/profile/${domain}`
    console.log(`🔄 Rewriting to: ${url.pathname}`)
    return NextResponse.rewrite(url)
  }

  // Default: continue to main app
  console.log(`🏠 Main domain: continuing to main app`)
  return NextResponse.next()
}

function getSubdomain(hostname: string): string | null {
  // Handle localhost development
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.')
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0]
    }
    return null
  }
  
  // Production subdomain extraction
  const parts = hostname.split('.')
  if (parts.length > 2) {
    return parts[0]
  }
  
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 