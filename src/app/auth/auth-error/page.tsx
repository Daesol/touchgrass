"use client"

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

// Separate client component to handle search params
function AuthErrorContent() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get('error') || 'There was a problem authenticating your account'
  const errorCode = searchParams.get('code')
  const errorType = searchParams.get('type')
  const errorReason = searchParams.get('reason')
  
  const [showDetails, setShowDetails] = useState(false)
  
  const allParams = Object.fromEntries(
    Array.from(searchParams.entries())
  )
  
  return (
    <div className="max-w-md p-8 mx-auto space-y-6 rounded-lg shadow-md border">
      <h1 className="text-2xl font-bold text-center text-foreground">Authentication Error</h1>
      <p className="text-center text-muted-foreground">
        {errorMessage}.
      </p>
      
      {(errorCode || errorType || errorReason) && (
        <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-primary hover:underline text-xs"
          >
            {showDetails ? 'Hide' : 'Show'} diagnostic details
          </button>
          
          {showDetails && (
            <div className="mt-2 p-3 bg-muted/50 rounded text-xs font-mono">
              {errorCode && <p>Error code: {errorCode}</p>}
              {errorType && <p>Error type: {errorType}</p>}
              {errorReason && <p>Reason: {errorReason}</p>}
              <p className="mt-2 text-xs">Debug data:</p>
              <pre className="overflow-auto mt-1 p-2 bg-muted rounded">
                {JSON.stringify(allParams, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <Link 
          href="/login" 
          className="inline-flex items-center justify-center px-6 py-2 font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
        >
          Return to Login
        </Link>
        
        <Link
          href="/auth/debug"
          className="inline-flex items-center justify-center px-6 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
        >
          Go to Auth Debug
        </Link>
      </div>
    </div>
  )
}

// Loading fallback
function AuthErrorLoading() {
  return (
    <div className="max-w-md p-8 mx-auto space-y-6 rounded-lg shadow-md border text-center">
      <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
      <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto"></div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Suspense fallback={<AuthErrorLoading />}>
        <AuthErrorContent />
      </Suspense>
    </div>
  )
} 