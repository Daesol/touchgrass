import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Function to handle logout POST request
export async function POST() {
  try {
    // Initialize Supabase with admin permissions for logout
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Call Supabase's signOut method
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error during logout:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Clear all Supabase auth cookies manually
    const cookieStore = cookies()
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-provider-token',
      // Add the specific cookie name from your logs
      'sb-nlqfvldarwbkgbumnhex-auth-token',
      'sb-nlqfvldarwbkgbumnhex-auth-token.0',
      'sb-nlqfvldarwbkgbumnhex-auth-token.1',
      'sb-nlqfvldarwbkgbumnhex-auth-token.2',
      'sb-nlqfvldarwbkgbumnhex-auth-token.3',
      'sb-nlqfvldarwbkgbumnhex-auth-token.4'
    ]
    
    // Clear each cookie
    for (const name of cookiesToClear) {
      cookieStore.set({
        name,
        value: '',
        expires: new Date(0),
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      })
    }
    
    console.log('Successfully logged out and cleared cookies')
    
    // Return success response with redirects
    return NextResponse.json(
      { success: true },
      { 
        status: 200,
        headers: {
          'Set-Cookie': 'sb-nlqfvldarwbkgbumnhex-auth-token=; Max-Age=0; Path=/; HttpOnly',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
} 