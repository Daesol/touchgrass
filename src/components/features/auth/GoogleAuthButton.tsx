'use client'

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from 'react'
import { Loader2, Chrome } from 'lucide-react'

export function GoogleAuthButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        console.error("Google OAuth Error:", error)
        setError(error.message)
      } else {
        console.log("Redirecting to Google for authentication...")
      }
    } catch (err) {
      console.error("Unexpected error during Google login:", err)
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">Error: {error}</p>}
    </div>
  )
} 