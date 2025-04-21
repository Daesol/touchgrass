"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Settings, LogOut, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"

// Define types for nested JSONB structures
type SocialLinks = {
  github?: string | null; // Use optional or null based on schema
  twitter?: string | null;
  linkedin?: string | null;
} | null; // Allow the whole object to be null

type Preferences = {
  theme?: 'system' | 'light' | 'dark' | null;
  notifications?: boolean | null;
} | null; // Allow the whole object to be null

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  company: string | null;
  bio: string | null;
  // Added fields to match Supabase schema
  location: string | null;
  phone: string | null; 
  website: string | null;
  social_links: SocialLinks;
  preferences: Preferences;
  created_at: string | null; // Typically returned as ISO string
  updated_at: string | null; // Typically returned as ISO string
}

export function ProfileSection() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();

  const fetchUserAndProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    setProfile(null)
    setUserEmail(null);

    try {
      const profileResponse = await fetch('/api/profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const data = await profileResponse.json();

      if (!profileResponse.ok || !data.success) {
        const errorMessage = data?.error?.message || 'Failed to fetch profile data.';
        console.error('API Error fetching profile:', data?.error || 'Unknown API error');
        setError(errorMessage);
      } else if (data.success && data.data) {
        setProfile(data.data);
      } else if (data.success && data.data === null) {
        console.log("Profile not found via API, user needs setup.");
      }
      
    } catch (err) {
      console.error('Network or other error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndProfile();
  }, [fetchUserAndProfile]);

  useEffect(() => {
    if (!loading && !error && !profile) {
      console.log("Profile not found, redirecting to setup...");
      router.replace('/profile/setup');
    }
  }, [loading, error, profile, router]);

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      window.location.href = '/login'
    }
  }

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name
    if (profile?.first_name && profile?.last_name) return `${profile.first_name} ${profile.last_name}`
    if (profile?.first_name) return profile.first_name
    if (userEmail) return userEmail.split('@')[0]
    return 'User'
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-muted"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="h-3 w-32 bg-muted rounded"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Separator />
              <div className="grid gap-4">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={fetchUserAndProfile}>
              Retry Fetching Profile
            </Button>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${getDisplayName()}`} 
                alt={getDisplayName()} 
              />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{getDisplayName()}</CardTitle>
              <CardDescription>
                {profile?.job_title} {profile?.company ? `at ${profile.company}` : ''}
              </CardDescription>
              {profile?.bio && (
                <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Separator />
            <div className="grid gap-4">
              <Button variant="outline" className="justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Button>
              <Button variant="outline" className="justify-start">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
              <Button 
                variant="outline" 
                className="justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About NetworkPro</CardTitle>
          <CardDescription>Version 1.0.0</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            NetworkPro helps you manage your professional networking contacts and events. Keep track of people you meet,
            important conversations, and follow-up tasks.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} NetworkPro. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
