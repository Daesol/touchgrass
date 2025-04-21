"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Users, CheckSquare, User } from "lucide-react"
import Link from "next/link"

export default function MinimalDashboard() {
  const [tab, setTab] = useState("events")
  
  return (
    <div className="container mx-auto max-w-4xl p-4 bg-background text-foreground">
      <header className="mb-4">
        <h1 className="text-xl font-bold">NetworkPro</h1>
        <p className="text-xs text-muted-foreground">Manage your networking events and contacts</p>
      </header>
      
      <main className="min-h-[70vh] border rounded-md p-4 mb-4">
        <div className="text-center py-10">
          {tab === "events" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Events</h2>
              <p className="text-muted-foreground mb-4">Your events will appear here</p>
              <Button>Create an Event</Button>
            </div>
          )}
          
          {tab === "contacts" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Contacts</h2>
              <p className="text-muted-foreground mb-4">Your contacts will appear here</p>
              <Button>Add a Contact</Button>
            </div>
          )}
          
          {tab === "tasks" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Tasks</h2>
              <p className="text-muted-foreground mb-4">Your tasks will appear here</p>
              <Button>Create a Task</Button>
            </div>
          )}
          
          {tab === "profile" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Profile</h2>
              <p className="text-muted-foreground mb-4">Your profile information</p>
              <Button>Edit Profile</Button>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 max-w-md mx-auto">
            <p className="text-sm">
              <strong>Limited functionality mode:</strong> The full dashboard couldn't be loaded. 
              This is a simplified version with reduced functionality.
            </p>
            <div className="mt-4 space-y-2">
              <Link href="/login?clear_session=true">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  Return to login page
                </Button>
              </Link>
              <Link href="/reset">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  Reset session & cookies
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex h-16 w-full justify-around bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:bg-gray-800">
        <button
          onClick={() => setTab("events")}
          className={`flex w-1/5 flex-col items-center justify-center ${
            tab === "events"
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs">Events</span>
        </button>
        <button
          onClick={() => setTab("contacts")}
          className={`flex w-1/5 flex-col items-center justify-center ${
            tab === "contacts"
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs">Contacts</span>
        </button>
        <button
          onClick={() => {}}
          className="flex w-1/5 flex-col items-center justify-center rounded-full bg-primary p-1 text-white"
        >
          <span className="text-xs mt-1">Disabled</span>
        </button>
        <button
          onClick={() => setTab("tasks")}
          className={`flex w-1/5 flex-col items-center justify-center ${
            tab === "tasks"
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <CheckSquare className="h-6 w-6" />
          <span className="text-xs">Tasks</span>
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`flex w-1/5 flex-col items-center justify-center ${
            tab === "profile"
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
      {/* Add padding at the bottom to prevent content from being hidden behind the navigation */}
      <div className="h-16"></div>
    </div>
  )
} 