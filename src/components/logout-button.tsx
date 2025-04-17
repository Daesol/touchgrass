"use client"

import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { ButtonHTMLAttributes, useState } from 'react'

interface LogoutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export default function LogoutButton({ className, ...props }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log("Logout initiated")
      
      // Immediately disable any interactivity
      document.body.style.pointerEvents = 'none'
      document.body.style.opacity = '0.7'
      
      // Use the direct logout URL which is more reliable
      window.location.href = '/logout'
    } catch (error) {
      console.error('Logout error:', error)
      alert('Logout failed. Please try again or close the browser.')
      
      // Direct fallback
      window.location.href = '/login?error=logout_failed'
    }
  }
  
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${className}`}
      onClick={handleLogout}
      disabled={isLoggingOut}
      {...props}
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  )
} 