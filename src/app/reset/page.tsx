'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ResetPage() {
  const [cleared, setCleared] = useState(false)
  
  useEffect(() => {
    const clearAllState = () => {
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=')
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      })
      
      // Clear localStorage and sessionStorage
      try {
        localStorage.clear()
        sessionStorage.clear()
        console.log('All browser storage cleared')
      } catch (e) {
        console.error('Error clearing storage:', e)
      }
      
      setCleared(true)
    }
    
    clearAllState()
  }, [])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Session Reset Tool</h1>
        
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">
            {cleared 
              ? '✅ All cookies and browser storage have been cleared successfully.' 
              : 'Clearing browser state...'}
          </p>
        </div>
        
        <p className="mb-4 text-gray-600">
          This utility has removed all cookies and browser storage. You can now access the application
          in several ways:
        </p>
        
        <div className="space-y-3 mb-6">
          <Link 
            href="/login"
            className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Go to Login Page
          </Link>
          
          <Link 
            href="/bypass"
            className="block w-full text-center py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md"
          >
            Access Emergency Dashboard
          </Link>
          
          <Link 
            href="/"
            className="block w-full text-center py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
          >
            Go to Homepage
          </Link>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>If you continue to experience issues:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Try using incognito/private browsing mode</li>
            <li>Clear browser cache in your browser settings</li>
            <li>Disable browser extensions that might interfere</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 