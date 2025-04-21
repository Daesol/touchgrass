'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Simplified component: Assumes cookies were set by the server-side callback
export default function AuthCallbackProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') || '/dashboard'
    console.log('[Callback Processing] Redirecting to:', next)
    
    // Simply redirect. The necessary auth cookies should already be set 
    // by the /api/auth/callback server route.
    router.replace(next) // Use replace to avoid adding this processing page to history

  }, [router, searchParams])

  // Display a loading indicator while the redirect happens
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg border text-center">
        <h1 className="text-2xl font-bold">Processing Login</h1>
        <p className="text-gray-600">Please wait...</p>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  )
} 