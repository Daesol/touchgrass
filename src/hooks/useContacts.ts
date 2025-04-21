'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Contact model type
export interface Contact {
  id: string
  user_id: string
  event_id: string
  linkedin_url?: string
  name: string
  position?: string
  company?: string
  summary?: string
  voice_memo?: {
    url: string
    duration: number
  }
  created_at?: string
  updated_at?: string
}

/**
 * Hook for managing contacts
 */
export function useContacts(eventId?: string) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Function to load contacts from the database
  const loadContacts = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Filter by event if provided
      if (eventId) {
        query = query.eq('event_id', eventId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setContacts(data || [])
    } catch (err: unknown) {
      console.error('Error loading contacts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [user, eventId])
  
  // Load contacts when the user or eventId changes
  useEffect(() => {
    loadContacts()
  }, [loadContacts])
  
  // Add a new contact
  const addContact = useCallback(async (
    contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Contact | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      // Use server-generated UUID
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          user_id: user.id,
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Update local state
      setContacts(prevContacts => [data, ...prevContacts])
      
      return data
    } catch (err: unknown) {
      console.error('Error adding contact:', err)
      setError(err instanceof Error ? err.message : 'Failed to add contact')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Update an existing contact
  const updateContact = useCallback(async (
    updatedContact: Partial<Contact> & { id: string }
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      // Extract ID for the query
      const { id, ...updateData } = updatedContact
      
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the user can only update their own contacts
      
      if (error) throw error
      
      // Update local state
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === id ? { ...contact, ...updateData } : contact
        )
      )
      
      return true
    } catch (err: unknown) {
      console.error('Error updating contact:', err)
      setError(err instanceof Error ? err.message : 'Failed to update contact')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Delete a contact
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the user can only delete their own contacts
      
      if (error) throw error
      
      // Update local state
      setContacts(prevContacts => prevContacts.filter(contact => contact.id !== id))
      
      return true
    } catch (err: unknown) {
      console.error('Error deleting contact:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete contact')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Return the hook interface
  return {
    contacts,
    loading,
    error,
    loadContacts,
    addContact,
    updateContact,
    deleteContact,
  }
} 