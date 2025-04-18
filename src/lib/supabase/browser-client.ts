import { createBrowserClient } from '@supabase/ssr'

// Cache the client instance to avoid multiple initializations
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;
let clientCreationTime: number = 0;
const MAX_CLIENT_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds

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
      // Let the browser handle cookies automatically
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      // Add request timeout
      global: {
        fetch: (url, options) => {
          // Safety check for URL
          if (!url) {
            console.error('[Browser Client] Invalid URL provided to fetch');
            return Promise.reject(new Error('Invalid URL provided to fetch'));
          }
          
          // Create a controller for request cancellation
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn('[Browser Client] Request timed out:', typeof url === 'string' ? url : url.toString());
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