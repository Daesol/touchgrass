'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Contact } from "@/types/models"
import { Database } from "@/types/database.types"

/**
 * Get all contacts for the current user
 * Optionally filter by event ID
 */
export async function getContacts(eventId?: string): Promise<Contact[]> {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Build query
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
  
  // Add filter by event ID if provided
  if (eventId) {
    query = query.eq('event_id', eventId)
  }
  
  // Execute query
  const { data, error } = await query.order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching contacts:', error)
    throw new Error(`Failed to fetch contacts: ${error.message}`)
  }
  
  return data || []
}

/**
 * Create a new contact
 */
export async function createContact(
  formData: FormData | Record<string, any>
): Promise<Contact> {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  let contactData: Record<string, any>
  if (formData instanceof FormData) {
    contactData = Object.fromEntries(formData.entries())
  } else {
    contactData = formData
  }
  
  // Validate required fields (add more as needed based on your schema)
  if (!contactData.name) {
    throw new Error('Contact name is required')
  }
  // Add validation for event_id if it's mandatory in your DB
  // if (!contactData.event_id) {
  //   throw new Error('Event ID is required')
  // }
  
  const dataToInsert = {
    ...contactData,
    user_id: user.id,
    // Ensure correct types before insertion if necessary
    // e.g., parse numbers, format dates
  }
  
  // Insert data
  const { data, error } = await supabase
    .from('contacts')
    .insert(dataToInsert) // Use the prepared data object
    .select()
    .single()
  
  if (error) {
    console.error('Error creating contact:', error)
    throw new Error(`Failed to create contact: ${error.message}`)
  }
  
  revalidatePath('/dashboard/contacts')
  return data as Contact // Cast should be safer now
}

/**
 * Update an existing contact
 */
export async function updateContact(
  id: string,
  formData: FormData | Record<string, any>
): Promise<Contact> {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Process FormData if needed
  const contactData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData
  
  // Validate contact ID
  if (!id) {
    throw new Error('Contact ID is required')
  }
  
  // Check for at least one field to update
  if (Object.keys(contactData).length === 0) {
    throw new Error('No update data provided')
  }
  
  // Get existing contact to verify ownership
  const { data: existingContact, error: fetchError } = await supabase
    .from('contacts')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Contact not found')
    }
    throw new Error(`Error fetching contact: ${fetchError.message}`)
  }
  
  // Verify ownership
  if (existingContact.user_id !== user.id) {
    throw new Error('You do not have permission to update this contact')
  }
  
  // Update contact
  const { data, error } = await supabase
    .from('contacts')
    .update(contactData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating contact:', error)
    throw new Error(`Failed to update contact: ${error.message}`)
  }
  
  // Revalidate the contacts page
  revalidatePath('/dashboard')
  
  return data
}

/**
 * Delete a contact
 */
export async function deleteContact(contactId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
        // First, delete associated action items (assuming 'action_items' table and 'contact_id' column)
        // You might need to adjust table/column names based on your schema
        // Consider doing this in a transaction if your DB supports it for atomicity
        const { error: actionItemsError } = await supabase
            .from('action_items')
            .delete()
            .eq('contact_id', contactId);

        if (actionItemsError) {
            console.error("Error deleting associated action items:", actionItemsError);
            throw new Error(`Failed to delete associated action items: ${actionItemsError.message}`);
        }

        // TODO: Delete associated notes as well if they exist
        // const { error: notesError } = await supabase
        //     .from('notes') // Assuming 'notes' table
        //     .delete()
        //     .eq('contact_id', contactId);
        // if (notesError) {
        //     console.error("Error deleting associated notes:", notesError);
        //     throw new Error(`Failed to delete associated notes: ${notesError.message}`);
        // }

        // Then, delete the contact itself
        const { error: contactError } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactId);

        if (contactError) {
            console.error("Error deleting contact:", contactError);
            throw new Error(`Failed to delete contact: ${contactError.message}`);
        }

        // Revalidate paths where contacts are displayed
        revalidatePath("/dashboard/contacts");
        revalidatePath(`/dashboard/contacts/${contactId}`); // Revalidate potential detail page
        // Also revalidate paths where action items/notes might be shown, e.g., /dashboard/action-items
        revalidatePath("/dashboard/action-items"); 

        console.log(`Contact ${contactId} and associated items deleted successfully.`);
        return { success: true };

    } catch (error) {
        console.error('Delete Contact Action Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
} 

// --- Delete Multiple Contacts ---
export async function deleteMultipleContacts(contactIds: string[]): Promise<{ success: boolean; error?: string }> {
    if (!contactIds || contactIds.length === 0) {
        return { success: true }; // Nothing to delete
    }

    const supabase = await createClient();
    // Optional: Verify user - uncomment if needed, though actions might be protected by middleware/RLS
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //     return { success: false, error: 'User not authenticated' };
    // }

    try {
        // Delete associated action items first using .in() filter
        const { error: actionItemsError } = await supabase
            .from('action_items')
            .delete()
            .in('contact_id', contactIds);
            // Optional: Add .eq('user_id', user.id) if RLS doesn't cover this

        if (actionItemsError) {
            console.error("Error deleting associated action items (batch):", actionItemsError);
            throw new Error(`Failed to delete associated action items: ${actionItemsError.message}`);
        }

        // TODO: Delete associated notes as well using .in() filter
        // const { error: notesError } = await supabase
        //     .from('notes') // Assuming 'notes' table
        //     .delete()
        //     .in('contact_id', contactIds);
        // if (notesError) {
        //     console.error("Error deleting associated notes (batch):", notesError);
        //     throw new Error(`Failed to delete associated notes: ${notesError.message}`);
        // }

        // Then, delete the contacts themselves using .in() filter
        const { error: contactsError } = await supabase
            .from('contacts')
            .delete()
            .in('id', contactIds);
            // Optional: Add .eq('user_id', user.id) if RLS doesn't cover this

        if (contactsError) {
            console.error("Error deleting contacts (batch):", contactsError);
            throw new Error(`Failed to delete contacts: ${contactsError.message}`);
        }

        // Revalidate paths 
        revalidatePath("/dashboard/contacts");
        // Revalidate detail pages? Could be many. Maybe skip or handle differently.
        // contactIds.forEach(id => revalidatePath(`/dashboard/contacts/${id}`)); 
        revalidatePath("/dashboard/action-items"); 

        console.log(`${contactIds.length} contact(s) and associated items deleted successfully.`);
        return { success: true };

    } catch (error) {
        console.error('Batch Delete Contact Action Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred during batch delete' };
    }
} 