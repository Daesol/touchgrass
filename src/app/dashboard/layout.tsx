import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Home, Users, Calendar, ClipboardList, Bell, User } from 'lucide-react'
import Link from 'next/link'
import { SafeSupabaseProvider } from '../providers'
import { LogoutButton } from '@/components/features/auth/LogoutButton'
import { Button } from '@/components/ui/button'
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar'

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
        <div className="min-h-screen h-screen flex flex-col overflow-hidden">
          <header className="border-b sticky top-0 bg-background z-20">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-bold">
                  NetworkPro
                </Link>
              </div>
            </div>
          </header>
          
          <SafeSupabaseProvider>
            <main className="flex-1 container mx-auto px-4 py-6 pb-20 overflow-y-auto">
              {children}
            </main>
          </SafeSupabaseProvider>
          
          <div className="relative z-20">
            <BottomNavigationBar />
          </div>
        </div>
      );
    }
    
    // FOR DEVELOPMENT TESTING - Bypass auth check
    if (BYPASS_AUTH_FOR_TESTING && process.env.NODE_ENV === 'development') {
      console.log('⚠️ DEVELOPMENT MODE: Authentication check bypassed for testing');
      
      return (
        <div className="min-h-screen h-screen flex flex-col overflow-hidden">
          <header className="border-b sticky top-0 bg-background z-20">
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
                <LogoutButton />
              </div>
            </div>
          </header>
          
          <SafeSupabaseProvider>
            <main className="flex-1 container mx-auto px-4 py-6 pb-20 overflow-y-auto">
              {children}
            </main>
          </SafeSupabaseProvider>
          
          <div className="relative z-20">
            <BottomNavigationBar />
          </div>
        </div>
      );
    }
    
    // Normal auth flow for runtime requests
    const supabase = await createClient()
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
      <div className="min-h-screen h-screen flex flex-col overflow-hidden">
        <header className="border-b sticky top-0 bg-background z-20">
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
              <LogoutButton />
            </div>
          </div>
        </header>
        
        <SafeSupabaseProvider>
          <main className="flex-1 container mx-auto px-4 py-6 pb-20 overflow-y-auto">
            {children}
          </main>
        </SafeSupabaseProvider>
        
        <div className="relative z-20">
          <BottomNavigationBar />
        </div>
      </div>
    )
  } catch (err) {
    // Catch any unexpected errors to prevent crash
    console.error('Unexpected error in dashboard layout:', err)
    
    // Emergency redirect for critical errors
    return redirect('/dashboard/emergency')
  }
} 