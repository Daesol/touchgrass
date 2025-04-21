import { Suspense } from 'react'
import { Metadata } from 'next'
import { ConfirmationForm } from '@/components/features/auth/ConfirmationForm'
// import { LoadingProvider } from '@/components/features/auth/LoadingProvider'
// import { SuspenseBoundary } from '@/components/features/auth/SuspenseBoundary'

export const metadata: Metadata = {
  title: 'Confirm Email - NetworkPro',
  description: 'Confirm your email address for NetworkPro',
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ConfirmationPage({ searchParams }: PageProps) {
  // Get email from query params
  const email = typeof searchParams.email === 'string' ? searchParams.email : undefined

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <ConfirmationForm />
        </Suspense>
      </div>
    </div>
  )
} 