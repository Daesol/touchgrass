'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Note } from "@/types/models"

/**
 * Get all notes for the current user
 * Optionally filter by contact ID
 */
export async function getNotes(contactId?: string): Promise<Note[]> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Build query
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
  
  // Add filter by contact ID if provided
  if (contactId) {
    query = query.eq('contact_id', contactId)
  }
  
  // Execute query
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching notes:', error)
    throw new Error(`Failed to fetch notes: ${error.message}`)
  }
  
  return data || []
}

/**
 * Create a new note
 */
export async function createNote(
  formData: FormData | Record<string, any>
): Promise<Note> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Process FormData if needed
  const noteData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData
  
  // Validate input
  if (!noteData.content) {
    throw new Error('Note content is required')
  }
  
  if (!noteData.contact_id) {
    throw new Error('Associated contact is required')
  }
  
  // Create note
  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...noteData,
      user_id: user.id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating note:', error)
    throw new Error(`Failed to create note: ${error.message}`)
  }
  
  // Revalidate the notes page
  revalidatePath('/dashboard')
  
  return data
}

/**
 * Update an existing note
 */
export async function updateNote(
  id: string,
  formData: FormData | Record<string, any>
): Promise<Note> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Process FormData if needed
  const noteData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData
  
  // Validate note ID
  if (!id) {
    throw new Error('Note ID is required')
  }
  
  // Check for at least one field to update
  if (Object.keys(noteData).length === 0) {
    throw new Error('No update data provided')
  }
  
  // Get existing note to verify ownership
  const { data: existingNote, error: fetchError } = await supabase
    .from('notes')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Note not found')
    }
    throw new Error(`Error fetching note: ${fetchError.message}`)
  }
  
  // Verify ownership
  if (existingNote.user_id !== user.id) {
    throw new Error('You do not have permission to update this note')
  }
  
  // Add updated_at timestamp
  const updatedData = {
    ...noteData,
    updated_at: new Date().toISOString()
  }
  
  // Update note
  const { data, error } = await supabase
    .from('notes')
    .update(updatedData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating note:', error)
    throw new Error(`Failed to update note: ${error.message}`)
  }
  
  // Revalidate the notes page
  revalidatePath('/dashboard')
  
  return data
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Validate note ID
  if (!id) {
    throw new Error('Note ID is required')
  }
  
  // Get existing note to verify ownership
  const { data: existingNote, error: fetchError } = await supabase
    .from('notes')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Note not found')
    }
    throw new Error(`Error fetching note: ${fetchError.message}`)
  }
  
  // Verify ownership
  if (existingNote.user_id !== user.id) {
    throw new Error('You do not have permission to delete this note')
  }
  
  // Delete note
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting note:', error)
    throw new Error(`Failed to delete note: ${error.message}`)
  }
  
  // Revalidate the notes page
  revalidatePath('/dashboard')
} 