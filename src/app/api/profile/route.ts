import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  console.log('[API] Profile request initiated')
  
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[API] Profile authentication error:', authError?.message || 'No user found')
      return NextResponse.json({ profile: null, error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log(`[API] User authenticated: ${user.id}`)
    
    // Try to get profile from public.profiles first
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[API] Error fetching profile from public.profiles:', profileError.message)
    } else if (profileData) {
      console.log('[API] Profile found in public.profiles')
      return NextResponse.json({ profile: profileData })
    }
    
    // Try touchgrass_profiles if public.profiles failed
    const { data: touchgrassProfile, error: touchgrassError } = await supabase
      .from('touchgrass_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (touchgrassError && touchgrassError.code !== 'PGRST116') {
      console.error('[API] Error fetching profile from touchgrass_profiles:', touchgrassError.message)
    } else if (touchgrassProfile) {
      console.log('[API] Profile found in touchgrass_profiles')
      return NextResponse.json({ profile: touchgrassProfile })
    }
    
    console.log('[API] No profile found for user')
    return NextResponse.json({ profile: null })
    
  } catch (error) {
    console.error('[API] Unexpected error in profile route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 