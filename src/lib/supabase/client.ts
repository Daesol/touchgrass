'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types' // Assuming Database types are defined

/**
 * Creates a Supabase client for Client Components.
 * This is the standard pattern recommended by Supabase SSR docs.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Removed the older createSupabaseBrowserClient and useSupabaseBrowser functions
// as they are redundant with the standard createClient above. 