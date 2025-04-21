import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * API Route to sign the user out on the server.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    // Use the server client, ensuring cookie context is available
    const supabase = await createClient(); 
    
    console.log('[API Logout] Attempting to sign out user...');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[API Logout] Error signing out:', error.message);
      // Return error but maybe still try to clear cookies client-side via response?
      return NextResponse.json({ message: 'Server sign-out failed', error: error.message }, { status: 500 });
    }

    console.log('[API Logout] Server sign-out successful.');
    // Supabase client's signOut configured with cookies() should handle sending
    // the necessary Set-Cookie headers to expire the auth tokens.
    return NextResponse.json({ message: 'Logout successful' }, { status: 200 });

  } catch (err) {
    console.error('[API Logout] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ message: 'Server error during logout', error: message }, { status: 500 });
  }
} 