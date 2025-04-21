'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ClearCookiesButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter();

  const handleClear = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/clearall', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clear cookies');
      }

      toast.success('Authentication cookies cleared.');
      // Refresh the page or redirect to ensure state is clean
      // Redirecting to login is usually safest
      router.push('/login');
      // Short delay before reload to allow navigation
      setTimeout(() => window.location.reload(), 500);

    } catch (error) {
      console.error("Clear Cookies Error:", error);
      toast.error(error instanceof Error ? error.message : 'Could not clear cookies');
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleClear}
      disabled={isLoading}
      className="mt-4"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      Clear Auth Cookies (Dev)
    </Button>
  )
} 