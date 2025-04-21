import { NextRequest, NextResponse } from 'next/server'
// import { createServerClient } from '@supabase/ssr' // No longer needed directly
import { cookies } from 'next/headers' 
import { Session, AuthError, type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server' // Import the new utility
// import { Database } from '@/types/database.types' // Type is inferred by createClient

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash') // For email OTP
  const type = searchParams.get('type') as EmailOtpType | null // For email OTP
  const next = searchParams.get('next') ?? '/dashboard' // Use next for redirect

  try {
    console.log(`Auth callback initiated: code: ${!!code}, token_hash: ${!!token_hash}, type: ${type || 'N/A'}`)
    
    let error: AuthError | null = null;
    
    // Use the unified server client utility
    // It automatically uses the cookies() store
    const supabase = await createClient() // Await the async function
    
    if (code) {
      // OAuth flow or Magic Link flow
      console.log('Attempting to exchange code for session...')
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      error = exchangeError
    } else if (token_hash && type) {
       // Email OTP flow
       console.log('Attempting to verify email OTP...')
       const { error: otpError } = await supabase.auth.verifyOtp({ token_hash, type })
       error = otpError
    } else {
        console.error('Auth callback error: No code or token_hash/type provided')
        return NextResponse.redirect(new URL('/login?error=Invalid+callback+parameters&reason=missing_params', request.url))
    }
    
    if (error) {
      console.error('Auth callback error:', error.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}&reason=auth_failed`, request.url)
      )
    }
    
    // Session should be set by the exchange/verify calls. Redirect to the intended destination.
    console.log('Auth callback successful. Redirecting to:', next)
    return NextResponse.redirect(new URL(next, request.url))

  } catch (err) {
    console.error('Unexpected error in auth callback:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/login?error=Unexpected+server+error&reason=exception&details=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
} 