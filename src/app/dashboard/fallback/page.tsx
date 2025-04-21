"use client"

import React, { useState } from 'react'
import { HomeIcon, UsersIcon, CalendarIcon, ClipboardListIcon, BellIcon, UserIcon, PlusIcon, ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, PlusCircleIcon, RefreshCwIcon, AlertCircleIcon } from "lucide-react";

export default function FallbackDashboard() {
  const [activeTab, setActiveTab] = useState<string>('home')
  
  // Simple logout function that clears cookies
  const logout = () => {
    document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    window.location.href = '/login?clear_session=true'
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard/fallback" className="text-xl font-bold text-green-600 flex items-center">
            <HomeIcon className="mr-2" size={24} />
            TouchGrass Emergency Mode
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            onClick={() => window.location.href = '/login?clear_session=true'}
          >
            Login
          </button>
          <button 
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={logout}
          >
            Reset Session
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow mb-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Emergency Dashboard</h1>
            <p className="text-gray-600 mb-4">
              You're seeing this page because we detected an issue with your session or authentication.
              This is a limited functionality mode that doesn't require authentication.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <BellIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    To restore full functionality, please try logging out and logging back in.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content based on active tab */}
          <div className="p-6 bg-white rounded-lg shadow">
            {activeTab === 'home' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Home</h2>
                <p className="text-gray-600">
                  Welcome to the TouchGrass emergency dashboard. This is a simplified version
                  with limited functionality that works even when authentication has issues.
                </p>
              </div>
            )}
            
            {activeTab === 'contacts' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Contacts</h2>
                <p className="text-gray-600">
                  Your contacts would normally appear here. Please log in again to access your contacts.
                </p>
              </div>
            )}
            
            {activeTab === 'events' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Events</h2>
                <p className="text-gray-600">
                  Your events would normally appear here. Please log in again to access your events.
                </p>
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                <p className="text-gray-600">
                  Your tasks would normally appear here. Please log in again to access your tasks.
                </p>
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Profile</h2>
                <p className="text-gray-600">
                  Your profile would normally appear here. Please log in again to access your profile.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-between py-3">
            <button
              className={`flex flex-col items-center ${activeTab === 'events' ? 'text-green-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('events')}
            >
              <CalendarIcon size={24} />
              <span className="text-xs mt-1">Events</span>
            </button>
            
            <button
              className={`flex flex-col items-center ${activeTab === 'contacts' ? 'text-green-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('contacts')}
            >
              <UsersIcon size={24} />
              <span className="text-xs mt-1">Contacts</span>
            </button>
            
            <button
              className={`flex flex-col items-center ${activeTab === 'home' ? 'text-green-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('home')}
            >
              <HomeIcon size={24} />
              <span className="text-xs mt-1">Home</span>
            </button>
            
            <button
              className={`flex flex-col items-center ${activeTab === 'tasks' ? 'text-green-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('tasks')}
            >
              <ClipboardListIcon size={24} />
              <span className="text-xs mt-1">Tasks</span>
            </button>
            
            <button
              className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-green-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserIcon size={24} />
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DebugCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InstructionsCard() {
  return (
    <DebugCard title="Instructions">
      <p className="text-sm">
        This page helps debug authentication issues. It shows your current session
        status, allows refreshing tokens, and provides options to reset state.
      </p>
      <p className="mt-2 text-sm">
        If you&apos;re stuck in a loop, try &apos;Clear All Session Cookies&apos; first.
      </p>
    </DebugCard>
  );
} 