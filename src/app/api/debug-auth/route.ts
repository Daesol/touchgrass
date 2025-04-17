import { createSupabaseServerActionClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerActionClient()
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'status'
    
    // Get auth configuration and status
    if (action === 'status') {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Check configured redirect URLs
      const origin = request.nextUrl.origin
      const callbackUrl = `${origin}/auth/callback`
      
      return NextResponse.json({
        status: 'ok',
        authUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        session: session ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            emailConfirmed: session.user.email_confirmed_at !== null,
            lastSignIn: session.user.last_sign_in_at,
            createdAt: session.user.created_at,
          }
        } : null,
        config: {
          redirectUrl: callbackUrl,
          siteUrl: origin,
        }
      })
    }
    
    // Test the email signup callback URL format
    if (action === 'test-callback') {
      const code = 'example-code'
      const type = 'signup'
      const mockCallbackUrl = `${request.nextUrl.origin}/auth/callback?code=${code}&type=${type}`
      
      return NextResponse.json({
        status: 'ok',
        mockCallbackUrl,
        urlInfo: {
          baseUrl: request.nextUrl.origin,
          callbackPath: '/auth/callback',
          fullCallbackUrlFormat: mockCallbackUrl,
        }
      })
    }
    
    return NextResponse.json({
      status: 'error',
      message: 'Invalid action',
      validActions: ['status', 'test-callback']
    })
    
  } catch (error) {
    console.error('Auth debug error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
} 