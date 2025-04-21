/**
 * Route configurations for the middleware
 */

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/', // Landing page
  '/login',
  '/signup',
  '/api/auth/callback', // Auth callback
  '/login?error=.*', // Error redirects to login
  '/auth/confirmation' // Allow access to confirmation page
];

/**
 * Routes specifically related to authentication
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/events',
  '/contacts',
  // Add other protected routes here
];

/**
 * Routes that should completely bypass middleware processing
 */
export const EXEMPT_ROUTES = [
  '/bypass',
  '/dashboard/emergency',
  '/reset',
  '/logout'
]

/**
 * Static file routes that should be excluded from middleware processing
 */
export const STATIC_ROUTE_PATTERN = /^\/_next\/|^\/favicon\.ico$|\.(ico|svg|png|jpg|jpeg|webp|js|css)$/

/**
 * Debug parameters that can bypass auth
 */
export const DEBUG_PARAMS = [
  'fallback',
  'debug',
  'bypass_auth',
  'loop_detected'
]

/**
 * Cookie configuration
 */
export const COOKIES = {
  redirectCount: {
    name: 'redirect-count',
    maxAge: 60 // 1 minute expiration
  }
}

/**
 * Default redirect paths
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
export const ROOT_ROUTE = '/';

/**
 * API routes
 */
export const API_ROUTES_PREFIX = '/api';
export const API_AUTH_ROUTES = [
  '/api/auth/callback'
];

/**
 * Special routes
 */
export const LOGIN_ROUTE = '/login';
export const SIGNUP_ROUTE = '/signup';
export const ERROR_ROUTE = '/login'; // Redirecting errors to login for simplicity

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }
  
  // Check API routes (public by default unless explicitly marked as protected)
  if (pathname.startsWith('/api/') && !pathname.includes('/api/protected/')) {
    return true
  }
  
  return false
}

/**
 * Check if a route should bypass middleware
 */
export function shouldBypassMiddleware(pathname: string): boolean {
  // Check exempt routes
  if (EXEMPT_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return true
  }
  
  // Check static file pattern
  if (STATIC_ROUTE_PATTERN.test(pathname)) {
    return true
  }
  
  return false
}

/**
 * Check if a route is on the auth system
 */
export function isAuthRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.includes(pathname)
}

/**
 * Check if debug mode should be activated based on search params
 */
export function isDebugMode(searchParams: URLSearchParams): boolean {
  return DEBUG_PARAMS.some(param => searchParams.has(param))
} 