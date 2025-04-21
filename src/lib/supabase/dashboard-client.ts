import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'
import { redirect } from 'next/navigation'
import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// Emergency kill switch - set to true to force fallback dashboard
export const FORCE_FALLBACK = false

// Loop detection variables
const MAX_FETCH_ATTEMPTS = 2
const LOOP_STORAGE_KEY = 'supabase_fetch_attempts'
const LAST_ATTEMPT_TIME_KEY = 'supabase_last_attempt_time'
const LOOP_TIME_WINDOW = 3000 // 3 seconds

// Initialize the Supabase client for client components
export const createDashboardClient = () => {
  const supabase = createClientComponentClient<Database>()
  
  // Check for potential loops and handle them
  const detectLoop = () => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Get current attempts from storage
      const attemptsString = localStorage.getItem(LOOP_STORAGE_KEY)
      const attempts = attemptsString ? parseInt(attemptsString, 10) : 0
      const lastAttemptTime = parseInt(localStorage.getItem(LAST_ATTEMPT_TIME_KEY) || '0', 10)
      const currentTime = Date.now()
      
      // Check for rapid requests (possible loop)
      const isRapidRequests = (currentTime - lastAttemptTime) < LOOP_TIME_WINDOW && attempts > 0
      
      // If we exceed max attempts or have rapid requests, redirect to fallback
      if (attempts >= MAX_FETCH_ATTEMPTS || isRapidRequests) {
        console.error('Loop detected in Supabase client fetch operations', 
          { attempts, timeSinceLastAttempt: currentTime - lastAttemptTime })
          
        // Reset counters
        localStorage.setItem(LOOP_STORAGE_KEY, '0')
        localStorage.setItem(LAST_ATTEMPT_TIME_KEY, '0')
        
        try {
          // Check if we're already on the fallback page to prevent another loop
          if (!window.location.pathname.includes('/dashboard/fallback')) {
            redirect('/dashboard/fallback?loop_detected=true')
          }
        } catch (error) {
          console.error('Failed to redirect to fallback', error)
          // As a last resort, try direct navigation
          window.location.href = '/dashboard/fallback?loop_detected=true&direct=true'
        }
        return true
      }
      
      // Store attempt time
      localStorage.setItem(LAST_ATTEMPT_TIME_KEY, currentTime.toString())
      
      // Increment attempts
      localStorage.setItem(LOOP_STORAGE_KEY, (attempts + 1).toString())
      
      // Set a timeout to reset the counter (if successful operation)
      setTimeout(() => {
        // Only reset if we haven't redirected
        if (window.location.pathname !== '/dashboard/fallback') {
          localStorage.setItem(LOOP_STORAGE_KEY, '0')
        }
      }, 5000)
    }
    return false
  }
  
  // Check if we should force fallback
  if (FORCE_FALLBACK) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/dashboard/fallback')) {
      try {
        redirect('/dashboard/fallback?force_fallback=true')
      } catch (error) {
        console.error('Failed to redirect with Next.js redirect', error)
        window.location.href = '/dashboard/fallback?force_fallback=true&direct=true'
      }
    }
  }
  
  // Enhanced client with loop detection
  return {
    ...supabase,
    async getUser() {
      try {
        if (detectLoop() || FORCE_FALLBACK) {
          return { data: { user: null }, error: null }
        }
        return await supabase.auth.getUser()
      } catch (error) {
        console.error('Error in getUser', error)
        return { data: { user: null }, error: new Error('Client-side auth error') }
      }
    },
    async getSession() {
      try {
        if (detectLoop() || FORCE_FALLBACK) {
          return { data: { session: null }, error: null }
        }
        return await supabase.auth.getSession()
      } catch (error) {
        console.error('Error in getSession', error)
        return { data: { session: null }, error: new Error('Client-side session error') }
      }
    }
  }
}

export default createDashboardClient 