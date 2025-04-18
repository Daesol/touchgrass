'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const next = searchParams.get('next') || '/dashboard'
      const code = searchParams.get('code')

      if (!code) {
        setError('No code provided in callback URL')
        setLoading(false)
        return
      }

      try {
        console.log('Processing auth callback...')
        const supabase = createSupabaseBrowserClient()

        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('Error exchanging code for session:', error)
          setError(error.message)
          setLoading(false)
          return
        }

        if (!data.session) {
          setError('No session returned from code exchange')
          setLoading(false)
          return
        }

        // Sync the session with the server
        try {
          console.log('Syncing auth session with server...')
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'SIGNED_IN',
              session: data.session,
            }),
          })
          
          if (!response.ok) {
            throw new Error('Failed to sync auth session with server')
          }
          
          console.log('Auth session synced successfully')
        } catch (syncError) {
          console.error('Error syncing auth session:', syncError)
          // Continue anyway since we have a client-side session
        }

        // Redirect to the target page
        console.log('Auth callback successful, redirecting to:', next)
        router.push(next)
      } catch (err) {
        console.error('Error in auth callback:', err)
        setError('An unexpected error occurred during authentication')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg border">
          <h1 className="text-2xl font-bold text-center">Authentication Error</h1>
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg border text-center">
        <h1 className="text-2xl font-bold">Completing Authentication</h1>
        <p className="text-gray-600">Please wait while we complete your authentication...</p>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  )
} 