'use client'

import { Suspense } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface SuspenseBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function SuspenseBoundary({ 
  children, 
  fallback,
  className = ''
}: SuspenseBoundaryProps) {
  const defaultFallback = (
    <div className="flex justify-center items-center p-4">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <div className={className}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </div>
  )
} 