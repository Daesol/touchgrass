import { Suspense } from 'react'
import { SignupForm } from '@/components/features/auth/SignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - NetworkPro',
  description: 'Create your NetworkPro account',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
} 