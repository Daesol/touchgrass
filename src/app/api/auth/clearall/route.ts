import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// This is a special endpoint to forcefully clear all cookies related to Supabase auth
export async function GET(/* Removed request as it wasn't used */) {
  console.log("Clearing all cookies for complete logout")
  
  // Optional: Verify user is authenticated before clearing? Maybe not for a forceful clear.
  // const supabase = createSupabaseServerActionClient();
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) { /* Handle error or proceed anyway */ }

  const response = NextResponse.json({ success: true, message: "All auth cookies cleared" })
  
  // Clear cookies by setting them with expiry in the past
  const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
  const cookieOptions = { path: '/', maxAge: 0 }
  
  if (cookiePrefix) {
    const authTokenCookieName = `sb-${cookiePrefix}-auth-token`
    // Clear potential fragments for auth token
    for (let i = 0; i < 10; i++) { // Check more fragments just in case
      response.cookies.set(`${authTokenCookieName}.${i}`, '', cookieOptions)
    }
    response.cookies.set(authTokenCookieName, '', cookieOptions)

    // Clear refresh token cookie
    const refreshTokenCookieName = `sb-${cookiePrefix}-auth-token-refresh`
    response.cookies.set(refreshTokenCookieName, '', cookieOptions)
    
    // Clear pkce cookie if it exists
    const pkceCookieName = `sb-${cookiePrefix}-pkce-verifier`
    response.cookies.set(pkceCookieName, '', cookieOptions)
  }
  
  // Add any other known auth-related cookies here
  response.cookies.set('redirect-count', '', { path: '/', maxAge: 0 }) // Clear redirect counter

  console.log("Cookies cleared, returning response.")
  return response
}

/**
 * API Route to clear authentication cookies by signing the user out.
 */
export async function POST(request: NextRequest) {
  try {
    // No need to pass cookieStore, createClient reads it implicitly
    const supabase = await createClient()
    
    // Signing out clears the server session and tells the browser to remove cookies
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out to clear cookies:', error.message)
      return NextResponse.json({ message: 'Failed to clear cookies', error: error.message }, { status: 500 })
    }

    // Invalidate path to ensure redirect checks work correctly
    // This might not be strictly necessary if redirecting client-side anyway
    // revalidatePath('/', 'layout')

    console.log('Cookies cleared via sign out.')
    return NextResponse.json({ message: 'Cookies cleared successfully' }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error clearing cookies:', err)
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ message: 'Server error while clearing cookies', error: message }, { status: 500 })
  }
}

// PUT and DELETE are likely not needed for this route
// export async function PUT(request: NextRequest) { ... }
// export async function DELETE(request: NextRequest) { ... } 