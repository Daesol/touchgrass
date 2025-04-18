import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Debug flag to log cookie operations
const DEBUG_COOKIES = true

// Function to get complete cookie value from fragments
async function getCompleteTokenFromFragments(cookieStore: any, baseName: string): Promise<string> {
  // If cookieStore is a promise, await it
  const resolvedCookieStore = await cookieStore
  
  // With Supabase SSR, tokens are split across multiple cookies with numeric suffixes
  // First try the base name (though often this won't exist for large tokens)
  const baseToken = resolvedCookieStore.get(baseName)
  if (baseToken?.value) {
    if (DEBUG_COOKIES) console.log(`[Complete Cookie] Using base token for ${baseName}`)
    return baseToken.value
  }
  
  // Check for fragmented cookies
  let fragments: {index: number, value: string}[] = []
  
  // Collect all fragments (we don't know how many there are)
  for (let i = 0; i < 10; i++) {
    const fragmentName = `${baseName}.${i}`
    const fragment = resolvedCookieStore.get(fragmentName)
    
    if (fragment?.value) {
      if (DEBUG_COOKIES) console.log(`[Fragment] Found ${fragmentName}`)
      fragments.push({
        index: i,
        value: fragment.value
      })
    }
  }
  
  // If we found fragments, sort and join them
  if (fragments.length > 0) {
    // Sort by index to ensure correct order
    fragments.sort((a, b) => a.index - b.index)
    
    // Join all fragment values
    const completeValue = fragments.map(f => f.value).join('')
    
    if (DEBUG_COOKIES) {
      console.log(`[Complete Cookie] Reconstructed token from ${fragments.length} fragments for ${baseName}: ` +
                 `fragments ${fragments.map(f => f.index).join(', ')}`)
    }
    
    return completeValue
  }
  
  if (DEBUG_COOKIES) console.log(`[Complete Cookie] No fragments found for ${baseName}`)
  return ''
}

export async function createSupabaseServerComponentClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = cookies()
            
            // Use the special handling for auth tokens
            if (name.includes('auth-token')) {
              const completeValue = await getCompleteTokenFromFragments(cookieStore, name)
              if (DEBUG_COOKIES) {
                console.log(`[Cookie Read] ${name}: ${completeValue ? 'reconstructed' : 'not found'}`)
              }
              return completeValue
            }
            
            // Default behavior for other cookies
            const cookie = (await cookieStore).get(name)
            if (DEBUG_COOKIES && (name.includes('supabase') || name.includes('auth'))) {
              console.log(`[Cookie Read] ${name}: ${cookie ? 'found' : 'not found'}`)
            }
            
            return cookie?.value || ''
          } catch (error) {
            console.error(`[Cookie Error] Failed to read cookie "${name}":`, error)
            return ''
          }
        },
        async set() {
          console.warn('Cannot set cookies in server components')
          return
        },
        async remove() {
          console.warn('Cannot remove cookies in server components')
          return
        },
      },
    }
  )
}

export async function createSupabaseServerActionClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = cookies()
            
            // Use the special handling for auth tokens
            if (name.includes('auth-token')) {
              const completeValue = await getCompleteTokenFromFragments(cookieStore, name)
              if (DEBUG_COOKIES) {
                console.log(`[Action Cookie Read] ${name}: ${completeValue ? 'reconstructed' : 'not found'}`)
              }
              return completeValue
            }
            
            // Default behavior for other cookies
            const cookie = (await cookieStore).get(name)
            if (DEBUG_COOKIES && (name.includes('supabase') || name.includes('auth'))) {
              console.log(`[Action Cookie Read] ${name}: ${cookie ? 'found' : 'not found'}`)
            }
            
            return cookie?.value || ''
          } catch (error) {
            console.error(`[Action Cookie Error] Failed to read cookie "${name}":`, error)
            return ''
          }
        },
        async set(name: string, value: string, options?: CookieOptions) {
          try {
            const cookieStore = cookies()
            
            if (DEBUG_COOKIES) {
              console.log(`[Action Cookie Set] Setting ${name}`)
            }
            
            (await cookieStore).set({
              name,
              value,
              ...options,
            })
          } catch (error) {
            console.error(`[Action Cookie Error] Failed to set cookie "${name}":`, error)
          }
        },
        async remove(name: string, options?: CookieOptions) {
          try {
            const cookieStore = cookies()
            
            if (DEBUG_COOKIES) {
              console.log(`[Action Cookie Remove] Removing ${name}`)
            }
            
            (await cookieStore).set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            })
          } catch (error) {
            console.error(`[Action Cookie Error] Failed to remove cookie "${name}":`, error)
          }
        },
      },
    }
  )
}

export function createSupabaseReqResClient(req: NextRequest) {
  const res = NextResponse.next()
  
  // Helper function for middleware cookies
  function getCompleteTokenFromRequestFragments(req: NextRequest, baseName: string): string {
    // With Supabase SSR, tokens are split across multiple cookies with numeric suffixes
    // First try the base name (though often this won't exist for large tokens)
    const baseToken = req.cookies.get(baseName)
    if (baseToken?.value) {
      if (DEBUG_COOKIES) console.log(`[Middleware Complete Cookie] Using base token for ${baseName}`)
      return baseToken.value
    }
    
    // Check for fragmented cookies
    let fragments: {index: number, value: string}[] = []
    
    // Collect all fragments (we don't know how many there are)
    for (let i = 0; i < 10; i++) {
      const fragmentName = `${baseName}.${i}`
      const fragment = req.cookies.get(fragmentName)
      
      if (fragment?.value) {
        if (DEBUG_COOKIES) console.log(`[Middleware Fragment] Found ${fragmentName}`)
        fragments.push({
          index: i,
          value: fragment.value
        })
      }
    }
    
    // If we found fragments, sort and join them
    if (fragments.length > 0) {
      // Sort by index to ensure correct order
      fragments.sort((a, b) => a.index - b.index)
      
      // Join all fragment values
      const completeValue = fragments.map(f => f.value).join('')
      
      if (DEBUG_COOKIES) {
        console.log(`[Middleware Complete Cookie] Reconstructed token from ${fragments.length} fragments for ${baseName}: ` +
                   `fragments ${fragments.map(f => f.index).join(', ')}`)
      }
      
      return completeValue
    }
    
    if (DEBUG_COOKIES) console.log(`[Middleware Complete Cookie] No fragments found for ${baseName}`)
    return ''
  }
  
  return {
    supabase: createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              // Use the special handling for auth tokens
              if (name.includes('auth-token')) {
                const completeValue = getCompleteTokenFromRequestFragments(req, name)
                if (DEBUG_COOKIES) {
                  console.log(`[Middleware Cookie Read] ${name}: ${completeValue ? 'reconstructed' : 'not found'}`)
                }
                return completeValue
              }
              
              // Default behavior for other cookies
              const cookie = req.cookies.get(name)
              if (DEBUG_COOKIES && (name.includes('supabase') || name.includes('auth'))) {
                console.log(`[Middleware Cookie Read] ${name}: ${cookie ? 'found' : 'not found'}`)
              }
              
              return cookie?.value || ''
            } catch (error) {
              console.error(`[Middleware Cookie Error] Failed to read cookie "${name}":`, error)
              return ''
            }
          },
          set(name: string, value: string, options?: CookieOptions) {
            try {
              if (DEBUG_COOKIES) {
                console.log(`[Middleware Cookie Set] Setting ${name}`)
              }
              
              res.cookies.set({
                name,
                value,
                ...options,
              })
            } catch (error) {
              console.error(`[Middleware Cookie Error] Failed to set cookie "${name}":`, error)
            }
          },
          remove(name: string, options?: CookieOptions) {
            try {
              if (DEBUG_COOKIES) {
                console.log(`[Middleware Cookie Remove] Removing ${name}`)
              }
              
              res.cookies.set({
                name,
                value: '',
                ...options,
                maxAge: 0,
              })
            } catch (error) {
              console.error(`[Middleware Cookie Error] Failed to remove cookie "${name}":`, error)
            }
          },
        },
      }
    ),
    res,
  }
} 