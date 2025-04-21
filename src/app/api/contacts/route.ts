import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, ApiErrors, withErrorHandling } from '@/lib/api/response'
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
 * DELETE handler for deleting a contact
 */
export async function DELETE(req: NextRequest) {
  return withErrorHandling<{ message: string }>(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return ApiErrors.unauthorized('Authentication required');
    }

    const url = new URL(req.url);
    const idsString = url.searchParams.get('ids');

    if (!idsString) {
      // This route ONLY handles bulk delete via query param.
      // For single delete via path /api/contacts/[contactId], create that specific route file.
      return ApiErrors.badRequest('Contact IDs are required via the "ids" query parameter (e.g., ?ids=id1,id2)');
    }

    // Split and filter IDs
    const contactIdsToDelete = idsString.split(',').filter(id => id.trim() !== ''); 

    if (contactIdsToDelete.length === 0) {
      return ApiErrors.badRequest('No valid contact IDs provided in the "ids" query parameter.');
    }

    console.log(`[API DELETE /api/contacts] User ${user.id} attempting to delete contacts:`, contactIdsToDelete);

    // Verify the user owns ALL contacts they are trying to delete.
    const { count: ownedCount, error: verificationError } = await supabase
      .from('contacts')
      .select('*' /* Using select('*') here, though just 'id' would work */, { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('id', contactIdsToDelete);

    if (verificationError) {
        console.error("[API DELETE /api/contacts] Error verifying contact ownership:", verificationError);
        return ApiErrors.databaseError('Database error verifying contact ownership', verificationError);
    }

    if (ownedCount !== contactIdsToDelete.length) {
        console.warn(`[API DELETE /api/contacts] User ${user.id} attempted to delete contacts they don't own or that don't exist. Requested: ${contactIdsToDelete.length}, Owned: ${ownedCount}`);
        return ApiErrors.forbidden('Permission denied: You can only delete contacts you own.');
    }

    // Proceed with deletion
    console.log(`[API DELETE /api/contacts] User ${user.id} verified ownership. Deleting contacts...`);
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .in('id', contactIdsToDelete); // Use the array of IDs here

    if (deleteError) {
      console.error("[API DELETE /api/contacts] Error deleting contacts:", deleteError);
      return ApiErrors.databaseError('Failed to delete contacts', deleteError);
    }

    console.log(`[API DELETE /api/contacts] Successfully deleted ${contactIdsToDelete.length} contacts for user ${user.id}.`);
    return apiSuccess({ message: `${contactIdsToDelete.length} contact(s) deleted successfully` });
  });
} 