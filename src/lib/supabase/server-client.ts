import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies as requestCookies } from 'next/headers'
import { cookies as responseCookies } from 'next/headers'
import { CookieOptions } from '@supabase/ssr'
import { RequestCookies, ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'
import { GenericSchema, PostgrestDefaultSchema } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Debug flag to log cookie operations
const DEBUG_COOKIES = true

// Simple in-memory token cache to reduce redundant cookie checks
// Format: Map<cookieName, {value: string, timestamp: number}>
const TOKEN_CACHE = new Map();
const CACHE_TTL = 10000; // 10 seconds cache lifetime

// Cache for cookie values to reduce reads
const cookieCache = new Map<string, { value: string, timestamp: number }>();
const COOKIE_CACHE_TTL = 10 * 1000; // 10 seconds in milliseconds

// Function to get complete cookie value from fragments with caching
async function getCompleteTokenFromFragments(cookieStore: any, baseName: string): Promise<string> {
  // Check cache first
  const cacheKey = `fragment_${baseName}`;
  const cached = TOKEN_CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (DEBUG_COOKIES) console.log(`[Complete Cookie] Using cached value for ${baseName}`);
    return cached.value;
  }
  
  // If cookieStore is a promise, await it
  const resolvedCookieStore = await cookieStore
  
  // With Supabase SSR, tokens are split across multiple cookies with numeric suffixes
  // First try the base name (though often this won't exist for large tokens)
  const baseToken = resolvedCookieStore.get(baseName)
  if (baseToken?.value) {
    if (DEBUG_COOKIES) console.log(`[Complete Cookie] Using base token for ${baseName}`)
    // Cache the result
    TOKEN_CACHE.set(cacheKey, {
      value: baseToken.value,
      timestamp: Date.now()
    });
    return baseToken.value
  }
  
  // Check for fragmented cookies
  let fragments: {index: number, value: string}[] = []
  let foundAnyFragment = false;
  
  // Collect all fragments (we don't know how many there are)
  for (let i = 0; i < 5; i++) { // Reduced from 10 to 5 fragments
    const fragmentName = `${baseName}.${i}`
    const fragment = resolvedCookieStore.get(fragmentName)
    
    if (fragment?.value) {
      if (DEBUG_COOKIES) console.log(`[Fragment] Found ${fragmentName}`)
      fragments.push({
        index: i,
        value: fragment.value
      })
      foundAnyFragment = true;
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
    
    // Cache the result
    TOKEN_CACHE.set(cacheKey, {
      value: completeValue,
      timestamp: Date.now()
    });
    
    return completeValue
  }
  
  if (DEBUG_COOKIES && !foundAnyFragment) {
    console.log(`[Complete Cookie] No fragments found for ${baseName}`);
  }
  
  // Cache negative result too
  TOKEN_CACHE.set(cacheKey, {
    value: '',
    timestamp: Date.now()
  });
  
  return ''
}

// More efficient cookie reader with caching
export async function getCookieValue(
  name: string,
  { cookies }: { cookies: () => RequestCookies | ResponseCookies }
): Promise<string | undefined> {
  try {
    // Check cache first
    const now = Date.now();
    const cached = cookieCache.get(name);
    if (cached && now - cached.timestamp < COOKIE_CACHE_TTL) {
      // Use cached value
      return cached.value;
    }

    // No valid cache, need to read the cookie
    console.log(`[Cookie Read] Reading cookie value for: ${name}`);
    const cookieValue = cookies().get(name)?.value;
    
    // Cache the result
    if (cookieValue) {
      cookieCache.set(name, { value: cookieValue, timestamp: now });
    }
    
    return cookieValue;
  } catch (error) {
    console.error(`[Cookie Read Error] Failed to read cookie ${name}:`, error);
    return undefined;
  }
}

// More efficient cookie reader that handles fragments
export async function reconstructTokenFromCookieFragments(
  baseName: string,
  { cookies }: { cookies: () => RequestCookies | ResponseCookies }
): Promise<string | undefined> {
  try {
    // First check if we have a fully cached token for this base name
    const cacheKey = `${baseName}_full`;
    const now = Date.now();
    const cached = cookieCache.get(cacheKey);
    if (cached && now - cached.timestamp < COOKIE_CACHE_TTL) {
      return cached.value;
    }
    
    // Start with the base token
    let tokenValue = await getCookieValue(baseName, { cookies });
    if (!tokenValue) {
      // No base token found
      return undefined;
    }
    
    // Check if we need to reconstruct fragments
    // We'll only check a maximum of 5 fragments
    const fragments: string[] = [];
    for (let i = 0; i < 5; i++) {
      const fragmentName = `${baseName}.${i}`;
      const fragmentValue = await getCookieValue(fragmentName, { cookies });
      
      if (!fragmentValue) {
        // No more fragments
        break;
      }
      
      fragments.push(fragmentValue);
    }
    
    // Reconstruct the token if we found fragments
    if (fragments.length > 0) {
      tokenValue = [tokenValue, ...fragments].join('');
      
      // Cache the full reconstructed token
      cookieCache.set(cacheKey, { value: tokenValue, timestamp: now });
    }
    
    return tokenValue;
  } catch (error) {
    console.error(`[Cookie Fragment Error] Failed to reconstruct token from fragments for ${baseName}:`, error);
    return undefined;
  }
}

// Cookie reader for cookies().getAll()
export async function getAllCookies(
  { cookies }: { cookies: () => RequestCookies | ResponseCookies }
): Promise<{ name: string; value: string }[]> {
  if (typeof cookies !== 'function') {
    console.error('[Cookie Error] cookies is not a function', typeof cookies);
    return [];
  }
  
  try {
    const cookiesObj = cookies();
    if (!cookiesObj) {
      console.error('[Cookie Error] cookies() returned null/undefined');
      return [];
    }
    
    // Handle different cookie types based on interface available
    if (typeof cookiesObj.getAll === 'function') {
      return cookiesObj.getAll();
    } else {
      // For Response cookies that don't have getAll
      // This is an empty implementation as ResponseCookies usually don't support getAll
      // In production, you'd need to implement a custom solution based on your need
      console.warn('[Cookie Warning] cookies().getAll() not supported');
      return [];
    }
  } catch (error) {
    console.error('[Cookie Error] Failed to get all cookies:', error);
    return [];
  }
}

// More efficient cookie writer
export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions,
  { cookies }: { cookies: () => ResponseCookies }
): Promise<void> {
  if (typeof cookies !== 'function') {
    console.error('[Cookie Error] cookies is not a function', typeof cookies);
    return;
  }
  
  try {
    const cookiesObj = cookies();
    if (!cookiesObj || typeof cookiesObj.set !== 'function') {
      console.error('[Cookie Error] cookies().set is not a function');
      return;
    }
    
    // Set the cookie
    cookiesObj.set(name, value, options);
    
    // Update cache
    cookieCache.set(name, { value, timestamp: Date.now() });
    
    // Also clear any cached full token if this is a fragment
    if (name.includes('.')) {
      const baseName = name.split('.')[0];
      cookieCache.delete(`${baseName}_full`);
    }
  } catch (error) {
    console.error(`[Cookie Error] Failed to set cookie ${name}:`, error);
  }
}

export async function createSupabaseServerComponentClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            // Check cache for any cookie
            const cacheKey = `cookie_${name}`;
            const cached = TOKEN_CACHE.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
              if (DEBUG_COOKIES) console.log(`[Cookie Read] ${name}: using cached value`);
              return cached.value;
            }
            
            const cookieStore = cookies()
            
            // Use the special handling for auth tokens
            if (name.includes('auth-token')) {
              const completeValue = await getCompleteTokenFromFragments(cookieStore, name)
              if (DEBUG_COOKIES) {
                console.log(`[Cookie Read] ${name}: ${completeValue ? 'reconstructed' : 'not found'}`)
              }
              
              // Cache result
              TOKEN_CACHE.set(cacheKey, {
                value: completeValue,
                timestamp: Date.now()
              });
              
              return completeValue
            }
            
            // Default behavior for other cookies
            const cookie = (await cookieStore).get(name)
            const value = cookie?.value || '';
            
            // Cache result
            TOKEN_CACHE.set(cacheKey, {
              value,
              timestamp: Date.now()
            });
            
            if (DEBUG_COOKIES && (name.includes('supabase') || name.includes('auth'))) {
              console.log(`[Cookie Read] ${name}: ${cookie ? 'found' : 'not found'}`)
            }
            
            return value
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

export async function createSupabaseServerActionClient<
  Schema extends GenericSchema = PostgrestDefaultSchema
>() {
  // Generate a random ID for this client instance for debugging
  const clientId = Math.random().toString(36).substring(2, 8);
  console.log(`[Server Action Client ${clientId}] Creating new Supabase Server Action client`);
  
  // Get the database URL and anonymous key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Create a custom version of getCookie that handles both the base cookie and fragments
  const cookieStore = new Map<string, string>();
  
  return createServerClient<Schema>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        // Check in-memory first
        if (cookieStore.has(name)) {
          return cookieStore.get(name);
        }
        
        // For now return undefined. We'll implement our own token handling
        return undefined;
      },
      set(name, value, options) {
        cookieStore.set(name, value);
      },
      remove(name, options) {
        cookieStore.delete(name);
      },
    },
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
    },
    auth: {
      storage: {
        getItem: (name) => {
          if (name.includes('auth-token') || name.includes('auth-admin-token')) {
            // Use our custom implementation to get the token from cookies
            // Here we would have to load the token from HTTP cookies
            // But we don't have the req/res here, so we'll return null
            console.log(`[Server Action Client ${clientId}] getItem called for auth token`);
            return null;
          }
          return null; // Return null for other keys
        },
        setItem: (name, value) => {
          // Similarly, we can't set cookies here
          console.log(`[Server Action Client ${clientId}] setItem called for ${name}`);
        },
        removeItem: (name) => {
          // Similarly, we can't remove cookies here
          console.log(`[Server Action Client ${clientId}] removeItem called for ${name}`);
        },
      },
    },
    global: {
      fetch: (url, options) => {
        console.log(`[Server Action Client ${clientId}] Fetch: ${url}`);
        return fetch(url, options);
      },
    },
  });
}

export function createSupabaseReqResClient(req: NextRequest) {
  const res = NextResponse.next()
  
  // Helper function for middleware cookies with caching
  function getCompleteTokenFromRequestFragments(req: NextRequest, baseName: string): string {
    // Check cache first
    const cacheKey = `middleware_${baseName}`;
    const cached = TOKEN_CACHE.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (DEBUG_COOKIES) console.log(`[Middleware Complete Cookie] Using cached value for ${baseName}`);
      return cached.value;
    }
    
    // With Supabase SSR, tokens are split across multiple cookies with numeric suffixes
    // First try the base name (though often this won't exist for large tokens)
    const baseToken = req.cookies.get(baseName)
    if (baseToken?.value) {
      if (DEBUG_COOKIES) console.log(`[Middleware Complete Cookie] Using base token for ${baseName}`)
      
      // Cache the result
      TOKEN_CACHE.set(cacheKey, {
        value: baseToken.value,
        timestamp: Date.now()
      });
      
      return baseToken.value
    }
    
    // Check for fragmented cookies
    let fragments: {index: number, value: string}[] = []
    let foundAnyFragment = false;
    
    // Collect all fragments (we don't know how many there are)
    for (let i = 0; i < 5; i++) { // Reduced from 10 to 5
      const fragmentName = `${baseName}.${i}`
      const fragment = req.cookies.get(fragmentName)
      
      if (fragment?.value) {
        if (DEBUG_COOKIES) console.log(`[Middleware Fragment] Found ${fragmentName}`)
        fragments.push({
          index: i,
          value: fragment.value
        })
        foundAnyFragment = true;
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
      
      // Cache the result
      TOKEN_CACHE.set(cacheKey, {
        value: completeValue,
        timestamp: Date.now()
      });
      
      return completeValue
    }
    
    if (DEBUG_COOKIES && !foundAnyFragment) {
      console.log(`[Middleware Complete Cookie] No fragments found for ${baseName}`)
    }
    
    // Cache negative result too
    TOKEN_CACHE.set(cacheKey, {
      value: '',
      timestamp: Date.now()
    });
    
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
              // Check cache first
              const cacheKey = `middleware_read_${name}`;
              const cached = TOKEN_CACHE.get(cacheKey);
              
              if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                if (DEBUG_COOKIES) console.log(`[Middleware Cookie Read] ${name}: using cached value`);
                return cached.value;
              }
              
              // Use the special handling for auth tokens
              if (name.includes('auth-token')) {
                const completeValue = getCompleteTokenFromRequestFragments(req, name)
                if (DEBUG_COOKIES) {
                  console.log(`[Middleware Cookie Read] ${name}: ${completeValue ? 'reconstructed' : 'not found'}`)
                }
                
                // Cache the result
                TOKEN_CACHE.set(cacheKey, {
                  value: completeValue,
                  timestamp: Date.now()
                });
                
                return completeValue
              }
              
              // Default behavior for other cookies
              const cookie = req.cookies.get(name)
              const value = cookie?.value || '';
              
              // Cache the result
              TOKEN_CACHE.set(cacheKey, {
                value,
                timestamp: Date.now()
              });
              
              if (DEBUG_COOKIES && (name.includes('supabase') || name.includes('auth'))) {
                console.log(`[Middleware Cookie Read] ${name}: ${cookie ? 'found' : 'not found'}`)
              }
              
              return value
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