"use server"

import { createSupabaseServerActionClient } from "@/lib/supabase/server-client";
import { revalidatePath } from "next/cache";
import { Event } from "@/types/models/Event";
import { convertToUIEvent, UIEvent } from "@/utils/event-converters";

// Type for client-side event format
export type UIEvent = {
  id: string;
  title: string;
  location?: string;
  company?: string;
  date: string;
  colorIndex: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Convert UI event to database format
function convertToDbEvent(event: UIEvent): Omit<Event, "id" | "createdAt" | "updatedAt"> {
  return {
    title: event.title,
    description: "",
    location: event.location,
    startDate: new Date(event.date),
    tags: ["color:" + event.colorIndex],
    notes: event.company ? `Company: ${event.company}` : "",
  };
}

// Create a new event
export async function createEvent(event: Omit<UIEvent, "id">) {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    const dbEvent = convertToDbEvent(event as UIEvent);
    
    // Insert into events table
    const { data, error } = await supabase
      .from("events")
      .insert({
        ...dbEvent,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating event:", error);
      throw error;
    }
    
    // Revalidate the dashboard page
    revalidatePath("/dashboard");
    
    return convertToUIEvent(data as unknown as Event);
  } catch (error) {
    console.error("Error in createEvent:", error);
    throw error;
  }
}

// Get all events for current user
export async function getEvents() {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    // Get events from the database
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
    
    // Convert to UI format
    return data.map(event => convertToUIEvent(event as unknown as Event));
  } catch (error) {
    console.error("Error in getEvents:", error);
    throw error;
  }
}

// Update an existing event
export async function updateEvent(id: string, updates: Partial<Omit<UIEvent, "id">>) {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    // First get the existing event
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    
    if (fetchError) {
      console.error("Error fetching event for update:", fetchError);
      throw fetchError;
    }
    
    // Merge existing with updates
    const mergedEvent = { 
      ...convertToUIEvent(existingEvent as unknown as Event),
      ...updates
    };
    
    // Convert to DB format
    const dbEvent = convertToDbEvent(mergedEvent);
    
    // Update the event
    const { data, error } = await supabase
      .from("events")
      .update({
        ...dbEvent,
        updated_at: new Date(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating event:", error);
      throw error;
    }
    
    // Revalidate the dashboard page
    revalidatePath("/dashboard");
    
    return convertToUIEvent(data as unknown as Event);
  } catch (error) {
    console.error("Error in updateEvent:", error);
    throw error;
  }
}

// Delete an event
export async function deleteEvent(id: string) {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    // Delete the event
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    
    if (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
    
    // Revalidate the dashboard page
    revalidatePath("/dashboard");
    
    return true;
  } catch (error) {
    console.error("Error in deleteEvent:", error);
    throw error;
  }
} 