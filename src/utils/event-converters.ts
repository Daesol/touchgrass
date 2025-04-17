import { Event } from "@/types/models/Event";

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

// Convert database event to UI format
export function convertToUIEvent(dbEvent: Event): UIEvent {
  // Extract color index from tags if available
  const colorTag = dbEvent.tags?.find(tag => tag.startsWith("color:"));
  const colorIndex = colorTag ? colorTag.split(":")[1] : "0";
  
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    location: dbEvent.location || "",
    company: dbEvent.notes?.replace("Company: ", "") || "",
    date: dbEvent.startDate.toISOString().split("T")[0],
    colorIndex: colorIndex,
    createdAt: dbEvent.createdAt,
    updatedAt: dbEvent.updatedAt,
  };
} 