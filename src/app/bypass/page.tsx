'use client'

import React from 'react'
import MinimalDashboard from '@/components/minimal-dashboard'

export default function BypassPage() {
  return (
    <div className="p-4">
      <div className="mb-4 p-3 bg-amber-100 text-amber-800 rounded-md border border-amber-300">
        <h2 className="font-semibold text-lg">Emergency Access Mode</h2>
        <p className="text-sm">
          You are viewing the application in direct bypass mode, which doesn't require authentication
          and skips all middleware checks. Use this mode to troubleshoot login issues.
        </p>
      </div>
      
      <MinimalDashboard />
    </div>
  )
} 