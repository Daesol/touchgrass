import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, withErrorHandling } from '@/lib/api/response'
import { Event } from '@/types/models' // Assuming types moved to @/types/models

/**
 * GET handler for fetching all events
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401)
  }
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
  if (error) {
    return apiError(error.message, 'DATABASE_ERROR', 500)
  }
  return apiSuccess(data || [])
}

/**
 * POST handler for creating a new event
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401)
  }
  const eventData = await request.json()
  if (!eventData.title || !eventData.date) {
    return apiError('Title and date are required', 'VALIDATION_ERROR', 400)
  }
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      user_id: user.id,
    })
    .select()
    .single()
  if (error) {
    return apiError(error.message, 'DATABASE_ERROR', 500)
  }
  return apiSuccess(data)
}

/**
 * PUT handler for updating an event
 */
export async function PUT(req: NextRequest) {
  return withErrorHandling<Event>(async () => {
    const url = new URL(req.url)
    const eventId = url.pathname.split('/').pop() // Assuming ID is the last segment

    if (!eventId) {
       return apiError('Event ID is required in the URL path', 'MISSING_PARAMETER', 400)
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const eventData = await req.json()
    if (Object.keys(eventData).length === 0) {
      return apiError('No update data provided', 'VALIDATION_ERROR', 400)
    }
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single()
    if (fetchError) {
      return fetchError.code === 'PGRST116' ? apiError('Event not found', 'NOT_FOUND', 404) : apiError(fetchError.message, 'DATABASE_ERROR', 500)
    }
    if (existingEvent.user_id !== user.id) {
      return apiError('You do not have permission to update this event', 'FORBIDDEN', 403)
    }
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single()
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess(data)
  })
}

/**
 * DELETE handler for deleting an event
 */
export async function DELETE(req: NextRequest) {
  return withErrorHandling<{ message: string }>(async () => {
    const url = new URL(req.url)
    const eventId = url.pathname.split('/').pop() // Assuming ID is the last segment
    
    if (!eventId) {
       return apiError('Event ID is required in the URL path', 'MISSING_PARAMETER', 400)
    }
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single()
    if (fetchError) {
      return fetchError.code === 'PGRST116' ? apiError('Event not found', 'NOT_FOUND', 404) : apiError(fetchError.message, 'DATABASE_ERROR', 500)
    }
    if (existingEvent.user_id !== user.id) {
      return apiError('You do not have permission to delete this event', 'FORBIDDEN', 403)
    }
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
    if (error) {
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    return apiSuccess({ message: 'Event deleted successfully' })
  })
} 