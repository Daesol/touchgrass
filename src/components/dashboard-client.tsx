"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Load Dashboard with error handling
const Dashboard = dynamic(
  () => 
    import("@/components/dashboard")
      .then(mod => {
        console.log("Dashboard module loaded successfully");
        return mod;
      })
      .catch(err => {
        console.error("Error loading Dashboard module:", err);
        throw err;
      }),
  {
    ssr: false,
    loading: () => <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-500" />
  }
);

// Simple error boundary client component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  
  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      console.error("Caught error in ErrorBoundary:", event);
      setHasError(true)
      
      if (event instanceof ErrorEvent) {
        setErrorMessage(event.message || "Unknown error");
      } else {
        // Handle promise rejection
        try {
          const reason = event.reason;
          setErrorMessage(
            typeof reason === 'string' ? reason : 
            reason instanceof Error ? reason.message : 
            "Unknown promise rejection"
          );
        } catch (e) {
          setErrorMessage("Unserializable error occurred");
        }
      }
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])
  
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Dashboard Error</h2>
        <p className="text-gray-600 mb-4">{errorMessage || "We're having trouble loading the dashboard"}</p>
        
        <div className="flex space-x-3">
          <Button 
            onClick={() => window.location.reload()}
            variant="default"
          >
            Reload Page
          </Button>
          <Button
            onClick={() => window.location.href = '/login?clear_session=true'}
            variant="outline"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }
  
  return children
}

export default function DashboardClient() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // This ensures we only render the Dashboard after hydration
  useEffect(() => {
    setIsClient(true)
    
    // Set a reasonable timeout for dashboard loading
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timeout)
  }, [])
  
  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }
  
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  )
} 