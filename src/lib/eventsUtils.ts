import { Event } from "@/types/models";

// Type for client-side event format
export type UIEvent = {
  id: string;
  title: string;
  location?: string;
  company?: string;
  date: string;
  colorIndex: string;
  createdAt?: string;
  updatedAt?: string;
};

// Convert database event (from @/types/models) to UI format
export function convertToUIEvent(dbEvent: Event): UIEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    location: dbEvent.location || undefined,
    company: dbEvent.company || undefined,
    date: dbEvent.date,
    colorIndex: dbEvent.color_index?.toString() || "0",
    createdAt: dbEvent.created_at,
    updatedAt: dbEvent.updated_at,
  };
} 