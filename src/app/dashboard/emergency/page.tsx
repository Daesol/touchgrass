import React from 'react'
import Link from 'next/link'

// Make this a server component by removing 'use client'
export const dynamic = 'force-dynamic'

export default function EmergencyDashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <header className="mb-6 text-center">
          <div className="mb-2 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Emergency Dashboard</h1>
          <p className="text-gray-600 mt-1">Limited functionality mode</p>
        </header>
        
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            You are seeing this page because we detected an issue with your session or authentication.
            Please try one of the options below to restore normal functionality.
          </p>
        </div>
        
        <div className="space-y-3 mb-8">
          <Link 
            href="/login?clear_session=true"
            className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Return to Login Page
          </Link>
          
          <Link 
            href="/reset"
            className="block w-full text-center py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md"
          >
            Reset All Cookies & Sessions
          </Link>
          
          <Link 
            href="/"
            className="block w-full text-center py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
          >
            Go to Homepage
          </Link>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          <p>NetworkPro • Emergency Access</p>
          <p className="mt-1">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </div>
  )
} 