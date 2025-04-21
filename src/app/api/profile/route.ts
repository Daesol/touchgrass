import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, withErrorHandling, ApiResponse, ApiErrors } from '@/lib/api/response'
import { Profile } from '@/types/models' // Assuming Profile type is in models.ts

/**
 * GET handler for fetching user profile
 */
export async function GET(/* Removed unused req */) {
  // Wrap the core logic in a separate async function for clarity with withErrorHandling
  const getProfileLogic = async (): Promise<NextResponse<ApiResponse<Profile | null>>> => {
    console.log("[API Profile GET] Fetching user...");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[API Profile GET] Auth error:", authError.message);
      // Use the specific error helper
      return ApiErrors.unauthorized("Authentication error fetching user", authError);
    }
    if (!user) {
      console.log("[API Profile GET] No user found.");
      return ApiErrors.unauthorized("User not authenticated");
    }
    console.log("[API Profile GET] User found:", user.id);

    console.log("[API Profile GET] Fetching profile for user (matching profiles.id):");
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("[API Profile GET] Error fetching profile:", error);
      if (error.code === 'PGRST116') { // Resource not found
        console.log("[API Profile GET] Profile not found for user:", user.id);
        return apiSuccess(null); // Return success with null data if profile doesn't exist yet
      }
      // Use the specific error helper
      return ApiErrors.databaseError("Database error fetching profile", error);
    }
    
    console.log("[API Profile GET] Profile fetched successfully for user:", user.id);
    return apiSuccess(data);
  };

  // Pass the logic function to the error handler
  return withErrorHandling(getProfileLogic);
}

/**
 * POST handler for creating/updating profile or uploading avatar
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  
  if (contentType.includes('multipart/form-data')) {
    // Handle Avatar Upload
    return withErrorHandling<{ url: string }>(async () => {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401)
      }
      try {
        const formData = await req.formData()
        const file = formData.get('avatar') as File
        if (!file) {
          return apiError('No file provided', 'VALIDATION_ERROR', 400)
        }
        const fileExt = file.name.split('.').pop()
        const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('user_content').upload(filePath, file)
        if (uploadError) {
          return apiError(uploadError.message, 'STORAGE_ERROR', 500)
        }
        const { data } = supabase.storage.from('user_content').getPublicUrl(filePath)
        
        console.log("[API Profile POST] Updating profile avatar URL (matching profiles.id):");
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', user.id);
            
        if (updateError) {
          // Attempt to clean up uploaded file if profile update fails
          await supabase.storage.from('user_content').remove([filePath]);
          return apiError(updateError.message, 'DATABASE_ERROR', 500)
        }
        return apiSuccess({ url: data.publicUrl })
      } catch (err: unknown) {
         return apiError(err instanceof Error ? err.message : 'Error uploading avatar', 'UPLOAD_ERROR', 500)
      }
    })
  } else {
    // Handle Profile Update (delegating to PUT logic)
    return updateProfileLogic(req);
  }
}

/**
 * PUT handler for updating a user profile
 */
export async function PUT(req: NextRequest) {
  return updateProfileLogic(req);
}

// Shared logic for updating profile (used by POST and PUT)
async function updateProfileLogic(req: NextRequest): Promise<NextResponse<ApiResponse<Profile>>> {
  return withErrorHandling<Profile>(async () => {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }
    const profileData = await req.json()
    // TODO: Add Zod validation for profileData against Profile type
    
    // Remove fields that shouldn't be updated directly
    delete profileData.id; // Don't allow changing the ID itself
    delete profileData.user_id; // Remove this if it exists in payload
    delete profileData.created_at;
    delete profileData.updated_at;

    if (Object.keys(profileData).length === 0) {
        return apiError('No update data provided', 'VALIDATION_ERROR', 400)
    }

    console.log("[API Profile updateProfileLogic] Upserting profile (matching profiles.id):");
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
          id: user.id, // Ensure the ID (primary key, references auth user) is set
          ...profileData,
          updated_at: new Date().toISOString()
      })
      // Remove the .eq filter, upsert uses primary key (id) by default
      // when matching. If you need to match on another unique column, use onConflict.
      // .eq('id', user.id) // REMOVED - Upsert matches on PK (id)
      .select()
      .single()
      
    if (error) {
      console.error("Profile upsert error:", error);
      return apiError(error.message, 'DATABASE_ERROR', 500)
    }
    
    return apiSuccess(data)
  })
} 