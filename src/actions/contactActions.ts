'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Contact } from "@/types/models"

/**
 * Get all contacts for the current user
 * Optionally filter by event ID
 */
export async function getContacts(eventId?: string): Promise<Contact[]> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Build query
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
  
  // Add filter by event ID if provided
  if (eventId) {
    query = query.eq('event_id', eventId)
  }
  
  // Execute query
  const { data, error } = await query.order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching contacts:', error)
    throw new Error(`Failed to fetch contacts: ${error.message}`)
  }
  
  return data || []
}

/**
 * Create a new contact
 */
export async function createContact(
  formData: FormData | Record<string, any>
): Promise<Contact> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Process FormData if needed
  const contactData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData
  
  // Validate input
  if (!contactData.name) {
    throw new Error('Contact name is required')
  }
  
  if (!contactData.event_id) {
    throw new Error('Associated event is required')
  }
  
  // Create contact
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      ...contactData,
      user_id: user.id,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating contact:', error)
    throw new Error(`Failed to create contact: ${error.message}`)
  }
  
  // Revalidate the contacts page
  revalidatePath('/dashboard')
  
  return data
}

/**
 * Update an existing contact
 */
export async function updateContact(
  id: string,
  formData: FormData | Record<string, any>
): Promise<Contact> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Process FormData if needed
  const contactData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData
  
  // Validate contact ID
  if (!id) {
    throw new Error('Contact ID is required')
  }
  
  // Check for at least one field to update
  if (Object.keys(contactData).length === 0) {
    throw new Error('No update data provided')
  }
  
  // Get existing contact to verify ownership
  const { data: existingContact, error: fetchError } = await supabase
    .from('contacts')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Contact not found')
    }
    throw new Error(`Error fetching contact: ${fetchError.message}`)
  }
  
  // Verify ownership
  if (existingContact.user_id !== user.id) {
    throw new Error('You do not have permission to update this contact')
  }
  
  // Update contact
  const { data, error } = await supabase
    .from('contacts')
    .update(contactData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating contact:', error)
    throw new Error(`Failed to update contact: ${error.message}`)
  }
  
  // Revalidate the contacts page
  revalidatePath('/dashboard')
  
  return data
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<void> {
  const supabase = createSupabaseServerActionClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Validate contact ID
  if (!id) {
    throw new Error('Contact ID is required')
  }
  
  // Get existing contact to verify ownership
  const { data: existingContact, error: fetchError } = await supabase
    .from('contacts')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Contact not found')
    }
    throw new Error(`Error fetching contact: ${fetchError.message}`)
  }
  
  // Verify ownership
  if (existingContact.user_id !== user.id) {
    throw new Error('You do not have permission to delete this contact')
  }
  
  // Delete contact
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting contact:', error)
    throw new Error(`Failed to delete contact: ${error.message}`)
  }
  
  // Revalidate the contacts page
  revalidatePath('/dashboard')
} 