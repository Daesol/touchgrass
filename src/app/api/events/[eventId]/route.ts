import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, ApiErrors, withErrorHandling } from '@/lib/api/response';
import { Event } from '@/types/models'; // Import Event type

interface RouteParams {
  params: {
    eventId: string;
  };
}

/**
 * GET handler for fetching a specific event by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  return withErrorHandling<Event | null>(async () => {
    const { eventId } = params;

    if (!eventId) {
      return ApiErrors.badRequest('Event ID is required');
    }

    console.log(`[API GET /api/events/${eventId}] Fetching event details...`);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[API GET /api/events/${eventId}] Auth error:`, authError?.message);
      return ApiErrors.unauthorized('Authentication required');
    }

    console.log(`[API GET /api/events/${eventId}] User ${user.id} authenticated.`);

    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('*') // Select all columns for the event
      .eq('id', eventId)
      .eq('user_id', user.id) // Ensure the event belongs to the user
      .maybeSingle(); // Use maybeSingle() to return null instead of error if not found

    if (fetchError) {
       // Don't treat "not found" as a server error when using maybeSingle
       if (fetchError.code !== 'PGRST116') { 
           console.error(`[API GET /api/events/${eventId}] Error fetching event:`, fetchError);
           return ApiErrors.databaseError('Database error fetching event', fetchError);
       }
       // If code is PGRST116, it means not found, which maybeSingle handles by returning null data.
    }

    if (!eventData) {
      // Handle the case where the event is not found or doesn't belong to the user
      console.log(`[API GET /api/events/${eventId}] Event not found or user ${user.id} does not have permission.`);
      return ApiErrors.notFound('Event not found or permission denied');
    }
    
    console.log(`[API GET /api/events/${eventId}] Event found:`, eventData.title);
    return apiSuccess(eventData as Event);
  });
}

/**
 * PUT handler for updating a specific event
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withErrorHandling<Event>(async () => {
    const { eventId } = params;

    if (!eventId) {
       // This check might be redundant due to Next.js routing but good practice
       return ApiErrors.badRequest('Event ID is required in the URL path');
    }

    console.log(`[API PUT /api/events/${eventId}] Updating event...`);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[API PUT /api/events/${eventId}] Auth error:`, authError?.message);
      return ApiErrors.unauthorized('Authentication required');
    }

    const eventData = await req.json();
    // Remove id and user_id from the update payload if they exist, 
    // as these shouldn't be directly updatable via this endpoint.
    delete eventData.id;
    delete eventData.user_id;

    if (Object.keys(eventData).length === 0) {
      return ApiErrors.badRequest('No update data provided');
    }
    
    console.log(`[API PUT /api/events/${eventId}] User ${user.id} authenticated. Update payload:`, eventData);

    // Verify user owns the event before updating
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id') // Select minimal data
      .eq('id', eventId)
      .eq('user_id', user.id) // Check ownership
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Resource not found (or doesn't belong to user)
        console.warn(`[API PUT /api/events/${eventId}] Event not found or user ${user.id} does not have permission.`);
        return ApiErrors.notFound('Event not found or permission denied');
      }
      console.error(`[API PUT /api/events/${eventId}] Error fetching event for verification:`, fetchError);
      return ApiErrors.databaseError('Database error verifying event ownership', fetchError);
    }
    
    // Proceed with the update
    console.log(`[API PUT /api/events/${eventId}] User ${user.id} verified ownership. Updating event...`);
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .eq('user_id', user.id) // Add user_id match again for safety
      .select()
      .single();

    if (updateError) {
      console.error(`[API PUT /api/events/${eventId}] Error updating event in database:`, updateError);
      return ApiErrors.databaseError('Database error updating event', updateError);
    }
    
    console.log(`[API PUT /api/events/${eventId}] Event updated successfully:`, updatedEvent.title);
    return apiSuccess(updatedEvent as Event);
  });
}

/**
 * DELETE handler for deleting a specific event
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withErrorHandling<{ message: string }>(async () => {
    const { eventId } = params;

    if (!eventId) {
      // Should be caught by Next.js routing, but good practice to check
      return ApiErrors.badRequest('Event ID is required in the URL path');
    }

    console.log(`[API DELETE /api/events/${eventId}] Initiating deletion...`);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[API DELETE /api/events/${eventId}] Auth error:`, authError?.message);
      return ApiErrors.unauthorized('Authentication required');
    }

    console.log(`[API DELETE /api/events/${eventId}] User ${user.id} authenticated.`);

    // Verify user owns the event before deleting
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id') // Select minimal data needed for verification
      .eq('id', eventId)
      .eq('user_id', user.id) // Ensure the event belongs to the authenticated user
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Resource not found (or doesn't belong to user)
        console.warn(`[API DELETE /api/events/${eventId}] Event not found or user ${user.id} does not have permission.`);
        return ApiErrors.notFound('Event not found or permission denied');
      }
      console.error(`[API DELETE /api/events/${eventId}] Error fetching event for verification:`, fetchError);
      return ApiErrors.databaseError('Database error verifying event ownership', fetchError);
    }

    // If fetchError is null and existingEvent is present, the user owns it. Proceed with deletion.
    console.log(`[API DELETE /api/events/${eventId}] User ${user.id} verified ownership. Deleting event...`);
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId); // Match the event ID for deletion

    if (deleteError) {
      console.error(`[API DELETE /api/events/${eventId}] Error deleting event from database:`, deleteError);
      return ApiErrors.databaseError('Database error deleting event', deleteError);
    }

    console.log(`[API DELETE /api/events/${eventId}] Event deleted successfully.`);
    return apiSuccess({ message: 'Event deleted successfully' });
  });
}

// You can also add PUT handler here later if needed
// export async function PUT(req: NextRequest, { params }: RouteParams) { ... } 