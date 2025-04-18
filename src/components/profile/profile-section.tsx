"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Settings, LogOut, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  company: string | null;
  bio: string | null;
}

export function ProfileSection() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user and profile data on mount
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setLoading(true)
        
        // Try to get profile from API first as it's more reliable
        try {
          const profileResponse = await fetch('/api/profile', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          
          if (profileResponse.ok) {
            const data = await profileResponse.json();
            
            if (data.profile) {
              setProfile(data.profile);
              setUser({ id: data.profile.id, email: data.profile.email });
              setLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.error('Error fetching profile from API:', apiError);
        }
        
        // If API fails, fall back to direct client-side fetch
        const supabase = createSupabaseBrowserClient();
        
        // Get the current user with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const authResponse = await Promise.race([
            supabase.auth.getUser(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auth request timeout')), 5000)
            )
          ]);
          
          clearTimeout(timeoutId);
          
          const { data: { user }, error: userError } = authResponse;
          
          if (userError || !user) {
            setError('Please log in to view your profile');
            return;
          }
          
          setUser(user);
          
          // Create default profile immediately to ensure we have something to show
          createDefaultProfile(user);
          
          // Then try to get the actual profile from the database
          try {
            // Try the "profiles" table in public schema
            let { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (!profileError && profileData) {
              setProfile(profileData);
            } else {
              // Create default profile if no profile found
              createDefaultProfile(user);
            }
          } catch (profileError) {
            createDefaultProfile(user);
          }
        } catch (error) {
          setError('An unexpected error occurred');
        }
      } catch (error) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false)
      }
    }
    
    const createDefaultProfile = (user: any) => {
      // Create a default profile from the user object
      const email = user.email || '';
      const username = email.split('@')[0] || 'User';
      
      const defaultProfile: Profile = {
        id: user.id,
        first_name: null,
        last_name: null,
        display_name: username,
        avatar_url: null,
        job_title: null,
        company: null,
        bio: null
      };
      
      setProfile(defaultProfile);
    };
    
    fetchUserAndProfile()
  }, [])

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback in case sign out fails
      window.location.href = '/login'
    }
  }

  // Set display name based on available profile data
  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name
    if (profile?.first_name && profile?.last_name) return `${profile.first_name} ${profile.last_name}`
    if (profile?.first_name) return profile.first_name
    if (user?.email) return user.email.split('@')[0]
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
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out and Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
