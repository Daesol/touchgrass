import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Main middleware entry point
 */
export async function middleware(request: NextRequest) {
  // updateSession handles refreshing the session and setting cookies
  console.log('[Middleware] Running Supabase updateSession for:', request.nextUrl.pathname);
  const response = await updateSession(request)
  console.log('[Middleware] updateSession completed for:', request.nextUrl.pathname);
  
  // You can add custom logic here after Supabase session handling if needed,
  // for example, role-based access control or redirects based on session status.
  // const supabase = createClient(request.cookies); // If needed for further checks
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user && !isPublicRoute(request.nextUrl.pathname)) { ... redirect ... }
  
  return response
}

/**
 * Matcher configuration for the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 