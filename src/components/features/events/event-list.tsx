"use client"

import type { Event, Contact } from "@/types/models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Building, Users, Clock } from "lucide-react"
import { useMemo } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Briefcase } from "lucide-react"
import { User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type EventListProps = {
  events: Event[]
  onSelectEvent: (event: Event) => void
  contacts: Contact[]
  searchQuery?: string
  selectedEvent?: Event | null
  onSelectContact?: (contact: Contact) => void
  compact?: boolean
}

// Array of vibrant gradient pairs - export this for reuse
export const gradients = [
  ["from-pink-500 to-rose-500", "bg-rose-50", "text-rose-700"],
  ["from-blue-500 to-cyan-500", "bg-blue-50", "text-blue-700"],
  ["from-violet-500 to-purple-500", "bg-violet-50", "text-violet-700"],
  ["from-emerald-500 to-teal-500", "bg-emerald-50", "text-emerald-700"],
  ["from-amber-500 to-orange-500", "bg-amber-50", "text-amber-700"],
  ["from-indigo-500 to-blue-500", "bg-indigo-50", "text-indigo-700"],
]

// Helper to get color based on index
const getColorByIndex = (index: number): string[] => {
  // Return the full gradient array pair
  return gradients[index % gradients.length] ?? gradients[0];
};

export function EventList({ events, onSelectEvent, contacts, searchQuery, selectedEvent, onSelectContact, compact }: EventListProps) {
  const normalizedSearchQuery = (searchQuery ?? '').toLowerCase();

  // Filter events based ONLY on the search query
  // Selection logic is handled by the parent Dashboard component (by passing a single event)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
        if (normalizedSearchQuery === '') {
            return true; // No search query, show all
        }
        
        const matchesSearch = (
          event.title.toLowerCase().includes(normalizedSearchQuery) ||
          (event.company && event.company.toLowerCase().includes(normalizedSearchQuery)) ||
          (event.location && event.location.toLowerCase().includes(normalizedSearchQuery))
        );
        return matchesSearch;
      });
  }, [events, normalizedSearchQuery]);

  const eventsToRender = filteredEvents;

  if (eventsToRender.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <Calendar className="h-12 w-12 text-zinc-300" />
        <h3 className="mt-2 text-lg font-medium">No events found</h3>
        <p className="text-sm text-muted-foreground">
          {searchQuery ? "No events match your search." : "Create your first networking event."}
        </p>
      </div>
    )
  }

  return (
    // Changed grid layout if needed, maybe just one column for events?
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2"> 
      {eventsToRender.map((event) => {
        // Safely parse color_index (string) to number with fallback
        const eventColorIndex = parseInt(event.color_index || '0', 10);
        const [gradientClass, lightBgClass, textClass] = getColorByIndex(eventColorIndex);

        // Count associated contacts (optional, but can be useful)
        const contactCount = contacts.filter(c => c.event_id === event.id).length;

        return (
          <Card
            key={event.id}
            className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 dark:hover:shadow-primary/20 border border-border rounded-lg group`}
            onClick={() => onSelectEvent(event)} // Use onSelectEvent prop
          >
            {/* Top border gradient */}
            <div className={`h-2 bg-gradient-to-r ${gradientClass}`}></div>
            
            <CardContent className={`p-4 ${lightBgClass} bg-opacity-30 group-hover:bg-opacity-40 transition-colors`}>
              <CardTitle className={`mb-2 text-lg font-semibold ${textClass}`}>{event.title}</CardTitle>
              <CardDescription className="space-y-1 text-sm text-muted-foreground">
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.company && (
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>{event.company}</span>
                  </div>
                )}
                {event.date && (
                   <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                    {/* Format date nicely if needed, e.g., using date-fns */}
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                )}
                 {contactCount > 0 && (
                  <div className="flex items-center pt-1">
                    <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>{contactCount} {contactCount === 1 ? 'Contact' : 'Contacts'}</span>
                  </div>
                )}
              </CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
