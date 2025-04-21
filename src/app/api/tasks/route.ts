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
    let supabase;
    let user;
    try {
        supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError; // Throw to be caught below
        if (!authData.user) return apiError('Unauthorized - No user found', 'UNAUTHORIZED', 401);
        user = authData.user;
        console.log("Authenticated user ID:", user.id);
    } catch (authError: any) {
        console.error("Authentication error in POST /api/tasks:", authError);
        // Use a more specific error message if possible
        const message = authError.message || 'Authentication failed';
        const code = authError.code || 'AUTH_ERROR';
        return apiError(message, code, 401);
    }

    let itemData;
    try {
        itemData = await request.json();
        console.log("Received item data for POST /api/tasks:", itemData);

        // Validate based on the actual schema column 'title' (not 'text')
        if (!itemData.title) {
           console.error("Validation failed: Task title content is required.", itemData);
           return apiError('Task title content is required', 'VALIDATION_ERROR', 400);
        }
    } catch (parseError: any) {
        console.error("Error parsing request JSON in POST /api/tasks:", parseError);
        return apiError('Invalid request body', 'BAD_REQUEST', 400);
    }

    // Ensure user_id and completed are set, insert received data
    try {
        const insertPayload = {
            ...itemData, // contains 'title', 'due_date', 'contact_id', 'event_id' from payload
            user_id: user.id, // Use the authenticated user's ID
            completed: itemData.completed ?? false // Default completed to false if not provided
        };
        console.log("Attempting to insert task with payload:", insertPayload);

        const { data, error } = await supabase
          .from('action_items')
          .insert(insertPayload)
          .select()
          .single();
          
        if (error) throw error; // Throw DB error to be caught below

        console.log("Successfully inserted task:", data);
        return apiSuccess(data);

    } catch (dbError: any) {
        console.error("Database error inserting task in POST /api/tasks:", { 
            message: dbError.message, 
            code: dbError.code, 
            details: dbError.details, 
            hint: dbError.hint 
        });
        // Provide a more informative error response if possible
        const message = dbError.message || 'Failed to create task due to database error';
        const code = dbError.code || 'DATABASE_ERROR';
        return apiError(message, code, 500);
    }
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