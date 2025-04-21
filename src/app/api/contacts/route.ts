import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, ApiErrors, withErrorHandling, ApiErrorCode } from '@/lib/api/response'
import { Contact } from '@/types/models' // Assuming types moved to @/types/models

/**
 * GET handler for fetching contacts, optionally filtered by event_id or other params
 */
export async function GET(req: NextRequest) {
  return withErrorHandling<Contact[]>(async () => {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const url = new URL(req.url)
    const eventId = url.searchParams.get('event_id') // Filter by event_id
    // Add other potential filters here, e.g., ?search=query
    
    console.log(`[API GET /api/contacts] User ${user.id} authenticated. Fetching contacts... ${eventId ? `for event ${eventId}` : ''}`);

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    // Add other filters like search here
    // if (searchQuery) { query = query.ilike('name', `%${searchQuery}%`) } 
    
    const { data, error } = await query
    if (error) {
      console.error(`[API GET /api/contacts] Database error:`, error);
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    console.log(`[API GET /api/contacts] Found ${data?.length || 0} contacts for user ${user.id}.`);
    return apiSuccess((data || []) as Contact[])
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
    
    console.log(`[API POST /api/contacts] User ${user.id} authenticated. Creating contact...`);
    let contactData;
    try {
      contactData = await req.json()
    } catch (jsonError) {
      console.error("[API POST /api/contacts] Invalid JSON received:", jsonError);
      return apiError('Invalid request body: Must be valid JSON.', 'BAD_REQUEST' as any, 400); // Use BAD_REQUEST
    }
    
    // TODO: Add validation using Zod or similar based on src/types/models Contact
    if (!contactData.name || !contactData.event_id) {
        console.warn("[API POST /api/contacts] Validation failed: Name and event_id are required.");
      return apiError('Name and event_id are required', 'VALIDATION_ERROR', 400)
    }

    // Destructure id and keep the rest of the properties
    const { id, created_at, updated_at, ...insertData } = contactData; 

    console.log(`[API POST /api/contacts] Contact data for creation:`, insertData);

    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({ ...insertData, user_id: user.id }) // Use insertData without the client-side id
      .select()
      .single()
      
    if (error) {
      console.error(`[API POST /api/contacts] Database error:`, error);
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    console.log(`[API POST /api/contacts] Contact created successfully:`, newContact.id);
    return apiSuccess(newContact as Contact)
  })
}

/**
 * DELETE handler for deleting multiple contacts via query parameters
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
      // Clarify this endpoint is ONLY for bulk delete
      return ApiErrors.badRequest('Contact IDs are required via the "ids" query parameter for bulk deletion (e.g., ?ids=id1,id2). For single delete, use DELETE /api/contacts/[contactId].');
    }

    // Split and filter IDs
    const contactIdsToDelete = idsString.split(',').filter(id => id.trim() !== ''); 

    if (contactIdsToDelete.length === 0) {
      return ApiErrors.badRequest('No valid contact IDs provided in the "ids" query parameter.');
    }

    console.log(`[API DELETE /api/contacts?ids=...] User ${user.id} attempting bulk delete for contacts:`, contactIdsToDelete);

    // Verify the user owns ALL contacts they are trying to delete.
    const { count: ownedCount, error: verificationError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('id', contactIdsToDelete);

    if (verificationError) {
        console.error("[API DELETE /api/contacts?ids=...] Error verifying contact ownership:", verificationError);
        return ApiErrors.databaseError('Database error verifying contact ownership', verificationError);
    }

    if (ownedCount !== contactIdsToDelete.length) {
        console.warn(`[API DELETE /api/contacts?ids=...] User ${user.id} attempted to delete contacts they don't own or that don't exist. Requested: ${contactIdsToDelete.length}, Owned: ${ownedCount}`);
        return ApiErrors.forbidden('Permission denied: You can only delete contacts you own, and all specified IDs must exist.');
    }

    // Proceed with deletion
    console.log(`[API DELETE /api/contacts?ids=...] User ${user.id} verified ownership. Deleting contacts...`);
    const { error: deleteError, count } = await supabase
      .from('contacts')
      .delete({ count: 'exact' })
      .eq('user_id', user.id) // Ensure user match for safety
      .in('id', contactIdsToDelete); 

    if (deleteError) {
      console.error("[API DELETE /api/contacts?ids=...] Error deleting contacts:", deleteError);
      return ApiErrors.databaseError('Failed to delete contacts', deleteError);
    }

    console.log(`[API DELETE /api/contacts?ids=...] Successfully deleted ${count} contacts for user ${user.id}.`);
    // Consider deleting associated tasks/action items here or handle via DB cascade

    return apiSuccess({ message: `${count} contact(s) deleted successfully` });
  });
}

/* PUT handler was moved to [contactId]/route.ts */ 