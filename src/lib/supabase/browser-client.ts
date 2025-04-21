import { createBrowserClient } from '@supabase/ssr'

// Cache the client instance to avoid multiple initializations
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;
let clientCreationTime: number = 0;
const MAX_CLIENT_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds

// Rate limiting tracking
const API_CALLS = {
  auth: {
    lastCalls: new Map<string, number[]>(),
    limits: {
      'signup': { max: 3, window: 60 * 1000 }, // 3 calls per minute
      'signin': { max: 5, window: 60 * 1000 }, // 5 calls per minute
      'signout': { max: 5, window: 60 * 1000 }, // 5 calls per minute
      'user': { max: 10, window: 60 * 1000 }, // 10 calls per minute
      'session': { max: 10, window: 60 * 1000 }, // 10 calls per minute
      'default': { max: 10, window: 60 * 1000 } // default rate limit
    }
  }
};

// Check if a call should be rate limited
function shouldRateLimit(category: 'auth', operation: string): boolean {
  const now = Date.now();
  const categoryLimits = API_CALLS[category];
  
  // Find the specific limit for this operation or use default
  const limitKey = Object.keys(categoryLimits.limits).find(key => 
    operation.toLowerCase().includes(key.toLowerCase())
  ) || 'default';
  
  const limit = categoryLimits.limits[limitKey as keyof typeof categoryLimits.limits];
  
  // Initialize or get the call history
  if (!categoryLimits.lastCalls.has(operation)) {
    categoryLimits.lastCalls.set(operation, [now]);
    return false;
  }
  
  // Get calls within the time window
  const calls = categoryLimits.lastCalls.get(operation)!;
  const recentCalls = calls.filter(time => now - time < limit.window);
  
  // Update the call history
  categoryLimits.lastCalls.set(operation, [...recentCalls, now]);
  
  // Check if rate limited
  return recentCalls.length >= limit.max;
}

export function createSupabaseBrowserClient() {
  const now = Date.now();
  
  // Return cached instance if it exists and is not too old
  if (browserClientInstance && now - clientCreationTime < MAX_CLIENT_AGE) {
    return browserClientInstance;
  }
  
  // If the client is too old or doesn't exist, create a new one
  console.log('[Browser Client] Creating new Supabase browser client');
  
  // Create a new client with timeout options
  browserClientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Use PKCE flow for more secure auth
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      // Add request timeout and rate limiting
      global: {
        fetch: (url, options) => {
          // Safety check for URL
          if (!url) {
            console.error('[Browser Client] Invalid URL provided to fetch');
            return Promise.reject(new Error('Invalid URL provided to fetch'));
          }
          
          // Check for rate limiting based on URL and method
          const urlStr = typeof url === 'string' ? url : url.toString();
          
          // Handle auth rate limiting
          if (urlStr.includes('/auth/v1/')) {
            // Extract operation (signup, token, etc)
            const operation = urlStr.split('/auth/v1/')[1]?.split('?')[0] || 'default';
            
            if (shouldRateLimit('auth', operation)) {
              console.warn(`[Browser Client] Rate limited ${operation} operation`);
              return Promise.reject({
                status: 429,
                error: 'Too Many Requests',
                message: 'You are making too many requests. Please try again later.'
              });
            }
          }
          
          // Create a controller for request cancellation
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn('[Browser Client] Request timed out:', urlStr);
          }, 8000); // 8 second timeout
          
          // Add the signal to the options
          const fetchOptions = {
            ...options,
            signal: controller.signal
          };
          
          // Make the fetch call and clear the timeout if it completes
          return fetch(url, fetchOptions)
            .then(response => {
              clearTimeout(timeoutId);
              return response;
            })
            .catch(error => {
              clearTimeout(timeoutId);
              if (error.name === 'AbortError') {
                console.error('[Browser Client] Request was aborted due to timeout');
                throw new Error('Request timeout');
              }
              throw error;
            });
        }
      }
    }
  );
  
  // Record the creation time
  clientCreationTime = now;
  
  return browserClientInstance;
} 