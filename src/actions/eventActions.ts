'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Event } from "@/types/models"
import { convertToUIEvent, UIEvent } from "@/lib/eventsUtils"

/**
 * Get all events for the current user
 */
export async function getEventsAction(): Promise<UIEvent[]> {
  try {
    const supabase = createSupabaseServerActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
    
    if (error) {
      console.error("Error fetching events:", error)
      throw error
    }
    
    return (data || []).map(event => convertToUIEvent(event as Event))
  } catch (error) {
    console.error("Error in getEventsAction:", error)
    throw error
  }
}

/**
 * Create a new event
 */
export async function createEventAction(event: Omit<UIEvent, "id" | "createdAt" | "updatedAt">): Promise<UIEvent> {
  try {
    const supabase = createSupabaseServerActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    const dbEventData = convertToDbEventData(event as UIEvent)
    
    const { data, error } = await supabase
      .from("events")
      .insert({ ...dbEventData, user_id: user.id })
      .select()
      .single()
    
    if (error) {
      console.error("Error creating event:", error)
      throw error
    }
    
    revalidatePath("/dashboard")
    return convertToUIEvent(data as Event)
  } catch (error) {
    console.error("Error in createEventAction:", error)
    throw error
  }
}

/**
 * Update an existing event
 */
export async function updateEventAction(id: string, updates: Partial<Omit<UIEvent, "id" | "createdAt" | "updatedAt">>): Promise<UIEvent> {
  try {
    const supabase = createSupabaseServerActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    // Convert partial UIEvent updates to partial DB Event updates
    const dbUpdates: Partial<Omit<Event, "id" | "created_at" | "updated_at" | "user_id">> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.location !== undefined) dbUpdates.location = updates.location === '' ? null : updates.location
    if (updates.company !== undefined) dbUpdates.company = updates.company === '' ? null : updates.company
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.colorIndex !== undefined) dbUpdates.color_index = parseInt(updates.colorIndex || '0', 10)

    if (Object.keys(dbUpdates).length === 0) {
      throw new Error("No valid fields to update")
    }
    
    const { data, error } = await supabase
      .from("events")
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating event:", error)
      throw error
    }
    
    revalidatePath("/dashboard")
    return convertToUIEvent(data as Event)
  } catch (error) {
    console.error("Error in updateEventAction:", error)
    throw error
  }
}

/**
 * Delete an event
 */
export async function deleteEventAction(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseServerActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
    
    if (error) {
      console.error("Error deleting event:", error)
      throw error
    }
    
    revalidatePath("/dashboard")
    return true
  } catch (error) {
    console.error("Error in deleteEventAction:", error)
    throw error
  }
}

// Convert UI event to database format
function convertToDbEventData(event: UIEvent): Omit<Event, "id" | "created_at" | "updated_at" | "user_id"> {
  // Explicitly check for undefined/empty string and convert to null for DB
  const locationForDb = event.location === undefined || event.location === '' ? null : event.location;
  const companyForDb = event.company === undefined || event.company === '' ? null : event.company;

  return {
    title: event.title,
    location: locationForDb,
    company: companyForDb,
    date: event.date, // Expecting "YYYY-MM-DD"
    color_index: parseInt(event.colorIndex || '0', 10), // Convert string index to number
  };
} 