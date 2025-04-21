import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

/**
 * Supabase middleware function (based on official docs).
 * Refreshes the user session if expired and updates cookies.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the request for the next middleware
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Also update the response so it sets the cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request for the next middleware
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Also update the response so it removes the cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  try {
    await supabase.auth.getUser()
    console.log('[Supabase Middleware] Session refreshed successfully.');
  } catch (error) {
     console.error('[Supabase Middleware] Error refreshing session:', error instanceof Error ? error.message : error);
     // Potentially handle the error, e.g., by redirecting to login if critical
  }

  return response
} 