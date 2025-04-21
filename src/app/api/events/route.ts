import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, withErrorHandling, ApiErrorCode } from '@/lib/api/response'
import { Event } from '@/types/models' // Assuming types moved to @/types/models

/**
 * GET handler for fetching all events belonging to the authenticated user
 */
export async function GET(request: NextRequest) {
  return withErrorHandling<Event[]>(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[API GET /api/events] Auth error:", authError?.message);
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    console.log(`[API GET /api/events] User ${user.id} authenticated. Fetching events...`);
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
      
    if (error) {
      console.error("[API GET /api/events] Database error:", error);
      return apiError(error.message, 'DATABASE_ERROR', 500);
    }
    
    console.log(`[API GET /api/events] Found ${data?.length || 0} events for user ${user.id}.`);
    return apiSuccess((data || []) as Event[]);
  });
}

/**
 * POST handler for creating a new event for the authenticated user
 */
export async function POST(request: NextRequest) {
  return withErrorHandling<Event>(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[API POST /api/events] Auth error:", authError?.message);
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    console.log(`[API POST /api/events] User ${user.id} authenticated. Creating event...`);
    
    let eventData;
    try {
      eventData = await request.json();
    } catch (jsonError) {
      console.error("[API POST /api/events] Invalid JSON received:", jsonError);
      return apiError('Invalid request body: Must be valid JSON.', 'BAD_REQUEST' as ApiErrorCode, 400);
    }

    // Basic validation
    if (!eventData.title || !eventData.date) {
      console.warn("[API POST /api/events] Validation failed: Title and date are required.");
      return apiError('Title and date are required', 'VALIDATION_ERROR', 400);
    }
    
    // Remove potentially harmful or disallowed fields before insert
    delete eventData.id;
    delete eventData.user_id;
    delete eventData.created_at;
    delete eventData.updated_at;
    
    console.log(`[API POST /api/events] Event data for creation:`, eventData);

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert({
        ...eventData,
        user_id: user.id,
      })
      .select()
      .single();
      
    if (insertError) {
      console.error("[API POST /api/events] Database error:", insertError);
      return apiError(insertError.message, 'DATABASE_ERROR', 500);
    }
    
    console.log(`[API POST /api/events] Event created successfully:`, newEvent.id);
    return apiSuccess(newEvent as Event);
  });
}

/*
 * PUT handler was moved to [eventId]/route.ts
 */

/*
 * DELETE handler was moved to [eventId]/route.ts
 */ 