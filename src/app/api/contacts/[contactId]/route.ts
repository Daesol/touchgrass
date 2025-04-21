import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, ApiErrors, withErrorHandling } from '@/lib/api/response';
import { Contact } from '@/types/models';

interface RouteParams {
  params: {
    contactId: string;
  };
}

/**
 * GET handler for fetching a specific contact by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  return withErrorHandling<Contact | null>(async () => {
    const { contactId } = params;

    if (!contactId) {
      return ApiErrors.badRequest('Contact ID is required');
    }

    console.log(`[API GET /api/contacts/${contactId}] Fetching contact details...`);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[API GET /api/contacts/${contactId}] Auth error:`, authError?.message);
      return ApiErrors.unauthorized('Authentication required');
    }

    console.log(`[API GET /api/contacts/${contactId}] User ${user.id} authenticated.`);

    // Fetch the contact, ensuring it belongs to the user
    const { data: contactData, error: fetchError } = await supabase
      .from('contacts')
      .select('*') // Select all columns
      .eq('id', contactId)
      .eq('user_id', user.id) // Ownership check
      .maybeSingle(); 

    if (fetchError) {
      if (fetchError.code !== 'PGRST116') { 
        console.error(`[API GET /api/contacts/${contactId}] Error fetching contact:`, fetchError);
        return ApiErrors.databaseError('Database error fetching contact', fetchError);
      }
    }

    if (!contactData) {
      console.log(`[API GET /api/contacts/${contactId}] Contact not found or user ${user.id} does not have permission.`);
      return ApiErrors.notFound('Contact not found or permission denied');
    }
    
    console.log(`[API GET /api/contacts/${contactId}] Contact found:`, contactData.name);
    return apiSuccess(contactData as Contact);
  });
}

/**
 * PUT handler for updating a specific contact
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withErrorHandling<Contact>(async () => {
    const { contactId } = params;

    if (!contactId) {
      return ApiErrors.badRequest('Contact ID is required');
    }

    console.log(`[API PUT /api/contacts/${contactId}] Updating contact...`);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[API PUT /api/contacts/${contactId}] Auth error:`, authError?.message);
      return ApiErrors.unauthorized('Authentication required');
    }

    const contactUpdateData = await req.json();
    // Remove fields that shouldn't be updated directly
    delete contactUpdateData.id;
    delete contactUpdateData.user_id;
    delete contactUpdateData.created_at;
    delete contactUpdateData.updated_at;

    if (Object.keys(contactUpdateData).length === 0) {
      return ApiErrors.badRequest('No update data provided');
    }

    console.log(`[API PUT /api/contacts/${contactId}] User ${user.id} authenticated. Update payload:`, contactUpdateData);

    // Verify ownership before update
    const { error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.warn(`[API PUT /api/contacts/${contactId}] Contact not found or user ${user.id} does not have permission.`);
        return ApiErrors.notFound('Contact not found or permission denied');
      }
      console.error(`[API PUT /api/contacts/${contactId}] Error checking contact ownership:`, checkError);
      return ApiErrors.databaseError('Database error verifying contact ownership', checkError);
    }
    
    // Perform the update
    console.log(`[API PUT /api/contacts/${contactId}] User ${user.id} verified ownership. Updating contact...`);
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update(contactUpdateData)
      .eq('id', contactId)
      .eq('user_id', user.id) // Ensure user match again
      .select()
      .single();

    if (updateError) {
      console.error(`[API PUT /api/contacts/${contactId}] Error updating contact:`, updateError);
      return ApiErrors.databaseError('Database error updating contact', updateError);
    }
    
    console.log(`[API PUT /api/contacts/${contactId}] Contact updated successfully:`, updatedContact.name);
    return apiSuccess(updatedContact as Contact);
  });
}

/**
 * DELETE handler for deleting a specific contact
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    return withErrorHandling<{ message: string }>(async () => {
      const { contactId } = params;
  
      if (!contactId) {
        return ApiErrors.badRequest('Contact ID is required');
      }
  
      console.log(`[API DELETE /api/contacts/${contactId}] Initiating deletion...`);
  
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
  
      if (authError || !user) {
        console.error(`[API DELETE /api/contacts/${contactId}] Auth error:`, authError?.message);
        return ApiErrors.unauthorized('Authentication required');
      }
  
      console.log(`[API DELETE /api/contacts/${contactId}] User ${user.id} authenticated.`);
  
      // Verify user owns the contact before deleting
      const { error: checkError } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true }) // More efficient check
        .eq('id', contactId)
        .eq('user_id', user.id);
        
      if (checkError) {
        console.error(`[API DELETE /api/contacts/${contactId}] Error checking contact ownership:`, checkError);
        // Don't return 404 here, the delete operation itself will handle it
        if (checkError.code !== 'PGRST116') { // Only error if it's not a 'not found' error
             return ApiErrors.databaseError('Database error verifying contact ownership', checkError);
        }
      }
  
      // Proceed with deletion (Supabase RLS should prevent unauthorized deletion)
      console.log(`[API DELETE /api/contacts/${contactId}] Attempting deletion...`);
      const { error: deleteError, count } = await supabase
        .from('contacts')
        .delete({ count: 'exact' }) // Get count of deleted rows
        .eq('id', contactId)
        .eq('user_id', user.id); // RLS handles this, but explicit check is fine
  
      if (deleteError) {
        console.error(`[API DELETE /api/contacts/${contactId}] Error deleting contact:`, deleteError);
        return ApiErrors.databaseError('Database error deleting contact', deleteError);
      }

      if (count === 0) {
         console.warn(`[API DELETE /api/contacts/${contactId}] Contact not found or user ${user.id} does not have permission.`);
         // Return 404 if no rows were deleted
         return ApiErrors.notFound('Contact not found or permission denied');
      }
  
      console.log(`[API DELETE /api/contacts/${contactId}] Contact deleted successfully.`);
      // Also consider deleting associated tasks/action items here or handle via DB cascade

      return apiSuccess({ message: 'Contact deleted successfully' });
    });
  } 