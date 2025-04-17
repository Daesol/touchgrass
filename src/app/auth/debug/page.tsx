"use client"

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import Link from 'next/link'

export default function AuthDebugPage() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAuthInfo() {
      try {
        setLoading(true)
        
        // Get auth status from API
        const apiResponse = await fetch('/api/debug-auth?action=status')
        const apiData = await apiResponse.json()
        
        // Get current session
        const supabase = createSupabaseBrowserClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw new Error(sessionError.message)
        }
        
        setAuthInfo({
          api: apiData,
          session: session ? {
            user: {
              id: session.user.id,
              email: session.user.email,
              emailConfirmed: session.user.email_confirmed_at !== null,
            }
          } : null,
          redirectInfo: {
            origin: window.location.origin,
            callbackUrl: `${window.location.origin}/auth/callback`,
          },
          urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
        })
      } catch (err) {
        console.error('Error fetching auth info:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAuthInfo()
  }, [])
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      {loading ? (
        <div className="p-4 border rounded">Loading auth info...</div>
      ) : error ? (
        <div className="p-4 border rounded bg-red-50 text-red-600">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Session Status</h2>
            <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
              {JSON.stringify(authInfo, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Auth Callback URL Test</h2>
            <p className="text-sm mb-2">
              Your auth callback URL is: <code className="bg-gray-100 px-1">{authInfo?.redirectInfo?.callbackUrl}</code>
            </p>
            <p className="text-sm mb-4">
              Make sure this matches the URL configured in your Supabase project settings under Authentication → URL Configuration → Site URL and Redirect URLs.
            </p>
            <Link 
              href="/api/debug-auth?action=test-callback" 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              View callback URL format
            </Link>
          </div>
          
          <div className="mt-6">
            <Link 
              href="/login" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 