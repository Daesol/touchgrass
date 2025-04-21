'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'An unknown error occurred'
  const reason = searchParams.get('reason') || 'unknown'
  const code = searchParams.get('code') || '500'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="mt-2 text-gray-600">We encountered a problem while processing your authentication.</p>
        </div>

        <div className="p-4 bg-red-50 rounded-md border border-red-200">
          <h2 className="font-semibold text-red-700">Error Details</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          {reason !== 'unknown' && (
            <p className="mt-1 text-sm text-red-500">
              Reason: {reason}
            </p>
          )}
          <p className="mt-1 text-sm text-red-500">
            Code: {code}
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <h3 className="font-semibold">What you can try:</h3>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Clear your browser cookies and try again</li>
              <li>Use a different browser</li>
              <li>Check your internet connection</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Link
              href="/login"
              className="w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Login
            </Link>
            <Link
              href="/"
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 text-center rounded-md hover:bg-gray-200 transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 