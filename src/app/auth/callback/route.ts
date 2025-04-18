import { createSupabaseServerActionClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'
  
  // Handle email confirmation (type parameter is present in email confirmations)
  const type = searchParams.get('type')
  
  try {
    console.log(`Auth callback initiated: code exists: ${!!code}, type: ${type || 'not specified'}`)
    
    // Debug: log all search params for troubleshooting
    console.log('Auth callback URL params:', Object.fromEntries(searchParams.entries()))
    
    const supabase = await createSupabaseServerActionClient()
    
    if (code) {
      // Exchange the code for a session
      console.log('Attempting to exchange code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error.message, error)
        // Include the error code and additional information for diagnostic purposes
        const errorParams = new URLSearchParams({
          error: error.message,
          code: String(error.status || 'unknown'),
          type: type || 'unknown'
        })
        return NextResponse.redirect(
          new URL(`/auth/auth-error?${errorParams.toString()}`, request.url)
        )
      }
      
      console.log('Code exchange successful, checking session...')
      // Email confirmation success - get user session to confirm login state
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('Session established, redirecting to:', next)
        // Successfully authenticated, redirect to dashboard or specified URL
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        console.log('No session established after code exchange')
      }
    } else {
      console.log('No code provided in callback URL')
    }
    
    // If we get here, something went wrong with authentication
    console.error('Authentication process incomplete')
    return NextResponse.redirect(
      new URL('/auth/auth-error?error=Unable+to+authenticate&reason=process_incomplete', request.url)
    )
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL('/auth/auth-error?error=Unexpected+error&reason=server_exception', request.url)
    )
  }
} 