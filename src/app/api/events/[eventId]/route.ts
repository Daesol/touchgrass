import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, ApiErrors, withErrorHandling } from '@/lib/api/response';

interface RouteParams {
  params: {
    eventId: string;
  };
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

// You can also add GET, PUT handlers here later if needed for individual events
// export async function GET(req: NextRequest, { params }: RouteParams) { ... }
// export async function PUT(req: NextRequest, { params }: RouteParams) { ... } 