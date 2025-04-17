'use client'

import { useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Logout page: Starting logout process')
        
        // 1. Client-side logout
        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()
        console.log('Logout page: Supabase signOut completed')
        
        // 2. Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=')
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        })
        console.log('Logout page: Cookies cleared')
        
        // 3. Clear localStorage
        try {
          Object.keys(localStorage).forEach(key => {
            localStorage.removeItem(key)
          })
          console.log('Logout page: LocalStorage cleared')
        } catch (e) {
          console.error('LocalStorage error:', e)
        }
        
        // 4. Redirect to login page
        console.log('Logout page: Redirecting to login')
        window.location.href = '/login?clear_session=true&from=logout_page'
      } catch (error) {
        console.error('Logout page error:', error)
        window.location.href = '/login?error=logout_page_error'
      }
    }
    
    performLogout()
  }, [])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
        <p className="mb-4">Please wait while we log you out...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          If you're not redirected automatically, <a href="/login?clear_session=true" className="text-blue-500 hover:underline">click here</a> to go to the login page.
        </p>
      </div>
    </div>
  )
} 