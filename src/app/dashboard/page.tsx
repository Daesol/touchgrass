import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Dashboard from "@/components/features/dashboard/dashboard"

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
// Removed unused ErrorBoundary component
// function ErrorBoundary({ children }: { children: React.ReactNode }) {
//   return (
//     <>
//       {children}
//       <div id="error-boundary-fallback" style={{ display: 'none' }}>
//         <div className="flex flex-col items-center justify-center min-h-screen p-4">
//           {/* ... svg ... */}
//           <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
//           <p className="text-gray-600 mb-4">We&apos;re having trouble loading this page</p> {/* Fixed apostrophe */}
//           <button
//             onClick={() => window.location.reload()}
//             className="px-4 py-2 bg-primary text-white rounded shadow hover:bg-primary/90"
//           >
//             Refresh page
//           </button>
//         </div>
//       </div>
//       {/* ... script ... */}
//     </>
//   )
// } 