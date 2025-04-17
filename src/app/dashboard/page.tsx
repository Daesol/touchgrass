import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Dashboard from "@/components/dashboard"

// Ensure this page is dynamically rendered and never static
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      }>
        <Dashboard />
      </Suspense>
    </div>
  )
}

// Simple error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div id="error-boundary-fallback" style={{ display: 'none' }}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We're having trouble loading this page</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded shadow hover:bg-primary/90"
          >
            Refresh page
          </button>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('error', function(event) {
            document.getElementById('error-boundary-fallback').style.display = 'block';
            document.querySelectorAll('.min-h-screen:not(#error-boundary-fallback)').forEach(el => {
              el.style.display = 'none';
            });
          });
        `
      }} />
    </>
  )
} 