import { createClient } from '@/lib/supabase/server'; // Import the new client
import { redirect } from 'next/navigation'
// import { isSessionValid } from '@/lib/auth/sessionUtils' // Removed client-side check

// Force dynamic rendering because we check cookies/session
export const dynamic = 'force-dynamic'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const supabase = await createClient(); // Use the new async client
  const { data: { session }, error } = await supabase.auth.getSession();

  // Handle potential errors during session check
  if (error) {
    console.error("AuthLayout Session Check Error:", error.message);
    // Decide how to handle error - maybe redirect to a generic error page or login?
    // For now, let it proceed but log the error.
  }
  
  // Redirect to dashboard if already authenticated
  if (session) {
    redirect('/dashboard')
  }
  
  // Otherwise, render the auth page layout
  return (
    <div className="min-h-screen bg-background">
      {/* Background pattern or image could be added here */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
} 