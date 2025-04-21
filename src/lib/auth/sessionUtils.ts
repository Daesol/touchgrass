import { createSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Type definition for session data
 */
export interface SessionData {
  access_token: string
  refresh_token: string
  expires_at?: number
  user?: {
    id: string
    email?: string
    role?: string
  }
}

/**
 * Checks if the current session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    return !!session && !!session.access_token
  } catch (error) {
    console.error('Error checking session validity:', error)
    return false
  }
}

/**
 * Gets the current session if it exists
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return null
    
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      } : undefined
    }
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

/**
 * Refreshes the current session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error || !session) {
      console.error('Error refreshing session:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error refreshing session:', error)
    return false
  }
}

/**
 * Clears the current session
 */
export async function clearSession(): Promise<void> {
  try {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    
    // Clear any session-related cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=')
      if (name && (name.includes('auth-token') || name.includes('supabase'))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      }
    })
  } catch (error) {
    console.error('Error clearing session:', error)
  }
}

/**
 * Gets user data from the current session
 */
export async function getCurrentUser() {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      role: user.role
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
} 