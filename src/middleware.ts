import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from './lib/supabase/server-client'

// Consolidated route configurations
const ROUTES = {
  public: ['/', '/login', '/signup', '/auth/callback', '/auth/auth-error', '/auth/debug', '/dashboard/fallback', '/dashboard/emergency', '/bypass', '/reset', '/logout'],
  auth: ['/login', '/signup'],
  exempt: ['/bypass', '/dashboard/emergency', '/reset', '/logout'],
  static: /^\/_next\/|^\/favicon\.ico$|\.(ico|svg|png|jpg|jpeg|webp|js|css)$/
}

// Debug parameters that bypass auth
const DEBUG_PARAMS = ['fallback', 'debug', 'bypass_auth', 'loop_detected']

// Cookie configuration
const COOKIES = {
  redirectCount: {
    name: 'redirect-count',
    maxAge: 60 // 1 minute expiration
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const searchParams = request.nextUrl.searchParams
  
  console.log(`Middleware: Processing ${pathname}`)
  
  // CRITICAL EMERGENCY ROUTE CHECK - Must be first
  if (pathname === '/dashboard/emergency') {
    console.log('Middleware: Emergency detected, serving static HTML recovery page');
    
    // Create a simple static HTML response to break any loops
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emergency Access - NetworkPro</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 500px;
      width: 100%;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 16px;
    }
    .alert {
      background-color: #fff8e6;
      border: 1px solid #ffecc7;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 24px;
      color: #92400e;
    }
    .button-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .button {
      display: block;
      width: 100%;
      padding: 12px;
      text-align: center;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    }
    .button-primary {
      background-color: #3b82f6;
      color: white;
    }
    .button-warning {
      background-color: #f59e0b;
      color: white;
    }
    .button-secondary {
      background-color: #e5e7eb;
      color: #374151;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">Emergency Access</div>
      <div class="subtitle">NetworkPro Limited Functionality Mode</div>
    </div>
    
    <div class="alert">
      You're seeing this page because we detected an issue with your session or authentication.
      This is a static emergency page with no JavaScript to ensure reliability.
    </div>
    
    <div class="button-container">
      <a href="/login?clear_session=true" class="button button-primary">Return to Login Page</a>
      <a href="/login?clear_session=true&force=true" class="button button-warning">Force Clear Session & Login</a>
      <a href="/" class="button button-secondary">Go to Homepage</a>
    </div>
    
    <div class="footer">
      <p>NetworkPro • Emergency Recovery Page</p>
      <p>Try clearing your browser cookies or using incognito mode if issues persist</p>
    </div>
  </div>
</body>
</html>`;
    
    // Return a static HTML response
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
  
  // Special handling for logout route
  if (pathname === '/logout') {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('clear_session', 'true')
    loginUrl.searchParams.set('from', 'logout_page')
    
    const response = NextResponse.redirect(loginUrl)
    
    // Clear auth cookies
    const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''
    if (cookiePrefix) {
      // Clear base auth token
      response.cookies.set(`sb-${cookiePrefix}-auth-token`, '', { 
        maxAge: 0,
        path: '/' 
      })
      
      // Clear fragmented auth tokens
      for (let i = 0; i < 5; i++) {
        response.cookies.set(`sb-${cookiePrefix}-auth-token.${i}`, '', { 
          maxAge: 0,
          path: '/' 
        })
      }
    }
    
    return response
  }
  
  // VERY IMPORTANT: Routes that should completely bypass middleware processing
  if (ROUTES.exempt.some(route => pathname === route || pathname.startsWith(`${route}/`)) ||
      ROUTES.static.test(pathname)) {
    console.log(`Middleware: Bypassing middleware for exempt route/static asset: ${pathname}`)
    return NextResponse.next()
  }
  
  // 2. Check for login page with special parameters to prevent loops
  if (pathname === '/login' && (searchParams.has('clear_session') || searchParams.has('error'))) {
    console.log('Middleware: Skipping auth check for login page with params')
    return NextResponse.next()
  }
  
  // 3. Check for loop detection parameter
  if (searchParams.has('loop_detected')) {
    console.log('Middleware: Loop detected via query parameter')
    return NextResponse.redirect(new URL('/auth/auth-error?code=redirect_loop', request.url))
  }
  
  // 4. Debug mode bypass
  const isDebugMode = DEBUG_PARAMS.some(param => searchParams.has(param))
  if (isDebugMode && pathname.startsWith('/dashboard/')) {
    console.log('Middleware: Debug mode active, bypassing auth for dashboard')
    return NextResponse.next()
  }
  
  // 5. Redirect loop detection based on cookie counter
  let redirectCount = 0
  try {
    redirectCount = parseInt(request.cookies.get(COOKIES.redirectCount.name)?.value || '0')
  } catch (e) {
    // If cookie parsing fails, reset counter
    redirectCount = 0
  }
  
  if (redirectCount > 3) {
    console.error(`Middleware: Redirect loop detected for ${pathname}`)
    const response = NextResponse.redirect(new URL('/auth/auth-error?code=redirect_loop', request.url))
    // Reset the counter with a proper expiration
    response.cookies.set(COOKIES.redirectCount.name, '0', { 
      maxAge: COOKIES.redirectCount.maxAge,
      path: '/'
    })
    return response
  }
  
  // Check if route is public
  const isPublicRoute = ROUTES.public.includes(pathname) || 
    pathname.startsWith('/api/') && !pathname.includes('/api/protected/')
  
  try {
    // Get the authentication status using the Supabase client
    const { supabase, res } = createSupabaseReqResClient(request)
    
    // Get user data with error handling
    let userData
    try {
      userData = await supabase.auth.getUser()
    } catch (authError) {
      console.error('Middleware Error:', authError)
      
      // For auth errors on non-login pages, redirect to login
      if (!isPublicRoute && pathname !== '/login') {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('clear_session', 'true')
        loginUrl.searchParams.set('error', 'Authentication failed')
        return NextResponse.redirect(loginUrl)
      }
      
      // For auth errors on public routes, just continue
      return NextResponse.next()
    }
    
    const { data, error } = userData
    
    // Create a response object to build on
    let response = res
    
    // Handle auth errors
    if (error) {
      console.error('Middleware Error: Error getting user:', error.message)
      
      // For auth session missing errors on public routes, just continue
      if (error.message === 'Auth session missing!' && isPublicRoute) {
        console.log('Middleware: Auth session missing on public route, allowing access')
        return NextResponse.next()
      }
      
      // For auth errors on dashboard, redirect to login with clear session
      if (pathname.startsWith('/dashboard/')) {
        console.log('Middleware: Auth error on dashboard, redirecting to login')
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('clear_session', 'true')
        return NextResponse.redirect(loginUrl)
      }
      
      // For other auth errors, redirect to login with error message
      // but only if not already on login page to prevent loops
      if (pathname !== '/login') {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('clear_session', 'true')
        redirectUrl.searchParams.set('error', error.message)
        
        const redirectResponse = NextResponse.redirect(redirectUrl)
        
        // Set cookies to expire with proper expiration
        redirectResponse.cookies.set('supabase-auth-token', '', { maxAge: 0, path: '/' })
        redirectResponse.cookies.set(COOKIES.redirectCount.name, (redirectCount + 1).toString(), {
          maxAge: COOKIES.redirectCount.maxAge,
          path: '/'
        })
        
        return redirectResponse
      } else {
        // Already on login page with an auth error, just proceed
        return NextResponse.next()
      }
    }
    
    const user = data.user
    
    // If the user is authenticated and trying to access auth routes, redirect to dashboard
    if (user && ROUTES.auth.includes(pathname)) {
      console.log('Middleware: User authenticated, redirecting from auth route to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // If the user is authenticated but email not confirmed, only allow certain routes
    if (user && !user.email_confirmed_at && !isPublicRoute) {
      console.log('Middleware: User email not confirmed, signing out')
      
      // Sign the user out and await completion
      await supabase.auth.signOut()
      
      // Redirect to login with verification needed parameter
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('verification_needed', 'true')
      redirectUrl.searchParams.set('email', user.email || '')
      return NextResponse.redirect(redirectUrl)
    }
    
    // If the user is not authenticated and trying to access a protected route, redirect to login
    if (!user && !isPublicRoute) {
      console.log('Middleware: User not authenticated, redirecting to login')
      
      // Redirect to login with return URL
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      
      const redirectResponse = NextResponse.redirect(redirectUrl)
      
      // Set redirect count cookie with proper expiration
      redirectResponse.cookies.set(COOKIES.redirectCount.name, (redirectCount + 1).toString(), {
        maxAge: COOKIES.redirectCount.maxAge,
        path: '/'
      })
      
      return redirectResponse
    }
    
    // User is authenticated and accessing an authorized route
    // Reset redirect count on successful passage
    response.cookies.set(COOKIES.redirectCount.name, '0', { 
      maxAge: COOKIES.redirectCount.maxAge,
      path: '/'
    })
    
    console.log(`Middleware: Request for ${pathname} processed successfully`)
    return response
  } catch (error) {
    console.error('Middleware Critical Error:', error)
    
    // For critical errors, redirect to error page
    const errorResponse = NextResponse.redirect(
      new URL(`/auth/auth-error?code=middleware_error&path=${pathname}`, request.url)
    )
    
    // Reset redirect count to prevent loops
    errorResponse.cookies.set(COOKIES.redirectCount.name, '0', { 
      maxAge: COOKIES.redirectCount.maxAge,
      path: '/'
    })
    
    return errorResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - bypass (direct access route)
     * - reset (session reset utility)
     */
    '/((?!_next/static|_next/image|favicon.ico|bypass|reset|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 