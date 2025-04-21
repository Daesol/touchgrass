import { NextRequest, NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'
import { Session } from '@supabase/supabase-js'
import { apiSuccess, apiError, withErrorHandling, ApiResponse } from '@/lib/api/response'
import { CookieManager } from '@/lib/auth/cookies'

// Auth event types
export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'

// Request structure for auth API
export interface AuthRequest {
  event: AuthEvent
  session: Session | null
}

// Auth response data
export interface AuthResponseData {
  message: string
}

// Default cookie options
const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: 'lax'
}

/**
 * Handler for auth API requests
 */
async function handleAuthRequest(req: NextRequest): Promise<NextResponse<ApiResponse<AuthResponseData>>> {
  return withErrorHandling<AuthResponseData>(async () => {
    console.log('[AUTH API] Processing auth token request')
    
    // Parse the request body
    const body = await req.json()
    
    // Validate request structure
    if (!body || !body.event) {
      console.log('[AUTH API] Invalid request, missing event or session')
      return apiError('Invalid request structure', 'BAD_REQUEST', 400)
    }
    
    const { event, session } = body as AuthRequest
    
    console.log(`[AUTH API] Processing event: ${event}`); // Log event type

    // Process based on event type
    switch (event) {
      case 'SIGNED_IN': {
        if (!session) {
          console.error('[AUTH API] SIGNED_IN event missing session data.');
          return apiError('Session data is required for SIGNED_IN event', 'BAD_REQUEST', 400)
        }
        
        console.log('[AUTH API] Auth event: SIGNED_IN - Preparing response...')
        
        // Generate Next.js response
        const response = apiSuccess<AuthResponseData>({ message: 'Auth token set successfully' })
        
        // Extract tokens
        const { access_token, refresh_token } = session
        
        // Get cookie prefix from Supabase URL
        const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
        
        if (!cookiePrefix) {
          console.error('[AUTH API] Missing cookie prefix.');
          return apiError('Failed to set auth token: missing cookie prefix', 'INTERNAL_ERROR', 500)
        }
        
        console.log(`[AUTH API] Cookie Prefix: sb-${cookiePrefix}-`);

        // Set auth token as cookie (fragmented if needed)
        if (access_token) {
          console.log('[AUTH API] Setting access token cookie(s)...');
          CookieManager.setFragmented(
            `sb-${cookiePrefix}-auth-token`,
            access_token,
            DEFAULT_COOKIE_OPTIONS,
            response.cookies
          )
        } else {
           console.warn('[AUTH API] No access_token found in session for SIGNED_IN.');
        }
        
        // Set refresh token if present
        if (refresh_token) {
          console.log('[AUTH API] Setting refresh token cookie...');
          CookieManager.set(
            `sb-${cookiePrefix}-auth-token-refresh`,
            refresh_token,
            DEFAULT_COOKIE_OPTIONS,
            response.cookies
          )
        } else {
          console.warn('[AUTH API] No refresh_token found in session for SIGNED_IN.');
        }
        
        // **Log Set-Cookie headers before returning**
        console.log('[AUTH API] Set-Cookie headers prepared:', response.headers.get('Set-Cookie'));
        console.log('[AUTH API] Returning success response for SIGNED_IN.');
        return response
      }
      
      case 'SIGNED_OUT': {
        console.log('[AUTH API] Auth event: SIGNED_OUT')
        
        // Generate Next.js response
        const response = apiSuccess<AuthResponseData>({ message: 'Auth token cleared successfully' })
        
        // Get cookie prefix from Supabase URL
        const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
        
        if (!cookiePrefix) {
          return apiError('Failed to clear auth token: missing cookie prefix', 'INTERNAL_ERROR', 500)
        }
        
        // Clear auth token and refresh token
        CookieManager.clearAllWithPrefix(
          `sb-${cookiePrefix}-auth-token`,
          { path: '/' },
          response.cookies
        )
        
        CookieManager.delete(
          `sb-${cookiePrefix}-auth-token-refresh`,
          { path: '/' },
          response.cookies
        )
        
        console.log('[AUTH API] Auth token cleared successfully')
        return response
      }
      
      case 'TOKEN_REFRESHED': {
        if (!session) {
          return apiError('Session data is required for TOKEN_REFRESHED event', 'BAD_REQUEST', 400)
        }
        
        console.log('[AUTH API] Auth event: TOKEN_REFRESHED')
        
        // Similar to SIGNED_IN but just for refreshing
        const response = apiSuccess<AuthResponseData>({ message: 'Auth token refreshed successfully' })
        
        // Extract tokens
        const { access_token, refresh_token } = session
        
        // Get cookie prefix from Supabase URL
        const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
        
        if (!cookiePrefix) {
          return apiError('Failed to refresh auth token: missing cookie prefix', 'INTERNAL_ERROR', 500)
        }
        
        // Set auth token as cookie (fragmented if needed)
        if (access_token) {
          CookieManager.setFragmented(
            `sb-${cookiePrefix}-auth-token`,
            access_token,
            DEFAULT_COOKIE_OPTIONS,
            response.cookies
          )
        }
        
        // Set refresh token if present
        if (refresh_token) {
          CookieManager.set(
            `sb-${cookiePrefix}-auth-token-refresh`,
            refresh_token,
            DEFAULT_COOKIE_OPTIONS,
            response.cookies
          )
        }
        
        console.log('[AUTH API] Auth token refreshed successfully')
        return response
      }
      
      default:
        return apiError(`Unsupported auth event: ${event}`, 'BAD_REQUEST', 400)
    }
  })
}

export async function POST(req: NextRequest) {
  return handleAuthRequest(req)
} 