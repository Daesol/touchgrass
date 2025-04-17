import { Suspense } from "react"
import Dashboard from "@/components/dashboard"
import { Loader2 } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-500" />}>
        <Dashboard />
      </Suspense>
    </main>
  )
}
