import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses the cookies() function from next/headers for cookie management following the latest Supabase SSR pattern.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // setAll can be called multiple times for a single request
            // Each time, we need to set all cookies on the Response cookie store
            // See: https://github.com/supabase/ssr/issues/78
            cookiesToSet.forEach(({ name, value, options }) => {
              // Overwrite existing cookies
              // Use request.cookies.set first to get the correct ResponseCookies store
              // See: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
             console.warn(`[Supabase Server Client - setAll] Ignoring error in read-only context (Server Component?): ${error instanceof Error ? error.message : error}`);
          }
        },
      },
    }
  )
} 