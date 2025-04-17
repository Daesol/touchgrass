"use client"

import { useState, Suspense, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectedFrom') || '/dashboard'
  const verificationNeeded = searchParams.get('verification_needed') === 'true'
  const emailFromParams = searchParams.get('email') || ''
  const clearSession = searchParams.get('clear_session') === 'true'
  const errorFromParams = searchParams.get('error') || ''
  
  // Show emergency options automatically if there are errors
  useEffect(() => {
    if (errorFromParams || clearSession) {
      setShowEmergencyOptions(true);
    }
  }, [errorFromParams, clearSession]);
  
  // Handle session clearing and error messages from URL parameters
  useEffect(() => {
    const handleInitialState = async () => {
      // Get the force parameter
      const forceCleanup = searchParams.get('force') === 'true';
      
      // Clear all cookies if there's a redirect loop or auth error
      if (clearSession || errorFromParams || forceCleanup) {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase.auth.signOut()
          
          // Clear all cookies to prevent issues
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=')
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
          })
          
          // Clear localStorage items related to auth
          localStorage.removeItem('supabase-auth-token')
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem('supabase_fetch_attempts')
          localStorage.removeItem('redirect-count')
          localStorage.removeItem('redirect-timestamp')
          
          // If force cleanup, clear everything
          if (forceCleanup) {
            console.log('Force cleanup: clearing all storage');
            localStorage.clear();
            sessionStorage.clear();
            
            // Try to clear IndexedDB
            try {
              window.indexedDB.databases().then(dbs => {
                dbs.forEach(db => {
                  if (db.name) {
                    window.indexedDB.deleteDatabase(db.name);
                  }
                })
              });
            } catch (e) {
              console.error('Error clearing IndexedDB:', e);
            }
            
            setSuccessMessage('All cookies and browser storage have been forcefully cleared. You can now log in safely.');
          } else if (clearSession) {
            setSuccessMessage('Your session has been cleared. Please log in again.');
          }
        } catch (err) {
          console.error('Error clearing session:', err)
        }
      }

      // Show verification message
      if (verificationNeeded && emailFromParams) {
        setEmail(emailFromParams)
        setError('Your email address has not been verified. Please check your inbox for a verification email.')
      }
      
      // Show error from middleware or other parts of the app
      if (errorFromParams) {
        setError(`Login error: ${errorFromParams}`)
      }
    }
    
    handleInitialState()
  }, [clearSession, verificationNeeded, emailFromParams, errorFromParams])
  
  const resendConfirmationEmail = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      
      if (error) {
        setError(`Failed to resend confirmation email: ${error.message}`)
      } else {
        setSuccessMessage('Confirmation email resent! Please check your inbox and spam folder.')
      }
    } catch (err) {
      setError('An unexpected error occurred while resending confirmation email.')
      console.error('Resend error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    const supabase = createSupabaseBrowserClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      
      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        // Email is not confirmed, sign out and ask user to confirm
        await supabase.auth.signOut()
        
        setError('Your email address has not been verified. Please check your inbox for a verification email.')
        setLoading(false)
        return
      }
      
      // Email is confirmed, proceed with login
      setSuccessMessage('Login successful! Redirecting...')
      
      // Delay navigation slightly to ensure cookies are set
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 500)
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }
  
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    const supabase = createSupabaseBrowserClient()
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold">NetworkPro</h1>
          <h2 className="mt-2 text-xl font-semibold">Log in to your account</h2>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
            {error.includes('not been verified') && (
              <button
                onClick={resendConfirmationEmail}
                className="block mt-2 text-blue-600 hover:underline"
                disabled={loading}
              >
                Resend verification email
              </button>
            )}
          </div>
        )}
        
        {successMessage && (
          <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
            {successMessage}
          </div>
        )}
        
        {/* Show emergency options if there was an error */}
        {showEmergencyOptions && (
          <div className="p-3 text-sm bg-amber-50 border border-amber-200 rounded-md">
            <p className="font-medium text-amber-800 mb-2">Having trouble logging in?</p>
            <div className="space-y-2">
              <Link 
                href="/dashboard/emergency" 
                className="block w-full py-2 px-4 text-center text-white bg-amber-600 hover:bg-amber-700 rounded-md"
              >
                Use Emergency Dashboard
              </Link>
              <Link 
                href="/bypass" 
                className="block w-full py-2 px-4 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Direct Bypass Mode
              </Link>
              <button
                onClick={() => {
                  // Hard clear all cookies and storage
                  document.cookie.split(';').forEach(cookie => {
                    const [name] = cookie.trim().split('=')
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
                  });
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="block w-full py-2 px-4 text-center text-amber-800 bg-white border border-amber-300 hover:bg-amber-50 rounded-md"
              >
                Clear All Cookies & Reload
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-white bg-primary hover:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-muted-foreground bg-card">Or continue with</span>
          </div>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center w-full py-2 px-4 text-foreground bg-background hover:bg-muted rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
        
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
        
        {/* Add emergency access button at the bottom */}
        <div className="pt-4 text-center">
          <button 
            onClick={() => setShowEmergencyOptions(!showEmergencyOptions)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showEmergencyOptions ? 'Hide emergency options' : 'Having trouble?'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
} 