import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const COOKIE_NAME = 'auth-token'

async function verifyTokenMiddleware(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const isAuthenticated = token ? await verifyTokenMiddleware(token) : false

  // Protected routes
  const protectedPaths = ['/dashboard', '/module', '/quiz', '/certificate', '/profile', '/admin']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Auth routes (redirect to dashboard if already logged in)
  const authPaths = ['/login', '/register', '/forgot-password']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPath && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect root to dashboard if logged in, otherwise to login
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = isAuthenticated ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
