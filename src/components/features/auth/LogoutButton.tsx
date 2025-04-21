'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
// import { createClient } from '@/lib/supabase/client' // No longer call client-side signOut
import { LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is used for toasts

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      // Call the server API route to perform logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      const data = await response.json();

      if (!response.ok) {
        console.error('Logout API Error:', data.message || 'Unknown error');
        toast.error(`Logout failed: ${data.message || 'Server error'}`);
      } else {
        console.log('Logout successful via API.')
        toast.success('Logged out successfully.');
        // Redirect to login page after successful logout
        router.push('/login')
        // Optionally force reload if state isn't clearing properly
        router.refresh() // Helps refresh server component data
        // Consider window.location.assign('/login'); for a full clear
      }
    } catch (err) {
        console.error('Unexpected Logout Error:', err)
        toast.error('An unexpected error occurred during logout.');
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full justify-start"
    >
      {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
          <LogOut className="mr-2 h-4 w-4" />
      )}
      Logout
    </Button>
  )
} 