import Link from 'next/link'
import { createSupabaseServerComponentClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'

// Explicitly mark this page as dynamic to avoid static generation errors
export const dynamic = "force-dynamic"

export default async function LandingPage() {
  try {
    // Check if user is already authenticated
    const supabase = await createSupabaseServerComponentClient()
    const { data, error } = await supabase.auth.getUser()
    
    // If user is authenticated, redirect to dashboard
    if (data?.user && !error) {
      redirect('/dashboard')
    }
  } catch (error) {
    console.error("Auth error on landing page:", error)
    // Continue to render the landing page if there's an error
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation */}
      <header className="px-4 py-4 border-b">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <h1 className="text-2xl font-bold">NetworkPro</h1>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium hover:underline"
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Manage your professional network effectively
                </h2>
                <p className="text-xl text-muted-foreground">
                  NetworkPro helps you keep track of your contacts, events, and networking 
                  opportunities all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/signup" 
                    className="px-6 py-3 text-center font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                  >
                    Get started for free
                  </Link>
                  <Link 
                    href="/login" 
                    className="px-6 py-3 text-center font-medium border rounded-md hover:bg-muted"
                  >
                    Log in
                  </Link>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-8 border">
                <div className="aspect-video rounded-md bg-card p-4 shadow-sm">
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xl font-medium text-center">
                      Track your contacts and events with ease
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Key Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your professional connections
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Event Management",
                  description: "Keep track of all your networking events, conferences, and meetups in one place."
                },
                {
                  title: "Contact Organization",
                  description: "Organize contacts by events, companies, or custom categories for easy reference."
                },
                {
                  title: "Follow-up Reminders",
                  description: "Never miss a follow-up with automated reminders and task tracking."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NetworkPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
