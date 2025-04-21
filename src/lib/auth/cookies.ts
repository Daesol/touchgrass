import { NextRequest, NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'
import { apiSuccess, apiError, withErrorHandling, ApiResponse } from '@/lib/api/response'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { RequestCookies, ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'

// Constants
const COOKIE_CACHE_TTL = 1000; // 1 second cache TTL for cookie reads
const DEBUG_COOKIES = false; // Set to false to disable verbose logging

// Type alias for different cookie store types
type CookieStore = ReadonlyRequestCookies | RequestCookies | ResponseCookies

// Cache for cookie values to reduce redundant reads
const cookieCache = new Map<string, { value: string; timestamp: number }>()

/**
 * Utility class for handling cookies, particularly Supabase auth token cookies
 * which may be fragmented across multiple cookies
 */
export class CookieManager {
  static MAX_CHUNK_SIZE = 4000; // Reduced slightly for safety margin
  static MAX_CHUNKS = 5; // Limit fragmentation

  /**
   * Read a cookie value with caching
   */
  static async get(name: string, cookieStore: CookieStore): Promise<string | undefined> {
    try {
      // Check cache first
      const now = Date.now()
      const cacheKey = `cookie_${name}`
      const cached = cookieCache.get(cacheKey)
      
      if (cached && now - cached.timestamp < COOKIE_CACHE_TTL) {
        if (DEBUG_COOKIES) console.log(`[Cookie] Using cached value for ${name}`)
        return cached.value
      }

      // No valid cache, read the cookie
      const cookie = cookieStore.get(name)
      const value = cookie?.value

      // Cache the result
      if (value) {
        cookieCache.set(cacheKey, { value, timestamp: now })
      }

      return value
    } catch (error) {
      console.error(`[Cookie Error] Failed to read cookie "${name}":`, error)
      return undefined
    }
  }

  /**
   * Set a cookie value and update cache
   */
  static set(
    name: string, 
    value: string, 
    options: CookieOptions, 
    cookieStore: ResponseCookies
  ): void {
    try {
      // Set the cookie
      cookieStore.set(name, value, options as any) // Cast needed due to type mismatch
      
      // Update cache
      cookieCache.set(`cookie_${name}`, { value, timestamp: Date.now() })
      
      // If this is a fragment, invalidate the composite cache entry
      if (name.includes('.')) {
        const baseName = name.split('.')[0]
        cookieCache.delete(`composite_${baseName}`)
      }
      
      if (DEBUG_COOKIES) console.log(`[Cookie] Set ${name}`)
    } catch (error) {
      console.error(`[Cookie Error] Failed to set cookie "${name}":`, error)
    }
  }

  /**
   * Delete a cookie and clear cache
   */
  static delete(
    name: string,
    options: CookieOptions, 
    cookieStore: ResponseCookies
  ): void {
    try {
      // Delete by setting expired date
      cookieStore.set(name, '', { 
        ...options as any, // Cast needed
        maxAge: 0, 
      })
      
      // Clear from cache
      cookieCache.delete(`cookie_${name}`)
      
      // If this is a fragment, invalidate the composite cache entry
      if (name.includes('.')) {
        const baseName = name.split('.')[0]
        cookieCache.delete(`composite_${baseName}`)
      }
      
      if (DEBUG_COOKIES) console.log(`[Cookie] Deleted ${name}`)
    } catch (error) {
      console.error(`[Cookie Error] Failed to delete cookie "${name}":`, error)
    }
  }

  /**
   * Get a potentially fragmented cookie value
   * @param baseName The base name of the cookie (e.g., 'sb-auth-token')
   * @param cookieStore The cookie store instance
   * @returns The complete cookie value
   */
  static async getCompositeValue(
    baseName: string,
    cookieStore: CookieStore
  ): Promise<string> {
    try {
      // Check cache first
      const now = Date.now()
      const cacheKey = `composite_${baseName}`
      const cached = cookieCache.get(cacheKey)
      
      if (cached && now - cached.timestamp < COOKIE_CACHE_TTL) {
        if (DEBUG_COOKIES) console.log(`[Composite Cookie] Using cached value for ${baseName}`)
        return cached.value
      }
      
      // First try the base cookie
      const baseValue = await this.get(baseName, cookieStore)
      if (baseValue) {
        cookieCache.set(cacheKey, { value: baseValue, timestamp: now })
        return baseValue
      }
      
      // Check for fragments
      const fragments: { index: number; value: string }[] = []
      
      // We'll check up to 5 fragments (common Supabase pattern)
      for (let i = 0; i < 5; i++) {
        const fragmentName = `${baseName}.${i}`
        const fragmentValue = await this.get(fragmentName, cookieStore)
        
        if (fragmentValue) {
          fragments.push({
            index: i,
            value: fragmentValue
          })
        }
      }
      
      // If found fragments, reconstruct the value
      if (fragments.length > 0) {
        // Sort by index to ensure correct order
        fragments.sort((a, b) => a.index - b.index)
        
        // Join the fragments
        const compositeValue = fragments.map(f => f.value).join('')
        
        if (DEBUG_COOKIES) {
          console.log(
            `[Composite Cookie] Reconstructed value for ${baseName} from ${fragments.length} fragments`
          )
        }
        
        // Cache the result
        cookieCache.set(cacheKey, { value: compositeValue, timestamp: now })
        
        return compositeValue
      }
      
      if (DEBUG_COOKIES) console.log(`[Composite Cookie] No fragments found for ${baseName}`)
      return ''
    } catch (error) {
      console.error(`[Cookie Error] Failed to get composite value for "${baseName}":`, error)
      return ''
    }
  }

  /**
   * Split a string into chunks of a given size
   */
  static chunkString(value: string, size: number): string[] {
    const chunks = []
    for (let i = 0; i < value.length; i += size) {
      chunks.push(value.substring(i, i + size))
    }
    return chunks
  }

  /**
   * Set a cookie, fragmenting if necessary
   * @param baseName Base name for the cookie
   * @param value The value to set
   * @param options Cookie options
   * @param cookieStore Cookie store instance
   * @param maxChunkSize Max size per cookie chunk (default 4000)
   */
  static setFragmented(
    baseName: string, 
    value: string, 
    options: CookieOptions, 
    cookieStore: ResponseCookies,
    maxChunkSize = 4000 // Safe size for most browsers
  ): void {
    try {
      // Clear any existing fragments or base cookie first to avoid conflicts
      this.delete(baseName, options, cookieStore);
      for (let i = 0; i < this.MAX_CHUNKS; i++) {
          this.delete(`${baseName}.${i}`, { path: options.path || '/' } as CookieOptions, cookieStore);
      }

      // If the value is small enough, just set it directly using the base name
      if (value.length <= maxChunkSize) {
        this.set(baseName, value, options, cookieStore);
        if (DEBUG_COOKIES) console.log(`[Fragmented Cookie] Set ${baseName} directly (not fragmented)`);
        return;
      }
      
      // Split into chunks
      const chunks = this.chunkString(value, maxChunkSize);
      
      if (chunks.length > this.MAX_CHUNKS) {
          throw new Error('Cookie value too large to be fragmented within limits.');
      }

      if (DEBUG_COOKIES) {
        console.log(`[Fragmented Cookie] Splitting ${baseName} into ${chunks.length} fragments`);
      }

      // Set each chunk as a separate cookie
      for (let i = 0; i < chunks.length; i++) {
        const fragmentName = `${baseName}.${i}`;
        this.set(fragmentName, chunks[i], options, cookieStore);
      }
      
      // Base cookie name is already deleted at the start
      // Invalidate the composite cache (though deleting base/fragments in set/delete should handle this)
      cookieCache.delete(`composite_${baseName}`);

    } catch (error) {
      console.error(`[Cookie Error] Failed to set fragmented cookie "${baseName}":`, error);
    }
  }

  /**
   * Clear all cookies starting with a specific prefix (base and fragments)
   */
  static clearAllWithPrefix(
    prefix: string,
    options: CookieOptions, 
    cookieStore: ResponseCookies
  ): void {
    try {
      // Clear base cookie
      this.delete(prefix, options, cookieStore)
      
      // Clear fragments
      for (let i = 0; i < 5; i++) {
        this.delete(`${prefix}.${i}`, options, cookieStore)
      }
      
      // Clear from cache
      cookieCache.delete(`composite_${prefix}`)
      cookieCache.delete(`cookie_${prefix}`)
      
      if (DEBUG_COOKIES) console.log(`[Cookie] Cleared all cookies with prefix ${prefix}`)
    } catch (error) {
      console.error(`[Cookie Error] Failed to clear cookies with prefix "${prefix}":`, error)
    }
  }
  
  /**
   * Helper for Next.js middleware to handle cookies in the request
   */
  static getFromRequest(name: string, req: NextRequest): string | undefined {
    try {
      const cookie = req.cookies.get(name)
      return cookie?.value
    } catch (error) {
      console.error(`[Cookie Error] Failed to get cookie from request "${name}":`, error)
      return undefined
    }
  }
  
  /**
   * Helper for Next.js middleware to get composite value from the request
   */
  static async getCompositeFromRequest(baseName: string, req: NextRequest): Promise<string> {
    // First try direct cookie
    const baseValue = this.getFromRequest(baseName, req)
    if (baseValue) return baseValue
    
    // Check for fragments
    const fragments: { index: number; value: string }[] = []
    
    for (let i = 0; i < 5; i++) {
      const fragmentName = `${baseName}.${i}`
      const fragmentValue = this.getFromRequest(fragmentName, req)
      
      if (fragmentValue) {
        fragments.push({
          index: i,
          value: fragmentValue
        })
      }
    }
    
    // Reconstruct if needed
    if (fragments.length > 0) {
      fragments.sort((a, b) => a.index - b.index)
      return fragments.map(f => f.value).join('')
    }
    
    return ''
  }
  
  /**
   * Helper to clear cookies in a Next.js response
   */
  static clearAllAuthCookies(res: NextResponse): void {
    const cookiePrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''
    
    if (cookiePrefix) {
      this.clearAllWithPrefix(`sb-${cookiePrefix}-auth-token`, { path: '/' }, res.cookies)
    }
  }
} 