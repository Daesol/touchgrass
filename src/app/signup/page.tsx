"use client"

import { useState, Suspense } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const router = useRouter()
  
  const resendConfirmationEmail = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      
      if (error) {
        setError(`Failed to resend confirmation email: ${error.message}`)
        return
      }
      
      setSuccessMessage('Confirmation email resent! Please check your inbox and spam folder.')
    } catch (err) {
      setError('An unexpected error occurred while resending confirmation email.')
      console.error('Resend error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }
    
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Try regular signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        // If email already in use, try to sign in to see if it's unconfirmed
        if (error.message.includes('already registered')) {
          // Try to sign in to see if it's an unconfirmed account
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          if (signInError) {
            // Failed to sign in - wrong password or other issue
            setError(`This email is already registered. ${signInError.message}`)
          } else if (signInData.user && !signInData.user.email_confirmed_at) {
            // Signed in but email not confirmed
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email,
            })
            
            if (resendError) {
              setError(`This email is registered but not confirmed. Error sending confirmation email: ${resendError.message}`)
            } else {
              setSuccessMessage('This account needs email verification. We\'ve sent a new confirmation email. Please check your inbox and spam folder.')
            }
            
            // Sign out automatically since email isn't confirmed
            await supabase.auth.signOut()
          } else {
            // Successfully signed in, email is confirmed
            setError('This email is already registered and confirmed. Please log in instead.')
            // Sign out to be safe
            await supabase.auth.signOut()
          }
        } else {
          // Different error
          setError(error.message)
        }
        
        setLoading(false)
        return
      }
      
      // Handle successful signup
      if (data.user) {
        // Check if the email is auto-confirmed (like with Google login)
        if (data.user.email_confirmed_at) {
          // Email already confirmed
          setSuccessMessage('Account created successfully! Redirecting to dashboard...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          // Email needs confirmation
          setSuccessMessage(
            'Confirmation email sent! Please check your inbox and click the link to verify your account. (Check your spam folder if you don\'t see it)'
          )
          
          // Sign out - user shouldn't be logged in until email is confirmed
          await supabase.auth.signOut()
        }
      } else {
        setError("Unexpected error during sign up. Please try again.")
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)
    
    const supabase = createSupabaseBrowserClient()
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
          <h2 className="mt-2 text-xl font-semibold">Create an account</h2>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
            {error.includes('not confirmed') && (
              <button
                onClick={resendConfirmationEmail}
                className="block mt-2 text-blue-600 hover:underline"
                disabled={loading}
              >
                Resend confirmation email
              </button>
            )}
          </div>
        )}
        
        {successMessage && (
          <div className="p-4 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
            <p className="font-medium mb-2">Account creation initiated!</p>
            <p>{successMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleEmailSignup} className="space-y-6">
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
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || successMessage !== null}
            className="w-full py-2 px-4 text-white bg-primary hover:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Sign up'}
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
          onClick={handleGoogleSignup}
          disabled={loading || successMessage !== null}
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
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
} 