'use client'

import { useState, useEffect, useCallback } from 'react'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook for authentication state and operations
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  
  // Get the current session/user
  useEffect(() => {
    if (initialized) return
    
    async function initializeAuth() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Check for active session
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        // Subscribe to changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event: AuthChangeEvent, session: Session | null) => {
            setSession(session)
            setUser(session?.user ?? null)
            
            // Force refresh on auth changes
            if (session || event === 'SIGNED_OUT') {
              router.refresh()
            }
          }
        )
        
        setInitialized(true)
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initializeAuth()
  }, [router, initialized])
  
  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        return data
      } catch (error) {
        console.error('Error signing in:', error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )
  
  // Sign in with OAuth provider
  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github' | 'facebook') => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback`
          }
        })
        
        if (error) throw error
        
        return data
      } catch (error) {
        console.error(`Error signing in with ${provider}:`, error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )
  
  // Sign up with email and password
  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`
          }
        })
        
        if (error) throw error
        
        return data
      } catch (error) {
        console.error('Error signing up:', error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )
  
  // Sign out
  const signOut = useCallback(
    async (redirectTo = '/login') => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        // Sync with server by calling API
        await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event: 'SIGNED_OUT',
            session: null
          })
        })
        
        // Redirect to login or specified page
        window.location.href = redirectTo
      } catch (error) {
        console.error('Error signing out:', error)
        // Even on error, redirect to login
        window.location.href = `${redirectTo}?error=signout_error`
      } finally {
        setLoading(false)
      }
    },
    []
  )
  
  // Reset password with email
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/features/auth/reset-password`
        })
        
        if (error) throw error
        
        return true
      } catch (error) {
        console.error('Error resetting password:', error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )
  
  return {
    user,
    session,
    loading,
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  }
} 