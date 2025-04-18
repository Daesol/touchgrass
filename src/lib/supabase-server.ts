import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) {
          return (await cookies()).get(name)?.value
        },
        async set(name, value, options) {
          try {
            (await cookies()).set(name, value, options)
          } catch (error) {
            // Handle error if needed
          }
        },
        async remove(name, options) {
          try {
            (await cookies()).set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // Handle error if needed
          }
        },
      },
    }
  )
} 