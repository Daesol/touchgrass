import { Suspense } from 'react'
import { LoginForm } from '@/components/features/auth/LoginForm'
import { ClearCookiesButton } from '@/components/features/auth/ClearCookiesButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - NetworkPro',
  description: 'Log in to your NetworkPro account',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <LoginForm />
          <div className="mt-6 text-center">
            <ClearCookiesButton />
          </div>
        </Suspense>
      </div>
    </div>
  )
} 