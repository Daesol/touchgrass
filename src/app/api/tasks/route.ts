import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/api/response';
import { ActionItem } from '@/types/models';

/**
 * GET handler for fetching action items (tasks)
 */
export async function GET(request: NextRequest) {
  return withErrorHandling<ActionItem[]>(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Fetch action items belonging to the user
    // Optionally filter by contact_id or event_id if query params are present
    const url = new URL(request.url);
    const contactId = url.searchParams.get('contactId');
    const eventId = url.searchParams.get('eventId');

    let query = supabase
      .from('action_items') // Make sure 'action_items' is the correct table name
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching action items:", error);
      return apiError(error.message, 'DATABASE_ERROR', 500);
    }

    return apiSuccess(data || []);
  });
}

/**
 * POST handler for creating a new action item
 */
export async function POST(request: NextRequest) {
   return withErrorHandling<ActionItem>(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiError('Unauthorized', 'UNAUTHORIZED', 401);

    const itemData = await request.json();
    // Validate based on the actual schema column 'text'
    if (!itemData.text) { 
       return apiError('Task text content is required', 'VALIDATION_ERROR', 400);
    }

    // Ensure user_id and completed are set, insert received data
    const { data, error } = await supabase
      .from('action_items')
      .insert({ 
          ...itemData, // contains 'text', 'due_date', 'contact_id', 'event_id' from payload
          user_id: user.id, 
          completed: itemData.completed !== undefined ? itemData.completed : false // Use provided completed status or default to false
      })
      .select()
      .single();
      
    if (error) return apiError(error.message, 'DATABASE_ERROR', 500);
    return apiSuccess(data);
   });
}

/**
 * PUT handler for updating an action item (e.g., marking complete)
 */
export async function PUT(request: NextRequest) {
    return withErrorHandling<ActionItem>(async () => {
        const url = new URL(request.url);
        const taskId = url.pathname.split('/').pop(); // Assuming ID is the last segment
        if (!taskId) return apiError('Task ID is required', 'MISSING_PARAMETER', 400);

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return apiError('Unauthorized', 'UNAUTHORIZED', 401);

        // Explicitly type the expected body structure
        const updateData: { completed?: boolean; [key: string]: any } = await request.json();
        
        // Validation check
        if (typeof updateData?.completed !== 'boolean') { 
            return apiError("Invalid update data: boolean 'completed' status is required", 'VALIDATION_ERROR', 400);
        }

        // Verify user owns the task before updating
        const { data: existingTask, error: fetchError } = await supabase
            .from('action_items')
            .select('user_id')
            .eq('id', taskId)
            .eq('user_id', user.id) // Filter by user_id here for security
            .single();

        if (fetchError) {
            return fetchError.code === 'PGRST116' 
                ? apiError('Task not found or you do not have permission', 'NOT_FOUND', 404) 
                : apiError(fetchError.message, 'DATABASE_ERROR', 500);
        }
        // No need for explicit user_id check as the fetch query included it

        const { data, error } = await supabase
            .from('action_items')
            .update({ 
                completed: updateData.completed, // Access the validated property
                updated_at: new Date().toISOString() 
            })
            .eq('id', taskId)
            .select()
            .single();

        if (error) return apiError(error.message, 'DATABASE_ERROR', 500);
        return apiSuccess(data);
    });
}

/**
 * DELETE handler for deleting an action item
 */
export async function DELETE(request: NextRequest) {
   return withErrorHandling<{ message: string }>(async () => {
        const url = new URL(request.url);
        const taskId = url.pathname.split('/').pop();
        if (!taskId) return apiError('Task ID is required', 'MISSING_PARAMETER', 400);

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return apiError('Unauthorized', 'UNAUTHORIZED', 401);

        // Verify user owns the task before deleting
        const { error: deleteError } = await supabase
            .from('action_items')
            .delete()
            .eq('id', taskId)
            .eq('user_id', user.id); // Important security check

        if (deleteError) {
             // Check if the error is due to the item not existing (code PGRST116 might indicate this)
            if (deleteError.code === 'PGRST116') {
                 return apiError('Task not found or you do not have permission', 'NOT_FOUND', 404);
            }
            return apiError(deleteError.message, 'DATABASE_ERROR', 500);
        }
        
        // Check if any rows were affected? Supabase delete might not return count easily.
        // If deletion was successful (no error), assume it worked.
        return apiSuccess({ message: 'Task deleted successfully' });
   });
} 