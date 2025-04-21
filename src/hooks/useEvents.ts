'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Event model type
export interface Event {
  id: string
  user_id: string
  title: string
  location: string
  company: string
  date: string
  color_index: number
  created_at?: string
  updated_at?: string
}

/**
 * Hook for managing events
 */
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Function to load events from the database
  const loadEvents = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
      
      if (error) throw error
      
      setEvents(data || [])
    } catch (err: any) {
      console.error('Error loading events:', err)
      setError(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Load events when the user changes
  useEffect(() => {
    loadEvents()
  }, [loadEvents])
  
  // Add a new event
  const addEvent = useCallback(async (
    event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Event | null> => {
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
        .from('events')
        .insert({
          ...event,
          user_id: user.id,
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Update local state
      setEvents(prevEvents => [...prevEvents, data])
      
      return data
    } catch (err: any) {
      console.error('Error adding event:', err)
      setError(err.message || 'Failed to add event')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Update an existing event
  const updateEvent = useCallback(async (
    updatedEvent: Partial<Event> & { id: string }
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
      const { id, ...updateData } = updatedEvent
      
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the user can only update their own events
      
      if (error) throw error
      
      // Update local state
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === id ? { ...event, ...updateData } : event
        )
      )
      
      return true
    } catch (err: any) {
      console.error('Error updating event:', err)
      setError(err.message || 'Failed to update event')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Delete an event
  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createSupabaseBrowserClient()
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the user can only delete their own events
      
      if (error) throw error
      
      // Update local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== id))
      
      return true
    } catch (err: any) {
      console.error('Error deleting event:', err)
      setError(err.message || 'Failed to delete event')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Return the hook interface
  return {
    events,
    loading,
    error,
    loadEvents,
    addEvent,
    updateEvent,
    deleteEvent,
  }
} 