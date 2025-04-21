'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface Note {
  id: string
  content: string
  user_id: string
  contact_id: string
  created_at: string
  updated_at?: string
}

/**
 * Hook for managing notes
 */
export function useNotes(contactId?: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Function to load notes from the database
  const fetchNotes = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Filter by contact ID if provided
      if (contactId) {
        query = query.eq('contact_id', contactId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setNotes(data || [])
    } catch (err: unknown) {
      console.error('Error loading notes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }, [user, contactId])
  
  // Load notes when the user or contactId changes
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])
  
  // Add a new note
  const addNote = useCallback(async (
    noteData: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Note | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Update local state
      await fetchNotes()
      
      return data
    } catch (err: unknown) {
      console.error('Error adding note:', err)
      setError(err instanceof Error ? err.message : 'Failed to add note')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchNotes])
  
  // Update an existing note
  const editNote = useCallback(async (
    id: string,
    noteData: Partial<Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      const updatedData = {
        ...noteData,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('notes')
        .update(updatedData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the user can only update their own notes
      
      if (error) throw error
      
      // Update local state
      await fetchNotes()
      
      return true
    } catch (err: unknown) {
      console.error('Error updating note:', err)
      setError(err instanceof Error ? err.message : 'Failed to update note')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchNotes])
  
  // Delete a note
  const removeNote = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the user can only delete their own notes
      
      if (error) throw error
      
      // Update local state
      await fetchNotes()
      
      return true
    } catch (err: unknown) {
      console.error('Error deleting note:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete note')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchNotes])
  
  return {
    notes,
    isLoading,
    error,
    addNote,
    editNote,
    removeNote,
    refresh: fetchNotes
  }
} 