import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, withErrorHandling } from '@/lib/api/response'
import { Note } from '@/types/models' // Assuming Note type is in models.ts

/**
 * GET handler for fetching notes, optionally filtered by contact
 */
export async function GET(req: NextRequest) {
  return withErrorHandling<Note[]>(async () => {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const url = new URL(req.url)
    const contactId = url.searchParams.get('contactId')
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    const { data, error } = await query
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess(data || [])
  })
}

/**
 * POST handler for creating a new note
 */
export async function POST(req: NextRequest) {
  return withErrorHandling<Note>(async () => {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const noteData = await req.json()
    // TODO: Add validation based on src/types/models Note
    if (!noteData.content || !noteData.contact_id) {
      return apiError('Content and contact_id are required', 'VALIDATION_ERROR', 400)
    }
    const { data, error } = await supabase
      .from('notes')
      .insert({ 
        ...noteData, 
        user_id: user.id, 
        created_at: new Date().toISOString() // Ensure created_at is set
      })
      .select()
      .single()
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess(data)
  })
}

/**
 * PUT handler for updating a note
 */
export async function PUT(req: NextRequest) {
  return withErrorHandling<Note>(async () => {
    const url = new URL(req.url)
    const noteId = url.pathname.split('/').pop() // Assuming ID is the last segment
    if (!noteId) {
      return apiError('Note ID is required in the URL path', 'MISSING_PARAMETER', 400)
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const noteData = await req.json()
    if (Object.keys(noteData).length === 0) {
      return apiError('No update data provided', 'VALIDATION_ERROR', 400)
    }
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single()
    if (fetchError) {
      return fetchError.code === 'PGRST116' ? apiError('Note not found', 'NOT_FOUND', 404) : apiError(fetchError.message, 'DATABASE_ERROR', 500)
    }
    if (existingNote.user_id !== user.id) {
      return apiError('You do not have permission to update this note', 'FORBIDDEN', 403)
    }
    const updatedData = { ...noteData, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('notes')
      .update(updatedData)
      .eq('id', noteId)
      .select()
      .single()
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess(data)
  })
}

/**
 * DELETE handler for deleting a note
 */
export async function DELETE(req: NextRequest) {
  return withErrorHandling<{ message: string }>(async () => {
    const url = new URL(req.url)
    const noteId = url.pathname.split('/').pop() // Assuming ID is the last segment
    if (!noteId) {
      return apiError('Note ID is required in the URL path', 'MISSING_PARAMETER', 400)
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single()
    if (fetchError) {
      return fetchError.code === 'PGRST116' ? apiError('Note not found', 'NOT_FOUND', 404) : apiError(fetchError.message, 'DATABASE_ERROR', 500)
    }
    if (existingNote.user_id !== user.id) {
      return apiError('You do not have permission to delete this note', 'FORBIDDEN', 403)
    }
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess({ message: 'Note deleted successfully' })
  })
} 