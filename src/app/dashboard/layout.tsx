import { createSupabaseServerComponentClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import { Home, Users, Calendar, ClipboardList, Bell, User } from 'lucide-react'
import Link from 'next/link'
import { SafeSupabaseProvider } from '../providers'
import { LogoutButton } from '@/components/features/auth/LogoutButton'
import { Button } from '@/components/ui/button'

// Ensure the layout is always dynamically rendered
export const dynamic = 'force-dynamic'

// For development only - bypasses authentication to allow direct dashboard testing
// REMOVE THIS FOR PRODUCTION!
const BYPASS_AUTH_FOR_TESTING = false

// Detect static generation environment
const isServerComponent = typeof window === 'undefined'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // Skip auth check during static generation at build time
    // NODE_ENV would be 'production' and we can check for specific build-time behaviors
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build time detected, skipping auth check for static generation');
      return (
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-bold">
                  NetworkPro
                </Link>
              </div>
            </div>
          </header>
          
          <SafeSupabaseProvider>
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
          </SafeSupabaseProvider>
          
          <footer className="border-t py-4">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} NetworkPro. All rights reserved.
            </div>
          </footer>
        </div>
      );
    }
    
    // FOR DEVELOPMENT TESTING - Bypass auth check
    if (BYPASS_AUTH_FOR_TESTING && process.env.NODE_ENV === 'development') {
      console.log('⚠️ DEVELOPMENT MODE: Authentication check bypassed for testing');
      
      return (
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-bold">
                  NetworkPro
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">DEV MODE</span> demo@test.com
                </div>
                <LogoutButton className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md" />
              </div>
            </div>
          </header>
          
          <SafeSupabaseProvider>
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
          </SafeSupabaseProvider>
          
          <footer className="border-t py-4">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} NetworkPro. All rights reserved.
            </div>
          </footer>
        </div>
      );
    }
    
    // Normal auth flow for runtime requests
    const supabase = await createSupabaseServerComponentClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Handle auth errors gracefully
    if (error) {
      console.error('Auth error in dashboard layout:', error.message)
      return redirect('/login?clear_session=true&error=' + encodeURIComponent(error.message))
    }
    
    // Only redirect if user is null and we're not already redirecting to login
    // This prevents potential redirect loops
    if (!user) {
      console.log('No user found, redirecting to login')
      return redirect('/login')
    }
    
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-bold">
                NetworkPro
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
              <LogoutButton className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md" />
            </div>
          </div>
        </header>
        
        <SafeSupabaseProvider>
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>
        </SafeSupabaseProvider>
        
        <footer className="border-t py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} NetworkPro. All rights reserved.
          </div>
        </footer>
      </div>
    )
  } catch (err) {
    // Catch any unexpected errors to prevent crash
    console.error('Unexpected error in dashboard layout:', err)
    
    // Emergency redirect for critical errors
    return redirect('/dashboard/emergency')
  }
} 