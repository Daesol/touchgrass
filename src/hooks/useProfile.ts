'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Profile model type
export interface Profile {
  id: string
  user_id: string
  full_name?: string
  avatar_url?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  bio?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
  created_at?: string
  updated_at?: string
}

/**
 * Hook for managing user profile
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Function to load profile from the database
  const loadProfile = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        // If the profile doesn't exist yet, this isn't an error
        if (error.code === 'PGRST116') {
          setProfile(null)
          return
        }
        throw error
      }
      
      setProfile(data)
    } catch (err: unknown) {
      console.error('Error loading profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Load profile when the user changes
  useEffect(() => {
    loadProfile()
  }, [loadProfile])
  
  // Create or update the profile
  const updateProfile = useCallback(async (
    profileData: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Profile | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      let result
      
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .single()
      } else {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...profileData,
          })
          .select()
          .single()
      }
      
      if (result.error) throw result.error
      
      // Update local state
      setProfile(result.data)
      
      return result.data
    } catch (err: unknown) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Update avatar URL
  const updateAvatar = useCallback(async (
    avatarUrl: string
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null)
      
      return true
    } catch (err: unknown) {
      console.error('Error updating avatar:', err)
      setError(err instanceof Error ? err.message : 'Failed to update avatar')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Upload avatar to storage
  const uploadAvatar = useCallback(async (
    file: File,
    fileExt: string = 'jpg'
  ): Promise<string | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      // Create a unique filename
      const filename = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${filename}`
      
      // Upload file to storage
      const { error: uploadError } = await supabase
        .storage
        .from('user_content')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data } = supabase
        .storage
        .from('user_content')
        .getPublicUrl(filePath)
      
      // Update profile with new avatar URL
      const avatarUrl = data.publicUrl
      const success = await updateAvatar(avatarUrl)
      
      if (!success) {
        throw new Error('Failed to update profile with new avatar URL')
      }
      
      return avatarUrl
    } catch (err: unknown) {
      console.error('Error uploading avatar:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, updateAvatar])
  
  // Return the hook interface
  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    updateAvatar,
    uploadAvatar,
  }
} 