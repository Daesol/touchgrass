"use client";

import { useState, useEffect } from "react";
import { EventList } from "@/components/features/events/event-list";
import { Event, Contact, ActionItem } from "@/types/models";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DeleteEventDialog } from "@/components/features/events/delete-event-dialog";
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

// Placeholder for data fetching and state management logic that needs to be moved here
// from the old dashboard.tsx component.

export default function EventsPage() {
  const router = useRouter();
  const [uiEvents, setUIEvents] = useState<Event[]>([]);
  const [uiContacts, setUIContacts] = useState<Contact[]>([]);
  const [uiActionItems, setUIActionItems] = useState<ActionItem[]>([]); // Needed for delete confirmation logic potentially
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Simplified data fetching (needs error handling, better state management)
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [eventsRes, contactsRes, actionsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/contacts'),
          fetch('/api/tasks') // ActionItems are fetched from tasks endpoint
        ]);

        if (!isMounted) return;

        if (!eventsRes.ok || !contactsRes.ok || !actionsRes.ok) {
          throw new Error('Failed to fetch initial data');
        }

        const eventsData = await eventsRes.json();
        const contactsData = await contactsRes.json();
        const actionsData = await actionsRes.json();

        setUIEvents(eventsData.data || []);
        setUIContacts(contactsData.data || []);
        setUIActionItems(actionsData.data || []); // Store action items

      } catch (err) {
        console.error('Error fetching events page data:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // --- Event Deletion Logic (Moved from dashboard.tsx) ---
  const handleInitiateDeleteEvent = (event: Event) => {
    console.log("Initiating delete for event:", event.title);
    setEventToDelete(event);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDeleteEvent = async (eventData: Event, contactIdsToDelete: string[]) => {
    console.log(`Confirmed delete for event: ${eventData.title} (ID: ${eventData.id})`);
    console.log(`Deleting ${contactIdsToDelete.length} associated contacts:`, contactIdsToDelete);

    try {
      // Delete associated contacts first if any selected
      if (contactIdsToDelete.length > 0) {
        const idsQueryParam = contactIdsToDelete.join(',');
        const contactResponse = await fetch(`/api/contacts?ids=${idsQueryParam}`, { method: 'DELETE' });
        if (!contactResponse.ok) {
           console.error("Failed to delete some contacts:", await contactResponse.text());
           toast({ title: "Warning", description: "Failed to delete selected contacts, but proceeding with event deletion.", variant: "destructive" });
        } else {
           setUIContacts(prev => prev.filter(c => !contactIdsToDelete.includes(c.id)));
           // Also remove related action items (tasks) from UI state
           setUIActionItems(prev => prev.filter(item => !item.contact_id || !contactIdsToDelete.includes(item.contact_id)));
           console.log("Successfully deleted associated contacts and updated UI state.");
        }
      }

      // Delete the event itself
      const eventResponse = await fetch(`/api/events/${eventData.id}`, { method: 'DELETE' });
      if (!eventResponse.ok) {
        let errorMsg = `Failed to delete event ${eventData.title}`;
        try { const errorData = await eventResponse.json(); errorMsg = errorData?.error?.message || errorData?.message || errorMsg; } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      toast({ title: "Event Deleted", description: `"${eventData.title}" was successfully deleted.` });

      // Update UI state
      setUIEvents(prev => prev.filter(e => e.id !== eventData.id));
      // Remove action items related to the event itself
      setUIActionItems(prev => prev.filter(item => item.event_id !== eventData.id));

      setShowDeleteConfirmation(false);
      setEventToDelete(null);

    } catch (err) {
      console.error("Error during deletion process:", err);
      toast({ title: "Error During Deletion", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      setShowDeleteConfirmation(false); // Ensure dialog closes on error too
      setEventToDelete(null);
    }
  };

  const handleCancelDeleteEvent = () => {
    setShowDeleteConfirmation(false);
    setEventToDelete(null);
  };
  // --- End Deletion Logic ---

  // --- Event Selection Logic ---
  const handleSelectEvent = (event: Event) => {
    // Navigate to a dynamic route for event details
    router.push(`/dashboard/events/${event.id}`);
  };
  // --- End Selection Logic ---


  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Error loading events: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Events</h1>
        {/* TODO: Add "Create Event" button here, maybe linking to /dashboard/events/new */}
        <EventList
            events={uiEvents}
            onSelectEvent={handleSelectEvent} // Updated to navigate
            onInitiateDeleteEvent={handleInitiateDeleteEvent} // Use moved logic
            contacts={uiContacts} // Pass contacts needed for delete dialog
            searchQuery="" // Placeholder
            selectedEvent={null} // Not needed directly in list view anymore
        />
        <DeleteEventDialog
            event={eventToDelete as any} // Pass the event to delete
            contacts={uiContacts.filter(c => c.event_id === eventToDelete?.id)} // Only pass contacts for *this* event
            isOpen={showDeleteConfirmation}
            onClose={handleCancelDeleteEvent}
            onConfirmDelete={handleConfirmDeleteEvent}
      />
    </div>
  );
} 