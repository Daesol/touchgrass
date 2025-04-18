import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('[AUTH API] Processing auth token request')
    const { event, session } = await request.json()
    
    if (!event || !session) {
      console.error('[AUTH API] Invalid request, missing event or session')
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    
    console.log('[AUTH API] Auth event:', event)
    
    // Get Supabase server client
    const supabase = await createServerSupabaseClient()
    
    // Set auth cookie on the server side
    const cookieStore = cookies()
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Clear any existing auth cookies first to ensure a clean slate
      const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''
      
      if (cookiePrefix) {
        // Clear main token
        (await cookieStore).set(`sb-${cookiePrefix}-auth-token`, '', { maxAge: 0, path: '/' })
        
        // Clear any fragment cookies
        for (let i = 0; i < 5; i++) {
          (await cookieStore).set(`sb-${cookiePrefix}-auth-token.${i}`, '', { maxAge: 0, path: '/' })
        }
      }
      
      // Now set the new session
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          refresh_token: session.refresh_token,
        }),
      })
      
      if (!response.ok) {
        console.error('[AUTH API] Error refreshing token:', response.statusText)
        return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
      }
      
      // Get the new session data
      const { access_token, refresh_token } = await response.json()
      
      // Create session data object to store in cookie
      const sessionData = {
        access_token,
        refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }
      
      // Set the session data in the cookie
      const cookieValue = JSON.stringify(sessionData)
      if (cookiePrefix) {
        // Main token cookie with 7 day expiration
        (await cookieStore).set(`sb-${cookiePrefix}-auth-token`, cookieValue, {
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      }
      
      console.log('[AUTH API] Auth token set successfully')
      return NextResponse.json({ message: 'Auth token set successfully' })
    } else if (event === 'SIGNED_OUT') {
      // Clear auth cookies
      const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''
      
      if (cookiePrefix) {
        // Clear main token
        (await cookieStore).set(`sb-${cookiePrefix}-auth-token`, '', { maxAge: 0, path: '/' })
        
        // Clear any fragment cookies
        for (let i = 0; i < 5; i++) {
          (await cookieStore).set(`sb-${cookiePrefix}-auth-token.${i}`, '', { maxAge: 0, path: '/' })
        }
      }
      
      console.log('[AUTH API] Auth cookies cleared')
      return NextResponse.json({ message: 'Auth cookies cleared' })
    }
    
    return NextResponse.json({ message: 'No action taken' })
  } catch (error) {
    console.error('[AUTH API] Error processing request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 