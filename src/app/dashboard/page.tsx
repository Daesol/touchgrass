import { redirect } from 'next/navigation'

// This component simply redirects the base /dashboard route
// to the default section, which we'll set as /dashboard/events.

export default function DashboardBasePage() {
  redirect('/dashboard/events')

  // Next.js requires a return, but redirect() throws an error, 
  // so this part is technically unreachable but satisfies TypeScript.
  // return null;
} 