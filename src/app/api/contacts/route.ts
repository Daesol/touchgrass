import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, withErrorHandling } from '@/lib/api/response'
import { Contact } from '@/types/models' // Assuming types moved to @/types/models

/**
 * GET handler for fetching contacts, optionally filtered by event
 */
export async function GET(req: NextRequest) {
  return withErrorHandling<Contact[]>(async () => {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const url = new URL(req.url)
    const eventId = url.searchParams.get('eventId')
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    const { data, error } = await query
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess(data || [])
  })
}

/**
 * POST handler for creating a new contact
 */
export async function POST(req: NextRequest) {
  return withErrorHandling<Contact>(async () => {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const contactData = await req.json()
    // TODO: Add validation using Zod or similar based on src/types/models Contact
    if (!contactData.name || !contactData.event_id) {
      return apiError('Name and event_id are required', 'VALIDATION_ERROR', 400)
    }
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...contactData, user_id: user.id })
      .select()
      .single()
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess(data)
  })
}

/**
 * PUT handler for updating a contact
 */
export async function PUT(req: NextRequest) {
  return withErrorHandling<Contact>(async () => {
    const url = new URL(req.url)
    const contactId = url.pathname.split('/').pop() // Assuming ID is the last segment
    if (!contactId) {
      return apiError('Contact ID is required in the URL path', 'MISSING_PARAMETER', 400)
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const contactData = await req.json()
    if (Object.keys(contactData).length === 0) {
      return apiError('No update data provided', 'VALIDATION_ERROR', 400)
    }
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('user_id')
      .eq('id', contactId)
      .single()
    if (fetchError) {
      return fetchError.code === 'PGRST116' ? apiError('Contact not found', 'NOT_FOUND', 404) : apiError(fetchError.message, 'DATABASE_ERROR', 500)
    }
    if (existingContact.user_id !== user.id) {
      return apiError('You do not have permission to update this contact', 'FORBIDDEN', 403)
    }
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...contactData, updated_at: new Date().toISOString() }) // Add updated_at
      .eq('id', contactId)
      .select()
      .single()
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess(data)
  })
}

/**
 * DELETE handler for deleting a contact
 */
export async function DELETE(req: NextRequest) {
  return withErrorHandling<{ message: string }>(async () => {
    const url = new URL(req.url)
    const contactId = url.pathname.split('/').pop() // Assuming ID is the last segment
    if (!contactId) {
      return apiError('Contact ID is required in the URL path', 'MISSING_PARAMETER', 400)
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('user_id')
      .eq('id', contactId)
      .single()
    if (fetchError) {
      return fetchError.code === 'PGRST116' ? apiError('Contact not found', 'NOT_FOUND', 404) : apiError(fetchError.message, 'DATABASE_ERROR', 500)
    }
    if (existingContact.user_id !== user.id) {
      return apiError('You do not have permission to delete this contact', 'FORBIDDEN', 403)
    }
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess({ message: 'Contact deleted successfully' })
  })
} 