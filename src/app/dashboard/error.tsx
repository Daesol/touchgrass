'use client'

import React from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 text-red-500">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-20 w-20"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      
      <h2 className="mb-2 text-2xl font-bold">Something went wrong!</h2>
      
      <p className="mb-6 max-w-md text-muted-foreground">
        {error.message || "There was an error loading the dashboard. Please try again."}
      </p>
      
      <div className="flex space-x-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-white rounded shadow hover:bg-primary/90"
        >
          Try again
        </button>
        
        <button
          onClick={() => {
            window.location.href = '/dashboard/fallback';
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300"
        >
          Use emergency dashboard
        </button>
      </div>
    </div>
  )
} 